// Listens to the Sequence bench. check-bench proves the picture and the
// datasets; this proves the sound: an analyser tapped in front of the
// destination (RMS every 25 ms), every buffer source's start time recorded
// (so a drum hit can be placed on the clock), every oscillator's start
// recorded (so a synth note can be), and a second reading of the same
// signal above 1.2 kHz, because a low-pass on a bass line takes the top off
// without taking much level (the fundamental holds most of a saw's power),
// so the filter is proved in the band it works on. The real UI is driven
// by Playwright.
//
//   node scripts/measure-seq.mjs <url> [scenario]
//   scenarios: level swing filter record hold restart   (default: all)
//
// Do not edit the bench while it runs: Fast Refresh resets the page and
// every reading after that is void (BENCH-STANDARD, 29 Aug late).
import { chromium } from 'playwright';
const url = process.argv[2] || 'http://localhost:3416/sequence-bench';
const only = process.argv[3] || '';
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 700 }, deviceScaleFactor: 1 });
const u = new URL(url);
await ctx.addCookies([{ name: 'mts_consent', value: 'essential', domain: u.hostname, path: '/' }]);
await ctx.addInitScript(() => {
  window.__rms = []; window.__starts = []; window.__oscStarts = []; window.__oscs = 0;
  const oc = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (dest, ...rest) {
    if (dest instanceof AudioDestinationNode) {
      const c = dest.context;
      if (!window.__tap) {
        const an = c.createAnalyser(); an.fftSize = 4096; an.smoothingTimeConstant = 0;
        oc.call(an, dest); window.__tap = an; window.__ctx = c;
        const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1200; hp.Q.value = -3;
        const an2 = c.createAnalyser(); an2.fftSize = 4096; an2.smoothingTimeConstant = 0;
        oc.call(an, hp); oc.call(hp, an2);
        const buf = new Float32Array(an.fftSize); const buf2 = new Float32Array(an2.fftSize);
        setInterval(() => {
          an.getFloatTimeDomainData(buf); an2.getFloatTimeDomainData(buf2);
          let s = 0; let pk = 0; let s2 = 0;
          for (let i = 0; i < buf.length; i += 1) { s += buf[i] * buf[i]; pk = Math.max(pk, Math.abs(buf[i])); s2 += buf2[i] * buf2[i]; }
          window.__rms.push([c.currentTime, Math.sqrt(s / buf.length), pk, Math.sqrt(s2 / buf2.length)]);
          if (window.__rms.length > 4000) window.__rms.splice(0, 2000);
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
  const ost = OscillatorNode.prototype.start;
  OscillatorNode.prototype.start = function (when) { window.__oscStarts.push([+(when || 0).toFixed(4), +this.frequency.value.toFixed(2)]); if (window.__oscStarts.length > 800) window.__oscStarts.splice(0, 400); return ost.call(this, when); };
});
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForSelector('[data-bench-frame]', { timeout: 15000 });
await page.waitForTimeout(800);
const begin = page.locator('button', { hasText: /Play the bench/ }).first();
if (await begin.count()) { await begin.click(); await page.waitForTimeout(1200); }
const preset = (name) => page.locator('[aria-label="Presets"] button', { hasText: name });
const depthBtn = (label) => page.locator('[aria-label="What the bench does for you"] button', { hasText: new RegExp('^' + label + '$') });
const dB = (x) => (x <= 1e-7 ? ' -inf' : (20 * Math.log10(x)).toFixed(1).padStart(5));
const now = () => page.evaluate(() => window.__ctx?.currentTime ?? 0);
const line = (label, o) => console.log(`${label.padEnd(50)} ${o}`);
const tempoOf = () => page.evaluate(() => Number(document.querySelector('[aria-label="Tempo"]')?.getAttribute('aria-valuenow') || 112));
async function rmsOver(sec, settle = 0.8) {
  await page.waitForTimeout(settle * 1000);
  const t0 = await now();
  await page.waitForTimeout(sec * 1000);
  const t1 = await now();
  const pts = await page.evaluate(([a, b]) => window.__rms.filter((p) => p[0] >= a && p[0] <= b), [t0, t1]);
  const v = pts.map((p) => p[1]); const v2 = pts.map((p) => p[3] || 0);
  const rms = (a) => Math.sqrt(a.reduce((s, x) => s + x * x, 0) / Math.max(1, a.length));
  return { t0, t1, mean: rms(v), hi: rms(v2), max: Math.max(...v), peak: Math.max(...pts.map((p) => p[2])), n: v.length, silent: v.filter((x) => x < 1e-5).length, pts };
}
async function measure(label, sec) {
  const r = await rmsOver(sec);
  line(label, `mean ${dB(r.mean)} dB  above 1.2 kHz ${dB(r.hi)} dB  peak ${dB(r.peak)} dBFS  silent ${r.silent}/${r.n}`);
  return r;
}
async function setDial(label, tenths) {
  // the kit's dials take the keyboard: Home, then PageUp a tenth of the travel at a time
  const d = page.locator(`[aria-label="${label}"]`);
  await d.focus();
  await page.keyboard.press('Home');
  for (let i = 0; i < tenths; i += 1) await page.keyboard.press('PageUp');
  await page.waitForTimeout(120);
  return d.getAttribute('aria-valuetext');
}
const want = (name) => !only || only === name;
const barSec = async () => (60 / (await tempoOf())) * 4;

// ---- level: each preset over two bars ----
if (want('level')) {
  for (const name of ['Bass and chords', 'Hats and swing', 'Filter sweep', 'Played in']) {
    await preset(name).click();
    await measure(`LEVEL ${name}`, (await barSec()) * 2);
  }
  const oscs = await page.evaluate(() => window.__oscs);
  line('oscillators made so far', `${oscs}`);
}

// ---- swing: the hats' start times against the sixteenth grid ----
if (want('swing')) {
  const offsets = async (label) => {
    const seen = await page.evaluate(() => window.__benchLoopStart || 0);
    await page.waitForFunction((prev) => (window.__benchLoopStart || 0) > prev, seen, { timeout: 15000 });
    const origin = await page.evaluate(() => window.__benchLoopStart);
    const bar = await barSec();
    await page.waitForTimeout(bar * 1000 + 300);
    const starts = await page.evaluate(([a, b]) => window.__starts.filter((s) => s[0] >= a - 0.001 && s[0] < b - 0.001), [origin, origin + bar]);
    const stepSec = bar / 16;
    const late = starts.map((s) => { const pos = (s[0] - origin) / stepSec; const st = Math.round(pos); return { st, ms: (pos - st) * stepSec * 1000 }; });
    const odd = late.filter((x) => x.st % 2 === 1).map((x) => x.ms);
    const even = late.filter((x) => x.st % 2 === 0).map((x) => x.ms);
    const avg = (a) => (a.length ? (a.reduce((p, q) => p + q, 0) / a.length).toFixed(1) : 'none');
    line(label, `${starts.length} hits booked; even steps ${avg(even)} ms off the grid, odd steps ${avg(odd)} ms late`);
  };
  await preset('Judge: straight').click();
  await offsets('SWING 0 (Judge: straight)');
  await preset('Hats and swing').click();
  await offsets('SWING 45 (Hats and swing): a step is ' + ((await barSec()) / 16 * 1000).toFixed(1) + ' ms');
}

// ---- filter: the level of the bass at three cutoffs, and the sweep's climb ----
if (want('filter')) {
  await preset('Bass and chords').click();
  await depthBtn('A-level').click();
  const stageCutoff = () => page.evaluate(() => document.querySelector('[aria-label="Stage"] canvas')?.dataset.cutoff);
  for (const tenths of [0, 5, 10]) {
    const shown = await setDial('Cutoff', tenths);
    await page.waitForTimeout(300);
    const c = await stageCutoff();
    await measure(`FILTER cutoff ${c} Hz (dial reads ${shown}), bass and chords`, (await barSec()) * 1.5);
  }
  // the voice alone: the transport stopped, one key held, so the hats are out of the band
  await page.locator('[aria-label="Stop"]').click();
  await page.waitForTimeout(600);
  const keyC = page.locator('[aria-label="Controls"] [data-key="48"]');
  for (const tenths of [0, 5, 10]) {
    const shown = await setDial('Cutoff', tenths);
    const kb = await keyC.boundingBox();
    await page.mouse.move(kb.x + kb.width / 2, kb.y + kb.height - 6);
    await page.mouse.down();
    const r = await rmsOver(1.2, 0.4);
    await page.mouse.up();
    line(`FILTER a held C2 alone, cutoff ${shown}`, `mean ${dB(r.mean)} dB  above 1.2 kHz ${dB(r.hi)} dB`);
    await page.waitForTimeout(500);
  }
  await page.locator('[aria-label="Play"]').click();
  await preset('Filter sweep').click();
  await page.waitForTimeout(500);
  const reads = [];
  const bar = await barSec();
  for (let i = 0; i < 9; i += 1) { reads.push(await stageCutoff()); await page.waitForTimeout(bar * 500); }
  line('FILTER sweep: the stage\'s cutoff every half bar', reads.join(' '));
  const consoleC = await page.evaluate(() => document.querySelector('[aria-label="Controls"] [data-cutoff]')?.getAttribute('data-cutoff'));
  const stageC = await stageCutoff();
  line('FILTER sweep: console against stage at one instant', `${consoleC} vs ${stageC} Hz`);
  await depthBtn('Core').click();
}

// ---- record: a typed key lands in the Bass row on the step that was sounding ----
if (want('record')) {
  await preset('Played in').click();
  await page.locator('[aria-label="Presets"] ~ * [data-more], [data-more]').first().click().catch(() => {});
  const chip = page.locator('[aria-label="Pattern"] button', { hasText: /^Empty$/ });
  if (await chip.count()) await chip.click();
  await page.locator('[data-record]').click();
  await page.waitForTimeout(400);
  const before = await page.evaluate(() => document.querySelector('[aria-label="Stage"] canvas')?.dataset.pattern);
  const stepAt = await page.evaluate(() => document.querySelector('[aria-label="Stage"] canvas')?.dataset.step);
  await page.keyboard.down('z'); await page.waitForTimeout(80); await page.keyboard.up('z');
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => document.querySelector('[aria-label="Stage"] canvas')?.dataset.pattern);
  const bassRow = (after || '').split('|').find((r) => r.startsWith('bass:')) || '';
  line('RECORD z (C1) while step ' + (Number(stepAt) + 1) + ' sounded', `${before === after ? 'nothing written' : 'written'}; Bass row now ${bassRow}`);
  await page.locator('[data-record]').click();
}

// ---- hold: the filter opens while the button is held ----
if (want('hold')) {
  await preset('Bass and chords').click();
  await setDial('Cutoff', 0);
  await page.waitForTimeout(300);
  const closed = await measure('HOLD cutoff at 80 Hz, resonance 30', 1.5);
  const hold = page.locator('[data-hold]');
  const hb = await hold.boundingBox();
  await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2);
  await page.mouse.down();
  const opened = await measure('HOLD held: no filter', 1.5);
  await page.mouse.up();
  line('hold, opened against closed', `${(20 * Math.log10(opened.mean / Math.max(1e-7, closed.mean))).toFixed(1)} dB more overall, ${(20 * Math.log10(opened.hi / Math.max(1e-7, closed.hi))).toFixed(1)} dB more above 1.2 kHz with the filter open`);
}

// ---- restart: hits in a bar before a stop and after a start ----
if (want('restart')) {
  await preset('Bass and chords').click();
  const countBar = async () => {
    const seen = await page.evaluate(() => window.__benchLoopStart || 0);
    await page.waitForFunction((prev) => (window.__benchLoopStart || 0) > prev, seen, { timeout: 15000 });
    const origin = await page.evaluate(() => window.__benchLoopStart);
    const bar = await barSec();
    await page.waitForTimeout(bar * 1000 + 300);
    return page.evaluate(([a, b]) => ({ hits: window.__starts.filter((s) => s[0] >= a - 0.001 && s[0] < b - 0.001).length, notes: window.__oscStarts.filter((s) => s[0] >= a - 0.001 && s[0] < b - 0.001).length / 2 }), [origin, origin + bar]);
  };
  const a = await countBar();
  await page.locator('[aria-label="Stop"]').click();
  await page.waitForTimeout(800);
  const quiet = await rmsOver(0.8, 0.3);
  await page.locator('[aria-label="Play"]').click();
  const b = await countBar();
  line('RESTART hits and notes a bar, before and after', `${a.hits} hits, ${a.notes} notes; stopped ${dB(quiet.mean)} dB; ${b.hits} hits, ${b.notes} notes`);
}

if (errors.length) console.log('page errors:', errors.join(' | '));
await browser.close();
