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
// How many questions there are is read off the page ("Question 1 of N"), so
// this script never has to be told when the paper grows.
//
// The laws:
//   1. every question renders: its number, the stem in the paper's own words,
//      and the marks in brackets
//   2. nothing is clipped at 1280 wide, and the page never scrolls sideways
//   3. Back and Next walk question 1 to N and then the blank paper, and
//      neither wraps: Back is dead on the first, Next on the last
//   4. the scheme's own answer, drawn with the pointer and checked, scores
//      full marks on every one of them
//   5. Check marks in the scheme's own words: a tick or a cross a mark, the
//      total beside the marks bracket, the model answer over the grid
//   8. the bare-grid question prints two boxes and earns its two axis marks:
//      unlabelled it scores 3 of 5, labelled 5 of 5
//   9. the sheet can always scroll clear of the floating strip
//   6. Back and Next clear the drawing and the marking
//   7. house style: no em-dash, no "utilise" in anything the page renders
//  10. the sheet names no exam: no year, no paper question number and no part
//      label reaches the student, before or after Check (Mike, 12 Sep 2026:
//      "this is going to tip the students off to which exams have this type
//      of question in them")

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
        paper: el('[aria-label="The question paper"]')?.innerText || '',
        stem: text('[class*="stem"]'),
        stemOver: over('[class*="stem"]'),
        bullets: [...document.querySelectorAll('[class*="bullets"] li')].map((b) => b.textContent.trim()),
        boxes: [...document.querySelectorAll('input[data-axis]')].map((i) => i.dataset.axis),
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
// Law 10. Anything on the sheet that would tell a student which sitting the
// question came from. "examiner report" is here without its apostrophe on
// purpose: the page signs its lines "(examiner's report)", so the old form
// with a year in front of it is caught the moment it comes back.
const TELLS = [
    [/\b20\d\d\b/, 'a four-digit year'],
    [/\bQ[1-4]\b/, 'a paper question number'],
    [/\bQ\d\(/, 'a paper question reference'],
    [/examiner report/i, 'an examiner report named with its year'],
];
let told = 0;
function noExamOnTheSheet(paper, where) {
    for (const [re, said] of TELLS) {
        const hit = paper.match(re);
        if (hit) { fail(`${where}: ${said} is printed on the sheet ("${hit[0]}")`); told += 1; }
    }
}

const btn = (name) => page.locator('[aria-label="The questions"] button', { hasText: new RegExp(`^${name}`) }).first();
const next = () => btn('Next|Blank paper');
const back = () => btn('←');

// Write the axes in, where the question asks for them.
async function labelTheAxes() {
    for (const [axis, said] of [['y', 'Displacement'], ['x', 'Time (ms)']]) {
        const box = page.locator(`input[data-axis="${axis}"]`);
        if (await box.count()) { await box.fill(said); await page.waitForTimeout(60); }
    }
}

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

// ---- how many questions the paper sets, in the page's own words ----
const first = await sheet();
const COUNT = Number((first.head.match(/Question 1 of (\d+)/) || [])[1] || 0);
if (!COUNT) {
    fail(`the sheet's head does not say how many questions there are ("${first.head}")`);
    await browser.close();
    console.log('\n1 failure(s)');
    process.exit(1);
}
ok(`the sheet sets ${COUNT} questions and a blank paper`);

// ---- 1, 2, 3 and 10: the walk, and what every question prints ----
const seen = [];
let axisQ = 0; // the question that prints the two axis boxes, found by walking
for (let i = 1; i <= COUNT + 1; i += 1) {
    const s = await sheet();
    seen.push(s.q);
    const name = s.q === 'blank' ? 'the blank paper' : `question ${s.q}`;
    if (i <= COUNT && s.q !== `${i}/${COUNT}`) fail(`${name}: the page is on ${s.q || 'nothing'} after ${i - 1} presses of Next`);
    if (!s.stem || s.stem.length < 20) fail(`${name}: no stem printed ("${s.stem}")`);
    if (s.stemOver > 0) fail(`${name}: the stem is clipped by ${s.stemOver} px`);
    if (s.pageW > s.innerW) fail(`${name}: the page scrolls sideways (${s.pageW} > ${s.innerW})`);
    noExamOnTheSheet(s.paper, `${name}, before Check`);
    if (s.boxes.length === 2) axisQ = i;
    if (i <= COUNT) {
        if (!new RegExp(`Question \\d+ of ${COUNT}`).test(s.head)) fail(`${name}: the sheet's head does not number the question ("${s.head}")`);
        if (!s.bracket && !s.bullets.length) fail(`${name}: no marks in brackets`);
        if (s.bullets.length && !s.bullets.every((b) => /\(\d\)$/.test(b))) fail(`${name}: a bullet carries no marks bracket`);
        if (!s.bullets.length && !/^\(\d\)$/.test(s.bracket.replace(/\s+/g, ''))) fail(`${name}: the marks bracket reads "${s.bracket}"`);
        if (!s.answer) fail(`${name}: the page does not expose the scheme's answer for the gate`);
    }
    if (i === 1 && !(await back().isDisabled())) fail('Back is not dead on question 1');
    if (i === COUNT + 1 && !(await next().isDisabled())) fail('Next is not dead on the blank paper');
    if (i < COUNT + 1) { await next().click(); await page.waitForTimeout(160); }
}
const walked = [...Array(COUNT)].map((_, i) => `${i + 1}/${COUNT}`).concat('blank').join(' ');
if (seen.join(' ') === walked) ok(`Next walks question 1 to ${COUNT} and then the blank paper, and stops`);
else fail(`the walk went ${seen.join(' ')}`);
if (!axisQ) fail('no question prints the two axis boxes');
const bodyText = (await sheet()).body;
if (/—/.test(bodyText)) fail('em-dash in the page\'s own text');
else if (/\butilise/i.test(bodyText)) fail('"utilise" in the page\'s own text');
else ok('no em-dash and no "utilise" in anything the page prints');

// ---- 4 and 5: the scheme's answer, drawn and checked ----
for (let i = COUNT; i >= 1; i -= 1) {
    await back().click();
    await page.waitForTimeout(160);
}
for (let i = 1; i <= COUNT; i += 1) {
    const before = await sheet();
    if (before.q !== `${i}/${COUNT}`) fail(`the walk back left the page on ${before.q}, not ${i}/${COUNT}`);
    if (before.checked !== 'false') fail(`question ${i} opens already marked`);
    await answerWithThePointer(before);
    await labelTheAxes();
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
    noExamOnTheSheet(after.paper, `question ${i}, after Check`);
    if (i < COUNT) { await next().click(); await page.waitForTimeout(160); }
}

// ---- 8: the bare-grid question earns its axis marks ----
{
    // back to it, on clean paper
    for (let i = COUNT; i > axisQ; i -= 1) { await back().click(); await page.waitForTimeout(160); }
    const on11 = await sheet();
    if (on11.q !== `${axisQ}/${COUNT}`) fail(`the axis test wanted question ${axisQ}, not ${on11.q}`);
    else if (on11.boxes.join('') !== 'yx') fail(`question ${axisQ} does not print two axis boxes (${on11.boxes.join(', ') || 'none'})`);
    else {
        await answerWithThePointer(on11);
        await btn('Check').click();
        await page.waitForTimeout(220);
        const bare = await sheet();
        noExamOnTheSheet(bare.paper, `question ${axisQ}, after Check with the axes blank`);
        if (bare.score !== '3/5') fail(`an unlabelled answer to the bare grid scored ${bare.score}, not 3/5`);
        else if (!bare.marks.filter((m) => m.tick === '✗').length) fail('the axis marks are not crossed when the axes are unlabelled');
        else ok(`the axes are not given away (${bare.score} with them blank)`);
        await labelTheAxes();
        await btn('Check').click();
        await page.waitForTimeout(220);
        const said = await sheet();
        if (said.score !== '5/5') fail(`a labelled answer to the bare grid scored ${said.score}, not 5/5`);
        else if (!said.marks.some((m) => /labelled for you here/.test(m.note))) fail('the amplitude and period marks do not say the page labelled them');
        else ok(`writing the axes in earns them (${said.score}, and the wave is labelled in red)`);
        // and "Hz" on the vertical axis, the mistake the 2024 report names
        await page.locator('input[data-axis="y"]').fill('Hz');
        await btn('Check').click();
        await page.waitForTimeout(220);
        const wrong = await sheet();
        if (wrong.score !== '4/5') fail(`"Hz" on the vertical axis scored ${wrong.score}, not 4/5`);
        else ok('"Hz" on the vertical axis loses its mark, as the examiner report has it');
    }
}

// ---- 9: the sheet scrolls clear of the strip ----
{
    await page.setViewportSize({ width: 1280, height: 700 });
    await page.waitForTimeout(200);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(250);
    const clear = await page.evaluate(() => {
        const strip = document.querySelector('[aria-label="The questions"]');
        const marking = document.querySelector('[class*="marking"]');
        const last = marking ? marking.lastElementChild : null;
        if (!strip || !last) return null;
        return Math.round(strip.getBoundingClientRect().top - last.getBoundingClientRect().bottom);
    });
    if (clear == null) fail('nothing to measure against the strip at 1280 by 700');
    else if (clear < 12) fail(`the last line of the marking sits ${clear} px from the strip at 1280 by 700`);
    else ok(`the marking scrolls clear of the strip at 1280 by 700 (${clear} px)`);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.waitForTimeout(150);
}

// ---- 6: Next and Back carry nothing ----
await back().click();
await page.waitForTimeout(200);
const cleared = await sheet();
if (cleared.checked !== 'false' || cleared.verdict !== 'blank') fail(`Back left the drawing or the marking behind (checked ${cleared.checked}, verdict ${cleared.verdict})`);
else ok('Back clears the drawing and the marking');

// ---- 5 again: a wrong answer is crossed, with the examiner's line ----
// Back has left a clean paper on the question before the one just marked.
const wrongOn = await sheet();
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
if (marked.verdict === 'full') fail(`a sine wave at 1.25 ms scored full marks on question ${marked.q}`);
else if (!marked.marks.some((m) => m.tick === '✗')) fail('a lost mark is not crossed in the margin');
else if (!marked.marks.every((m) => m.words && m.note)) fail('a mark line is missing the scheme\'s wording or what the page measured');
else if (!marked.report) fail('no examiner line under a question with a mark lost');
else ok(`a wrong answer is crossed in the scheme's own words, with the examiner's line (${marked.score})`);

noExamOnTheSheet(marked.paper, `question ${marked.q}, after a wrong answer`);
if (!told) ok('no year, no paper question and no part label reaches the sheet, before or after Check');

if (errors.length) fail(`page errors: ${errors.join(' | ').slice(0, 200)}`);
await browser.close();

console.log(failures ? `\n${failures} failure(s)` : '\nall clear');
process.exit(failures ? 1 : 0);
