// Listens to the Automation Lane. check-bench proves the picture and the
// datasets; this proves the sound: an analyser tapped in front of the
// destination, RMS every 25 ms, one part soloed at the source (the bench
// starts its four parts in PART_IDS order every pass; the others are
// disconnected), the real UI driven by Playwright.
//
//   node scripts/measure-lane.mjs <url> <drums|bass|guitar|keys|none> [scenario]
//   scenarios: probe level vol filter send touch room mix restart solo
//
// Do not edit the bench while it runs: Fast Refresh resets the page and
// every reading after that is void. Written 29 Aug 2026 after Mike's first
// listen, when the keys sat 12 dB under the drums and nobody had measured.
import { chromium } from 'playwright';
const url = process.argv[2] || 'http://localhost:3402/automation-lane';
const solo = process.argv[3] === 'none' ? '' : (process.argv[3] || 'keys');
const only = process.argv[4] || ''; // run one scenario by name
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 700 }, deviceScaleFactor: 1 });
const u = new URL(url);
await ctx.addCookies([{ name: 'mts_consent', value: 'essential', domain: u.hostname, path: '/' }]);
await ctx.addInitScript((soloName) => {
  window.__solo = soloName;
  window.__curves = []; window.__starts = []; window.__rms = []; window.__decoded = [];
  window.__timers = []; window.__gains = []; window.__keys = [];
  window.addEventListener('keydown', (e) => window.__keys.push([performance.now() | 0, e.key, e.target?.tagName, e.target?.getAttribute?.('aria-label'), e.isTrusted, e.repeat]), true);
  const osi = window.setInterval, oci = window.clearInterval;
  window.setInterval = function (fn, ms) { const id = osi.call(window, fn, ms); window.__timers.push({ set: id, ms, at: performance.now().toFixed(0) }); return id; };
  window.clearInterval = function (id) { window.__timers.push({ cleared: id, at: performance.now().toFixed(0), stack: String(new Error().stack).split('\n').slice(2, 5).join(' | ').slice(0, 300) }); return oci.call(window, id); };
  const ocg = AudioContext.prototype.createGain;
  AudioContext.prototype.createGain = function () { const g = ocg.call(this); window.__gains.push(g); return g; };
  const oc = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (dest, ...rest) {
    if (dest instanceof AudioDestinationNode) {
      const c = dest.context;
      if (!window.__tap) {
        const an = c.createAnalyser(); an.fftSize = 2048; an.smoothingTimeConstant = 0;
        oc.call(an, dest); window.__tap = an; window.__ctx = c;
        const buf = new Float32Array(an.fftSize);
        setInterval(() => { an.getFloatTimeDomainData(buf); let s = 0; for (let i = 0; i < buf.length; i += 1) s += buf[i] * buf[i]; window.__rms.push([c.currentTime, Math.sqrt(s / buf.length)]); }, 25);
      }
      return oc.call(this, window.__tap, ...rest);
    }
    return oc.call(this, dest, ...rest);
  };
  const osv = AudioParam.prototype.setValueCurveAtTime;
  AudioParam.prototype.setValueCurveAtTime = function (v, t, d) {
    try { const r = osv.call(this, v, t, d); window.__curves.push({ t: +t.toFixed(3), d: +d.toFixed(3), n: v.length, v0: +v[0].toFixed(4), vEnd: +v[v.length - 1].toFixed(4), ok: true }); return r; }
    catch (e) { window.__curves.push({ t: +t.toFixed(3), d: +d.toFixed(3), n: v.length, ok: false, err: String(e).slice(0, 120) }); throw e; }
  };
  // Solo by order: the bench starts its four parts in PART_IDS order
  // (drums, bass, guitar, keys) every pass; the others are disconnected.
  const ORDER = ['drums', 'bass', 'guitar', 'keys'];
  const os = AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start = function (when, off, dur) {
    const k = window.__starts.length % 4;
    window.__starts.push(+((when || 0)).toFixed(3));
    if (window.__solo && ORDER[k] !== window.__solo) this.disconnect();
    return os.call(this, when, off, dur);
  };
}, solo);
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 300)); });
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForSelector('[data-bench-frame]', { timeout: 15000 });
await page.waitForTimeout(800);
const begin = page.locator('button', { hasText: /Play the bench/ }).first();
if (await begin.count()) { await begin.click(); await page.waitForTimeout(1500); }
const diag = () => page.evaluate(() => ({ keys: window.__keys, vis: document.visibilityState, state: window.__ctx?.state, tap: !!window.__tap, timers: window.__timers.filter((t) => t.ms == null || t.ms < 1000), gains: window.__gains.map((g) => +g.gain.value.toFixed(3)), starts: window.__starts.length, curves: window.__curves.length, rms: window.__rms.length, last: window.__rms.slice(-3).map((p) => p[1].toFixed(4)), now: window.__ctx?.currentTime?.toFixed(2), play: [...document.querySelectorAll('button')].filter((b) => /^(Play|Stop|Pause)/.test(b.textContent.trim())).map((b) => b.textContent.trim().slice(0, 12) + ':' + b.getAttribute('aria-pressed')) }));
const canvas = page.locator('[aria-label="Stage"] canvas');
const chip = (group, name) => page.locator(`[aria-label="${group}"] button`, { hasText: new RegExp('^' + name + '$') });
const preset = (name) => page.locator('[aria-label="Presets"] button', { hasText: name });
const dB = (x) => (x <= 1e-7 ? '-inf' : (20 * Math.log10(x)).toFixed(1));
const now = () => page.evaluate(() => window.__ctx?.currentTime ?? 0);
async function measure(label, sec = 9.4, settle = 1.2) {
  await page.waitForTimeout(settle * 1000);
  const t0 = await now();
  await page.waitForTimeout(sec * 1000);
  const t1 = await now();
  const r = await page.evaluate(([a, b]) => window.__rms.filter((p) => p[0] >= a && p[0] < b).map((p) => p[1]), [t0, t1]);
  const mean = r.reduce((s, x) => s + x, 0) / Math.max(1, r.length);
  const max = Math.max(...r), min = Math.min(...r);
  const quiet = r.filter((x) => x < 1e-4).length;
  console.log(`${label.padEnd(36)} mean ${dB(mean).padStart(6)} dB  max ${dB(max).padStart(6)}  min ${dB(min).padStart(6)}  silent ${quiet}/${r.length}`);
  return { mean, max, min };
}
async function handleTo(where) { // drag the handle to the lane floor or ceiling
  const box = await canvas.boundingBox();
  const [hx, hy] = (await canvas.getAttribute('data-handle')).split(':').map(Number);
  await page.mouse.move(box.x + hx, box.y + hy); await page.mouse.down();
  await page.mouse.move(box.x + hx, box.y + hy + (where === 'floor' ? 400 : -400), { steps: 6 }); await page.mouse.up();
  await page.waitForTimeout(150);
  return canvas.getAttribute('data-point');
}
async function flatten() { if (!(await chip('Lane', 'Flatten').isVisible().catch(() => false))) { await page.locator('[data-more]').click(); await page.waitForTimeout(200); } await chip('Lane', 'Flatten').click(); await page.waitForTimeout(150); }
const lane = () => canvas.getAttribute('data-lane');
const curveLog = async () => { const c = await page.evaluate(() => window.__curves); const bad = c.filter((x) => !x.ok); return `curves ${c.length}, failed ${bad.length}${bad.length ? ' ' + JSON.stringify(bad.slice(0, 3)) : ''}`; };
const playBtn = page.locator('[aria-label="Transport"] button, [data-play]').first();
async function play() { const on = await page.locator('button[aria-label="Stop"]').count(); if (!on) { await page.keyboard.press('Space'); await page.waitForTimeout(500); console.log('pressed Space; playing now', await page.locator('button[aria-label="Stop"]').count() === 1, 'starts', await page.evaluate(() => window.__starts.length)); } else console.log('already playing, starts', await page.evaluate(() => window.__starts.length)); }
async function stopPlay() { if (await page.locator('button[aria-label="Stop"]').count()) { await page.keyboard.press('Space'); await page.waitForTimeout(300); } }

