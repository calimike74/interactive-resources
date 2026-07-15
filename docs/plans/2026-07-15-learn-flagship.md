# Learn Area Overhaul — Synthesis Flagship Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn the Learn door into a guided-course system with synthesis as the first full 5-chapter course, and re-file all 51 resources behind the correct door by kind.

**Architecture:** Additive evolution of the existing lesson machinery — no new frameworks, no visual redesign. Resources gain a `kind` field that doors filter on; the learn-topics array becomes an ordered chapter list; the spine layout gains optional row blocks (audio, one-knob interactive) and a chapter-level exam anchor + outro. Everything renders with the existing components and styling idiom (inline styles, `editorial` tokens from `@/lib/theme`).

**Tech Stack:** Next.js 16 (App Router, **static export** — `output: 'export'` in `next.config.mjs`), React 19, Web Audio API, Node built-in test runner (`node --test`, zero new dependencies).

**Spec:** `docs/superpowers/specs/2026-07-15-learn-area-synthesis-flagship-design.md` — read it before starting. Its two hard constraints govern every task: **no visual changes anywhere**, and **Learn DNA preserved** (short visual sections ≤ ~70 words, depth via expandable terms, never walls of text).

**Branch:** work on a new branch `learn-flagship` cut from `fable/smallcalls-2026-06-11` (clean tree verified 2026-07-15). No worktree needed — this repo is the only consumer of its node_modules and the tree is clean. Do **not** push; local only per the three-stage promotion workflow.

**House rules that apply to every task:**
- Match existing code style: 4-space indent, inline style objects, `editorial as ED` tokens, sparse comments.
- `npm run build` must pass before every commit.
- Never edit anything visual: colours, fonts, spacing, card styles all stay byte-identical unless a task explicitly adds a *new* element (which must reuse the existing idiom).

---

## Phase 0 — Setup

### Task 0: Branch + test harness

**Files:**
- Modify: `package.json` (add test script)
- Create: `tests/` directory

**Step 1: Create the branch**

```bash
cd '/Users/mikelehnert/Obsidian/Professional (AI)/interactive-resources'
git checkout -b learn-flagship
```

**Step 2: Add the test script to package.json**

In `package.json` scripts, after `"lint": "eslint"`:

```json
"test": "node --test tests/"
```

**Step 3: Verify the runner works with an empty suite**

Run: `mkdir -p tests && npm test`
Expected: passes with 0 tests (exit code 0).

**Step 4: Commit**

```bash
git add package.json
git commit -m "chore: add node --test script for data-layer tests"
```

> **Why node --test:** the repo has no test infra and the data layer (`lib/resources/*`, `lib/learn/topics/*`) is pure ESM with only relative imports — Node's built-in runner imports it directly. Component files contain JSX and canNOT be imported in these tests; where a test needs to cross-check a component registry, it reads the file as text (Task 16). Do not add jest/vitest/playwright deps.

---

## Phase 1 — Resource kinds (site-wide re-filing)

### Task 1: Failing test — every resource declares a valid kind

**Files:**
- Create: `tests/resource-kinds.test.mjs`

**Step 1: Write the failing test**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getAllResources } from '../lib/resources/index.js';

const VALID_KINDS = ['sandbox', 'interface', 'retrieval', 'practice'];

test('every registered resource declares a valid kind', () => {
    const resources = getAllResources();
    assert.ok(resources.length >= 51, `expected >= 51 resources, got ${resources.length}`);
    for (const r of resources) {
        assert.ok(
            VALID_KINDS.includes(r.kind),
            `resource "${r.id}" has kind "${r.kind}" — must be one of ${VALID_KINDS.join(', ')}`
        );
    }
});
```

> If `getAllResources` doesn't exist in `lib/resources/index.js`, check the exports at the bottom of that file first (`grep -n "export" lib/resources/index.js`) and use whatever enumerates the registry — or add `export function getAllResources() { return Object.values(resources); }` alongside the existing exports.

**Step 2: Run it to make sure it fails**

Run: `npm test`
Expected: FAIL — every resource missing `kind`.

**Step 3: Commit the failing test** (data tests are cheap to land red on a feature branch)

```bash
git add tests/resource-kinds.test.mjs lib/resources/index.js
git commit -m "test: require kind field on every registered resource"
```

### Task 2: Add `kind` to all 51 resource entries

**Files:**
- Modify: every file in `lib/resources/*.js` (51 entries; skip `index.js`, skip the `essay-scaffolds/` subdirectory)

**Step 1: Apply the classification.** Add one line `kind: '<value>',` immediately after the existing `type:` line in each file (or after `id:` if no `type`). The classification (from the approved spec — verify against each file's `title`/`description` as you edit; **stop and flag** any that read differently rather than guessing):

| kind | resources |
|---|---|
| `sandbox` (20) | eq-filter-bridge · octave-period-trainer · midi-pitch-bend-controller · filter-rolloff-visualization · double-tracking-explorer · graphic-parametric-eq · reveal-explorer · subtractive-synth-explorer · compressor-explorer · delay-effects · digital-analogue · combined-distortion-lab · stereo-panning · adc-explorer · signal-chain-builder · signal-chain-eurorack · patch-bay-simulator · sampling-playground · waveform-explorer · bpm-delay-calculator |
| `interface` (7) | compressor-image-explorer · gate-image-explorer · autofilter-image-explorer · eq8-image-explorer · reverb-image-explorer · delay-image-explorer · operator-image-explorer |
| `retrieval` (17) | eq-assessment-prototype · compressor-assessment · gate-assessment · autofilter-assessment · eq8-assessment · reverb-assessment · delay-assessment · operator-assessment · waveform-drawing-assessment · midi-binary-assessment · digital-audio-assessment · pitch-synth-monitors-assessment · levels-metering-assessment · acoustics-flashcards · audio-leads-flashcards · delay-flashcards · rtq-dynamic-compression |
| `practice` (7) | essay-scaffold · essay-scaffold-practice · stereo-recording-essay · compressor-curve-practice · mixing-production · production-analysis · acoustics-psychoacoustics |

> The pre-existing `type:` field is inconsistent (`interactive`/`practice`/`revision`/`assessment`) and is used for display. Leave it untouched — `kind` is door-routing only.
> **Check `acoustics-psychoacoustics` carefully** — the spec flags it as uncertain. If it reads as an explorable/reading tool rather than practice, classify accordingly and note the change in the commit message.

**Step 2: Run the test**

Run: `npm test`
Expected: PASS.

**Step 3: Build, then commit**

```bash
npm run build
git add lib/resources/
git commit -m "feat: classify all 51 resources with a door-routing kind field"
```

### Task 3: Doors filter by kind

**Files:**
- Modify: `app/topic/[topicId]/page.js`
- Modify: `app/topic/[topicId]/TopicPageClient.js`

**Step 1: Split resources by door in the server component.** In `app/topic/[topicId]/page.js`, replace the `resources` resolution + return:

```js
    // Resolve resource metadata for this topic, split by door
    const all = topic.resourceIds
        .filter(id => resourceExists(id))
        .map(id => getResource(id));
    const exploreResources = all.filter(r => r.kind === 'sandbox' || r.kind === 'interface');
    const reviseResources = all.filter(r => r.kind === 'retrieval' || r.kind === 'practice');

    return <TopicPageClient topic={topic} resources={exploreResources} reviseResources={reviseResources} />;
```

**Step 2: Render the Revise practice list.** In `TopicPageClient.js`:

1. Add `reviseResources = []` to the component's props.
2. Explore section (~line 332): already maps `resources` — now receives only sandbox/interface. Its empty-state placeholder stays as-is.
3. Revise section (~line 366): currently `getAvailableTopics().includes(topic.id) ? (...) : (<ComingSoonPlaceholder .../>)`. Restructure so the bank/exam cards remain gated on the bank, and the practice list renders whenever `reviseResources.length > 0`:

```jsx
{getAvailableTopics().includes(topic.id) || reviseResources.length > 0 ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
        {getAvailableTopics().includes(topic.id) && (
            <>
                {/* existing ProgressCard, Start Revision link, Exam Mode link — unchanged, moved inside this fragment */}
            </>
        )}
        {reviseResources.length > 0 && (
            <div>
                <h3 style={{
                    fontSize: typography.size.lg,
                    fontWeight: typography.weight.semibold,
                    color: t.text.primary,
                    margin: `${spacing[2]} 0 ${spacing[3]}`,
                }}>
                    Practice materials
                </h3>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: spacing[4],
                }}>
                    {reviseResources.map((resource, i) => (
                        <ResourceCard key={resource.id} resource={resource} theme={t} animationDelay={i * 80} />
                    ))}
                </div>
            </div>
        )}
    </div>
) : (
    <ComingSoonPlaceholder label="Revision quizzes and flashcards coming soon" theme={t} />
)}
```

This is a *restructure*, not a redesign: the bank cards and ResourceCard grid are the existing components with the existing styles. The only new element is the "Practice materials" heading, using the file's existing type tokens.

4. Add anchor ids (needed by Task 7's outro links): `id="explore"` on the Explore `<section>` and `id="revise"` on the Revise `<section>`. `scroll-margin-top: 16px` style on both.

**Step 3: Verify in the browser**

Run: `npm run dev` then check on `http://localhost:3000`:
- `/topic/dynamics` — Explore shows 3 cards (compressor-explorer, compressor-image-explorer, gate-image-explorer); Revise shows bank + exam + 4 practice cards (compressor-assessment, gate-assessment, rtq-dynamic-compression, compressor-curve-practice).
- `/topic/delay` — Revise door now shows practice materials (assessment + flashcards) instead of "coming soon" even though it has no bank.
- `/topic/distortion` — Explore has its 1 sandbox; Revise shows "coming soon" (no bank, no retrieval resources).

