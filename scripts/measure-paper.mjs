// Listens to Squared Paper. check-bench proves the picture and the
// datasets; this proves the sound: an analyser tapped in front of the
// destination (RMS every 10 ms, and time-domain frames kept for the pitch),
// the real UI driven by Playwright.
//
//   node scripts/measure-paper.mjs <url> [scenario]
//   scenarios: level pitch drawn shapes   (default: all)
//
// The bench's own claim under test: the drawing you make is the pitch you
// hear (a square drawn at 2 ms plays at 500 Hz), and the three Hear targets
// sit within 3 dB of each other so the ear is comparing pitch and shape,
// never loudness.
//
// Do not edit the bench while it runs: Fast Refresh resets the page and
// every reading after that is void. Written 12 Sep 2026 with the bench.
//
// Run it from this worktree's scripts/ folder: Playwright resolves from the
// node_modules beside it.
import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:3466/squared-paper';
const only = process.argv[3] || '';
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 700 }, deviceScaleFactor: 1 });
const u = new URL(url);
await ctx.addCookies([{ name: 'mts_consent', value: 'essential', domain: u.hostname, path: '/' }]);
await ctx.addInitScript(() => {
    window.__rms = []; window.__frames = []; window.__keep = false;
    const oc = AudioNode.prototype.connect;
    AudioNode.prototype.connect = function connect(dest, ...rest) {
        if (dest instanceof AudioDestinationNode) {
            const c = dest.context;
            if (!window.__tap) {
                const an = c.createAnalyser(); an.fftSize = 8192; an.smoothingTimeConstant = 0;
                const short = c.createAnalyser(); short.fftSize = 1024; short.smoothingTimeConstant = 0;
                oc.call(an, dest); oc.call(short, dest); window.__tap = an; window.__short = short; window.__ctx = c;
                const buf = new Float32Array(an.fftSize); const sbuf = new Float32Array(short.fftSize);
                setInterval(() => {
                    short.getFloatTimeDomainData(sbuf);
                    let s = 0; for (let i = 0; i < sbuf.length; i += 1) s += sbuf[i] * sbuf[i];
                    window.__rms.push([c.currentTime, Math.sqrt(s / sbuf.length)]);
                    if (window.__keep) { an.getFloatTimeDomainData(buf); window.__frames.push([c.currentTime, Array.from(buf)]); if (window.__frames.length > 40) window.__frames.shift(); }
                }, 10);
            }
            oc.call(this, window.__short || window.__tap, ...rest);
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
await page.waitForTimeout(700);
// The bench opens silent, like the written paper, so there is no "Play the
// bench" overlay to press: the console's own Play button is the gesture that
// builds the context and the tap in front of the destination (12 Sep 2026).
const begin = page.locator('button', { hasText: /Play the bench/ }).first();
const play = (await begin.count()) ? begin : page.locator('[aria-label="Play"]').first();
if (await play.count()) { await play.click(); await page.waitForTimeout(1000); }

const chip = (group, name) => page.locator(`[aria-label="${group}"] button`, { hasText: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) });
const preset = (name) => page.locator('[aria-label="Presets"] button', { hasText: name });
const canvasSel = '[aria-label="Stage"] canvas';
const dB = (x) => (x <= 1e-7 ? ' -inf' : (20 * Math.log10(x)).toFixed(1).padStart(5));
const now = () => page.evaluate(() => window.__ctx?.currentTime ?? 0);
const line = (label, o) => console.log(`${label.padEnd(48)} ${o}`);
const stage = () => page.evaluate((sel) => {
    const c = document.querySelector(sel);
    return { period: c?.dataset.periodMs || '', hz: c?.dataset.hz || '', shape: c?.dataset.shape || '', verdict: c?.dataset.verdict || '', paper: c?.dataset.paper || '' };
}, canvasSel);

async function rms(sec = 2, settle = 0.7) {
    await page.waitForTimeout(settle * 1000);
    const t0 = await now();
    await page.waitForTimeout(sec * 1000);
    const t1 = await now();
    const pts = await page.evaluate(([a, b]) => window.__rms.filter((p) => p[0] >= a && p[0] <= b), [t0, t1]);
    const v = pts.map((p) => p[1]);
    return { mean: Math.sqrt(v.reduce((s, x) => s + x * x, 0) / Math.max(1, v.length)), max: Math.max(...v), n: v.length };
}
const pitchOf = (buf, sr) => {
    const n = buf.length;
    const win = buf.map((x, i) => x * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1))));
    const mag = (f) => {
        let re = 0; let im = 0; const w = (2 * Math.PI * f) / sr;
        for (let i = 0; i < n; i += 1) { re += win[i] * Math.cos(w * i); im -= win[i] * Math.sin(w * i); }
        return Math.hypot(re, im);
    };
    let bestF = 0; let best = 0;
    for (let f = 60; f <= 1400; f += 0.5) { const a = mag(f); if (a > best) { best = a; bestF = f; } }
    for (const d of [2, 3]) if (bestF / d >= 60 && mag(bestF / d) > best * 0.3) { bestF /= d; break; }
    return bestF;
};
async function pitch(settle = 0.8) {
    await page.evaluate(() => { window.__keep = true; window.__frames = []; });
    await page.waitForTimeout(settle * 1000 + 300);
    const { frames, sr } = await page.evaluate(() => ({ frames: window.__frames.slice(-3), sr: window.__ctx.sampleRate }));
    await page.evaluate(() => { window.__keep = false; });
    const hzs = frames.map((f) => pitchOf(f[1], sr));
    return hzs.sort((a, b) => a - b)[Math.floor(hzs.length / 2)];
}