const want = (n) => !only || only === n;
await play();
if (want('probe')) { for (let i = 0; i < 2; i += 1) { await page.waitForTimeout(3000); const d = await diag(); delete d.gains; console.log('probe', JSON.stringify(d)); } }
console.log('playing?', await page.evaluate(() => !!window.__ctx), 'starts', JSON.stringify(await page.evaluate(() => window.__starts.slice(0, 3))));
if (want('vol')) {
  await chip('Target', 'Volume').click(); await flatten();
  console.log('vol flat lane', await lane());
  console.log('handle -> floor, point =', await handleTo('floor'), 'lane', await lane());
  await measure('VOL lane at floor (expect silence)');
  console.log('handle -> top, point =', await handleTo('top'));
  await measure('VOL lane at top (+6 dB)');
  console.log(await curveLog());
}
if (want('filter')) {
  await chip('Target', 'Filter').click(); await flatten();
  console.log('handle -> floor, point =', await handleTo('floor'), 'lane', await lane());
  await measure('FILTER at floor (100 Hz)');
  console.log('handle -> top, point =', await handleTo('top'));
  await measure('FILTER at top (16 kHz)');
  console.log(await curveLog());
}
if (want('send')) {
  await chip('Target', 'Send').click(); await flatten();
  console.log('send flat lane', await lane());
  await measure('SEND at floor (dry)');
  console.log('handle -> top, point =', await handleTo('top'), 'lane', await lane());
  await measure('SEND at top');
  console.log(await curveLog());
}
if (want('touch')) {
  // Touch on Volume with the grid on Bar: where do the points land?
  await chip('Target', 'Volume').click(); await chip('Grid', 'Bar').click(); await flatten();
  const dial = page.locator('[aria-label="Volume"]'); const db = await dial.boundingBox();
  const t0 = await now();
  await page.mouse.move(db.x + db.width / 2, db.y + db.height / 2); await page.mouse.down();
  for (let i = 1; i <= 20; i += 1) { await page.mouse.move(db.x + db.width / 2, db.y + db.height / 2 + i * 6, { steps: 2 }); await page.waitForTimeout(60); }
  await page.mouse.up();
  const t1 = await now();
  const starts = await page.evaluate(() => window.__starts);
  const loopStart = starts.filter((s) => s <= t1).pop();
  console.log(`TOUCH: dial dragged down over ${(t1 - t0).toFixed(2)} s from beat ${(((t0 - loopStart) / 9.3204) * 16).toFixed(2)} to ${(((t1 - loopStart) / 9.3204) * 16).toFixed(2)}`);
  console.log('TOUCH lane after:', await lane());
  await measure('TOUCH result (vol)', 9.4, 0.5);
  console.log(await curveLog());
}
if (want('level')) {
  await chip('Target', 'Volume').click(); await flatten();
  await measure(`LEVEL ${solo || 'mix'} at unity`, 9.4, 0.6);
}
if (want('room')) {
  if (solo) await chip('Part', solo[0].toUpperCase() + solo.slice(1)).click();
  await chip('Target', 'Send').click(); await flatten();
  await measure(`ROOM ${solo || 'mix'} send at floor`, 9.4, 0.6);
  await handleTo('top'); await measure(`ROOM ${solo || 'mix'} send at top`);
  // the tail: hold the lane off is not it; instead read the quietest 10% of windows (the gaps between hits)
  const t0 = await now(); await page.waitForTimeout(9400); const t1 = await now();
  const r = await page.evaluate(([a, b]) => window.__rms.filter((p) => p[0] >= a && p[0] < b).map((p) => p[1]).sort((x, y) => x - y), [t0, t1]);
  const q = (f) => r[Math.floor(r.length * f)];
  console.log(`ROOM ${solo || 'mix'} gaps with send at top: p10 ${dB(q(0.1))} dB, p25 ${dB(q(0.25))} dB (the floor of the loop)`);
  await handleTo('floor');
  const t2 = await now(); await page.waitForTimeout(9400); const t3 = await now();
  const r2 = await page.evaluate(([a, b]) => window.__rms.filter((p) => p[0] >= a && p[0] < b).map((p) => p[1]).sort((x, y) => x - y), [t2, t3]);
  const q2 = (f) => r2[Math.floor(r2.length * f)];
  console.log(`ROOM ${solo || 'mix'} gaps with send at floor: p10 ${dB(q2(0.1))} dB, p25 ${dB(q2(0.25))} dB`);
}
if (want('mix')) {
  // the full mix: how much does the keys' move change the whole?
  for (const [tg, lo, hi] of [['Volume', 'floor', 'top'], ['Filter', 'floor', 'top'], ['Send', 'floor', 'top']]) {
    await chip('Target', tg).click(); await flatten();
    await handleTo(lo); await measure(`MIX ${tg} keys at ${lo}`);
    await handleTo(hi); await measure(`MIX ${tg} keys at ${hi}`);
  }
}
if (want('restart')) {
  // stop mid-loop, restart without an edit: the lane must book clean and nothing plays twice
  await chip('Target', 'Volume').click(); await flatten(); await handleTo('top');
  await measure('RESTART: top before stop', 9.4, 0.8);
  await stopPlay(); await page.waitForTimeout(1500);
  const before = await page.evaluate(() => window.__curves.length);
  await play();
  await measure('RESTART: top after restart', 9.4, 0.3);
  const since = await page.evaluate((n) => window.__curves.slice(n), before);
  console.log(await curveLog(), 'booked since restart', JSON.stringify(since.map((c) => ({ t: c.t, ok: c.ok }))));
}
if (want('solo')) {
  // the bench's own solo (no decoder solo): the keys alone should measure as the keys alone
  await chip('Target', 'Volume').click(); await flatten();
  await measure('SOLO off: the mix', 9.4, 0.6);
  await chip('Hear', 'solo').click();
  await measure('SOLO on: keys alone', 9.4, 0.8);
  await handleTo('floor');
  await measure('SOLO on, lane at floor (silence)', 4, 0.8);
  await chip('Hear', 'the mix').click(); await handleTo('top');
  await chip('Part', 'Drums').click(); await chip('Hear', 'solo').click();
  await measure('SOLO on: drums alone', 9.4, 0.8);
}
console.log('errors:', errors.length ? errors.join('\n') : 'none');
await browser.close();
