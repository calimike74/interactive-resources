// Listens to the Piano Roll. check-bench proves the picture and the
// datasets; this proves the sound: an analyser tapped in front of the
// destination (RMS every 25 ms, and a time-domain frame kept for the
// pitch), every buffer source's start time and buffer length recorded (so
// a hit can be named by the file it played), the real UI driven by
// Playwright.
//
//   node scripts/measure-roll.mjs <url> [scenario]
//   scenarios: level velocity bend quantise hold restart   (default: all)
//
// Do not edit the bench while it runs: Fast Refresh resets the page and
// every reading after that is void. Written 30 Aug 2026 with the bench,
// as the Lane's first listen taught (BENCH-STANDARD, 29 Aug late).
import { chromium } from 'playwright';
const url = process.argv[2] || 'http://localhost:3402/piano-roll';
const only = process.argv[3] || '';
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 700 }, deviceScaleFactor: 1 });
const u = new URL(url);
await ctx.addCookies([{ name: 'mts_consent', value: 'essential', domain: u.hostname, path: '/' }]);
await ctx.addInitScript(() => {
  window.__rms = []; window.__starts = []; window.__frames = []; window.__oscs = 0;
  const oc = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (dest, ...rest) {
    if (dest instanceof AudioDestinationNode) {
      const c = dest.context;
      if (!window.__tap) {
        const an = c.createAnalyser(); an.fftSize = 4096; an.smoothingTimeConstant = 0;
        oc.call(an, dest); window.__tap = an; window.__ctx = c;
        const buf = new Float32Array(an.fftSize);
        setInterval(() => {
          an.getFloatTimeDomainData(buf);
          let s = 0; for (let i = 0; i < buf.length; i += 1) s += buf[i] * buf[i];
          window.__rms.push([c.currentTime, Math.sqrt(s / buf.length)]);
          if (window.__keepFrames) window.__frames.push([c.currentTime, Array.from(buf)]);
          if (window.__frames.length > 520) window.__frames.shift();
        }, 25);
      }
      return oc.call(this, window.__tap, ...rest);
    }
    return oc.call(this, dest, ...rest);
  };
  const os = AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start = function (when, off, dur) {
    window.__starts.push([+(when || 0).toFixed(4), +(this.buffer?.duration || 0).toFixed(3)]);
    if (window.__starts.length > 2000) window.__starts.splice(0, 1000);
    return os.call(this, when, off, dur);
  };
  const oo = AudioContext.prototype.createOscillator;
  AudioContext.prototype.createOscillator = function () { window.__oscs += 1; return oo.call(this); };
  window.__oscStarts = [];
  const ost = OscillatorNode.prototype.start;
  OscillatorNode.prototype.start = function (when) { window.__oscStarts.push([+(when || 0).toFixed(4), +this.frequency.value.toFixed(2)]); if (window.__oscStarts.length > 400) window.__oscStarts.splice(0, 200); return ost.call(this, when); };
});
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForSelector('[data-bench-frame]', { timeout: 15000 });
await page.waitForTimeout(800);
const begin = page.locator('button', { hasText: /Play the bench/ }).first();
if (await begin.count()) { await begin.click(); await page.waitForTimeout(1200); }
const chip = (group, name) => page.locator(`[aria-label="${group}"] button`, { hasText: new RegExp('^' + name.replace(/\//g, '\\/') + '$') });
const preset = (name) => page.locator('[aria-label="Presets"] button', { hasText: name });
const dB = (x) => (x <= 1e-7 ? ' -inf' : (20 * Math.log10(x)).toFixed(1).padStart(5));
const now = () => page.evaluate(() => window.__ctx?.currentTime ?? 0);
const LOOP = 10; // 16 beats at 96 bpm
const line = (label, o) => console.log(`${label.padEnd(44)} ${o}`);
async function rmsOver(sec = LOOP, settle = 1.0) {
  await page.waitForTimeout(settle * 1000);
  const t0 = await now();
  await page.waitForTimeout(sec * 1000);
  const t1 = await now();
  const pts = await page.evaluate(([a, b]) => window.__rms.filter((p) => p[0] >= a && p[0] <= b), [t0, t1]);
  const v = pts.map((p) => p[1]);
  const mean = Math.sqrt(v.reduce((s, x) => s + x * x, 0) / Math.max(1, v.length));
  return { t0, t1, mean, max: Math.max(...v), n: v.length, silent: v.filter((x) => x < 1e-5).length, pts };
}
async function measure(label, sec = LOOP) {
  const r = await rmsOver(sec);
  line(label, `mean ${dB(r.mean)} dB  max ${dB(r.max)}  silent ${r.silent}/${r.n}`);
  return r;
}
const stopPlay = async () => { const b = page.locator('[aria-label="Stop"]'); if (await b.count()) await b.click(); };
const play = async () => { const b = page.locator('[aria-label="Play"]'); if (await b.count()) await b.click(); };
const want = (name) => !only || only === name;

// ---- level: each kit, and the bass, at unity ----
if (want('level')) {
  await preset('Velocity table').click();
  await measure('LEVEL drums, acoustic kit');
  await chip('Kit', 'Electronic').click();
  await measure('LEVEL drums, electronic kit');
  await chip('Kit', 'Acoustic').click();
  await preset('Bend range').click();
  await measure('LEVEL bass, square wave');
  const oscs = await page.evaluate(() => window.__oscs);
  line('oscillators made for one pass of the bass', `${oscs} (25 notes in the file)`);
}

// ---- velocity: each hit's level against its velocity ----
if (want('velocity')) {
  await preset('Velocity table').click();
  await page.waitForTimeout(600);
  const roll = await page.evaluate(() => document.querySelector('[aria-label="Stage"] canvas')?.dataset.roll || '');
  const notes = roll.split(':')[1].split(',').map((s) => s.split('/').map(Number)).map(([id, note, at64, vel]) => ({ id, note, at: at64 / 64, vel }));
  const r = await rmsOver(LOOP + 0.5, 0.6);
  // the loop's start: the earliest start() at or after t0, on the beat grid
  const starts = await page.evaluate(([a, b]) => window.__starts.filter((s) => s[0] >= a && s[0] <= b), [r.t0, r.t1]);
  const beatSec = 60 / 96;
  const loopStart = starts.length ? Math.min(...starts.map((s) => s[0])) : r.t0;
  // the level 20 to 80 ms after each note, in the lane where only that note sounds (bar 2's hats)
  const hats = notes.filter((n) => n.note === 42 && n.at >= 4 && n.at < 7).sort((a, b) => a.vel - b.vel);
  const lvl = (t) => { const a = loopStart + t * beatSec; const pts = r.pts.filter((p) => p[0] >= a + 0.02 && p[0] <= a + 0.08).map((p) => p[1]); return pts.length ? Math.max(...pts) : 0; };
  const shownHats = [hats[0], hats[hats.length - 1]];
  for (const h of shownHats) line(`VELOCITY hat at ${h.at.toFixed(2)} vel ${h.vel}`, `peak ${dB(lvl(h.at))} dB`);
  const kicks = notes.filter((n) => n.note === 36 && n.at < 4);
  for (const k of kicks.slice(0, 2)) line(`VELOCITY kick at ${k.at.toFixed(2)} vel ${k.vel}`, `peak ${dB(lvl(k.at))} dB`);
  line('velocity, ghost hat against accent hat', `${(20 * Math.log10(lvl(shownHats[1].at) / Math.max(1e-7, lvl(shownHats[0].at)))).toFixed(1)} dB apart (velocity ${shownHats[0].vel} to ${shownHats[1].vel})`);
}

// ---- bend: the pitch of the long A at the bottom of the bend, by range ----
if (want('bend')) {
  const pitchOf = (buf, sr = 44100) => {
    // a DFT over 24 to 500 Hz in 0.5 Hz steps (a Hann window), the strongest
    // line; if the line at half that frequency carries more than a third of
    // its energy, that is the fundamental (a filtered square wave)
    const n = buf.length; const win = buf.map((x, i) => x * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1))));
    const mag = (f) => { let re = 0; let im = 0; const w = (2 * Math.PI * f) / sr; for (let i = 0; i < n; i += 1) { re += win[i] * Math.cos(w * i); im -= win[i] * Math.sin(w * i); } return Math.hypot(re, im); };
    let bestF = 0; let best = 0;
    for (let f = 24; f <= 500; f += 0.5) { const a = mag(f); if (a > best) { best = a; bestF = f; } }
    if (bestF >= 48 && mag(bestF / 2) > best * 0.33) bestF /= 2;
    return bestF;
  };
  const readAt = async (label, beatsAfter) => {
    await page.evaluate(() => { window.__keepFrames = true; window.__frames = []; });
    await page.waitForTimeout(LOOP * 1000 + 1500);
    const { frames, oscStarts, sr } = await page.evaluate(() => ({ frames: window.__frames, oscStarts: window.__oscStarts, sr: window.__ctx.sampleRate }));
    const beatSec = 60 / 96;
    // the long A: a 110 Hz start with nothing else starting for the next 3.5 beats (bar 1 has a short A2 too)
    const lastFrame = frames[frames.length - 1][0];
    const longA = oscStarts.filter((o, i) => Math.abs(o[1] - 110) < 1 && !oscStarts.some((p) => p[0] > o[0] + 0.01 && p[0] < o[0] + 3.5 * beatSec) && o[0] + beatsAfter * beatSec < lastFrame - 0.1 && o[0] + beatsAfter * beatSec > frames[0][0]);
    if (!longA.length) { line(label, 'no long A found in the window'); return; }
    const t12 = longA[longA.length - 1][0];
    const target = t12 + beatsAfter * beatSec;
    let best = frames[0];
    for (const f of frames) if (Math.abs(f[0] - target) < Math.abs(best[0] - target)) best = f;
    const hz = pitchOf(best[1], sr);
    line(label, `${hz.toFixed(1)} Hz, ${((best[0] - t12) / beatSec).toFixed(2)} beats into the long A (context at ${sr} Hz)`);
    return hz;
  };
  await preset('Bend range').click();
  await readAt('BEND range 2: the long A before the bend (A2, 110 Hz)', 0.6);
  await readAt('BEND range 2: the bottom of the bend (a tone down is 98 Hz)', 3.0);
  await chip('Bend range', '12').click();
  await readAt('BEND range 12: the long A before the bend (110 Hz)', 0.6);
  await readAt('BEND range 12: halfway down (a tritone down is 78 Hz)', 2.0);
  await readAt('BEND range 12: the bottom of the bend (an octave down is 55 Hz)', 3.0);
  await readAt('BEND range 12: back at the centre (110 Hz)', 3.85);
  await chip('Bend range', '24').click();
  await readAt('BEND range 24: the bottom of the bend (two octaves down is 27.5 Hz)', 3.0);
  await page.evaluate(() => { window.__keepFrames = false; });
}

// ---- quantise: the roll's distinct onsets on and off the grid ----
if (want('quantise')) {
  await preset('Hi-hat roll').click();
  const count = async (label) => {
    // wait for the next pass to begin, then count exactly that pass
    const seen = await page.evaluate(() => window.__benchLoopStart || 0);
    await page.waitForFunction((prev) => (window.__benchLoopStart || 0) > prev, seen, { timeout: 15000 });
    const origin = await page.evaluate(() => window.__benchLoopStart);
    await page.waitForTimeout(LOOP * 1000 + 300);
    const starts = await page.evaluate(([a, b]) => window.__starts.filter((s) => s[0] >= a - 0.001 && s[0] < b - 0.001), [origin, origin + LOOP]);
    const times = new Set(starts.map((s) => Math.round(s[0] * 200)));
    line(label, `${starts.length} hits booked, ${times.size} distinct onsets`);
    return { hits: starts.length, distinct: times.size };
  };
  const off = await count('QUANTISE off: the roll as written');
  await chip('Quantise', '1/16').click();
  const hard = await count('QUANTISE 1/16 at 100: the roll collapsed');
  await chip('Quantise', '1/32').click();
  const fine = await count('QUANTISE 1/32: the roll whole');
  line('quantise, onsets lost on 1/16', `${off.distinct - hard.distinct} of ${off.distinct}; on 1/32, ${off.distinct - fine.distinct}`);
}

// ---- hold: the example plays the right sound on the kick's row ----
if (want('hold')) {
  await preset('Wrong sounds').click();
  await chip('Quantise', 'Off').click();
  const kickFiles = async (label) => {
    const seen = await page.evaluate(() => window.__benchLoopStart || 0);
    await page.waitForFunction((prev) => (window.__benchLoopStart || 0) > prev, seen, { timeout: 15000 });
    const origin = await page.evaluate(() => window.__benchLoopStart);
    await page.waitForTimeout(LOOP * 1000 + 300);
    const starts = await page.evaluate(([a, b]) => window.__starts.filter((s) => s[0] >= a - 0.001 && s[0] < b - 0.001), [origin, origin + LOOP]);
    // beat 4.5 of bars 2 and 4: the kick's pickup and the low tom, no hat, no ride, no crash
    const beatSec = 60 / 96;
    const at = (beat) => starts.filter((s) => Math.abs(s[0] - (origin + beat * beatSec)) < 0.02).map((s) => s[1]).sort();
    line(label, `at bar 2 beat 4.5: ${at(7.5).join(', ')} s; at bar 4 beat 4.5: ${at(15.5).join(', ')} s`);
  };
  await kickFiles('HOLD off: the wrong map (kick row plays the crash 2.56, tom row the open hat 1.36)');
  const hold = page.locator('[data-hold]');
  await hold.dispatchEvent('pointerdown');
  await kickFiles('HOLD on: the example (kick 0.408 and low tom 0.434)');
  await hold.dispatchEvent('pointerup');
}

// ---- restart: no double notes after stop and start ----
if (want('restart')) {
  await preset('Velocity table').click();
  const perLoop = async (label) => {
    await page.waitForTimeout(600);
    const t0 = await now();
    await page.waitForTimeout(LOOP * 1000);
    const t1 = await now();
    const n = await page.evaluate(([a, b]) => window.__starts.filter((s) => s[0] >= a && s[0] <= b).length, [t0, t1]);
    const r = await rmsOver(2, 0);
    line(label, `${n} hits in ${LOOP} s, mean ${dB(r.mean)} dB`);
    return n;
  };
  const before = await perLoop('RESTART: before');
  await stopPlay();
  await page.waitForTimeout(400);
  await play();
  const after = await perLoop('RESTART: after a stop and start');
  line('restart, hits per loop', `${before} then ${after}`);
}

console.log('errors:', errors.length ? errors.join(' | ') : 'none');
await browser.close();
