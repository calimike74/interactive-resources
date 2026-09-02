// Listens to the Reverb bench. check-bench proves the picture and the
// datasets; this proves the sound: analysers tapped in front of the
// destination (a mono RMS every 5 ms, plus a ChannelSplitter into two
// analysers for the stereo readings), the real UI driven by Playwright.
//
//   node scripts/measure-reverb.mjs <url> [scenario]
//   scenarios: level types rt60 predelay stereo gated   (default: all)
//
// Do not edit the bench while it runs: Fast Refresh resets the page and
// every reading after that is void (BENCH-STANDARD, 29 Aug 2026).
//
// RT60 is a slope fit, not a stopwatch: the snare repeats every 1.2 s, so a
// four second tail cannot be heard out to -60 dB inside one gap. The decay
// of the wet-only signal is fitted in dB against time over the usable part
// of the gap and extrapolated to -60 dB, which is how T20 and T30 are
// measured in a real room. The dial's own reading is printed beside it.
import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:3402/reverb-bench';
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
                const short = c.createAnalyser(); short.fftSize = 256; short.smoothingTimeConstant = 0;
                const split = c.createChannelSplitter(2);
                const anL = c.createAnalyser(); anL.fftSize = 2048; anL.smoothingTimeConstant = 0;
                const anR = c.createAnalyser(); anR.fftSize = 2048; anR.smoothingTimeConstant = 0;
                oc.call(split, anL, 0);
                oc.call(split, anR, 1);
                oc.call(short, dest);
                window.__tap = short; window.__split = split; window.__anL = anL; window.__anR = anR; window.__ctx = c;
                const sbuf = new Float32Array(short.fftSize);
                setInterval(() => {
                    short.getFloatTimeDomainData(sbuf);
                    let s = 0;
                    for (let i = 0; i < sbuf.length; i += 1) s += sbuf[i] * sbuf[i];
                    window.__rms.push([c.currentTime, Math.sqrt(s / sbuf.length)]);
                    if (window.__rms.length > 6000) window.__rms.splice(0, 2000);
                }, 5);
            }
            oc.call(this, window.__split, ...rest);
            return oc.call(this, window.__tap, ...rest);
        }
        return oc.call(this, dest, ...rest);
    };
});

const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForSelector('[data-bench-frame]', { timeout: 15000 });
await page.waitForTimeout(800);
const begin = page.locator('button', { hasText: /Play the bench/ }).first();
if (await begin.count()) { await begin.click(); await page.waitForTimeout(1200); }

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const chip = (group, name) => page.locator(`[aria-label="${group}"] button`, { hasText: new RegExp(`^${esc(name)}$`) });
const depthBtn = (label) => page.locator('[aria-label="What the bench does for you"] button', { hasText: new RegExp(`^${label}$`) });
const dB = (x) => (x <= 1e-7 ? ' -inf' : (20 * Math.log10(x)).toFixed(1).padStart(5));
const line = (label, o) => console.log(`${label.padEnd(52)} ${o}`);
const now = () => page.evaluate(() => window.__ctx?.currentTime ?? 0);
const want = (name) => !only || only === name;

// Core shows the six types; the papers and the Judge patches sit at A-level.
// The level does not change the sound, so a preset is reached wherever it lives.
async function preset(name) {
    for (const lv of ['Core', 'A-level']) {
        await depthBtn(lv).click();
        await page.waitForTimeout(80);
        const b = page.locator('[aria-label="Presets"] button', { hasText: new RegExp(`^${esc(name)}$`) });
        if (await b.count()) { await b.first().click(); await page.waitForTimeout(200); return true; }
    }
    return false;
}
const openMore = async () => { if (await page.locator('[data-more]').count()) { await page.locator('[data-more]').click(); await page.waitForTimeout(120); } };
const playIfStopped = async () => { const b = page.locator('[aria-label="Play"], [aria-label="Stop"]').first(); if ((await b.getAttribute('aria-label')) === 'Play') { await b.click(); await page.waitForTimeout(300); } };

// A dial by its keyboard: Home, then whole pages, then single steps.
async function setDial(label, target, min, max, step) {
    const el = page.locator(`[aria-label="${label}"]`).first();
    await el.focus();
    await page.keyboard.press('Home');
    const big = (max - min) / 10;
    let cur = min;
    const pages = Math.max(0, Math.floor((target - cur) / big));
    for (let i = 0; i < pages; i += 1) await page.keyboard.press('PageUp');
    cur += pages * big;
    const arrows = Math.max(0, Math.round((target - cur) / step));
    for (let i = 0; i < arrows; i += 1) await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(120);
}
const wetDry = async (wet, dry) => {
    await openMore();
    await page.locator('[aria-label="Wet"]').first().focus();
    await page.keyboard.press(wet >= 100 ? 'End' : 'Home');
    await page.locator('[aria-label="Dry"]').first().focus();
    await page.keyboard.press(dry >= 100 ? 'End' : 'Home');
    await page.waitForTimeout(150);
};
// The Reverb time dial walks a log range, so the keyboard lands near a
// target rather than on it. The dial's own reading is what gets printed.
const TIME_MIN = 0.2;
const TIME_MAX = 8;
async function setTime(target) {
    const pos = (100 * Math.log(target / TIME_MIN)) / Math.log(TIME_MAX / TIME_MIN);
    await setDial('Reverb time', pos, 0, 100, 0.5);
    return page.evaluate(() => Number(document.querySelector('[aria-label="Controls"] [data-rt60]')?.getAttribute('data-rt60') || 0));
}
const readPre = () => page.evaluate(() => Number(document.querySelector('[aria-label="Controls"] [data-predelay]')?.getAttribute('data-predelay') || 0));