// Draw a wave on the answer paper the way a student's pointer would, from
// the paper box the stage publishes.
async function drawWave(shape, cycles, amp = 0.6) {
    const clear = page.locator('[aria-label="Clear the answer paper"]').first();
    if (await clear.count()) { await clear.click(); await page.waitForTimeout(150); }
    const box = await page.locator(canvasSel).boundingBox();
    const [x0, top, x1, bottom] = (await stage()).paper.split(':').map(Number);
    const mid = (top + bottom) / 2;
    const half = (bottom - top) / 2 - 6;
    const from = x0 + 4;
    const to = x1 - 4;
    const at = (t) => {
        const p = ((cycles * t) % 1 + 1) % 1;
        if (shape === 'sine') return Math.sin(2 * Math.PI * p);
        if (shape === 'square') return p < 0.5 ? 1 : -1;
        if (shape === 'saw') return 2 * p - 1;
        return p < 0.25 ? 4 * p : p < 0.75 ? 2 - 4 * p : 4 * p - 4;
    };
    const steps = 160;
    await page.mouse.move(box.x + from, box.y + mid - at(0) * half * amp);
    await page.mouse.down();
    for (let i = 1; i <= steps; i += 1) {
        const t = i / steps;
        await page.mouse.move(box.x + from + (to - from) * t, box.y + mid - at(t) * half * amp);
    }
    await page.mouse.up();
    await page.waitForTimeout(250);
}

const want = (name) => !only || only === name;

if (want('level')) {
    // The three Hear targets, on the 2023 paper with the scheme's answer drawn.
    await preset('2023: an octave lower').click();
    await page.waitForTimeout(250);
    await chip('Shape', 'Saw').click();
    await chip('Period', 'Double').click();
    await page.waitForTimeout(250);
    const out = {};
    for (const [id, label] of [['The figure', 'the figure'], ['Yours', 'your drawing'], ['The answer', "the scheme's answer"]]) {
        await chip('Hear', id).click();
        const r = await rms();
        out[label] = r.mean;
        line(`LEVEL ${label}`, `mean ${dB(r.mean)} dB  peak ${dB(r.max)} dB`);
    }
    const vals = Object.values(out);
    const spread = 20 * Math.log10(Math.max(...vals) / Math.min(...vals));
    line('LEVEL spread across the three targets', `${spread.toFixed(2)} dB (the bench claims under 3)`);
}

if (want('pitch')) {
    // A square drawn at 2 ms must sound at 500 Hz: the whole claim of the bench.
    await preset('Blank paper').click();
    await page.waitForTimeout(250);
    await drawWave('square', 2.5, 0.6); // 2.5 cycles across a 5 ms paper: 2 ms a cycle
    const st = await stage();
    await chip('Hear', 'Yours').click();
    const hz = await pitch();
    line('PITCH a square drawn at 2 ms, played as Yours', `stage says ${st.period} ms / ${st.hz} Hz; the sound is ${hz.toFixed(1)} Hz`);
    // and an octave lower is half the frequency. A 4 ms wave needs two
    // cycles of room, so the paper opens to 2 ms a division first: the same
    // move the 2025 preset makes.
    await chip('Screen', '2 ms').click();
    await page.waitForTimeout(200);
    await drawWave('square', 2.5, 0.6); // 4 ms a cycle on a 10 ms paper
    const st2 = await stage();
    await chip('Hear', 'Yours').click();
    const hz2 = await pitch();
    line('PITCH the same square an octave lower (4 ms)', `stage says ${st2.period} ms / ${st2.hz} Hz; the sound is ${hz2.toFixed(1)} Hz (ratio ${(hz / Math.max(1, hz2)).toFixed(2)})`);
    await chip('Screen', '1 ms').click();
    await page.waitForTimeout(200);
}

if (want('drawn')) {
    // Every paper preset: the scheme's answer drawn by the chips, the stage's
    // reading, and the pitch that comes out of the speakers.
    for (const [name, shapeChip, periodChip, louder] of [
        ['2023: an octave lower', 'Saw', 'Double', false],
        ['2025: louder', 'Square', 'As given', true],
        ['2025: an octave lower', 'Square', 'Double', false],
        ['An octave higher', 'Sine', 'Halve', false],
    ]) {
        await preset(name).click();
        await page.waitForTimeout(200);
        await chip('Shape', shapeChip).click();
        await chip('Period', periodChip).click();
        if (louder) {
            await page.locator('[aria-label="Height"]').focus();
            for (let i = 0; i < 12; i += 1) await page.keyboard.press('ArrowUp');
        }
        await page.waitForTimeout(250);
        const st = await stage();
        await chip('Hear', 'Yours').click();
        const hz = await pitch();
        line(`DRAWN ${name}`, `${st.shape} · ${st.period} ms · ${st.hz} Hz · ${st.verdict}; heard ${hz.toFixed(1)} Hz`);
    }
}

if (want('shapes')) {
    // The four shapes drawn by hand at one width: named, and each at one level.
    await preset('Blank paper').click();
    await page.waitForTimeout(200);
    for (const shape of ['sine', 'square', 'saw', 'triangle']) {
        await drawWave(shape, 4, 0.6);
        const st = await stage();
        await chip('Hear', 'Yours').click();
        const r = await rms(1.5, 0.6);
        const hz = await pitch(0.6);
        line(`SHAPE ${shape} drawn by hand, four cycles`, `read as ${st.shape || 'unnamed'} · ${st.period} ms · heard ${hz.toFixed(1)} Hz at ${dB(r.mean)} dB`);
    }
}

console.log('errors:', errors.length ? errors.join(' | ') : 'none');
await browser.close();
