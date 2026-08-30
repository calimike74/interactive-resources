// Listens to the Oscilloscope. check-bench proves the picture and the
// datasets; this proves the sound: an analyser tapped in front of the
// destination (RMS every 25 ms, and time-domain frames kept for the
// pitch), the real UI driven by Playwright.
//
//   node scripts/measure-scope.mjs <url> [scenario]
//   scenarios: level pitch octave stretch louder lfo   (default: all)
//
// Do not edit the bench while it runs: Fast Refresh resets the page and
// every reading after that is void. Written 30 Aug 2026 with the bench.
import { chromium } from 'playwright';
const url = process.argv[2] || 'http://localhost:3402/oscilloscope';
const only = process.argv[3] || '';
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 700 }, deviceScaleFactor: 1 });
const u = new URL(url);
await ctx.addCookies([{ name: 'mts_consent', value: 'essential', domain: u.hostname, path: '/' }]);
await ctx.addInitScript(() => {
  window.__rms = []; window.__frames = []; window.__keep = false;
  const oc = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (dest, ...rest) {
    if (dest instanceof AudioDestinationNode) {
      const c = dest.context;
      if (!window.__tap) {
        // two taps: a short one for level (21 ms, so a 4 Hz tremolo is seen whole), a long one for pitch
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
      oc.call(this, window.__short || window.__tap, ...rest); return oc.call(this, window.__tap, ...rest);
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
const chip = (group, name) => page.locator(`[aria-label="${group}"] button`, { hasText: new RegExp('^' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$') });
const preset = (name) => page.locator('[aria-label="Presets"] button', { hasText: name });
const dB = (x) => (x <= 1e-7 ? ' -inf' : (20 * Math.log10(x)).toFixed(1).padStart(5));
const now = () => page.evaluate(() => window.__ctx?.currentTime ?? 0);
const line = (label, o) => console.log(`${label.padEnd(46)} ${o}`);
async function rms(sec = 2.5, settle = 0.8) {
  await page.waitForTimeout(settle * 1000);
  const t0 = await now();
  await page.waitForTimeout(sec * 1000);
  const t1 = await now();
  const pts = await page.evaluate(([a, b]) => window.__rms.filter((p) => p[0] >= a && p[0] <= b), [t0, t1]);
  const v = pts.map((p) => p[1]);
  return { mean: Math.sqrt(v.reduce((s, x) => s + x * x, 0) / Math.max(1, v.length)), max: Math.max(...v), min: Math.min(...v), n: v.length, pts };
}
const pitchOf = (buf, sr) => {
  const n = buf.length; const win = buf.map((x, i) => x * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1))));
  const mag = (f) => { let re = 0; let im = 0; const w = (2 * Math.PI * f) / sr; for (let i = 0; i < n; i += 1) { re += win[i] * Math.cos(w * i); im -= win[i] * Math.sin(w * i); } return Math.hypot(re, im); };
  let bestF = 0; let best = 0;
  for (let f = 40; f <= 1300; f += 0.5) { const a = mag(f); if (a > best) { best = a; bestF = f; } }
  for (const d of [2, 3]) if (bestF / d >= 40 && mag(bestF / d) > best * 0.3) { bestF /= d; break; }
  return bestF;
};
async function pitch(settle = 0.9) {
  await page.evaluate(() => { window.__keep = true; window.__frames = []; });
  await page.waitForTimeout(settle * 1000 + 300);
  const { frames, sr } = await page.evaluate(() => ({ frames: window.__frames.slice(-3), sr: window.__ctx.sampleRate }));
  await page.evaluate(() => { window.__keep = false; });
  const hzs = frames.map((f) => pitchOf(f[1], sr));
  return hzs.sort((a, b) => a - b)[Math.floor(hzs.length / 2)];
}
const want = (name) => !only || only === name;

if (want('level')) {
  for (const src of ['Cello', 'Bass', 'Voice', 'Sine', 'Square', 'Saw', 'Triangle']) {
    await chip('Source', src).click();
    const r = await rms();
    line(`LEVEL ${src.toLowerCase()} as played`, `mean ${dB(r.mean)} dB  max ${dB(r.max)}`);
  }
}
if (want('pitch')) {
  for (const [src, wantHz] of [['Cello', 173.8], ['Bass', 103.8], ['Voice', 260], ['Sine', 250], ['Square', 500]]) {
    await chip('Source', src).click();
    const hz = await pitch();
    line(`PITCH ${src.toLowerCase()} as played (file says ${wantHz})`, `${hz.toFixed(1)} Hz`);
  }
}
if (want('octave')) {
  await preset('294 Hz, an octave up').click();
  const base = await pitch();
  await chip('Octave', 'Up').click();
  const up = await pitch();
  await chip('Octave', 'Down').click();
  const down = await pitch();
  await chip('Octave', 'As played').click();
  line('OCTAVE sine: as played · up · down', `${base.toFixed(1)} · ${up.toFixed(1)} · ${down.toFixed(1)} Hz (294 · 588 · 147)`);
  await chip('Source', 'Cello').click();
  const c0 = await pitch();
  await chip('Octave', 'Up').click();
  const c1 = await pitch();
  await chip('Octave', 'As played').click();
  line('OCTAVE cello (a recording at twice the speed)', `${c0.toFixed(1)} then ${c1.toFixed(1)} Hz (ratio ${(c1 / c0).toFixed(2)})`);
}
if (want('stretch')) {
  await preset('Read the period').click();
  await page.waitForTimeout(500);
  const canvasSel = '[aria-label="Stage"] canvas';
  const before = await page.evaluate((sel) => ({ p: document.querySelector(sel).dataset.period, h: document.querySelector(sel).dataset.handle }), canvasSel);
  const box = await page.locator(canvasSel).boundingBox();
  const [hx, hy] = before.h.split(':').map(Number);
  await page.mouse.move(box.x + hx, box.y + hy); await page.mouse.down();
  await page.mouse.move(box.x + hx + 60, box.y + hy, { steps: 8 }); await page.mouse.up();
  await page.waitForTimeout(300);
  const after = await page.evaluate((sel) => document.querySelector(sel).dataset.period, canvasSel);
  const hz = await pitch();
  line('STRETCH the bracket dragged 60 px right', `period ${before.p} -> ${after} ms on the stage; the sound at ${hz.toFixed(1)} Hz (1000 / ${after} = ${(1000 / Number(after)).toFixed(1)})`);
}
if (want('louder')) {
  await preset('Louder').click();
  const r0 = await rms();
  await page.locator('[aria-label="Level"]').focus();
  for (let i = 0; i < 12; i += 1) await page.keyboard.press('ArrowUp');
  const r6 = await rms();
  line('LOUDER square at 0 dB then +6 dB', `${dB(r0.mean)} then ${dB(r6.mean)} dB (${(20 * Math.log10(r6.mean / r0.mean)).toFixed(1)} dB apart)`);
}
if (want('lfo')) {
  // swells a second: local maxima of the level series, at least 60 ms apart
  const swells = (pts) => {
    const vals = pts.map((p) => p[1]);
    let n = 0; let lastT = -1;
    for (let i = 4; i < vals.length - 4; i += 1) {
      let top = true;
      for (let k = 1; k <= 4; k += 1) if (vals[i] < vals[i - k] || vals[i] < vals[i + k]) { top = false; break; }
      if (top && vals[i] > 1e-4 && pts[i][0] - lastT > 0.06) { n += 1; lastT = pts[i][0]; }
    }
    return n / (pts[pts.length - 1][0] - pts[0][0]);
  };
  await preset('The LFO').click();
  const more = page.locator('[data-more]');
  if (await more.count()) await more.click();
  await chip('LFO', 'Quaver').click();
  const r = await rms(3, 1.2);
  line('LFO quaver at 120 bpm: swells a second', `${swells(r.pts).toFixed(2)} Hz over 3 s (4 expected); depth ${dB(r.max)} to ${dB(r.min)} dB`);
  await chip('LFO', 'Crotchet').click();
  const r2 = await rms(3, 1.2);
  line('LFO crotchet: swells a second', `${swells(r2.pts).toFixed(2)} Hz (2 expected)`);
  await chip('LFO', 'Semiquaver').click();
  const r3 = await rms(3, 1.2);
  line('LFO semiquaver: swells a second', `${swells(r3.pts).toFixed(2)} Hz (8 expected)`);
}
console.log('errors:', errors.length ? errors.join(' | ') : 'none');
await browser.close();
