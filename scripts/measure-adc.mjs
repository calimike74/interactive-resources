// Listens to the ADC Explorer. check-bench proves the picture and the
// datasets; this proves the sound: an analyser tapped in front of the
// destination, the real UI driven by Playwright (the dials by keyboard,
// the sources by their chips).
//
//   node scripts/measure-adc.mjs <url> [scenario]
//   scenarios: levels alias hold   (default: all)
//
//   levels  each source through a ladder of settings: the level while it
//           sounds (the 90th centile of 21 ms RMS windows) must sit within
//           about 2 dB of the source at 44.1 kHz and 16 bit, except where
//           the sound is meant to vanish (the tone at or above half the
//           rate with the filter on; a recording at 2 or 3 bits, where
//           everything under the first step rounds to zero)
//   alias   the 3 kHz tone at 4 kHz, filter off, comes back at 1 kHz; at
//           20 kHz it is 3 kHz; the 15 kHz tone at 20 kHz is 5 kHz
//   hold    holding "hold: analogue" plays the source at the same level
//
// Do not edit the bench while it runs: Fast Refresh resets the page and
// every reading after that is void. Written 28 Sep 2026 with the bench.
import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:3491/adc-explorer';
const only = process.argv[3] || '';
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 700 }, deviceScaleFactor: 1 });
const u = new URL(url);
await ctx.addCookies([{ name: 'mts_consent', value: 'essential', domain: u.hostname, path: '/' }]);
await ctx.addInitScript(() => {
    window.__rms = [];
    const oc = AudioNode.prototype.connect;
    AudioNode.prototype.connect = function (dest, ...rest) {
        if (dest instanceof AudioDestinationNode) {
            const c = dest.context;
            if (!window.__tap) {
                const an = c.createAnalyser(); an.fftSize = 16384; an.smoothingTimeConstant = 0;
                const short = c.createAnalyser(); short.fftSize = 1024; short.smoothingTimeConstant = 0;
                oc.call(an, dest); oc.call(short, dest);
                window.__tap = an; window.__short = short; window.__ctx = c;
                const sbuf = new Float32Array(short.fftSize);
                setInterval(() => {
                    short.getFloatTimeDomainData(sbuf);
                    let s = 0; for (let i = 0; i < sbuf.length; i += 1) s += sbuf[i] * sbuf[i];
                    window.__rms.push([c.currentTime, Math.sqrt(s / sbuf.length)]);
                    if (window.__rms.length > 4000) window.__rms.shift();
                }, 10);
                // the strongest frequency now, from the long tap (Hz)
                window.__peakHz = () => {
                    const f = new Float32Array(an.frequencyBinCount);
                    an.getFloatFrequencyData(f);
                    let best = 0; for (let i = 3; i < f.length; i += 1) if (f[i] > f[best]) best = i;
                    return (best * c.sampleRate) / an.fftSize;
                };
            }
            oc.call(this, window.__short, ...rest);
            return oc.call(this, window.__tap, ...rest);
        }
        return oc.call(this, dest, ...rest);
    };
});
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'networkidle' });
await page.locator('button', { hasText: /Play the bench/ }).first().click();
await page.waitForTimeout(1200);

const RATES = [2, 3, 4, 5, 6, 8, 10, 11.025, 12, 16, 20, 22.05, 24, 32, 40, 44.1, 48, 60, 80, 96];
async function dial(label, steps) {
    const d = page.locator(`[aria-label="${label}"]`).first();
    await d.focus();
    await page.keyboard.press('Home');
    for (let i = 0; i < steps; i += 1) await page.keyboard.press('ArrowUp');
}
const setRate = (k) => dial('Sample rate', RATES.indexOf(k));
const setBits = (b) => dial('Bit depth', b - 2);
async function source(name) { await page.locator('[aria-label="Source"] button', { hasText: new RegExp(`^${name}$`) }).click(); }
async function more() { const m = page.locator('[data-more]'); if (await m.count()) await m.click(); }
async function filter(on) { await more(); await page.locator('[aria-label="Anti-alias filter"] button', { hasText: on ? /^On$/ : /^Off$/ }).click(); }
// the level while the source sounds, over one pass
async function level(seconds) {
    await page.waitForTimeout(400);
    const t0 = await page.evaluate(() => window.__ctx.currentTime);
    await page.waitForTimeout(seconds * 1000);
    const vals = await page.evaluate((from) => window.__rms.filter(([t]) => t >= from).map(([, v]) => v), t0);
    vals.sort((a, b) => a - b);
    const p90 = vals[Math.floor(vals.length * 0.9)] || 0;
    return 20 * Math.log10(Math.max(p90, 1e-9));
}
const f1 = (x) => (Math.round(x * 10) / 10).toFixed(1);
let problems = 0;