async function rms(sec = 3, settle = 0.7) {
    await page.waitForTimeout(settle * 1000);
    const t0 = await now();
    await page.waitForTimeout(sec * 1000);
    const t1 = await now();
    const pts = await page.evaluate(([a, b]) => window.__rms.filter((p) => p[0] >= a && p[0] <= b), [t0, t1]);
    const v = pts.map((p) => p[1]);
    if (!v.length) return { mean: 0, max: 0, n: 0, pts: [] };
    return { mean: Math.sqrt(v.reduce((s, x) => s + x * x, 0) / v.length), max: Math.max(...v), n: v.length, pts };
}

// Onsets in an RMS series: a rise through 30 % of the run's peak, with the
// crossing interpolated between the two samples that straddle it.
function onsets(pts, minGap = 0.5) {
    const peak = Math.max(...pts.map((p) => p[1]));
    const thr = peak * 0.3;
    const out = [];
    for (let i = 1; i < pts.length; i += 1) {
        if (pts[i - 1][1] < thr && pts[i][1] >= thr) {
            const f = (thr - pts[i - 1][1]) / (pts[i][1] - pts[i - 1][1]);
            const t = pts[i - 1][0] + f * (pts[i][0] - pts[i - 1][0]);
            if (!out.length || t - out[out.length - 1] > minGap) out.push(t);
        }
    }
    return out;
}
const median = (a) => (a.length ? [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)] : NaN);

// RT60 by slope fit, extrapolated to -60 dB (the T20/T30 method).
function rt60From(pts, ons, from = 0.10, to = 0.95) {
    const outs = [];
    for (const t0 of ons) {
        const win = pts.filter((p) => p[0] >= t0 + from && p[0] <= t0 + to && p[1] > 1e-6);
        if (win.length < 12) continue;
        const xs = win.map((p) => p[0] - t0);
        const ys = win.map((p) => 20 * Math.log10(p[1]));
        const n = xs.length;
        const mx = xs.reduce((a, b) => a + b, 0) / n;
        const my = ys.reduce((a, b) => a + b, 0) / n;
        let num = 0;
        let den = 0;
        for (let i = 0; i < n; i += 1) { num += (xs[i] - mx) * (ys[i] - my); den += (xs[i] - mx) ** 2; }
        const slope = den ? num / den : 0;
        if (slope < -1) outs.push(-60 / slope);
    }
    return median(outs);
}

console.log(`sample rate ${await page.evaluate(() => window.__ctx?.sampleRate ?? 0)} Hz\n`);

// ---- LEVEL: every preset, then every source -------------------------------------------
if (want('level')) {
    for (const p of ['Small room', 'Hall', 'Plate', 'Spring', 'Gated', 'Reverse', '2019 AS paper', '2019 paper', '2020 paper', '2019 dials', 'Judge: swamped', 'Judge: an insert', 'Judge: mono']) {
        await preset(p);
        await playIfStopped();
        const r = await rms(4);
        line(`LEVEL ${p}`, `mean ${dB(r.mean)} dB  max ${dB(r.max)}`);
    }
    await preset('Hall');
    for (const src of ['Vocal', 'Guitar', 'Snare']) {
        await chip('Source', src).click();
        await playIfStopped();
        const r = await rms(4.5);
        line(`LEVEL ${src} through the same hall`, `mean ${dB(r.mean)} dB  max ${dB(r.max)}`);
    }
}

// ---- TYPES: wet at 100 against dry at 100, per type -------------------------------------
if (want('types')) {
    await preset('Plate');
    await chip('Source', 'Snare').click();
    await playIfStopped();
    await wetDry(0, 100);
    const dry = await rms(3.5);
    line('TYPES the dry snare alone (Dry 100, Wet 0)', `mean ${dB(dry.mean)} dB  max ${dB(dry.max)}`);
    await wetDry(100, 0);
    for (const t of ['Room', 'Hall', 'Plate', 'Spring', 'Gated', 'Reversed']) {
        await chip('Type', t).click();
        await page.waitForTimeout(200);
        const r = await rms(3.5);
        line(`TYPES ${t} wet alone (Wet 100, Dry 0)`, `mean ${dB(r.mean)} dB  max ${dB(r.max)}  vs dry ${(20 * Math.log10(r.mean / (dry.mean || 1))).toFixed(1)} dB`);
    }
}