**Step 4: Build + commit**

```bash
npm run build
git add 'app/topic/[topicId]/page.js' 'app/topic/[topicId]/TopicPageClient.js'
git commit -m "feat: filter Explore/Revise doors by resource kind, add practice materials list"
```

---

## Phase 2 — Course shell

### Task 4: Course-shape guard test

**Files:**
- Create: `tests/learn-courses.test.mjs`

**Step 1: Write the test** (passes today with single-lesson topics; becomes the real guard when synthesis grows to 5 chapters in Phase 4):

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getLearnTopicIds, getLearnLessons } from '../lib/learn/topics/index.js';

test('every learn topic is a well-formed course', () => {
    for (const topicId of getLearnTopicIds()) {
        const chapters = getLearnLessons(topicId);
        assert.ok(chapters.length >= 1, `${topicId}: no chapters`);
        const ids = chapters.map(c => c.id);
        assert.equal(new Set(ids).size, ids.length, `${topicId}: duplicate chapter ids`);
        chapters.forEach((c, i) => {
            const num = c.chapterNumber ?? i + 1;
            assert.equal(num, i + 1, `${topicId}/${c.id}: chapterNumber ${num} out of order`);
            assert.ok(Array.isArray(c.rows) && c.rows.length > 0, `${topicId}/${c.id}: no rows`);
            for (const row of c.rows) {
                assert.ok(row.id && row.heading && row.description, `${topicId}/${c.id}/${row.id}: incomplete row`);
            }
        });
    }
});
```

**Step 2: Run + commit**

Run: `npm test` — Expected: PASS (all topics currently single-chapter).

```bash
git add tests/learn-courses.test.mjs
git commit -m "test: guard learn course shape (unique ids, ordered chapters, complete rows)"
```

### Task 5: Progress module (localStorage, SSR-safe)

**Files:**
- Create: `lib/learn/course-progress.js`
- Create: `tests/course-progress.test.mjs`

**Step 1: Write the failing test** — the module takes an injectable storage so Node can test it without a browser:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getProgress, markChapterComplete, firstIncompleteChapter } from '../lib/learn/course-progress.js';

function memoryStorage() {
    const m = new Map();
    return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) };
}

test('progress round-trips and finds first incomplete chapter', () => {
    const storage = memoryStorage();
    const chapters = ['waveforms', 'subtractive', 'envelopes'];

    assert.deepEqual(getProgress('synthesis', storage), {});
    assert.equal(firstIncompleteChapter('synthesis', chapters, storage), 'waveforms');

    markChapterComplete('synthesis', 'waveforms', storage);
    assert.equal(getProgress('synthesis', storage).waveforms, 'completed');
    assert.equal(firstIncompleteChapter('synthesis', chapters, storage), 'subtractive');

    markChapterComplete('synthesis', 'subtractive', storage);
    markChapterComplete('synthesis', 'envelopes', storage);
    assert.equal(firstIncompleteChapter('synthesis', chapters, storage), null);
});

test('corrupt stored JSON degrades to empty progress', () => {
    const storage = memoryStorage();
    storage.setItem('learn-progress:synthesis', '{not json');
    assert.deepEqual(getProgress('synthesis', storage), {});
});
```

**Step 2: Run to verify it fails** — `npm test` → FAIL (module missing).

**Step 3: Implement `lib/learn/course-progress.js`**

```js
// Chapter completion progress, stored per-topic in localStorage.
// storage is injectable for tests; defaults to window.localStorage and
// no-ops when unavailable (SSR / private browsing).

function defaultStorage() {
    if (typeof window === 'undefined') return null;
    try { return window.localStorage; } catch { return null; }
}

const key = (topicId) => `learn-progress:${topicId}`;

export function getProgress(topicId, storage = defaultStorage()) {
    if (!storage) return {};
    try {
        return JSON.parse(storage.getItem(key(topicId))) || {};
    } catch {
        return {};
    }
}

export function markChapterComplete(topicId, chapterId, storage = defaultStorage()) {
    if (!storage) return;
    const progress = getProgress(topicId, storage);
    if (progress[chapterId] === 'completed') return;
    progress[chapterId] = 'completed';
    try { storage.setItem(key(topicId), JSON.stringify(progress)); } catch { /* quota / private mode */ }
}

export function firstIncompleteChapter(topicId, chapterIds, storage = defaultStorage()) {
    const progress = getProgress(topicId, storage);
    return chapterIds.find(id => progress[id] !== 'completed') ?? null;
}
```

