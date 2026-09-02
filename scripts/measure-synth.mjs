// Listens to the Synth bench. check-bench proves the picture and the
// datasets; this proves the sound: an analyser tapped in front of the
// destination (RMS every 10 ms, time-domain frames kept for the pitch),
// the real UI driven by Playwright.
//
//   node scripts/measure-synth.mjs <url> [scenario]
//   scenarios: level pitch detune filter envelope release lfo mono pwm gate   (default: all)
//
// Do not edit the bench while it runs: Fast Refresh resets the page and
// every reading after that is void. Written 1 Sep 2026 with the bench;
// the panel re-cut of 2 Sep (sliders, a source mixer, PW by LFO, the VCA
// switch) added the pwm and gate scenarios and made level read each source.
import { chromium } from 'playwright';
const url = process.argv[2] || 'http://localhost:3402/synth-bench';
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
        const an = c.createAnalyser(); an.fftSize = 8192; an.smoothingTimeConstant = 0;
        const short = c.createAnalyser(); short.fftSize = 512; short.smoothingTimeConstant = 0;
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
await page.locator('[aria-label="What the bench does for you"] button', { hasText: /^Core$/ }).click(); // the keys live on the Core stage
await page.waitForTimeout(300);
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const chip = (group, name) => page.locator(`[aria-label="${group}"] button`, { hasText: new RegExp('^' + esc(name) + '$') });
const preset = (name) => page.locator('[aria-label="Presets"] button', { hasText: name });
const dial = async (label, key) => { await page.locator(`[aria-label="${label}"]`).focus(); await page.keyboard.press(key); };
// a source slider to one of its ends; `only` takes the other three to zero
const source = async (name, key) => { await dial(name, key); };
const solo = async (name) => { for (const n of ['Pulse', 'Saw', 'Sub', 'Noise']) await source(n, n === name ? 'End' : 'Home'); };
const dB = (x) => (x <= 1e-7 ? ' -inf' : (20 * Math.log10(x)).toFixed(1).padStart(5));
const now = () => page.evaluate(() => window.__ctx?.currentTime ?? 0);
const line = (label, o) => console.log(`${label.padEnd(50)} ${o}`);
async function rms(sec = 2.6, settle = 0.6) {
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
  for (let f = 14; f <= 1200; f += 0.5) { const a = mag(f); if (a > best) { best = a; bestF = f; } }
  for (const d of [2, 3, 4]) if (bestF / d >= 14 && mag(bestF / d) > best * 0.25) { bestF /= d; break; }
  return bestF;
};
// the pitch while a held key sounds: press A on the stage's keyboard by its data-key
async function keyPitch(settle = 0.5) {
  const canvasSel = '[aria-label="Stage"] canvas';
  const box = await page.locator(canvasSel).boundingBox();
  const key = await page.evaluate((sel) => document.querySelector(sel)?.dataset.key || '', canvasSel);
  const [kx, ky] = key.split(':').map(Number);
  await page.mouse.move(box.x + kx, box.y + ky); await page.mouse.down();
  await page.evaluate(() => { window.__keep = true; window.__frames = []; });
  await page.waitForTimeout(settle * 1000 + 300);
  const { frames, sr } = await page.evaluate(() => ({ frames: window.__frames.slice(-3), sr: window.__ctx.sampleRate }));
  await page.evaluate(() => { window.__keep = false; });
  await page.mouse.up();
  await page.waitForTimeout(300);
  const hzs = frames.map((f) => pitchOf(f[1], sr));
  return hzs.sort((a, b) => a - b)[Math.floor(hzs.length / 2)];
}
const want = (name) => !only || only === name;
const playIfStopped = async () => { const b = page.locator('[aria-label="Play"], [aria-label="Stop"]').first(); if ((await b.getAttribute('aria-label')) === 'Play') await b.click(); };
const stopIfPlaying = async () => { const b = page.locator('[aria-label="Play"], [aria-label="Stop"]').first(); if ((await b.getAttribute('aria-label')) === 'Stop') await b.click(); await page.waitForTimeout(300); };
// the level of a held C key, for a fair reading per wave (the sequence's notes vary)
async function keyLevel(sec = 1.6) {
  const canvasSel = '[aria-label="Stage"] canvas';
  const box = await page.locator(canvasSel).boundingBox();
  const k = await page.evaluate((sel) => document.querySelector(sel)?.dataset.key || '', canvasSel);
  const [kx, ky] = k.split(':').map(Number);
  await page.mouse.move(box.x + kx, box.y + ky); await page.mouse.down();
  const r = await rms(sec, 0.4);
  await page.mouse.up(); await page.waitForTimeout(400);
  return r;
}

