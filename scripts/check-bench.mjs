// check-bench — the Bench Standard's laws, measured on the rendered page
// rather than by eye (Planning-and-Admin/Interactive-Resources-Upgrade/
// BENCH-STANDARD.md §3 and §6). Exits 1 if anything fails, so it can gate
// a merge.
//
//   npm run dev -- -p 3402            # in another terminal
//   node scripts/check-bench.mjs http://localhost:3402/delay-effects [more urls]
//
// Checks, at 1280×700 and 1440×900:
//   1. no vertical or horizontal page scroll, console does not overflow
//   2. no site header above the bench, no site footer below it
//   3. the plate is white, the stage is the dark panel, no cream, no status reds/greens
//   4. sentences resolve to Manrope, the title to Playfair Display, labels to JetBrains Mono
//      (Mike's Fonts-Try note, 21 Aug 2026)
//   5. no em-dash in rendered text; no "utilise"
//   6. the drawer opens from its handle, closes on Escape, returns focus
//   7. More, once opened, does not close
//   8. before the first gesture no AudioContext exists; after Play one does
//   9. no createOscillator in the page's scripts unless the bench declares synthesis
//  10. the space bar stops and starts the bench
//  11. every console label fits inside its own box (no text under a slider)
//  12. the start button's two lines share a left edge
//  13. the stage draws a hit as a bar however long its sample rings; only the
//      vocal (a phrase) keeps an envelope. Read from the canvas's data-shapes.
//  14. the three levels are three jobs: each announces itself when chosen;
//      A-level's line judges a setting and tags AO3 / AO4; Extension's line
//      is a different sentence with no tags; the bench's "judge it" preset
//      lands its numbers (Delay: the 2023 paper sets 120 BPM; EQ: Too much
//      sets +12 dB)
//  15. (EQ bench) the dot on the stage is the dial: the canvas reports the
//      chosen band's frequency and gain, they equal the console's, and
//      dragging the dot moves the dial
//
//  Laws 13 to 15 read the bench's fixtures from BENCHES below, keyed by the
//  URL's last path segment; a bench with no entry skips them.
//
//   BENCH_ENGINE=webkit node scripts/check-bench.mjs <url>   # Safari's engine
//   (27 Aug 2026: an open-hat envelope showed only in Safari, whose decoder
//   reads the sample 40 ms longer; the laws now run in both engines)

import { chromium, webkit } from 'playwright';

const urls = process.argv.slice(2);
if (!urls.length) {
    console.error('usage: node scripts/check-bench.mjs <url> [url…]');
    process.exit(2);
}

const SIZES = [
    { width: 1280, height: 700 },
    { width: 1440, height: 900 },
];
const FORBIDDEN_BG = [
    'rgb(247, 242, 232)', // Botanical cream
    'rgb(10, 15, 26)', 'rgb(17, 24, 39)', // the old dark canvas
];
const STATUS_HUES = (rgb) => {
    const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!m) return false;
    const [r, g, b] = [Number(m[1]), Number(m[2]), Number(m[3])];
    const red = r > 170 && g < 90 && b < 90;
    const amber = r > 200 && g > 120 && g < 190 && b < 60;
    const green = g > 150 && r < 110 && b < 110;
    return red || amber || green;
};

// Per-bench fixtures for the laws that must name a preset or a control.
const BENCHES = {
    'delay-effects': {
        shapes: true,
        presets: { first: 'Rhythmic 1/8', second: 'Slapback', judge: '2023 paper' },
        judgeLands: { selector: '[aria-label="Tempo"]', attr: 'aria-valuenow', value: '120', says: 'sets 120 BPM' },
    },
    'eq-bench': {
        curve: true,
        presets: { first: 'Vocal clean-up', second: 'Telephone', judge: 'Too much' },
        judgeLands: { selector: '[aria-label="Gain"]', attr: 'aria-valuenow', value: '12', says: 'sets +12 dB' },
    },
};
const fixtureOf = (url) => BENCHES[new URL(url).pathname.split('/').filter(Boolean).pop()] || {};

let failures = 0;
const fail = (url, size, msg) => { failures += 1; console.log(`  ✗ ${size ? `${size.width}×${size.height} ` : ''}${msg}`); };
const ok = (msg) => console.log(`  ✓ ${msg}`);