**Step 4: Run tests** — `npm test` → PASS.

**Step 5: Commit**

```bash
git add lib/learn/course-progress.js tests/course-progress.test.mjs
git commit -m "feat: localStorage chapter-progress module"
```

### Task 6: Picker becomes the course map

**Files:**
- Modify: `app/learn/[topicId]/LearnPickerClient.js`

The visual language stays: same header, same `CardShell`/`LessonCard`/`ResourceCard`. Changes:

**Step 1: Make it progress-aware.** Component is already `'use client'`. Add:

```js
import { useState, useEffect } from 'react';
import { getProgress, firstIncompleteChapter } from '@/lib/learn/course-progress';
```

Inside the component:

```js
const [progress, setProgress] = useState({});
useEffect(() => { setProgress(getProgress(topic.id)); }, [topic.id]);
const chapterIds = lessons.map(l => l.id);
const continueId = firstIncompleteChapter(topic.id, chapterIds) ?? chapterIds[0];
```

(The `useEffect` avoids a hydration mismatch — server renders zero progress, client fills in.)

**Step 2: Course-map presentation.**
- `LessonCard`'s mono eyebrow (`lesson.subtitle`) becomes `CHAPTER ${lesson.chapterNumber ?? index + 1}` when the topic has >1 lesson; unchanged otherwise.
- Completed chapters get a small `✓ Completed` line in the card footer where `{lesson.rows.length} sections` currently sits (append, don't replace — e.g. `6 sections · ✓ completed`), coloured `#059669` to match the existing answered-check convention in `LearnSpineLayout`.
- Above the grid, when the topic has >1 lesson, render one **Continue** link — an existing-idiom card row (copy the `Start Learning` card pattern from `TopicPageClient` — glass card, title "Continue — Chapter N: Title", `→`) linking to `/learn/${topic.id}/${continueId}`. When every chapter is complete it reads "Start again — Chapter 1: …".
- Header copy: replace the static paragraph with course-aware text: `Work through the chapters in order — each builds on the last.` for multi-chapter topics; keep the existing sentence for single-chapter topics.

**Step 3: Verify** — `npm run dev`: `/learn/eq`, `/learn/dynamics`, `/learn/delay` look unchanged (single chapter → no Continue card, same eyebrows). `/learn/synthesis` likewise for now.

**Step 4: Build + commit**

```bash
npm run build
git add 'app/learn/[topicId]/LearnPickerClient.js'
git commit -m "feat: course map — chapter numbering, completion state, Continue card"
```

### Task 7: ChapterOutro + completion wiring (the dead-end fix)

**Files:**
- Create: `components/learn/ChapterOutro.js`
- Modify: `components/learn/LearnSpineLayout.js`
- Modify: `app/learn/[topicId]/[lessonId]/page.js`
- Modify: `app/learn/[topicId]/[lessonId]/LearnLessonClient.js`
- Modify: `components/learn/LearnTopicPage.js` (prop pass-through)
- Modify: `lib/resources/index.js` — confirm `getResource` is exported (it is, used by topic page)

**Step 1: Compute nav context in the server page.** In `app/learn/[topicId]/[lessonId]/page.js`:

```js
import { getLearnLesson, getLearnLessons, getAllLearnPaths } from '@/lib/learn/topics';
import { getResource, resourceExists } from '@/lib/resources';
```

In the page component, after resolving `lesson`:

```js
    const chapters = getLearnLessons(topicId);
    const index = chapters.findIndex(c => c.id === lessonId);
    const next = index >= 0 && index < chapters.length - 1 ? chapters[index + 1] : null;

    // Final-chapter outro targets: a designated resource if the course names one,
    // otherwise the topic page's Explore section.
    const outroResource = !next && lesson.outroResourceId && resourceExists(lesson.outroResourceId)
        ? getResource(lesson.outroResourceId)
        : null;

    const outro = next
        ? { nextHref: `/learn/${topicId}/${next.id}`, nextLabel: `Chapter ${next.chapterNumber ?? index + 2}: ${next.title}` }
        : {
            exploreHref: outroResource ? `/${outroResource.id}` : `/topic/${topicId}#explore`,
            exploreLabel: outroResource ? outroResource.title : 'the interactive tools',
            reviseHref: `/topic/${topicId}#revise`,
        };

    return <LearnLessonClient topic={lesson} parentTopicId={topicId} outro={outro} />;
```

> Check how resource routes are shaped before assuming `/${resource.id}` — `grep -rn "href" components/TopicCard.jsx app/topic/[topicId]/TopicPageClient.js | grep resource`. The topic page's ResourceCard is the source of truth; reuse its href logic.

**Step 2: Thread `outro` through** `LearnLessonClient` → `LearnTopicPage` → `LearnSpineLayout` as a plain prop.

**Step 3: Create `components/learn/ChapterOutro.js`** — pure presentational, existing idiom (rounded card, `ED` tokens, `→` arrow):

```jsx
'use client';

import Link from 'next/link';
import { editorial as ED } from '@/lib/theme';

function OutroCard({ href, eyebrow, title }) {
    return (
        <Link href={href} style={{ textDecoration: 'none', flex: '1 1 240px', maxWidth: '360px' }}>
            <div
                style={{
                    background: 'white',
                    border: `1px solid ${ED.accentFaint}`,
                    borderRadius: '0.75rem',
                    padding: '1.25rem 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    transition: 'border-color 150ms ease, transform 150ms ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = ED.accent; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = ED.accentFaint; e.currentTarget.style.transform = 'none'; }}
            >
                <div style={{ textAlign: 'left' }}>
                    <div style={{
                        fontFamily: ED.mono, fontSize: '10px', fontWeight: 500,
                        letterSpacing: '0.18em', textTransform: 'uppercase', color: ED.inkFade,
                        marginBottom: '0.35rem',
                    }}>
                        {eyebrow}
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1A1A2E', lineHeight: 1.3 }}>
                        {title}
                    </div>
                </div>
                <span aria-hidden="true" style={{ color: ED.accent, fontSize: '1.1rem', fontWeight: 600 }}>&rarr;</span>
            </div>
        </Link>
    );
}