if (want('level')) {
  for (const p of ['2023 paper', '2024 paper', '2025 paper', 'Fills', 'Judge: a bass', 'Judge: a pad']) {
    await preset(p).click(); await playIfStopped();
    const r = await rms();
    line(`LEVEL ${p}`, `mean ${dB(r.mean)} dB  max ${dB(r.max)}`);
  }
  await preset('2023 paper').click(); await stopIfPlaying();
  for (const w of ['Pulse', 'Saw', 'Sub', 'Noise']) { await solo(w); const r = await keyLevel(); line(`LEVEL C2 held, ${w.toLowerCase()} alone (paired), LPF 700 Hz`, `mean ${dB(r.mean)} dB  max ${dB(r.max)}`); }
  await dial('Cutoff', 'End');
  for (const w of ['Pulse', 'Saw', 'Sub', 'Noise']) { await solo(w); const r = await keyLevel(); line(`LEVEL C2 held, ${w.toLowerCase()} alone (paired), filter open`, `mean ${dB(r.mean)} dB  max ${dB(r.max)}`); }
  await solo('Pulse'); await dial('Pulse width', 'Home'); { const r = await keyLevel(); line('LEVEL C2 held, pulse at 5 % width, filter open', `mean ${dB(r.mean)} dB  max ${dB(r.max)}`); }
  await preset('2023 paper').click();
}
if (want('pitch')) {
  await preset('2023 paper').click(); await stopIfPlaying();
  const c2 = await keyPitch();
  await dial('Range', 'End');
  const c3 = await keyPitch();
  await dial('Range', 'Home');
  const c1 = await keyPitch();
  await preset('2023 paper').click();
  line("PITCH the C key on the bass: 8' · 4' · 16'", `${c2.toFixed(1)} · ${c3.toFixed(1)} · ${c1.toFixed(1)} Hz (65.4 · 130.8 · 32.7)`);
  await solo('Sub'); const sub1 = await keyPitch();
  if (await page.locator('[data-more]').count()) await page.locator('[data-more]').click();
  await chip('Sub octave', '2 oct').click(); const sub2 = await keyPitch(); await chip('Sub octave', '1 oct').click();
  line('PITCH the sub alone at 1 oct · 2 oct', `${sub1.toFixed(1)} · ${sub2.toFixed(1)} Hz (32.7 · 16.4)`);
  await preset('2023 paper').click();
  await chip('Part', 'Lead').click();
  const c4 = await keyPitch();
  line('PITCH the C key on the lead (C4)', `${c4.toFixed(1)} Hz (261.6)`);
  await chip('Part', 'Bass').click();
}
if (want('detune')) {
  await preset('2023 paper').click(); await stopIfPlaying();
  // a pair 12 ct apart beats at f × (2^(12/1200) − 1): at C2 65.4 Hz that is 0.45 Hz; at 50 ct 1.9 Hz
  for (const [key, ct] of [['Home', 0], ['End', 50]]) {
    await dial('Detune', key);
    const canvasSel = '[aria-label="Stage"] canvas';
    const box = await page.locator(canvasSel).boundingBox();
    const k = await page.evaluate((sel) => document.querySelector(sel)?.dataset.key || '', canvasSel);
    const [kx, ky] = k.split(':').map(Number);
    await page.mouse.move(box.x + kx, box.y + ky); await page.mouse.down();
    const r = await rms(3, 0.4);
    await page.mouse.up(); await page.waitForTimeout(300);
    const v = r.pts.map((p) => p[1]);
    const mid = (r.min + r.max) / 2; let ups = 0;
    for (let i = 1; i < v.length; i += 1) if (v[i - 1] < mid && v[i] >= mid) ups += 1;
    line(`DETUNE ${ct} ct held C2: level swing`, `${dB(r.min)} to ${dB(r.max)} dB, ${r.max - r.min > 0.02 ? ups : 0} beats in 3 s (${(65.4 * (2 ** (ct / 1200) - 1) * 3).toFixed(1)} expected)`);
  }
  await dial('Detune', 'Home'); for (let i = 0; i < 12; i += 1) await page.keyboard.press('ArrowUp');
}
if (want('filter')) {
  await preset('2023 paper').click(); await playIfStopped();
  const centroid = async () => {
    await page.evaluate(() => { window.__keep = true; window.__frames = []; });
    await page.waitForTimeout(1500);
    const { frames, sr } = await page.evaluate(() => ({ frames: window.__frames.slice(-6), sr: window.__ctx.sampleRate }));
    await page.evaluate(() => { window.__keep = false; });
    let num = 0; let den = 0;
    for (const [, buf] of frames) {
      const n = buf.length;
      for (let f = 40; f <= 6000; f *= 1.06) {
        let re = 0; let im = 0; const w = (2 * Math.PI * f) / sr;
        for (let i = 0; i < n; i += 4) { re += buf[i] * Math.cos(w * i); im -= buf[i] * Math.sin(w * i); }
        const m = Math.hypot(re, im); num += f * m; den += m;
      }
    }
    return num / den;
  };
  await dial('Cutoff', 'End'); const open = await centroid();
  await dial('Cutoff', 'Home'); const shut = await centroid();
  for (let i = 0; i < 20; i += 1) await page.keyboard.press('ArrowUp');
  const mid = await centroid();
  line('FILTER spectral centroid: cutoff 16 kHz · 40 Hz · mid', `${open.toFixed(0)} · ${shut.toFixed(0)} · ${mid.toFixed(0)} Hz`);
  await preset('2023 paper').click();
  await chip('Filter type', 'HPF').click(); const hp = await centroid(); await chip('Filter type', 'LPF').click();
  line('FILTER centroid LPF 700 Hz vs HPF 700 Hz', `${(await centroid()).toFixed(0)} vs ${hp.toFixed(0)} Hz`);
}
if (want('envelope')) {
  // a held C key: the level at set times after key-down, then after key-up
  const canvasSel = '[aria-label="Stage"] canvas';
  const trace = async (holdSec, tailSec) => {
    const box = await page.locator(canvasSel).boundingBox();
    const k = await page.evaluate((sel) => document.querySelector(sel)?.dataset.key || '', canvasSel);
    const [kx, ky] = k.split(':').map(Number);
    await page.mouse.move(box.x + kx, box.y + ky);
    const t0 = await now();
    await page.mouse.down();
    await page.waitForTimeout(holdSec * 1000);
    const tUp = await now();
    await page.mouse.up();
    await page.waitForTimeout(tailSec * 1000);
    const pts = await page.evaluate((a) => window.__rms.filter((p) => p[0] >= a), t0);
    const at = (sec, from = t0) => { const p = pts.find((q) => q[0] >= from + sec); return p ? dB(p[1]) : '   ? '; };
    return { at, tUp };
  };
  await preset('Judge: a bass').click(); await stopIfPlaying();
  let tr = await trace(1.2, 1.2);
  line('ENVELOPE A 600 D 400 S 80 R 900: level at 50 · 150 · 300 · 600 · 1000 ms', `${tr.at(0.05)} · ${tr.at(0.15)} · ${tr.at(0.3)} · ${tr.at(0.6)} · ${tr.at(1.0)} dB`);
  line('  after key-up at +100 · +400 · +800 · +1100 ms', `${tr.at(0.1, tr.tUp)} · ${tr.at(0.4, tr.tUp)} · ${tr.at(0.8, tr.tUp)} · ${tr.at(1.1, tr.tUp)} dB`);
  await preset('2023 paper').click(); await stopIfPlaying();
  tr = await trace(0.8, 0.5);
  line('ENVELOPE A 5 D 250 S 50 R 90: level at 20 · 50 · 150 · 300 · 600 ms', `${tr.at(0.02)} · ${tr.at(0.05)} · ${tr.at(0.15)} · ${tr.at(0.3)} · ${tr.at(0.6)} dB`);
  line('  after key-up at +30 · +100 · +200 ms', `${tr.at(0.03, tr.tUp)} · ${tr.at(0.1, tr.tUp)} · ${tr.at(0.2, tr.tUp)} dB`);
}
if (want('lfo')) {
  await preset('2023 paper').click(); await playIfStopped();
  await chip('LFO target', 'Amp').click();
  await dial('Depth', 'End');
  await dial('Rate', 'Home'); for (let i = 0; i < 139; i += 1) await page.keyboard.press('ArrowUp'); // 69.5 positions: 0.1 Hz × 200^0.695 ≈ 4 Hz
  const rateText = await page.evaluate(() => document.querySelector('[aria-label="Rate"]')?.getAttribute('aria-valuetext'));
  await chip('Part', 'Pad').click(); await page.waitForTimeout(600);
  const r = await rms(3, 0.8);
  const v = r.pts.map((p) => p[1]);
  let peaks = 0; let lastPeak = -1;
  for (let i = 2; i < v.length - 2; i += 1) if (v[i] > v[i - 1] && v[i] >= v[i + 1] && v[i] > v[i - 2] && v[i] >= v[i + 2] && i - lastPeak > 8) { peaks += 1; lastPeak = i; }
  line(`LFO tremolo at ${rateText} on the pad: swells in 3 s`, `${peaks} (${(parseFloat(rateText) * 3).toFixed(0)} expected), level ${dB(r.min)} to ${dB(r.max)} dB`);
  await dial('Depth', 'Home'); await chip('Part', 'Bass').click();
}
if (want('mono')) {
  await preset('Judge: a pad').click(); await playIfStopped(); await page.waitForTimeout(400);
  const mono = await rms(2.2, 0.8);
  if (await page.locator('[data-more]').count()) await page.locator('[data-more]').click();
  await chip('Voices', 'Poly').click(); await page.waitForTimeout(600);
  const poly = await rms(2.2, 0.8);
  line('MONO vs POLY on the pad chord: level', `${dB(mono.mean)} vs ${dB(poly.mean)} dB (four notes should be louder than one)`);
}
if (want('release')) {
  // the release traced every 100 ms after key-up, against the model's straight line
  await preset('Judge: a bass').click(); await stopIfPlaying();
  const canvasSel = '[aria-label="Stage"] canvas';
  const box = await page.locator(canvasSel).boundingBox();
  const k = await page.evaluate((sel) => document.querySelector(sel)?.dataset.key || '', canvasSel);
  const [kx, ky] = k.split(':').map(Number);
  await page.mouse.move(box.x + kx, box.y + ky); await page.mouse.down();
  await page.waitForTimeout(1300);
  await page.mouse.up();
  const tUp = await page.evaluate(() => window.__ctx.currentTime);
  await page.waitForTimeout(1200);
  const pts = await page.evaluate((a) => window.__rms.filter((p) => p[0] >= a - 0.05), tUp);
  const ref = pts[0][1];
  const row = [];
  for (let ms = 0; ms <= 1000; ms += 100) { const p = pts.find((q) => q[0] >= tUp + ms / 1000); row.push(p ? (20 * Math.log10(Math.max(1e-6, p[1] / ref))).toFixed(1) : '?'); }
  line('RELEASE 900 ms, dB below the held level at 0..1000 ms after key-up', row.join(' · '));
  line('  the model\'s straight line would give', [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000].map((ms) => (ms >= 900 ? '-inf' : (20 * Math.log10(1 - ms / 900)).toFixed(1))).join(' · '));
}
if (want('pwm')) {
  // a pulse's level follows its width (RMS of a ±1 pulse of duty w is 2·sqrt(w(1−w))): with PW by LFO the
  // width sweeps 5 to 95 % and the level swings about 7 dB, twice per LFO cycle; by hand it holds still
  await preset('2023 paper').click(); await stopIfPlaying();
  await dial('Cutoff', 'End'); await dial('Pulse width', 'Home');
  if (await page.locator('[data-more]').count()) await page.locator('[data-more]').click();
  await chip('Osc 2', 'Off').click();
  await dial('Rate', 'Home'); for (let i = 0; i < 87; i += 1) await page.keyboard.press('ArrowUp'); // 43.5 positions ≈ 1 Hz
  const rateText = await page.evaluate(() => document.querySelector('[aria-label="Rate"]')?.getAttribute('aria-valuetext'));
  const canvasSel = '[aria-label="Stage"] canvas';
  const hold = async (sec) => {
    const box = await page.locator(canvasSel).boundingBox();
    const k = await page.evaluate((sel) => document.querySelector(sel)?.dataset.key || '', canvasSel);
    const [kx, ky] = k.split(':').map(Number);
    await page.mouse.move(box.x + kx, box.y + ky); await page.mouse.down();
    const r = await rms(sec, 0.5);
    await page.mouse.up(); await page.waitForTimeout(400);
    return r;
  };
  // a 10 ms window straddles a narrow pulse, so the level is read in 100 ms bins
  const bins = (r) => { const out = []; const t0 = r.pts[0][0]; for (const [t, x] of r.pts) { const i = Math.floor((t - t0) / 0.1); (out[i] ||= []).push(x * x); } return out.filter(Boolean).map((a) => Math.sqrt(a.reduce((s2, x) => s2 + x, 0) / a.length)); };
  await chip('PW by', 'man').click(); const still = bins(await hold(3));
  await chip('PW by', 'LFO').click(); const moving = bins(await hold(3));
  const lo = Math.min(...moving); const hi = Math.max(...moving); const mid = (lo + hi) / 2; let ups = 0;
  for (let i = 1; i < moving.length; i += 1) if (moving[i - 1] < mid && moving[i] >= mid) ups += 1;
  line(`PWM width 5 % by hand: level swing (100 ms bins)`, `${dB(Math.min(...still))} to ${dB(Math.max(...still))} dB`);
  line(`PWM width 5 to 95 % by the LFO at ${rateText}: level swing`, `${dB(lo)} to ${dB(hi)} dB, ${ups} swells in 3 s (${(parseFloat(rateText) * 6).toFixed(0)} expected)`);
  await chip('PW by', 'man').click(); await preset('2023 paper').click();
}
if (want('gate')) {
  // the VCA on Gate: full within 10 ms of key-down whatever the attack, silent within 30 ms of key-up whatever the release
  const canvasSel = '[aria-label="Stage"] canvas';
  const trace = async (holdSec, tailSec) => {
    const box = await page.locator(canvasSel).boundingBox();
    const k = await page.evaluate((sel) => document.querySelector(sel)?.dataset.key || '', canvasSel);
    const [kx, ky] = k.split(':').map(Number);
    await page.mouse.move(box.x + kx, box.y + ky);
    const t0 = await now();
    await page.mouse.down();
    await page.waitForTimeout(holdSec * 1000);
    const tUp = await now();
    await page.mouse.up();
    await page.waitForTimeout(tailSec * 1000);
    const pts = await page.evaluate((a) => window.__rms.filter((p) => p[0] >= a), t0);
    const at = (sec, from = t0) => { const p = pts.find((q) => q[0] >= from + sec); return p ? dB(p[1]) : '   ? '; };
    return { at, tUp };
  };
  await preset('Judge: a bass').click(); await stopIfPlaying();
  await chip('VCA', 'Env').click();
  let tr = await trace(1.0, 1.0);
  line('GATE off (A 600 R 900): level at 15 · 100 ms, then +50 · +300 ms after key-up', `${tr.at(0.015)} · ${tr.at(0.1)} dB, then ${tr.at(0.05, tr.tUp)} · ${tr.at(0.3, tr.tUp)} dB`);
  await chip('VCA', 'Gate').click();
  tr = await trace(1.0, 1.0);
  line('GATE on  (A 600 R 900): level at 15 · 100 ms, then +50 · +300 ms after key-up', `${tr.at(0.015)} · ${tr.at(0.1)} dB, then ${tr.at(0.05, tr.tUp)} · ${tr.at(0.3, tr.tUp)} dB`);
  await chip('VCA', 'Env').click();
}
if (errors.length) console.log('page errors:', errors.join(' | '));
await browser.close();
