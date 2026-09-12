// check-paper - the Squared Paper page's own gate, measured on the rendered
// page rather than by eye. Squared Paper is not a bench (Mike, 12 Sep 2026:
// the resource should reflect the task in front of the student), so it is not
// in scripts/check-bench.mjs and its laws are here.
//
//   npx next build                       # the page is a static export
//   node scripts/serve-out.mjs &          # clean URLs, the way the site serves
//   node scripts/check-paper.mjs http://localhost:3416/squared-paper
//
// Exits 1 if anything fails, so it can gate a merge.
//
// The laws:
//   1. every question renders: its number, its source, the part label, the
//      stem in the paper's own words, and the marks in brackets
//   2. nothing is clipped at 1280 wide, and the page never scrolls sideways
//   3. Back and Next walk question 1 to 12 and then the blank paper, and
//      neither wraps: Back is dead on the first, Next on the last
//   4. the scheme's own answer, drawn with the pointer and checked, scores
//      full marks on every one of the twelve
//   5. Check marks in the scheme's own words: a tick or a cross a mark, the
//      total beside the marks bracket, the model answer over the grid
//   6. Back and Next clear the drawing and the marking
//   7. house style: no em-dash, no "utilise" in anything the page renders

import { chromium } from 'playwright';

const url = process.argv[2];
if (!url) {
    console.error('usage: node scripts/check-paper.mjs <url>');
    process.exit(2);
}

let failures = 0;
const fail = (msg) => { failures += 1; console.log(`  ✗ ${msg}`); };
const ok = (msg) => console.log(`  ✓ ${msg}`);