export default function ChapterOutro({ outro }) {
    if (!outro) return null;
    return (
        <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '1rem',
            justifyContent: 'center', padding: '0 1.5rem 4rem',
        }}>
            {outro.nextHref ? (
                <OutroCard href={outro.nextHref} eyebrow="Next" title={outro.nextLabel} />
            ) : (
                <>
                    <OutroCard href={outro.exploreHref} eyebrow="Now go play" title={outro.exploreLabel} />
                    <OutroCard href={outro.reviseHref} eyebrow="Prove it" title="Revise this topic" />
                </>
            )}
        </div>
    );
}
```

**Step 4: Wire into `LearnSpineLayout.js`.**
- Accept `outro` prop. Render `<ChapterOutro outro={outro} />` immediately after the existing "Complete message" `<div>` (ripple untouched), fading in with the same `rippleFired`-gated opacity/transition pattern the complete message uses.
- Mark completion: in the ripple effect (`checkRipple`, where `rippleFiredRef.current = true` is set), add `markChapterComplete(topic.parentTopicId ?? topicIdProp, topic.id)`. Cleanest wiring: pass `parentTopicId` down alongside `outro` (LearnTopicPage already receives it) and call `markChapterComplete(parentTopicId, topic.id)`. Import from `@/lib/learn/course-progress`.

**Step 5: Verify in the browser.** `npm run dev`; walk `/learn/eq/eq` (or its actual lesson id — check `lib/learn/topics/eq.js`) to the bottom: ripple fires, outro shows "Now go play / Prove it" cards (1-chapter course → final-chapter variant), and revisiting `/learn/eq` shows the chapter marked completed.

**Step 6: Build + commit**

```bash
npm run build
git add components/learn/ChapterOutro.js components/learn/LearnSpineLayout.js components/learn/LearnTopicPage.js 'app/learn/[topicId]/[lessonId]/page.js' 'app/learn/[topicId]/[lessonId]/LearnLessonClient.js'
git commit -m "feat: chapter outro replaces dead-end; ripple marks chapter complete"
```

---

## Phase 3 — Row blocks (audio, one-knob interactives, exam anchor)

### Task 8: Shared audio engine

**Files:**
- Create: `lib/learn/audio-presets.js`
- Create: `tests/audio-presets.test.mjs`

All synthesis chapter audio is generated live — no samples. One module owns the AudioContext and preset graphs; UI components (Task 9, 10) consume it.

**Step 1: Failing test** (pure logic only — preset registry completeness; Web Audio itself can't run under Node):

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRESET_IDS, describePreset } from '../lib/learn/audio-presets.js';

test('all planned presets are registered and describable', () => {
    const required = [
        'waveform-sine', 'waveform-triangle', 'waveform-sawtooth', 'waveform-square',
        'filter-sweep', 'adsr-pluck', 'adsr-swell',
        'lfo-vibrato', 'lfo-tremolo', 'lfo-wah', 'fm-ratio',
    ];
    for (const id of required) {
        assert.ok(PRESET_IDS.includes(id), `missing preset ${id}`);
        assert.ok(describePreset(id).length > 0, `preset ${id} has no accessible description`);
    }
});
```

Run: `npm test` → FAIL.

**Step 2: Implement `lib/learn/audio-presets.js`**

```js
// Live Web Audio presets for learn-chapter listening blocks.
// startPreset(id, params) builds a small graph and returns { stop, set }.
// One shared AudioContext, lazily created on first user gesture.

let ctx = null;

function getContext() {
    if (typeof window === 'undefined') return null;
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
}

const LEVEL = 0.15;
const RAMP = 0.015; // click-free fades

function master(ac) {
    const gain = ac.createGain();
    gain.gain.setValueAtTime(0, ac.currentTime);
    gain.gain.linearRampToValueAtTime(LEVEL, ac.currentTime + RAMP);
    gain.connect(ac.destination);
    return gain;
}

function stopper(ac, gain, nodes) {
    return () => {
        const t = ac.currentTime;
        gain.gain.cancelScheduledValues(t);
        gain.gain.setValueAtTime(gain.gain.value, t);
        gain.gain.linearRampToValueAtTime(0, t + RAMP);
        setTimeout(() => nodes.forEach(n => { try { n.stop ? n.stop() : n.disconnect(); } catch { /* already stopped */ } }), RAMP * 1000 + 30);
    };
}

const presets = {
    'waveform-sine': { desc: 'A pure sine wave at 220 Hz — fundamental only, no harmonics.', build: waveform('sine') },
    'waveform-triangle': { desc: 'A triangle wave at 220 Hz — odd harmonics, falling away quickly. Soft and mellow.', build: waveform('triangle') },
    'waveform-sawtooth': { desc: 'A sawtooth wave at 220 Hz — every harmonic present. Bright and buzzy.', build: waveform('sawtooth') },
    'waveform-square': { desc: 'A square wave at 220 Hz — odd harmonics only. Hollow and reedy.', build: waveform('square') },
    'filter-sweep': {
        desc: 'A sawtooth wave through a low-pass filter whose cutoff sweeps up and down.',
        build: (ac, out) => {
            const osc = ac.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = 110;
            const filter = ac.createBiquadFilter(); filter.type = 'lowpass'; filter.Q.value = 6;
            const lfo = ac.createOscillator(); lfo.frequency.value = 0.25;
            const lfoGain = ac.createGain(); lfoGain.gain.value = 1800;
            filter.frequency.value = 2000;
            lfo.connect(lfoGain).connect(filter.frequency);
            osc.connect(filter).connect(out);
            osc.start(); lfo.start();
            return [osc, lfo];
        },
    },
    'adsr-pluck': {
        desc: 'Instant attack, fast decay, no sustain — a percussive pluck.',
        build: envelope({ attack: 0.005, decay: 0.35, sustain: 0 }),
    },
    'adsr-swell': {
        desc: 'Slow attack into full sustain — a string-like swell.',
        build: envelope({ attack: 1.4, decay: 0.2, sustain: 0.85 }),
    },
    'lfo-vibrato': {
        desc: 'An LFO gently modulating pitch — vibrato.',
        build: lfoTo('frequency', { rate: 6, depth: 14, base: 330 }),
    },
    'lfo-tremolo': {
        desc: 'An LFO modulating volume — tremolo.',
        build: lfoTo('gain', { rate: 5, depth: 0.5, base: 330 }),
    },
    'lfo-wah': {
        desc: 'An LFO sweeping a filter cutoff — an automatic wah.',
        build: lfoTo('filter', { rate: 2, depth: 900, base: 110 }),
    },
    'fm-ratio': {
        desc: 'A modulator oscillator shaking a carrier’s frequency — frequency modulation. The ratio sets the character.',
        build: (ac, out, params = {}) => {
            const ratio = params.ratio ?? 2;
            const carrier = ac.createOscillator(); carrier.type = 'sine'; carrier.frequency.value = 220;
            const mod = ac.createOscillator(); mod.type = 'sine'; mod.frequency.value = 220 * ratio;
            const modGain = ac.createGain(); modGain.gain.value = params.index ?? 300;
            mod.connect(modGain).connect(carrier.frequency);
            carrier.connect(out);
            carrier.start(); mod.start();
            return [carrier, mod];
        },
    },
};

function waveform(type) {
    return (ac, out) => {
        const osc = ac.createOscillator();
        osc.type = type; osc.frequency.value = 220;
        osc.connect(out); osc.start();
        return [osc];
    };
}

function envelope({ attack, decay, sustain }) {
    return (ac, out) => {
        const osc = ac.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = 220;
        const env = ac.createGain();
        const t = ac.currentTime;
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(1, t + attack);
        env.gain.linearRampToValueAtTime(sustain, t + attack + decay);
        osc.connect(env).connect(out); osc.start();
        return [osc];
    };
}

function lfoTo(target, { rate, depth, base }) {
    return (ac, out) => {
        const osc = ac.createOscillator();
        osc.type = target === 'filter' ? 'sawtooth' : 'sine';
        osc.frequency.value = base;
        const lfo = ac.createOscillator(); lfo.frequency.value = rate;
        const lfoGain = ac.createGain(); lfoGain.gain.value = depth;
        const nodes = [osc, lfo];

        if (target === 'frequency') {
            lfo.connect(lfoGain).connect(osc.frequency);
            osc.connect(out);
        } else if (target === 'gain') {
            const amp = ac.createGain(); amp.gain.value = 1 - depth / 2;
            lfo.connect(lfoGain).connect(amp.gain);
            osc.connect(amp).connect(out);
        } else {
            const filter = ac.createBiquadFilter();
            filter.type = 'lowpass'; filter.frequency.value = 1200; filter.Q.value = 8;
            lfo.connect(lfoGain).connect(filter.frequency);
            osc.connect(filter).connect(out);
        }
        osc.start(); lfo.start();
        return nodes;
    };
}

export const PRESET_IDS = Object.keys(presets);

export function describePreset(id) {
    return presets[id]?.desc ?? '';
}

export function startPreset(id, params) {
    const ac = getContext();
    const preset = presets[id];
    if (!ac || !preset) return { stop: () => {} };
    const out = master(ac);
    const nodes = preset.build(ac, out, params);
    return { stop: stopper(ac, out, nodes) };
}
```

