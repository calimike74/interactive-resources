// Does a bench's audio graph grow while it plays? (16 Sep 2026: Mike found
// the Sequence bench a few seconds late on Play and on the keys after a
// while. A per-voice filter driven by a long-lived ConstantSource is never
// collected, so the render thread drowns.) This plays a bench for a while
// and samples, every 20 s:
//   - live connections into AudioParams and into nodes (connect minus
//     disconnect, counted through patched prototypes),
//   - biquad filters made so far,
//   - drift: wall-clock seconds minus ctx.currentTime seconds since Play
//     (a render thread that cannot keep up falls behind the clock),
//   - latency: milliseconds from osc.start() on the page's own context to
//     the first energy at an analyser (what a key press feels like).
// Usage: [BENCH_ENGINE=webkit] node scripts/measure-leak.mjs <url> [seconds=180]
import { chromium, webkit } from 'playwright';

const [url, secsArg = '180'] = process.argv.slice(2);
if (!url) { console.error('usage: node scripts/measure-leak.mjs <url> [seconds]'); process.exit(2); }
const SECS = Number(secsArg);
const EVERY = 20;

const engine = process.env.BENCH_ENGINE === 'webkit' ? webkit : chromium;
const browser = await engine.launch(engine === chromium ? { args: ['--autoplay-policy=no-user-gesture-required'] } : {});
const page = await browser.newPage({ viewport: { width: 1280, height: 700 } });
await page.addInitScript(() => {
    const P = AudioNode.prototype;
    const conn = P.connect; const disc = P.disconnect;
    const out = new WeakMap();
    const live = { param: 0, node: 0 };
    P.connect = function (dst, ...r) {
        const m = out.get(this) || new Map(); m.set(dst, (m.get(dst) || 0) + 1); out.set(this, m);
        if (dst instanceof AudioParam) live.param += 1; else live.node += 1;
        return conn.call(this, dst, ...r);
    };
    P.disconnect = function (dst, ...r) {
        const m = out.get(this);
        if (m) {
            if (dst === undefined || typeof dst === 'number') { for (const [d, c] of m) { if (d instanceof AudioParam) live.param -= c; else live.node -= c; } m.clear(); }
            else if (m.has(dst)) { const c = m.get(dst); if (dst instanceof AudioParam) live.param -= c; else live.node -= c; m.delete(dst); }
        }
        return disc.call(this, dst, ...r);
    };
    // Nodes made, and nodes the browser has since collected (a
    // FinalizationRegistry hears each one go), so `alive` = made - collected
    // tells a node that is merely still counted from a node that is really
    // kept. Collection is the browser's timing, so read the trend.
    const B = BaseAudioContext.prototype;
    live.made = { biquad: 0, osc: 0, gain: 0, source: 0 };
    live.gone = { biquad: 0, osc: 0, gain: 0, source: 0 };
    const reg = new FinalizationRegistry((kind) => { live.gone[kind] += 1; });
    const wrap = (name, kind) => { const mk = B[name]; B[name] = function (...a) { const n = mk.apply(this, a); live.made[kind] += 1; reg.register(n, kind); return n; }; };
    wrap('createBiquadFilter', 'biquad'); wrap('createOscillator', 'osc'); wrap('createGain', 'gain'); wrap('createBufferSource', 'source');
    const AC = window.AudioContext;
    window.AudioContext = class extends AC { constructor(...a) { super(...a); window.__ctx = this; } };
    window.__live = live;
});
await page.goto(url, { waitUntil: 'networkidle' });
const begin = page.locator('button', { hasText: /Play the bench/ }).first();
if (await begin.count()) await begin.click(); else await page.locator('[aria-label="Play"]').first().click();
await page.waitForFunction(() => !!window.__ctx, null, { timeout: 10000 });
await page.waitForTimeout(500);
const t0 = await page.evaluate(() => ({ wall: performance.now(), ctx: window.__ctx.currentTime }));

async function probe() {
    return page.evaluate(async () => {
        const ctx = window.__ctx;
        const o = ctx.createOscillator(); const an = ctx.createAnalyser(); an.fftSize = 256;
        const g = ctx.createGain(); g.gain.value = 0;
        o.connect(an); an.connect(g); g.connect(ctx.destination);
        const buf = new Float32Array(256);
        const start = performance.now();
        o.start();
        const ms = await new Promise((res) => {
            const poll = () => {
                an.getFloatTimeDomainData(buf);
                let e = 0; for (const v of buf) e += v * v;
                if (e > 1e-6) res(performance.now() - start);
                else if (performance.now() - start > 8000) res(Infinity);
                else setTimeout(poll, 2);
            };
            poll();
        });
        try { o.stop(); } catch { /* ended */ }
        o.disconnect(); an.disconnect(); g.disconnect();
        return ms;
    });
}

console.log(`bench: ${url}`);
console.log('   t(s)  paramConn  nodeConn   alive: biquad    osc   gain  source   drift(s)  latency(ms)');
for (let t = 0; t <= SECS; t += EVERY) {
    if (t) await page.waitForTimeout(EVERY * 1000);
    const s = await page.evaluate(() => ({ ...window.__live, wall: performance.now(), ctx: window.__ctx.currentTime, state: window.__ctx.state }));
    const drift = (s.wall - t0.wall) / 1000 - (s.ctx - t0.ctx);
    const lat = await probe();
    const alive = (k) => String(s.made[k] - s.gone[k]).padStart(6);
    console.log(`${String(t).padStart(6)}  ${String(s.param).padStart(9)}  ${String(s.node).padStart(8)}         ${alive('biquad')} ${alive('osc')} ${alive('gain')} ${alive('source')}  ${drift.toFixed(2).padStart(8)}  ${Number.isFinite(lat) ? lat.toFixed(0).padStart(11) : '    >8000'}`);
}
await browser.close();