const browser = await chromium.launch({ args: ['--use-angle=metal'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
const u = new URL(url);
await ctx.addCookies([{ name: 'mts_consent', value: 'essential', domain: u.hostname, path: '/' }]);
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));

console.log(`\n${url}`);
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForSelector('[data-paper-page]', { timeout: 15000 });
await page.waitForTimeout(400);

const sheet = () => page.evaluate(() => {
    const canvas = document.querySelector('canvas[data-question]');
    const el = (sel) => document.querySelector(sel);
    const text = (sel) => el(sel)?.textContent?.trim() || '';
    const over = (sel) => { const e = el(sel); return e ? e.scrollWidth - e.clientWidth : 0; };
    const marks = [...document.querySelectorAll('[class*="markLine"]')].map((m) => ({
        tick: m.children[0]?.textContent?.trim(),
        words: m.children[1]?.textContent?.trim(),
        note: m.children[2]?.textContent?.trim(),
    }));
    return {
        head: text('[class*="sheetHead"]'),
        part: text('[class*="part"]'),
        stem: text('[class*="stem"]'),
        stemOver: over('[class*="stem"]'),
        bullets: [...document.querySelectorAll('[class*="bullets"] li')].map((b) => b.textContent.trim()),
        bracket: text('[class*="marks"]'),
        where: text('[class*="where"]'),
        figure: Boolean(document.querySelectorAll('canvas').length > 1),
        marks,
        report: text('[class*="report"]'),
        q: canvas?.dataset.question || '',
        checked: canvas?.dataset.checked || '',
        shape: canvas?.dataset.shape || '',
        period: canvas?.dataset.periodMs || '',
        verdict: canvas?.dataset.verdict || '',
        score: canvas?.dataset.score || '',
        grid: canvas?.dataset.grid || '',
        span: Number(canvas?.dataset.span || 0),
        answer: canvas?.dataset.answer || '',
        pageW: document.documentElement.scrollWidth,
        innerW: window.innerWidth,
        body: document.body.innerText,
    };
});
const btn = (name) => page.locator('[aria-label="The questions"] button', { hasText: new RegExp(`^${name}`) }).first();
const next = () => btn('Next|Blank paper');
const back = () => btn('←');

// Draw the wave the scheme draws, the way a student's pointer would.
async function answerWithThePointer(s) {
    const canvas = page.locator('canvas[data-question]');
    await canvas.scrollIntoViewIfNeeded();
    await page.waitForTimeout(120);
    const box = await canvas.boundingBox();
    const [x0, y0, w, h] = s.grid.split(':').map(Number);
    const [shape, per, amp, inv] = s.answer.split(':');
    const periodMs = Number(per);
    const height = Number(amp);
    const flip = inv === '1' ? -1 : 1;
    const mid = box.y + y0 + h / 2;
    const half = h / 2;
    const at = (t) => {
        const p = (((t * s.span) / periodMs) % 1 + 1) % 1;
        const v = shape === 'sine' ? Math.sin(2 * Math.PI * p)
            : shape === 'square' ? (p < 0.5 ? 1 : -1)
                : shape === 'saw' ? 2 * p - 1
                    : p < 0.25 ? 4 * p : p < 0.75 ? 2 - 4 * p : 4 * p - 4;
        return v * flip;
    };
    const steps = 240;
    await page.mouse.move(box.x + x0 + 2, mid - at(0) * half * height);
    await page.mouse.down();
    for (let i = 1; i <= steps; i += 1) {
        const t = i / steps;
        await page.mouse.move(box.x + x0 + 2 + (w - 4) * t, mid - at(t) * half * height);
    }
    await page.mouse.up();
    await page.waitForTimeout(150);
}

// ---- 1, 2 and 3: the walk, and what every question prints ----
const seen = [];
for (let i = 1; i <= 13; i += 1) {
    const s = await sheet();
    seen.push(s.q);
    const name = s.q === 'blank' ? 'the blank paper' : `question ${s.q}`;
    if (i <= 12 && s.q !== `${i}/12`) fail(`${name}: the page is on ${s.q || 'nothing'} after ${i - 1} presses of Next`);
    if (!s.stem || s.stem.length < 20) fail(`${name}: no stem printed ("${s.stem}")`);
    if (s.stemOver > 0) fail(`${name}: the stem is clipped by ${s.stemOver} px`);
    if (s.pageW > s.innerW) fail(`${name}: the page scrolls sideways (${s.pageW} > ${s.innerW})`);
    if (i <= 12) {
        if (!/Question \d+ of 12/.test(s.head)) fail(`${name}: the sheet's head does not number the question ("${s.head}")`);
        if (!s.bracket && !s.bullets.length) fail(`${name}: no marks in brackets`);
        if (s.bullets.length && !s.bullets.every((b) => /\(\d\)$/.test(b))) fail(`${name}: a bullet carries no marks bracket`);
        if (!s.bullets.length && !/^\(\d\)$/.test(s.bracket.replace(/\s+/g, ''))) fail(`${name}: the marks bracket reads "${s.bracket}"`);
        if (!s.part) fail(`${name}: no part label`);
        if (!s.answer) fail(`${name}: the page does not expose the scheme's answer for the gate`);
    }
    if (i === 1 && !(await back().isDisabled())) fail('Back is not dead on question 1');
    if (i === 13 && !(await next().isDisabled())) fail('Next is not dead on the blank paper');
    if (i < 13) { await next().click(); await page.waitForTimeout(160); }
}
if (seen.join(' ') === '1/12 2/12 3/12 4/12 5/12 6/12 7/12 8/12 9/12 10/12 11/12 12/12 blank') ok('Next walks question 1 to 12 and then the blank paper, and stops');
else fail(`the walk went ${seen.join(' ')}`);
const bodyText = (await sheet()).body;
if (/—/.test(bodyText)) fail('em-dash in the page\'s own text');
else if (/\butilise/i.test(bodyText)) fail('"utilise" in the page\'s own text');
else ok('no em-dash and no "utilise" in anything the page prints');

// ---- 4 and 5: the scheme's answer, drawn and checked ----
for (let i = 12; i >= 1; i -= 1) {
    await back().click();
    await page.waitForTimeout(160);
}
for (let i = 1; i <= 12; i += 1) {
    const before = await sheet();
    if (before.q !== `${i}/12`) fail(`the walk back left the page on ${before.q}, not ${i}/12`);
    if (before.checked !== 'false') fail(`question ${i} opens already marked`);
    await answerWithThePointer(before);
    const drawn = await sheet();
    if (!drawn.period) fail(`question ${i}: the scheme's answer drawn by the pointer was not read (verdict ${drawn.verdict})`);
    await btn('Check').click();
    await page.waitForTimeout(220);
    const after = await sheet();
    const [got, total] = after.score.split('/');
    if (after.checked !== 'true') fail(`question ${i}: Check did not mark the page`);
    else if (after.verdict !== 'full' || got !== total) fail(`question ${i}: the scheme's own answer scored ${after.score} (${after.shape || 'no shape'}, ${after.period} ms, ${after.verdict})`);
    else if (!after.marks.length) fail(`question ${i}: nothing in the margin after Check`);
    else if (!after.marks.every((m) => m.tick === '✓')) fail(`question ${i}: a mark is crossed on the scheme's own answer`);
    else if (after.report) fail(`question ${i}: the examiner line shows on full marks`);
    else ok(`question ${i} scores ${after.score} on the scheme's own answer (${after.marks.length} mark line${after.marks.length > 1 ? 's' : ''}, ${after.shape || 'any shape'} at ${after.period} ms)`);
    if (i < 12) { await next().click(); await page.waitForTimeout(160); }
}

// ---- 6: Next and Back carry nothing ----
await back().click();
await page.waitForTimeout(200);
const cleared = await sheet();
if (cleared.checked !== 'false' || cleared.verdict !== 'blank') fail(`Back left the drawing or the marking behind (checked ${cleared.checked}, verdict ${cleared.verdict})`);
else ok('Back clears the drawing and the marking');

// ---- 5 again: a wrong answer is crossed, with the examiner's line ----
const wrongOn = await sheet(); // question 11 of 12, which wants a square wave
await page.mouse.move(0, 0);
const canvas = page.locator('canvas[data-question]');
await canvas.scrollIntoViewIfNeeded();
const box = await canvas.boundingBox();
const [gx, gy, gw, gh] = wrongOn.grid.split(':').map(Number);
await page.mouse.move(box.x + gx + 4, box.y + gy + gh / 2);
await page.mouse.down();
for (let i = 1; i <= 200; i += 1) {
    const t = i / 200;
    const p = ((t * wrongOn.span) / 1.25) % 1;
    await page.mouse.move(box.x + gx + 4 + (gw - 8) * t, box.y + gy + gh / 2 - Math.sin(2 * Math.PI * p) * (gh / 2) * 0.5);
}
await page.mouse.up();
await page.waitForTimeout(150);
await btn('Check').click();
await page.waitForTimeout(250);
const marked = await sheet();
if (marked.verdict === 'full') fail('a sine wave scored full marks on a question that asks for a square wave');
else if (!marked.marks.some((m) => m.tick === '✗')) fail('a lost mark is not crossed in the margin');
else if (!marked.marks.every((m) => m.words && m.note)) fail('a mark line is missing the scheme\'s wording or what the page measured');
else if (!marked.report) fail('no examiner line under a question with a mark lost');
else ok(`a wrong answer is crossed in the scheme's own words, with the examiner's line (${marked.score})`);

if (errors.length) fail(`page errors: ${errors.join(' | ').slice(0, 200)}`);
await browser.close();

console.log(failures ? `\n${failures} failure(s)` : '\nall clear');
process.exit(failures ? 1 : 0);