**Step 3: Run tests** — `npm test` → PASS. **Build + commit.**

```bash
npm run build
git add lib/learn/audio-presets.js tests/audio-presets.test.mjs
git commit -m "feat: live Web Audio preset engine for learn chapters"
```

### Task 9: AudioBlock (press-and-hold listen button)

**Files:**
- Create: `components/learn/AudioBlock.js`
- Modify: `components/learn/LearnSpineLayout.js`

**Step 1: Component.** Press-and-hold (pointer events, so it works on iOS — the press is the AudioContext unlock gesture). Keyboard accessible (Space/Enter toggles). Hard-stops on release, pointer leave, and unmount.

```jsx
'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { startPreset, describePreset } from '@/lib/learn/audio-presets';
import { editorial as ED } from '@/lib/theme';

export default function AudioBlock({ preset, params, label = 'Hold to listen' }) {
    const [playing, setPlaying] = useState(false);
    const handleRef = useRef(null);

    const stop = useCallback(() => {
        handleRef.current?.stop();
        handleRef.current = null;
        setPlaying(false);
    }, []);

    const start = useCallback(() => {
        if (handleRef.current) return;
        handleRef.current = startPreset(preset, params);
        setPlaying(true);
    }, [preset, params]);

    useEffect(() => stop, [stop]);

    return (
        <div style={{ marginTop: '0.9rem' }}>
            <button
                type="button"
                aria-pressed={playing}
                aria-label={`${label}: ${describePreset(preset)}`}
                onPointerDown={start}
                onPointerUp={stop}
                onPointerLeave={stop}
                onPointerCancel={stop}
                onKeyDown={e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); playing ? stop() : start(); } }}
                onContextMenu={e => e.preventDefault()}
                style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.5rem 1rem', borderRadius: '9999px',
                    border: `1.5px solid ${playing ? ED.accent : ED.accentFaint}`,
                    background: playing ? ED.accent + '15' : 'transparent',
                    color: ED.accent, fontFamily: 'inherit',
                    fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
                    transition: 'all 150ms ease',
                    WebkitUserSelect: 'none', userSelect: 'none', touchAction: 'none',
                }}
            >
                <span aria-hidden="true" style={{ fontSize: '0.7rem' }}>{playing ? '■' : '▸'}</span>
                {playing ? 'Playing… release to stop' : label}
            </button>
        </div>
    );
}
```

> `▸`/`⇄` glyph convention: A-level surfaces use `▸` not `▶` (house rule). `touchAction: 'none'` stops scroll hijack on the press.

**Step 2: Render in the spine.** In `LearnSpineLayout.js`, inside `textBlock` after the `<ExpandableText …/>` line:

```jsx
{row.audio && <AudioBlock preset={row.audio.preset} params={row.audio.params} label={row.audio.label} />}
```

**Step 3: Smoke-test on an existing row.** Temporarily add `audio: { preset: 'waveform-sawtooth' }` to the oscillators row of `lib/learn/topics/synthesis.js`, `npm run dev`, hold the button, hear a sawtooth, release, silence. **Revert the temporary row change** (Phase 4 adds audio properly).

**Step 4: Build + commit**

```bash
npm run build
git add components/learn/AudioBlock.js components/learn/LearnSpineLayout.js
git commit -m "feat: press-and-hold AudioBlock rendered from row.audio"
```

### Task 10: One-knob interactives registry

**Files:**
- Create: `components/learn/interactives/index.js`
- Create: `components/learn/interactives/CutoffSlider.js`
- Create: `components/learn/interactives/ResonanceKnob.js`
- Create: `components/learn/interactives/ADSRShaper.js`
- Create: `components/learn/interactives/LFODepthDial.js`
- Create: `components/learn/interactives/FMRatioSlider.js`
- Modify: `components/learn/LearnSpineLayout.js`
- Modify: `lib/learn/audio-presets.js` (expose `set` for live param changes)

**One knob per interactive is law** (spec): exactly one draggable control + one hold-to-listen button. Anything richer belongs in Explore.

**Step 1: Extend the audio engine for live control.** In `audio-presets.js`, presets used by interactives return a `set(value)` on the handle. Extend `startPreset` to pass through a `set` returned by the build function, defaulting to a no-op:

```js
export function startPreset(id, params) {
    const ac = getContext();
    const preset = presets[id];
    if (!ac || !preset) return { stop: () => {}, set: () => {} };
    const out = master(ac);
    const built = preset.build(ac, out, params);
    const nodes = Array.isArray(built) ? built : built.nodes;
    const set = Array.isArray(built) ? () => {} : built.set;
    return { stop: stopper(ac, out, nodes), set };
}
```

Add controllable presets (build returns `{ nodes, set }`):
- `'ctl-cutoff'` — saw 110 Hz → lowpass (Q 4); `set(hz)` ramps `filter.frequency` (`setTargetAtTime`, 0.02).
- `'ctl-resonance'` — saw 110 Hz → lowpass 900 Hz; `set(q)` sets `filter.Q` 0.5–20.
- `'ctl-adsr'` — retriggering saw pluck every 900 ms via a scheduling interval; `set({attack, decay, sustain, release})` updates the envelope used for the next trigger. Keep the interval handle in `nodes` cleanup (wrap `clearInterval` in a `{ stop() }` shim so `stopper` can dispose it — `stopper` already tolerates `disconnect`-less nodes via try/catch; give the shim a `stop()` method).
- `'ctl-lfo-depth'` — vibrato graph; `set(depth)` ramps `lfoGain.gain` 0–40.
- `'ctl-fm-ratio'` — FM pair; `set(ratio)` ramps `mod.frequency` to `220 * ratio`.

Update the Task 8 test's `required` list to include the five `ctl-*` ids. Run `npm test` → PASS.