if (!only || only === 'levels') {
    const PASS = { Tone: 2.3, Song: 4.5, Vocal: 6.5, Guitar: 8.7 };
    const LADDER = [[44.1, 16], [96, 16], [20, 16], [11.025, 16], [8, 16], [4, 16], [2, 16], [44.1, 12], [44.1, 8], [44.1, 6], [44.1, 4], [44.1, 3], [44.1, 2], [8, 8]];
    for (const src of ['Tone', 'Song', 'Vocal', 'Guitar']) {
        await source(src);
        const rows = [];
        let ref = null;
        for (const [r, b] of LADDER) {
            await setRate(r); await setBits(b);
            const db = await level(PASS[src]);
            if (ref == null) ref = db;
            // the 3 kHz tone at or above half the rate, filter on; a quiet
            // recording at 2 or 3 bits, which rounds mostly to silence
            const vanish = (src === 'Tone' && r <= 6) || (src !== 'Tone' && b <= 3);
            const d = db - ref;
            const bad = !vanish && Math.abs(d) > 2;
            if (bad) problems += 1;
            rows.push(`${String(r).padStart(6)} kHz ${String(b).padStart(2)} bit  ${f1(db).padStart(6)} dB  ${d >= 0 ? '+' : ''}${f1(d)}${vanish ? '  (meant to go)' : ''}${bad ? '  <-- more than 2 dB' : ''}`);
        }
        console.log(`\n${src}`); rows.forEach((r) => console.log(`  ${r}`));
    }
}

if (!only || only === 'alias') {
    await source('Tone'); await setBits(16); await filter(false);
    const cases = [[3, 4, 1000], [3, 20, 3000], [3, 5, 2000], [15, 20, 5000]];
    console.log('\nalias (filter off)');
    for (const [tone, r, want] of cases) {
        await page.locator('[aria-label="Tone"] button', { hasText: new RegExp(`^${tone} kHz$`) }).click();
        await setRate(r);
        await page.waitForTimeout(900);
        let hz = 0;
        for (let i = 0; i < 6 && !hz; i += 1) {
            const lv = await page.evaluate(() => window.__rms.at(-1)?.[1] || 0);
            if (lv > 0.01) hz = await page.evaluate(() => window.__peakHz());
            else await page.waitForTimeout(300);
        }
        const ok = Math.abs(hz - want) < 40;
        if (!ok) problems += 1;
        console.log(`  ${tone} kHz at ${r} kHz: peak ${Math.round(hz)} Hz, want ${want}${ok ? '' : '  <-- wrong'}`);
    }
    await filter(true);
    await page.locator('[aria-label="Tone"] button', { hasText: /^3 kHz$/ }).click();
}

if (!only || only === 'hold') {
    await source('Vocal'); await setRate(8); await setBits(6);
    const wet = await level(6.5);
    const hold = page.locator('[data-hold]');
    const box = await hold.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    const dry = await level(6.5);
    await page.mouse.up();
    const d = dry - wet;
    if (Math.abs(d) > 2) problems += 1;
    console.log(`\nhold: analogue  converted ${f1(wet)} dB, held ${f1(dry)} dB, ${d >= 0 ? '+' : ''}${f1(d)} dB${Math.abs(d) > 2 ? '  <-- more than 2 dB' : ''}`);
}

await browser.close();
console.log(problems ? `\n${problems} problem(s)` : '\nall within bounds');
process.exit(problems ? 1 : 0);
