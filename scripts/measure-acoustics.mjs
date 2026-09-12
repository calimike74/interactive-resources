// Listens to the Acoustics bench. check-bench proves the picture and the
// datasets; this proves the sound: an analyser tapped in front of the
// destination, the real UI driven by Playwright.
//
//   node scripts/measure-acoustics.mjs <url> [scenario]
//   scenarios: tones masking comb rt60 walls   (default: all)
//
// Do not edit the bench while it runs: Fast Refresh resets the page and every
// reading after that is void (BENCH-STANDARD, 29 Aug 2026).
//
// The three the design record has to carry:
//   comb   the first notch lands where the model says, and sits at least
//          12 dB under its neighbouring peaks for a 5 ms reflection. Measured
//          as the difference between the averaged spectrum with the copy on
//          and with it off, so the source's own shape cancels out.
//   rt60   the generated tail decays within 15 per cent of the dial, fitted
//          from the stem's stop by the slope method (T20/T30), with the
//          direct sound taken out by the Room dial.
//   tones  the four tones leave at one level, within 1 dB of each other,
//          because the drawing tells the story and the volume must not.
import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:3412/acoustics-bench';
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
                const short = c.createAnalyser();
                short.fftSize = 256;
                short.smoothingTimeConstant = 0;
                const fine = c.createAnalyser();
                fine.fftSize = 16384;
                fine.smoothingTimeConstant = 0;
                oc.call(short, dest);
                window.__tap = short;
                window.__fine = fine;
                window.__ctx = c;
                const sbuf = new Float32Array(short.fftSize);
                setInterval(() => {
                    short.getFloatTimeDomainData(sbuf);
                    let s = 0;
                    for (let i = 0; i < sbuf.length; i += 1) s += sbuf[i] * sbuf[i];
                    window.__rms.push([c.currentTime, Math.sqrt(s / sbuf.length)]);
                    if (window.__rms.length > 8000) window.__rms.splice(0, 3000);
                }, 5);
            }
            oc.call(this, window.__fine, ...rest);
            return oc.call(this, window.__tap, ...rest);
        }
        return oc.call(this, dest, ...rest);
    };
    // The averaged magnitude spectrum over a window, in dB, per bin. Frames
    // more than `floor` dB under the loudest are thrown away first: the Room
    // station's source is a hit, and averaging the silence between hits pulls
    // every reading toward the noise floor and flattens the comb being
    // measured (the fault the first listening pass found, 12 Sep 2026).
    window.__avgSpectrum = (ms, floor = 20) => new Promise((resolve) => {
        const an = window.__fine;
        const n = an.frequencyBinCount;
        const buf = new Float32Array(n);
        const frames = [];
        const id = setInterval(() => {
            an.getFloatFrequencyData(buf);
            const f = new Float64Array(n);
            let e = 0;
            for (let i = 0; i < n; i += 1) { f[i] = 10 ** (Math.max(buf[i], -160) / 10); e += f[i]; }
            frames.push({ f, e });
        }, 20);
        setTimeout(() => {
            clearInterval(id);
            const peak = Math.max(...frames.map((x) => x.e), 1e-30);
            const keep = frames.filter((x) => x.e >= peak / 10 ** (floor / 10));
            const use = keep.length ? keep : frames;
            const sum = new Float64Array(n);
            for (const x of use) for (let i = 0; i < n; i += 1) sum[i] += x.f[i];
            const out = new Array(n);
            for (let i = 0; i < n; i += 1) out[i] = 10 * Math.log10(sum[i] / use.length);
            resolve({ db: out, rate: an.context.sampleRate, bins: n, frames: use.length, seen: frames.length });
        }, ms);
    });
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
const dB = (x) => (x <= 1e-7 ? ' -inf' : (20 * Math.log10(x)).toFixed(1).padStart(6));
const line = (label, o) => console.log(`${label.padEnd(54)} ${o}`);
const now = () => page.evaluate(() => window.__ctx?.currentTime ?? 0);
const want = (name) => !only || only === name;
const median = (a) => (a.length ? [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)] : NaN);