**Step 2: Complete example — `CutoffSlider.js`.** The other four copy this shape exactly (same layout, same hold-button, different preset id + range + readout):

```jsx
'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { startPreset } from '@/lib/learn/audio-presets';
import { editorial as ED } from '@/lib/theme';

export default function CutoffSlider() {
    const [cutoff, setCutoff] = useState(2000);
    const [playing, setPlaying] = useState(false);
    const handleRef = useRef(null);

    const stop = useCallback(() => { handleRef.current?.stop(); handleRef.current = null; setPlaying(false); }, []);
    const start = useCallback(() => {
        if (handleRef.current) return;
        handleRef.current = startPreset('ctl-cutoff');
        handleRef.current.set(cutoff);
        setPlaying(true);
    }, [cutoff]);
    useEffect(() => stop, [stop]);

    const onChange = (e) => {
        const hz = Number(e.target.value);
        setCutoff(hz);
        handleRef.current?.set(hz);
    };

    return (
        <div style={{
            marginTop: '0.9rem', padding: '0.9rem 1rem',
            border: `1px solid ${ED.accentFaint}`, borderRadius: '0.75rem', background: '#fafafa',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                <span style={{
                    fontFamily: ED.mono, fontSize: '10px', fontWeight: 500,
                    letterSpacing: '0.18em', textTransform: 'uppercase', color: ED.inkFade,
                }}>
                    Try it — filter cutoff
                </span>
                <span style={{ fontFamily: ED.mono, fontSize: '11px', color: ED.accent, fontVariantNumeric: 'tabular-nums' }}>
                    {cutoff >= 1000 ? `${(cutoff / 1000).toFixed(1)} kHz` : `${cutoff} Hz`}
                </span>
            </div>
            <input
                type="range" min="100" max="8000" step="10" value={cutoff}
                onChange={onChange}
                aria-label="Filter cutoff frequency"
                style={{ width: '100%', accentColor: ED.accent }}
            />
            <button
                type="button"
                onPointerDown={start} onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop}
                onKeyDown={e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); playing ? stop() : start(); } }}
                style={{
                    marginTop: '0.6rem', padding: '0.35rem 0.9rem', borderRadius: '9999px',
                    border: `1.5px solid ${playing ? ED.accent : ED.accentFaint}`,
                    background: playing ? ED.accent + '15' : 'transparent',
                    color: ED.accent, fontFamily: 'inherit', fontSize: '0.75rem', fontWeight: 600,
                    cursor: 'pointer', WebkitUserSelect: 'none', userSelect: 'none', touchAction: 'none',
                }}
            >
                {playing ? '■ release to stop' : '▸ hold to hear it'}
            </button>
        </div>
    );
}
```

**Step 3: The other four**, same pattern:
- `ResonanceKnob` — range 0.5–20 (step 0.5), preset `ctl-resonance`, label "Try it — resonance", readout `Q {value}`.
- `ADSRShaper` — the one knob is a single "shape" slider 0–100 that morphs pluck→swell (0 = A 0.005/D 0.35/S 0; 100 = A 1.4/D 0.2/S 0.85; linear interpolate; `set(shape)` computes and passes the ADSR). Readout: "plucky ↔ swelling".
- `LFODepthDial` — range 0–40 Hz depth, preset `ctl-lfo-depth`, label "Try it — LFO depth", readout `±{value} Hz`.
- `FMRatioSlider` — range 0.5–8 step 0.01, preset `ctl-fm-ratio`, snap-highlight when within 0.02 of an integer (readout shows `ratio 2.00 — harmonic` vs `ratio 2.37 — inharmonic/bell-like`).

**Step 4: Registry + spine wiring.** `components/learn/interactives/index.js`:

```js
import CutoffSlider from './CutoffSlider';
import ResonanceKnob from './ResonanceKnob';
import ADSRShaper from './ADSRShaper';
import LFODepthDial from './LFODepthDial';
import FMRatioSlider from './FMRatioSlider';

const interactives = {
    'cutoff-slider': CutoffSlider,
    'resonance-knob': ResonanceKnob,
    'adsr-shaper': ADSRShaper,
    'lfo-depth-dial': LFODepthDial,
    'fm-ratio-slider': FMRatioSlider,
};

export default interactives;
```

In `LearnSpineLayout.js`, after the AudioBlock line in `textBlock`:

```jsx
{row.interactive && interactives[row.interactive] && (() => {
    const Interactive = interactives[row.interactive];
    return <Interactive />;
})()}
```

> Note: the existing `interactive: 'waveform-text'` on the oscillators row has never rendered (no consumer existed). It's not in the new registry, and the guard above skips unknown ids — remove the field in Phase 4 when that row is rewritten.

**Step 5: Verify** — temporarily set `interactive: 'cutoff-slider'` on the filters row, dev-server check (drag while holding = live sweep), then revert.

**Step 6: Build + commit**

```bash
npm run build
git add components/learn/interactives/ components/learn/LearnSpineLayout.js lib/learn/audio-presets.js tests/audio-presets.test.mjs
git commit -m "feat: one-knob interactives registry rendered from row.interactive"
```

### Task 11: Exam anchor ("In the exam")

**Files:**
- Create: `components/learn/ExamAnchor.js`
- Modify: `components/learn/LearnSpineLayout.js`

**Step 1: Component** — chapter-level, rendered once. Same register as the rest of the page (white card, mono eyebrow, no new colours):

```jsx
'use client';

import { editorial as ED } from '@/lib/theme';

export default function ExamAnchor({ anchor }) {
    if (!anchor) return null;
    return (
        <div style={{ maxWidth: '760px', margin: '0 auto 4rem', padding: '0 1.5rem', position: 'relative', zIndex: 3 }}>
            <div style={{ background: 'white', border: `1px solid ${ED.accentFaint}`, borderRadius: '0.75rem', padding: '1.75rem 2rem' }}>
                <div style={{
                    fontFamily: ED.mono, fontSize: '11px', fontWeight: 500,
                    letterSpacing: '0.18em', textTransform: 'uppercase', color: ED.accent, marginBottom: '0.75rem',
                }}>
                    In the exam
                </div>
                <p style={{ fontSize: '1rem', fontWeight: 600, color: '#1A1A2E', lineHeight: 1.45, marginBottom: '1rem' }}>
                    {anchor.question}
                </p>
                <div style={{
                    fontFamily: ED.mono, fontSize: '10px', fontWeight: 500,
                    letterSpacing: '0.18em', textTransform: 'uppercase', color: ED.inkFade, marginBottom: '0.5rem',
                }}>
                    A strong answer includes
                </div>
                <ul style={{ margin: '0 0 1rem', paddingLeft: '1.25rem' }}>
                    {anchor.modelPoints.map((point, i) => (
                        <li key={i} style={{ fontSize: '0.9375rem', color: '#374151', lineHeight: 1.55, marginBottom: '0.35rem' }}>
                            {point}
                        </li>
                    ))}
                </ul>
                {anchor.examTip && (
                    <p style={{ fontSize: '0.875rem', color: '#6B7280', lineHeight: 1.55, borderTop: `1px solid ${ED.rule ?? '#E5E7EB'}`, paddingTop: '0.9rem', margin: 0 }}>
                        <strong style={{ color: '#374151' }}>Examiner tip:</strong> {anchor.examTip}
                    </p>
                )}
            </div>
        </div>
    );
}
```