// ---- RT60: the wet-only decay of one snare hit ------------------------------------------
if (want('rt60')) {
    await preset('Plate');
    await chip('Source', 'Snare').click();
    await playIfStopped();
    await wetDry(100, 0);
    for (const type of ['Room', 'Hall', 'Plate']) {
        await chip('Type', type).click();
        for (const target of [1, 2, 4]) {
            const dial = await setTime(target);
            const r = await rms(5, 0.8);
            const ons = onsets(r.pts, 0.6);
            const got = rt60From(r.pts, ons);
            line(`RT60 ${type} at the dial's ${dial} s`, `${Number.isFinite(got) ? got.toFixed(2) : '   n/a'} s measured  (${ons.length} hits fitted)`);
        }
    }
}

// ---- PRE-DELAY: the wet onset after the dry onset ----------------------------------------
if (want('predelay')) {
    await preset('Plate');
    await chip('Source', 'Snare').click();
    await chip('Type', 'Room').click();
    await setTime(0.6);
    await playIfStopped();
    // the grid's own phase, from the dry hits, with the transport left running
    await wetDry(0, 100);
    const dryRun = await rms(4, 0.8);
    const dryPhase = median(onsets(dryRun.pts, 0.6).map((t) => ((t % 1.2) + 1.2) % 1.2));
    await wetDry(100, 0);
    for (const target of [0, 100, 300]) {
        await setDial('Pre-delay', target, 0, 400, 1);
        const dial = await readPre();
        const r = await rms(4, 0.6);
        const wetPhase = median(onsets(r.pts, 0.6).map((t) => ((t % 1.2) + 1.2) % 1.2));
        let gap = (wetPhase - dryPhase) * 1000;
        while (gap < -600) gap += 1200;
        while (gap > 600) gap -= 1200;
        line(`PRE-DELAY dial at ${dial} ms`, `${gap.toFixed(0)} ms measured between the dry and the wet onset`);
    }
    await setDial('Pre-delay', 0, 0, 400, 1);
}

// ---- STEREO: the inter-channel correlation ----------------------------------------------
if (want('stereo')) {
    await preset('Hall');
    await chip('Source', 'Vocal').click();
    await playIfStopped();
    await wetDry(100, 0);
    await openMore();
    for (const width of ['Stereo', 'Mono']) {
        await chip('Width', width).click();
        await page.waitForTimeout(900);
        const rs = [];
        for (let i = 0; i < 24; i += 1) {
            const c = await page.evaluate(() => {
                const n = window.__anL.fftSize;
                const a = new Float32Array(n);
                const b = new Float32Array(n);
                window.__anL.getFloatTimeDomainData(a);
                window.__anR.getFloatTimeDomainData(b);
                let sa = 0; let sb = 0; let sab = 0;
                for (let i2 = 0; i2 < n; i2 += 1) { sa += a[i2] * a[i2]; sb += b[i2] * b[i2]; sab += a[i2] * b[i2]; }
                if (sa < 1e-9 || sb < 1e-9) return null;
                return sab / Math.sqrt(sa * sb);
            });
            if (c != null) rs.push(c);
            await page.waitForTimeout(80);
        }
        line(`STEREO ${width}: inter-channel correlation`, `${rs.length ? median(rs).toFixed(3) : 'n/a'}  (${rs.length} frames, ${width === 'Stereo' ? 'want under 0.5' : 'want over 0.95'})`);
    }
    await chip('Width', 'Stereo').click();
}

// ---- GATED: the level 300 ms after the hit ------------------------------------------------
if (want('gated')) {
    await preset('Gated');
    await playIfStopped();
    await wetDry(100, 0);
    for (const type of ['Gated', 'Room']) {
        await chip('Type', type).click();
        await page.waitForTimeout(250);
        const r = await rms(5, 0.8);
        const ons = onsets(r.pts, 0.6);
        const rel = [];
        for (const t0 of ons) {
            const peak = Math.max(...r.pts.filter((p) => p[0] >= t0 - 0.02 && p[0] <= t0 + 0.08).map((p) => p[1]), 0);
            const at = r.pts.find((p) => p[0] >= t0 + 0.3);
            if (peak > 1e-6 && at) rel.push(20 * Math.log10(Math.max(at[1], 1e-7) / peak));
        }
        line(`GATED ${type}: level 300 ms after the hit`, `${rel.length ? median(rel).toFixed(1) : 'n/a'} dB below its peak  (${rel.length} hits)`);
    }
    await chip('Type', 'Gated').click();
}

if (errors.length) console.log(`\npage errors: ${errors.join(' | ').slice(0, 300)}`);
await browser.close();