const ENGINE = process.env.BENCH_ENGINE === 'webkit' ? webkit : chromium;
console.log(`engine: ${process.env.BENCH_ENGINE === 'webkit' ? 'webkit' : 'chromium'}`);
const browser = await ENGINE.launch();
// The cookie banner would otherwise sit over the bench and swallow clicks;
// essential-only consent is what a student who dismissed it has.
async function newPage(viewport, url) {
    const context = await browser.newContext({ viewport });
    const u = new URL(url);
    await context.addCookies([{ name: 'mts_consent', value: 'essential', domain: u.hostname, path: '/' }]);
    return context.newPage();
}
for (const url of urls) {
    console.log(`\n${url}`);
    const fx = fixtureOf(url);
    // 9. oscillators in the delivered scripts
    const page0 = await newPage(SIZES[1], url);
    const scripts = [];
    page0.on('response', async (res) => {
        const ct = res.headers()['content-type'] || '';
        if (ct.includes('javascript')) {
            try { scripts.push({ url: res.url(), body: await res.text() }); } catch { /* streamed */ }
        }
    });
    await page0.goto(url, { waitUntil: 'networkidle' });
    const declaresSynth = await page0.evaluate(() => document.querySelector('[data-bench-frame]')?.dataset.synthesis === 'true');
    const oscHits = scripts.filter((s) => /createOscillator\(/.test(s.body) && /bench|Bench/.test(s.url));
    if (oscHits.length && !declaresSynth) fail(url, null, `createOscillator found in ${oscHits.map((s) => s.url.split('/').pop()).join(', ')} and the bench does not declare synthesis`);
    else ok('no oscillators in the bench bundle');
    await page0.close();

    for (const size of SIZES) {
        const page = await newPage(size, url);
        const errors = [];
        page.on('pageerror', (e) => errors.push(String(e)));
        await page.goto(url, { waitUntil: 'networkidle' });
        await page.waitForSelector('[data-bench-frame]', { timeout: 15000 });
        await page.waitForTimeout(600);

        const m = await page.evaluate(() => {
            const de = document.documentElement;
            const console_ = document.querySelector('[aria-label="Controls"]');
            const frame = document.querySelector('[data-bench-frame]');
            const cs = (el) => (el ? getComputedStyle(el) : null);
            const stage = document.querySelector('[aria-label="Stage"]');
            const texts = [];
            const walker = document.createTreeWalker(frame, NodeFilter.SHOW_TEXT);
            while (walker.nextNode()) texts.push(walker.currentNode.nodeValue);
            const text = texts.join(' ');
            const fonts = {};
            for (const el of frame.querySelectorAll('p, span, label, button, h2, h3, dt, dd, td, th, b, small, summary, li, a')) {
                const f = getComputedStyle(el).fontFamily;
                fonts[f] = (fonts[f] || 0) + 1;
            }
            const bgs = new Set();
            for (const el of frame.querySelectorAll('*')) {
                const s = getComputedStyle(el);
                if (s.backgroundColor && s.backgroundColor !== 'rgba(0, 0, 0, 0)') bgs.add(s.backgroundColor);
                if (s.color) bgs.add(`color:${s.color}`);
            }
            return {
                scrollH: de.scrollHeight, innerH: innerHeight, scrollW: de.scrollWidth, innerW: innerWidth,
                consoleOverflow: console_ ? console_.scrollHeight - console_.clientHeight : null,
                siteHeader: Boolean(document.querySelector('body > div > header, main ~ header, header:not([data-bench-frame] header)')),
                siteFooter: Boolean(document.querySelector('footer')),
                stageBg: cs(stage)?.backgroundColor,
                frameBg: cs(frame)?.backgroundColor,
                text,
                fonts,
                colours: [...bgs],
                hasAudioCtx: Boolean(window.__benchAudioContextCreated),
            };
        });

        if (m.scrollH > m.innerH) fail(url, size, `page scrolls vertically (${m.scrollH} > ${m.innerH})`); else ok(`${size.width}×${size.height} no vertical scroll`);
        if (m.scrollW > m.innerW) fail(url, size, `page scrolls horizontally (${m.scrollW} > ${m.innerW})`);
        if (m.consoleOverflow > 0) fail(url, size, `console overflows by ${m.consoleOverflow}px`);
        if (m.siteHeader) fail(url, size, 'a site header sits above the bench');
        if (m.siteFooter) fail(url, size, 'a site footer sits below the bench');
        // The look Mike chose from Claude Design on 21 Aug 2026 (3A): the
        // stage is a dark navy panel on the white plate; the ground stays
        // the greige.
        if (m.stageBg !== 'rgb(23, 23, 43)') fail(url, size, `stage is not the dark panel (${m.stageBg})`);
        if (m.frameBg !== 'rgb(245, 244, 242)') fail(url, size, `ground is not the greige (${m.frameBg})`);
        for (const c of m.colours) {
            const v = c.replace(/^color:/, '');
            if (FORBIDDEN_BG.includes(v)) fail(url, size, `forbidden colour ${c}`);
            if (STATUS_HUES(v)) fail(url, size, `status colour in use: ${c}`);
        }
        if (/—/.test(m.text)) fail(url, size, 'em-dash in rendered text');
        if (/\butilise/i.test(m.text)) fail(url, size, '"utilise" in rendered text');
        const fontNames = Object.keys(m.fonts).join(' | ');
        if (!/Manrope/i.test(fontNames)) fail(url, size, `sentence face is not Manrope (${fontNames.slice(0, 120)})`);
        if (!/Playfair/i.test(fontNames)) fail(url, size, `title face is not Playfair Display (${fontNames.slice(0, 120)})`);
        if (!/JetBrains/i.test(fontNames)) fail(url, size, `label face is not JetBrains Mono (${fontNames.slice(0, 120)})`);
        if (/Hanken|Inter\b|Geist/i.test(fontNames)) fail(url, size, `a retired face is present (${fontNames.slice(0, 120)})`);
        if (/Space Mono/i.test(fontNames)) fail(url, size, 'Space Mono is present');

        // 11. words stay inside their box: no console label paints under a
        //     neighbour (27 Aug 2026: LEVEL sat under its own slider)
        // 12. the start button's two lines share a left edge (27 Aug 2026)
        const t = await page.evaluate(() => {
            const out = { spill: [], begin: null };
            const console_ = document.querySelector('[aria-label="Controls"]');
            const walker = document.createTreeWalker(console_, NodeFilter.SHOW_TEXT);
            while (walker.nextNode()) {
                const node = walker.currentNode;
                if (!node.nodeValue.trim()) continue;
                const el = node.parentElement;
                const rg = document.createRange();
                rg.selectNodeContents(node);
                const tr = rg.getBoundingClientRect();
                const er = el.getBoundingClientRect();
                if (tr.width === 0) continue;
                if (tr.right > er.right + 1 || tr.left < er.left - 1) out.spill.push(`"${node.nodeValue.trim().slice(0, 24)}" ${Math.round(tr.width)}px in a ${Math.round(er.width)}px box`);
            }
            const begin = [...document.querySelectorAll('button')].find((b) => /Play the bench/.test(b.textContent));
            if (begin) {
                const span = begin.querySelector('span');
                const small = begin.querySelector('small');
                const title = [...span.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
                const rg = document.createRange();
                rg.selectNodeContents(title);
                out.begin = { title: Math.round(rg.getBoundingClientRect().left), small: Math.round(small.getBoundingClientRect().left) };
            }
            return out;
        });
        if (t.spill.length) fail(url, size, `label text paints outside its box: ${t.spill.join('; ')}`);
        else ok('every console label fits its box');
        if (t.begin && Math.abs(t.begin.title - t.begin.small) > 1) fail(url, size, `start button lines do not share a left edge (title ${t.begin.title}, line two ${t.begin.small})`);
        else if (t.begin) ok('start button lines share a left edge');

        // 6. drawer
        const handle = page.locator('[data-drawer-handle]').first();
        await handle.focus();
        await handle.click();
        await page.waitForTimeout(350);
        const openState = await page.evaluate(() => document.getElementById('bench-drawer')?.dataset.open);
        if (openState !== 'true') fail(url, size, 'drawer did not open from its handle');
        await page.keyboard.press('Escape');
        await page.waitForTimeout(350);
        const afterEsc = await page.evaluate(() => ({ open: document.getElementById('bench-drawer')?.dataset.open, focus: document.activeElement?.getAttribute('data-drawer-handle') }));
        if (afterEsc.open !== 'false') fail(url, size, 'Escape did not close the drawer');
        if (!afterEsc.focus) fail(url, size, 'focus did not return to the handle after closing');
        else ok('drawer opens, closes on Escape, returns focus');

        // 7. More never re-hides: the row it opens stays, the button goes
        const more = page.locator('[data-more]').first();
        if (await more.count()) {
            await more.click();
            await page.waitForTimeout(200);
            const after = await page.evaluate(() => ({ row: Boolean(document.querySelector('[data-more-row]')), btn: Boolean(document.querySelector('[data-more]')) }));
            if (!after.row) fail(url, size, 'More did not open its row');
            else if (after.btn) fail(url, size, 'More could be pressed again (it must not be able to close)');
            else ok('More stays open');
            const m2 = await page.evaluate(() => { const c = document.querySelector('[aria-label="Controls"]'); return { over: c.scrollHeight - c.clientHeight, scrollH: document.documentElement.scrollHeight, innerH: innerHeight }; });
            if (m2.over > 0) fail(url, size, `console overflows by ${m2.over}px with More open`);
            if (m2.scrollH > m2.innerH) fail(url, size, 'page scrolls with More open');
        }

        // 8. audio only after a gesture
        const ctxBefore = await page.evaluate(() => window.__benchAudioContexts || 0);
        const play = page.locator('button', { hasText: /Play the bench/ }).first();
        if (await play.count()) {
            await play.click();
            await page.waitForTimeout(800);
            const ctxAfter = await page.evaluate(() => window.__benchAudioContexts || 0);
            if (ctxBefore !== 0) fail(url, size, `an AudioContext existed before any gesture (${ctxBefore})`);
            if (ctxAfter < 1) fail(url, size, 'no AudioContext after Play');
            else ok('AudioContext only after Play');
            const stop = page.locator('[aria-label="Stop"]');
            if (!(await stop.count())) fail(url, size, 'transport did not switch to Stop after Play');
            // 10. the space bar stops and starts it (21 Aug walk, note 1)
            await page.mouse.click(5, 5);
            await page.keyboard.press('Space');
            await page.waitForTimeout(200);
            const stopped = await page.locator('[aria-label="Play"]').count();
            await page.keyboard.press('Space');
            await page.waitForTimeout(200);
            const restarted = await page.locator('[aria-label="Stop"]').count();
            if (!stopped || !restarted) fail(url, size, 'space bar does not stop and start the bench');
            else ok('space bar stops and starts');

            // 13. hits are bars, only the phrase is an envelope
            const stageCanvas = '[aria-label="Stage"] canvas';
            if (fx.shapes && await page.locator(stageCanvas).count()) {
                await page.waitForTimeout(300);
                const onDrums = await page.evaluate((sel) => document.querySelector(sel)?.dataset.shapes || '', stageCanvas);
                if (!/bars:[1-9]/.test(onDrums) || !/envelopes:0\b/.test(onDrums)) fail(url, size, `stage on the default source drew ${onDrums || 'nothing readable'} (every hit must be a bar)`);
                else ok(`stage draws hits as bars (${onDrums})`);
                const vocal = page.locator('[aria-label="Source"] button', { hasText: /^Vocal$/ });
                if (await vocal.count()) {
                    await vocal.click();
                    await page.waitForTimeout(600);
                    const onVocal = await page.evaluate((sel) => document.querySelector(sel)?.dataset.shapes || '', stageCanvas);
                    if (!/envelopes:[1-9]/.test(onVocal)) fail(url, size, `stage on the vocal drew ${onVocal || 'nothing readable'} (the phrase keeps its envelope)`);
                    else ok(`stage keeps the vocal's envelope (${onVocal})`);
                }
            }
        }

        // 14. three levels, three jobs (27 Aug 2026)
        const depthBtn = (label) => page.locator('[aria-label="What the bench does for you"] button', { hasText: new RegExp('^' + label + '$') });
        if (fx.presets && await depthBtn('Core').count()) {
            const sayText = () => page.evaluate(() => document.querySelector('[data-bench-frame] [data-depth]')?.textContent?.trim() || '');
            const preset = (name) => page.locator('[aria-label="Presets"] button', { hasText: name });
            await depthBtn('Core').click();
            const coreSays = await sayText();
            await depthBtn('A-level').click();
            const alevelSays = await sayText();
            await preset(fx.presets.first).click();
            await page.waitForTimeout(100);
            const alevelJudges = await sayText();
            await depthBtn('Extension').click();
            const extSays = await sayText();
            await preset(fx.presets.second).click();
            await page.waitForTimeout(100);
            const extOpens = await sayText();
            if (!/^Core:/.test(coreSays) || !/^A-level:/.test(alevelSays) || !/^Extension:/.test(extSays)) fail(url, size, `a level did not announce itself (core "${coreSays.slice(0, 30)}", a-level "${alevelSays.slice(0, 30)}", extension "${extSays.slice(0, 30)}")`);
            else ok('each level announces what it does');
            if (!/AO3/.test(alevelJudges) || !/AO4/.test(alevelJudges)) fail(url, size, `A-level does not judge with AO3 and AO4 tags: "${alevelJudges.slice(0, 80)}"`);
            else ok('A-level judges the setting and tags the mark');
            if (/AO[34]/.test(extOpens) || extOpens === alevelJudges || extOpens.length < 40) fail(url, size, `Extension is not its own sentence: "${extOpens.slice(0, 80)}"`);
            else ok('Extension opens the machine in its own words');
            if (await preset(fx.presets.judge).count()) {
                await preset(fx.presets.judge).click();
                await page.waitForTimeout(150);
                const landed = await page.evaluate(({ selector, attr }) => document.querySelector(selector)?.getAttribute(attr), fx.judgeLands);
                const judgeSays = await sayText();
                if (landed !== fx.judgeLands.value) fail(url, size, `the ${fx.presets.judge} preset did not land (${fx.judgeLands.selector} ${fx.judgeLands.attr} = ${landed}, wanted ${fx.judgeLands.value})`);
                else if (judgeSays === extOpens) fail(url, size, `the ${fx.presets.judge} preset did not change the line`);
                else ok(`the ${fx.presets.judge} preset ${fx.judgeLands.says}`);
            } else fail(url, size, `no ${fx.presets.judge} preset`);
            await depthBtn('A-level').click();
        }

        // 15. (EQ) the dot on the stage is the dial
        if (fx.curve) {
            const canvasSel = '[aria-label="Stage"] canvas';
            const readBand = () => page.evaluate((sel) => document.querySelector(sel)?.dataset.band || '', canvasSel);
            const dial = async (label) => page.evaluate((l) => { const d = document.querySelector(`[aria-label="${l}"]`); return { now: d?.getAttribute('aria-valuenow'), text: d?.getAttribute('aria-valuetext') }; }, label);
            await page.waitForTimeout(200);
            const before = await readBand();
            const [id, hzStr, gainStr] = before.split(':');
            const freq = await dial('Frequency');
            const gain = await dial('Gain');
            const hz = Number(hzStr);
            const hzText = hz >= 1000 ? `${(hz / 1000).toFixed(hz >= 10000 ? 0 : 1).replace(/\.0$/, '')} kHz` : `${hz} Hz`;
            if (!id || Number.isNaN(hz)) fail(url, size, `the stage does not report the chosen band (data-band="${before}")`);
            else if (freq.text !== hzText || gain.now !== gainStr) fail(url, size, `the stage's band (${before}) is not the console's (Frequency "${freq.text}", Gain ${gain.now})`);
            else ok(`the stage reports the chosen band and it matches the dials (${before})`);
            // drag the chosen dot to the right: the frequency must rise on both
            const box = await page.locator(canvasSel).boundingBox();
            const dot = await page.evaluate((sel) => {
                // the canvas keeps no DOM for its dots; find it by walking the pixels is
                // overkill, so the bench exposes the chosen dot's position too
                return document.querySelector(sel)?.dataset.dot || '';
            }, canvasSel);
            const [dx, dy] = dot.split(':').map(Number);
            if (box && dot) {
                await page.mouse.move(box.x + dx, box.y + dy);
                await page.mouse.down();
                await page.mouse.move(box.x + dx + 40, box.y + dy, { steps: 6 });
                await page.mouse.move(box.x + dx + 80, box.y + dy, { steps: 6 });
                await page.mouse.up();
                await page.waitForTimeout(200);
                const after = await readBand();
                const hzAfter = Number(after.split(':')[1]);
                const freqAfter = await dial('Frequency');
                if (!(hzAfter > hz)) fail(url, size, `dragging the dot right did not raise the frequency (${before} -> ${after})`);
                else if (freqAfter.now === freq.now) fail(url, size, 'dragging the dot did not move the Frequency dial');
                else ok(`dragging the dot moves the dial (${hz} Hz -> ${hzAfter} Hz)`);
            } else fail(url, size, 'the stage does not expose the chosen dot for the drag test');
        }

        if (errors.length) fail(url, size, `page errors: ${errors.join(' | ').slice(0, 200)}`);
        await page.close();
    }
}
await browser.close();

console.log(failures ? `\n${failures} failure(s)` : '\nall clear');
process.exit(failures ? 1 : 0);