> Check `ED.rule` exists in `lib/theme.js` before using (`grep -n "rule" lib/theme.js`); fall back to `#E5E7EB` if not.

**Step 2: Render in `LearnSpineLayout.js`** between the sections map and the ripple zone:

```jsx
{topic.examAnchor && <ExamAnchor anchor={topic.examAnchor} />}
```

**Step 3: Verify with a temporary anchor** on the current synthesis lesson (dev server), then revert.

**Step 4: Build + commit**

```bash
npm run build
git add components/learn/ExamAnchor.js components/learn/LearnSpineLayout.js
git commit -m "feat: chapter-level In-the-exam anchor before the ripple"
```

---

## Phase 4 — The synthesis course (content)

**Content rules for every chapter task (from the spec — non-negotiable):**
- Section text ≤ ~70 words, cause-and-effect language, technical terms present so ExpandableText can deepen them. Depth lives in `lib/learn/expansions.js` entries, **not** in longer paragraphs.
- Every section has a `?` assessment: applied scenario (same style as existing ones — a producer/student problem, 3 options, feedback per option, mark-scheme vocabulary in the correct answer).
- Accuracy: mine the C4 Synthesis Definitive Reference and Synthesis Workshop content (ask Mike to point at the current copies if not found under `Professional (AI)/`); verify every claim against the Pearson 1.3 spec summary in `lib/topics.js` and past-paper phrasing. If a source can't be found, **write from the existing verified expansions + flag for Mike's review** — do not invent hardware history facts.
- Diagrams: each new row needs an `animation` id registered in `components/learn/diagrams/index.js`. **Before writing any new diagram, read two existing ones end-to-end** (`components/learn/diagrams/OscillatorWaveforms.js` and `FilterEnvelope.js`) and copy their conventions: self-contained SVG, 480×280 viewBox, CSS keyframe loops, reduced-motion respected, no external deps.

### Task 12: Restructure synthesis into 5 chapters (skeleton first)

**Files:**
- Modify: `lib/learn/topics/synthesis.js`
- Modify: `lib/learn/topics/index.js`
- Modify: `vercel.json`

**Step 1: Restructure the data.** `synthesis.js` now exports `SYNTHESIS_CHAPTERS` — five chapter objects with `id`, `chapterNumber`, `title`, `subtitle` (`'Chapter N — Topic 1.3'`), `description`, `estimatedTime`, `rows`. Distribute the existing six rows (content unchanged in this task):

| Chapter | id | rows (this task) |
|---|---|---|
| 1 | `waveforms` | *placeholder:* move `oscillators` row here temporarily so the chapter is non-empty |
| 2 | `subtractive` | `what-is-subtractive`, `filters`, `signal-flow` |
| 3 | `envelopes` | `filter-envelope`, `amp-envelope` |
| 4 | `lfo-modulation` | *placeholder row* (heading "LFOs", description one sentence, reuse `synth-signal-flow` animation) |
| 5 | `fm-synthesis` | *placeholder row* (reuse `subtractive-concept` animation) + `outroResourceId: 'operator-image-explorer'` on the chapter |

In `index.js`: `synthesis: SYNTHESIS_CHAPTERS`.

**Step 2: Old-URL redirect.** Static export means no runtime redirects — add to `vercel.json` (top level, alongside `headers`):

```json
"redirects": [
  { "source": "/learn/synthesis/synthesis", "destination": "/learn/synthesis/subtractive", "permanent": true }
]
```

**Step 3: Tests + build.** `npm test` (course-shape test now exercises real multi-chapter ordering) and `npm run build` (static params must include all five chapter routes — check build output lists `/learn/synthesis/waveforms` … `/learn/synthesis/fm-synthesis`).

**Step 4: Browser check.** `/learn/synthesis` shows 5 numbered chapters + Continue card; chapter 2 ends with "Next: Chapter 3 — Envelopes"; chapter 5 outro shows Operator explorer + Revise cards.

**Step 5: Commit**

```bash
git add lib/learn/topics/synthesis.js lib/learn/topics/index.js vercel.json
git commit -m "feat: synthesis restructured as 5-chapter course with old-URL redirect"
```

### Tasks 13–17: Chapter content (one task per chapter)

Each follows the identical loop — shown fully for Task 13; repeat for 14–17 with that chapter's scope.

#### Task 13: Chapter 1 — Sound & Waveforms

**Files:**
- Modify: `lib/learn/topics/synthesis.js` (chapter 1 rows)
- Modify: `lib/learn/expansions.js` (new SYNTHESIS entries)
- Create: `components/learn/diagrams/WhatIsSound.js`, `HarmonicSeries.js`, `TimbreComparison.js`
- Modify: `components/learn/diagrams/index.js`

**Step 1: Write the four rows** (replacing the placeholder; the `oscillators` row moves here permanently, rewritten to chapter-1 depth):

1. `what-is-sound` — vibration → frequency (pitch) → amplitude (loudness). `animation: 'what-is-sound'`. Assessment: pitch-vs-loudness scenario.
2. `harmonic-series` — fundamental + harmonics at integer multiples; why harmonics = timbre's raw material. `animation: 'harmonic-series'`. Audio: none (covered next row). Assessment: identify 3rd harmonic of 110 Hz (330 Hz) — numeracy crossover.
3. `four-waveforms` — the rewritten oscillators row. `animation: 'oscillator-waveforms'` (existing — reuse). **Four audio blocks is too many; one AudioBlock per row is the format** — use `audio: { preset: 'waveform-sawtooth', label: 'Hold to hear a sawtooth' }` here and put sine/square/triangle presets on the rows where they teach (sine on `what-is-sound`, square on the assessment feedback context — judgement call, keep ≤1 per row). Remove the dead `interactive: 'waveform-text'` field.
4. `timbre` — same pitch, different harmonic content = different instrument. `animation: 'timbre-comparison'`. Assessment: why do a flute and violin at A440 sound different.

Worked example of the register required (row 3):

```js
{
    id: 'four-waveforms',
    heading: 'The Four Waveforms',
    description: 'Each waveform is a recipe of harmonics. Sawtooth waves contain all harmonics — bright and buzzy. Square waves have only odd harmonics — hollow and reedy. Triangle waves keep the odd harmonics but much quieter — soft and mellow. Sine waves are pure fundamental — no harmonics at all.',
    animation: 'oscillator-waveforms',
    audio: { preset: 'waveform-sawtooth', label: 'Hold to hear a sawtooth' },
    assessment: { /* applied scenario, 3 options, feedback each — match existing style */ },
},
```

**Step 2: Expansions.** Add ≥2 triggers per new row to `SYNTHESIS_EXPANSIONS` (e.g. `"frequency"`, `"amplitude"`, `"integer multiples"`, `"fundamental"`). Existing waveform expansions already cover row 3.