async function preset(name) {
    for (const lv of ['Core', 'A-level']) {
        await depthBtn(lv).click();
        await page.waitForTimeout(80);
        const b = page.locator('[aria-label="Presets"] button', { hasText: new RegExp(`^${esc(name)}$`) });
        if (await b.count()) { await b.first().click(); await page.waitForTimeout(250); return true; }
    }
    return false;
}
const station = async (name) => { await chip('Station', name).click(); await page.waitForTimeout(400); };
const playIfStopped = async () => {
    const b = page.locator('[aria-label="Play"], [aria-label="Stop"]').first();
    if ((await b.getAttribute('aria-label')) === 'Play') { await b.click(); await page.waitForTimeout(300); }
};

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
    const read = () => page.evaluate((l) => Number(document.querySelector(`[aria-label="${l}"]`)?.getAttribute('aria-valuenow')), label);
    // step up to the target and then check, rather than trusting the arithmetic:
    // a page is not a whole number of steps and the rounding compounds
    for (let guard = 0; guard < 80; guard += 1) {
        const at = await read();
        if (Math.abs(at - target) < step / 2) break;
        await page.keyboard.press(at < target ? 'ArrowUp' : 'ArrowDown');
    }
    await page.waitForTimeout(140);
    return read();
}
const home = async (label) => { await page.locator(`[aria-label="${label}"]`).first().focus(); await page.keyboard.press('Home'); await page.waitForTimeout(120); };
const end = async (label) => { await page.locator(`[aria-label="${label}"]`).first().focus(); await page.keyboard.press('End'); await page.waitForTimeout(120); };
const readNotch = () => page.evaluate(() => Number(document.querySelector('[aria-label="Controls"] [data-notch-hz]')?.getAttribute('data-notch-hz') || 0));
const readRt60 = () => page.evaluate(() => Number(document.querySelector('[aria-label="Controls"] [data-rt60]')?.getAttribute('data-rt60') || 0));

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
const spectrum = (ms, floor = 20) => page.evaluate(([n, f]) => window.__avgSpectrum(n, f), [ms, floor]);
const binAt = (sp, hz) => Math.round((hz * sp.bins * 2) / sp.rate);
const dbAt = (sp, hz) => sp.db[Math.max(1, Math.min(sp.bins - 1, binAt(sp, hz)))];

// Onsets in an RMS series, found by their RISE rather than by a fixed level:
// a jump of more than 9 dB inside 20 ms. A level threshold misses the second
// hit of a pair once the tail is long enough not to fall back under it, and a
// missed hit lands in the middle of the next fit and reads it long (the fault
// the first listening pass found, 12 Sep 2026).
function onsets(pts, minGap = 0.6) {
    const peak = Math.max(...pts.map((p) => p[1]));
    const out = [];
    for (let i = 4; i < pts.length; i += 1) {
        const a = Math.max(pts[i - 4][1], 1e-9);
        const b = pts[i][1];
        // a real hit is both a big jump AND near the run's peak; without the
        // second test the noise inside a long tail throws spurious onsets
        if (b / a > 3 && b > peak * 0.35) {
            const t = pts[i][0];
            if (!out.length || t - out[out.length - 1] > minGap) out.push(t);
        }
    }
    return out;
}