**Step 3: Diagrams.** Build the three new components after reading the two reference diagrams. Register in `diagrams/index.js` (`'what-is-sound'`, `'harmonic-series'`, `'timbre-comparison'`).

**Step 4: Diagram-registration guard** (first chapter task only — then it protects all later ones). Create `tests/diagram-registry.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getLearnTopicIds, getLearnLessons } from '../lib/learn/topics/index.js';

test('every row animation id is registered in the diagrams index', () => {
    const indexSrc = readFileSync(new URL('../components/learn/diagrams/index.js', import.meta.url), 'utf8');
    for (const topicId of getLearnTopicIds()) {
        for (const chapter of getLearnLessons(topicId)) {
            for (const row of chapter.rows) {
                if (!row.animation) continue;
                assert.ok(
                    indexSrc.includes(`'${row.animation}'`),
                    `${topicId}/${chapter.id}/${row.id}: animation "${row.animation}" not registered`
                );
            }
        }
    }
});
```

**Step 5: Verify** — `npm test`, `npm run build`, dev-server read-through of `/learn/synthesis/waveforms`: 4 sections, diagrams animate, audio plays, ? checks work, outro → Chapter 2.

**Step 6: Commit**

```bash
git add lib/learn/topics/synthesis.js lib/learn/expansions.js components/learn/diagrams/ tests/diagram-registry.test.mjs
git commit -m "feat: chapter 1 — Sound & Waveforms (4 sections, 3 new diagrams)"
```

#### Task 14: Chapter 2 — Subtractive Synthesis
Same loop. Scope: keep/deepen `what-is-subtractive`, `filters`, `signal-flow`; **new `resonance` row** (`animation: 'resonance'` — new diagram: peak at cutoff, growing with Q); add `audio: { preset: 'filter-sweep' }` + `interactive: 'cutoff-slider'` to `filters`; `interactive: 'resonance-knob'` on `resonance`; chapter `examAnchor` (describe creating a bright-then-mellow pad; model points: rich waveform → LPF → cutoff/envelope movement → resonance emphasis; tip: name parameters, not vibes). Add expansions for resonance/self-oscillation. Commit: `feat: chapter 2 — subtractive deepened with resonance, live audio, cutoff interactive`.

#### Task 15: Chapter 3 — Envelopes
Scope: new intro row `what-is-an-envelope` (`animation: 'envelope-concept'` — new diagram: generic ADSR trace); existing `amp-envelope` + `filter-envelope` rows (audio: `adsr-pluck` on amp — swap the label to make pluck-vs-swell explicit; `interactive: 'adsr-shaper'` on amp); new `envelope-recipes` row (pad/pluck/bass settings table as diagram `'envelope-recipes'`); `examAnchor` (classic ADSR settings question with mark-scheme language: attack/decay/sustain/release each named with a time/level and a reason). Commit: `feat: chapter 3 — envelopes with ADSR shaper and recipes`.

#### Task 16: Chapter 4 — LFOs & Modulation
Scope (all new): rows `what-is-an-lfo` (`'lfo-basics'` diagram), `rate-and-depth` (`interactive: 'lfo-depth-dial'`), `lfo-targets` (`'lfo-targets'` diagram; audio: `lfo-vibrato`; teach pitch=vibrato / amp=tremolo / filter=wah), `lfo-vs-envelope` (`'lfo-vs-envelope'` diagram: cyclic vs one-shot). ≥8 new expansions. `examAnchor` (add movement to a static pad — LFO target/rate/depth with mark-scheme vocab). Commit: `feat: chapter 4 — LFOs & modulation (new)`.

#### Task 17: Chapter 5 — FM Synthesis
Scope (all new): rows `carrier-and-modulator` (`'fm-concept'` diagram; audio: `fm-ratio` at ratio 2), `operators-and-algorithms` (`'fm-operators'` diagram mirroring Operator's stack), `ratios` (`interactive: 'fm-ratio-slider'`; harmonic integer ratios vs inharmonic bell tones), `fm-in-practice` (`'fm-in-practice'` diagram; DX7/bass/bells — **facts verified against the Definitive Reference only, no invented history**). `examAnchor` (explain how FM generates complex timbres without filters — carrier, modulator, ratio, index in mark-scheme language). Chapter keeps `outroResourceId: 'operator-image-explorer'`. Commit: `feat: chapter 5 — FM synthesis (new), course complete`.

---

## Phase 5 — Verification & handoff

### Task 18: Full verification pass

**Step 1: Automated gates**

```bash
npm test          # all data-layer suites green
npm run lint      # no new violations in touched files
npm run build     # static export completes; note all /learn/synthesis/* routes in output
```

**Step 2: DOM walk (Playwright MCP or by hand against `npm run dev`)** — assert by DOM content, not screenshots:
- `/learn/synthesis` lists 5 chapters in order with Continue card.
- Each chapter renders all its sections; every `?` check answers and gives feedback.
- Outros: ch1→2→3→4→5 chain; ch5 shows Operator + Revise cards; `/topic/synthesis#explore` and `#revise` anchors land on their sections.
- `/topic/dynamics`, `/topic/delay`, `/topic/eq` door counts match the kind table (no resource lost: total cards across both doors per topic = old Explore count).
- EQ/dynamics/delay lessons render unchanged; their outros show the final-chapter variant.
- Old URL `/learn/synthesis/synthesis`: confirm the vercel.json redirect entry exists (runtime redirect is only testable on Vercel — flag as deploy-time check, do not claim verified locally).

**Step 3: Audio sign-off — Mike, by ear.** Every preset + all five interactives on speakers and iPhone Safari. This cannot be auto-verified; it is a named gate, not skippable silently.

**Step 4: House gates.** Run the `verify-house-build` skill (3 gates) before any "done" claim. API security check: `git diff fable/smallcalls-2026-06-11..HEAD --stat` must show no `app/api/` changes; no new fetch endpoints.

**Step 5: Content accuracy gate.** Cross-check all five examAnchors and every new factual claim against the Pearson spec + a past paper. Produce a short claims list for Mike's review with the chapter each appears in.

**Step 6: Final commit + stop.** Do **not** push, do **not** deploy. Hand to Mike: dev-server walkthrough + the claims list + the audio checklist. Promotion is Mike's call (three-stage workflow).

---

## Task summary

| # | Task | Phase |
|---|---|---|
| 0 | Branch + node --test harness | Setup |
| 1 | Failing kinds test | Re-filing |
| 2 | Classify all 51 resources | Re-filing |
| 3 | Doors filter by kind + practice list + anchors | Re-filing |
| 4 | Course-shape guard test | Shell |
| 5 | Progress module | Shell |
| 6 | Course map picker | Shell |
| 7 | ChapterOutro + completion wiring | Shell |
| 8 | Audio preset engine | Blocks |
| 9 | AudioBlock | Blocks |
| 10 | One-knob interactives | Blocks |
| 11 | ExamAnchor | Blocks |
| 12 | 5-chapter restructure + redirect | Content |
| 13–17 | Chapters 1–5 | Content |
| 18 | Verification + handoff | Verify |