// RT60 by slope fit, extrapolated to -60 dB (the T20/T30 method). Only a stop
// with `to + 0.3` seconds of clear space after it is fitted: the snare plays
// two hits and then rests, and a fit that runs into the next hit reads long.
function rt60From(pts, ons, from, to) {
    const outs = [];
    const clear = ons.filter((t, i) => i === ons.length - 1 || ons[i + 1] - t > to + 0.3);
    for (const t0 of clear) {
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
    return { rt60: median(outs), fitted: outs.length };
}

console.log(`sample rate ${await page.evaluate(() => window.__ctx?.sampleRate ?? 0)} Hz\n`);

// ---- TONES: four tones, one level ------------------------------------------
if (want('tones')) {
    await station('Loudness');
    await playIfStopped();
    const got = [];
    for (const t of ['100 Hz', '1 kHz', '3 kHz', '10 kHz']) {
        await chip('Tone', t).click();
        const r = await rms(2.2, 0.6);
        got.push({ t, db: 20 * Math.log10(Math.max(r.mean, 1e-9)) });
        line(`TONES ${t} at the destination`, `mean ${dB(r.mean)} dB  max ${dB(r.max)}`);
    }
    const lo = Math.min(...got.map((x) => x.db));
    const hi = Math.max(...got.map((x) => x.db));
    line('TONES the spread across the four', `${(hi - lo).toFixed(2)} dB  (want under 1.00, the drawing tells the story)`);
    // and the listening chip must change nothing in the output
    await chip('Tone', '100 Hz').click();
    const q = await rms(2.2, 0.5);
    await chip('Listening level', 'Loud').click();
    const l = await rms(2.2, 0.5);
    line('TONES Quiet against Loud at the output', `${(20 * Math.log10(l.mean / Math.max(q.mean, 1e-9))).toFixed(2)} dB  (want 0.00: the chip is a drawing, not a volume)`);
    await chip('Listening level', 'Quiet').click();
}

// ---- MASKING: the masker really rises, the target really is there ----------
if (want('masking')) {
    await station('Masking');
    await playIfStopped();
    await chip('Masker', 'Below').click();
    await home('Masker level');
    const quiet = await rms(2, 0.5);
    await end('Masker level');
    const loud = await rms(2, 0.5);
    line('MASKING masker from its floor to its ceiling', `${(20 * Math.log10(loud.mean / Math.max(quiet.mean, 1e-9))).toFixed(1)} dB louder`);
    await setDial('Masker level', -14, -60, 0, 1);
    const on = await spectrum(1400);
    await chip('Target on', 'Off').click();
    await page.waitForTimeout(400);
    const off = await spectrum(1400);
    const at = (hz) => dbAt(on, hz) - dbAt(off, hz);
    line('MASKING the 1 kHz target, on against off', `${at(1000).toFixed(1)} dB at 1 kHz  (it is there; whether it is heard is the ear\'s business)`);
    line('MASKING the same measurement a band away', `${at(1600).toFixed(1)} dB at 1.6 kHz  (want near 0: only the target moved)`);
    await chip('Target on', 'On').click();
}

// ---- COMB: the notch lands where the model says ----------------------------
// Measured on both sources. On a hit the first few milliseconds arrive before
// their own copy, so the leading edge is never cancelled and the notch reads
// shallower than the steady state: honest, and the reason the phrase is the
// source to read the comb on.
async function comb(source) {
    await chip('Source', source).click();
    await page.waitForTimeout(500);
    await home('Room level');            // direct only, so the comb is not diluted
    const delay = await setDial('Delay', 5, 0.5, 40, 0.5);
    const notch = await readNotch();
    line(`COMB ${source}: the dial and the console`, `Delay ${delay} ms, first notch ${notch} Hz  (the model says ${Math.round(500 / delay)} Hz)`);
    await home('Reflection level');      // the copy 40 dB down is the reference
    const without = await spectrum(5000);
    const refl = await setDial('Reflection level', -2, -40, 0, 1);
    const ideal = 20 * Math.log10(1 + 10 ** (refl / 20)) - 20 * Math.log10(Math.abs(1 - 10 ** (refl / 20)));
    const with_ = await spectrum(5000);
    const diff = (hz) => dbAt(with_, hz) - dbAt(without, hz);
    const notches = [notch, notch * 3, notch * 5, notch * 7];
    const peaks = [notch * 2, notch * 4, notch * 6];
    for (const hz of notches) line(`COMB ${source}: notch at ${Math.round(hz)} Hz`, `${diff(hz).toFixed(1)} dB against the same source with no copy`);
    for (const hz of peaks) line(`COMB ${source}: peak at ${Math.round(hz)} Hz`, `${diff(hz).toFixed(1)} dB against the same source with no copy`);
    const worstNotch = Math.max(...notches.map(diff));
    const weakestPeak = Math.min(...peaks.map(diff));
    line(`COMB ${source}: shallowest notch under weakest peak`, `${(weakestPeak - worstNotch).toFixed(1)} dB at ${refl} dB  (the model's ideal is ${ideal.toFixed(1)}; want at least 12.0)`);
    const first = diff(notch);
    const around = (diff(notch * 2) + diff(notch * 0.5)) / 2;
    line(`COMB ${source}: the FIRST notch under its neighbours`, `${(around - first).toFixed(1)} dB at ${Math.round(notch)} Hz  (want at least 12.0)`);
}
if (want('comb')) {
    await station('The Room');
    await playIfStopped();
    await comb('Vocal');
    await comb('Snare');
}

// ---- RT60: the tail decays at the time the dial says -----------------------
if (want('rt60')) {
    await station('The Room');
    await chip('Source', 'Snare').click();
    await chip('Walls', 'Bare').click();
    await playIfStopped();
    await home('Reflection level');   // no comb in the way
    await end('Room level');          // the tail alone, so the stem's own decay is out
    // First, how long the stem itself rings with no room at all: everything
    // below is fitted from after that, because a tail measured while the
    // source is still sounding reads as the two decays convolved together
    // (the first pass read +30 %).
    await home('Room level');
    const dryRun = await rms(10, 1.0);
    const dryOns = onsets(dryRun.pts);
    const dry = rt60From(dryRun.pts, dryOns, 0.05, 0.45);
    line('RT60 the stem alone, no room', `${Number.isFinite(dry.rt60) ? dry.rt60.toFixed(2) : ' n/a'} s of its own decay  (${dry.fitted} of ${dryOns.length} stops fitted)`);
    await end('Room level');
    // The stem rings for about as long as the shortest room on the dial, so
    // the harness reads the long end and the model's own unit test pins the
    // short end, where the envelope is -60 dB at T by construction. The same
    // division the Reverb bench settled on, 2 Sep 2026.
    const FROM = 0.85;
    for (const target of [1.5, 2, 2.5, 3]) {
        await setDial('Reverb time', target, 0.3, 3, 0.05);
        const dial = await readRt60();
        const r = await rms(14, 1.2);
        const ons = onsets(r.pts);
        const { rt60: got, fitted } = rt60From(r.pts, ons, FROM, FROM + dial * 0.55);
        const err = Number.isFinite(got) ? ((got - dial) / dial) * 100 : NaN;
        line(`RT60 dial at ${dial} s`, `${Number.isFinite(got) ? got.toFixed(2) : '  n/a'} s measured, ${Number.isFinite(err) ? `${err > 0 ? '+' : ''}${err.toFixed(1)} %` : 'n/a'}  (${fitted} of ${ons.length} stops fitted, want within 15 %)`);
    }
}

// ---- WALLS: thin panels reach the top only ---------------------------------
if (want('walls')) {
    await station('The Room');
    await chip('Source', 'Snare').click();
    await playIfStopped();
    await home('Reflection level');
    await end('Room level');
    const read = {};
    for (const walls of ['Bare', 'Some panels', 'Treated']) {
        await chip('Walls', walls).click();
        await page.waitForTimeout(500);
        const sp = await spectrum(3500);
        read[walls] = sp;
        const low = dbAt(sp, 120);
        const high = dbAt(sp, 6000);
        line(`WALLS ${walls}: the tail's own balance`, `low ${low.toFixed(1)} dB, high ${high.toFixed(1)} dB, tilt ${(high - low).toFixed(1)} dB`);
    }
    const tilt = (sp) => dbAt(sp, 6000) - dbAt(sp, 120);
    line('WALLS panels against bare, in the top', `${(dbAt(read['Some panels'], 6000) - dbAt(read.Bare, 6000)).toFixed(1)} dB  (thin panels reach here)`);
    line('WALLS panels against bare, in the low end', `${(dbAt(read['Some panels'], 120) - dbAt(read.Bare, 120)).toFixed(1)} dB  (they do not reach here)`);
    line('WALLS treated against panels, in the low end', `${(dbAt(read.Treated, 120) - dbAt(read['Some panels'], 120)).toFixed(1)} dB  (the bass traps do)`);
    line('WALLS the tilt, bare to panels to treated', `${tilt(read.Bare).toFixed(1)} then ${tilt(read['Some panels']).toFixed(1)} then ${tilt(read.Treated).toFixed(1)} dB`);
    // A per-band RT60 is NOT measured here, and the design record says why: the
    // stem rings 0.72 s of its own, which is longer than the top band of a
    // treated room, and the low band of a panelled one outruns the gap between
    // hits so it never falls. Both ends are pinned by the model's unit test,
    // where each band's envelope is -60 dB at its own time by construction.
    // What the spectrum above CAN show is the balance, and it shows the law:
    // thin panels take the top down and leave the low end where it was.

    // the trap: soundproofing must change nothing that can be measured
    await chip('Walls', 'Bare').click();
    // a 2.2 s tail takes several seconds of hits to fill, so both readings are
    // taken from its steady state or the comparison measures the build-up
    const before = await rms(8, 6);
    await chip('Soundproofing', 'Soundproofing').click();
    const after = await rms(8, 6);
    line('WALLS soundproofing on against off', `${(20 * Math.log10(after.mean / Math.max(before.mean, 1e-9))).toFixed(2)} dB  (want 0.00: it is not an acoustic treatment)`);
    await chip('Soundproofing', 'No proofing').click();
}

if (errors.length) console.log(`\npage errors: ${errors.join(' | ').slice(0, 300)}`);
await browser.close();
