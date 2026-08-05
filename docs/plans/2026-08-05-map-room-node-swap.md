# Map Room Node Swap Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the Map Room's 302 harvested concept nodes with the 267 curated subtopics, so every node on screen is a real thing a student can be taught, without breaking the exam routes or the whole-course tour.

**Architecture:** Extend the existing compiler (`scripts/compile-map-room-graph.py`) to read the curated overlay as its concept source instead of re-harvesting spec prose. Concept ids become stable and label-derived so routes and future threads can reference them permanently. The compiler's existing cross-topic hub-merge finally fires — guarded by a deny-list, because its normaliser strips parentheses and would otherwise merge two unrelated "Drivers" nodes. A hand-authored remap table repoints the 32 node ids that routes and tours reference today.

**Tech Stack:** Python 3 (compiler), Node's built-in test runner (`node --test`, `tests/**/*.test.mjs`), Next.js static export, three.js renderer (untouched by this work).

---

## Context an engineer needs before starting

**What the Map Room is.** One page (`/map-room`) on `interactive-resources`, live at `resources.musictechstudio.co.uk/map-room`, `noindex` and unlinked. It draws the whole Component 4 spec as a 3D force-directed graph. Design docs: `Planning-and-Admin/EdTech-Pathway/2026-07-30-map-room-graph-design.md` (build) and `2026-08-05-map-room-synoptic-threads-design.md` (this work's parent).

**Why the swap.** The current graph was harvested from spec prose and scraped the assessment column with it. Live nodes include "Recall", "Abbreviation expansion", "Mark allocation", "Technical skills", and — under Modulation — "How it works", "What it does", "Result". These are not concepts. Measured 05 Aug: 325 nodes (23 topic + 302 concept), 360 edges (311 parent + 49 cross-topic), and **zero shared hubs** — every concept node has exactly one parent.

**The replacement already exists and is already blessed.** `/Users/mikelehnert/Obsidian/Professional/Planning-and-Admin/Overnight-Runs/2026-08-04/topic-subtopics-curated.json` — 23 topics, 267 subtopics, average 11.6 each, curated from each topic's Official Spec file. Mike ruled on 05 Aug that these, not harvested concepts, are the subtopics. The Topic Room in `grades-dashboard` (commit `a593178`) already consumes it.

Each subtopic has three fields, and the split is deliberate — it is what keeps the spec's wordiness off the node:

| Field | Example | Renders as |
|---|---|---|
| `label` | `"Gain structure"` | the node label — keep it short |
| `family` | `"Gain structure and how it affects noise and distortion"` | grouping metadata only, never a node label |
| `blurb` | `"Setting gain so peaks sit around −6 to −12 dBFS…"` | the index card on click |

**Out of scope for this plan.** Deleting the 49 vague topic↔topic edges, drawing pins as concept↔concept edges, and the three synoptic threads. Those are steps 2 and 3 of the parent design. Do not touch `app/map-room/*.js` (the renderer), `lib/map-room/tours/`, or anything under `app/` other than what a test requires.

---

## Task 0: Isolated worktree

**Why this is task zero.** The shared checkout at `interactive-resources/` is on branch `feat/map-room` and has **5 uncommitted files from another session's synth-explorer work** (`app/sitemap.js`, `app/what-is-a-level-music-technology/page.js`, `lib/access.js`, `lib/spec-topics.js`, `tests/spec-topics.test.mjs`). They have sat there since 30 July. None of them touch map-room — verified — but switching branches in that checkout would disturb them. Do not.

Also note: local `main` is stale (`5a921b1`, 30 Jul). `origin/main` is `8b720ef` (31 Jul) and contains the merged Map Room. **Branch from `origin/main`, never local `main`.**

**Step 1: Fetch and create the worktree**

```bash
cd "/Users/mikelehnert/Obsidian/Professional (AI)/interactive-resources"
git fetch origin
git worktree add ../ir-map-room-nodes -b feat/map-room-curated-nodes origin/main
cd ../ir-map-room-nodes
```

**Step 2: Verify you are isolated and on the right base**

```bash
git status --porcelain          # expect: empty
git log -1 --format='%h %s'     # expect: 8b720ef Merge pull request #3 ...
```

If `git status` is not empty, stop — you are in the wrong directory.

**Step 3: Install and confirm the baseline is green**

```bash
npm install
npm test
```

Expected: all existing suites pass. Record the count; you must not reduce it.

---

## Task 1: Guard test — referential integrity

This test passes today and must still pass at the end. It is the tripwire that catches a swap which orphans a route step.

**Files:**
- Create: `tests/map-room-graph.test.mjs`

**Step 1: Write the test**

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const graph = JSON.parse(readFileSync('lib/map-room/graph.json', 'utf8'));
const routes = JSON.parse(readFileSync('lib/map-room/routes/exam-routes.json', 'utf8'));
const tour = JSON.parse(readFileSync('lib/map-room/tours/whole-course.json', 'utf8'));

const ids = new Set(graph.nodes.map((n) => n.id));

test('no edge points at a node that does not exist', () => {
    for (const e of graph.edges) {
        assert.ok(ids.has(e.from), `edge from missing node: ${e.from}`);
        assert.ok(ids.has(e.to), `edge to missing node: ${e.to}`);
    }
});

test('every exam-route focus id exists in the graph', () => {
    for (const r of routes.routes) {
        for (const s of r.steps) {
            for (const id of s.focus) {
                assert.ok(ids.has(id), `route ${r.id} focuses missing node: ${id}`);
            }
        }
    }
});

test('every tour focus id exists in the graph', () => {
    for (const b of tour.beats) {
        for (const id of b.focus) {
            assert.ok(ids.has(id), `tour beat focuses missing node: ${id}`);
        }
    }
});

test('every concept node has at least one parent edge', () => {
    const hasParent = new Set(graph.edges.filter((e) => e.kind === 'parent').map((e) => e.from));
    for (const n of graph.nodes) {
        if (n.kind !== 'concept') continue;
        assert.ok(hasParent.has(n.id), `orphan concept node: ${n.id} (${n.label})`);
    }
});
```

**Step 2: Run it — it must PASS before you change anything**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/map-room-graph.test.mjs
```

Expected: 4 pass. If any fail, the graph was already broken — stop and report, do not proceed.

**Step 3: Commit**

```bash
git add tests/map-room-graph.test.mjs
git commit -m "test: guard Map Room graph referential integrity"
```

---

## Task 2: Red tests — what the swap must achieve

These fail now and pass when the swap lands. They are the definition of done.

**Files:**
- Modify: `tests/map-room-graph.test.mjs` (append)

**Step 1: Append the failing tests**

```javascript
// --- the curated swap (Task 2 onward) ---

const FURNITURE = [
    'recall', 'abbreviation expansion', 'evaluation/justification',
    'hardware identification from image', 'specification comparison',
    'mark allocation', 'technical skills', 'industry standards',
    'past paper scenarios', 'multiple lesson references',
    'how it works', 'what it does', 'result', 'typical use', 'purpose',
    'why it matters', 'settings', 'tool', 'detection',
];

test('no assessment furniture or prose headings survive as nodes', () => {
    const bad = graph.nodes
        .filter((n) => FURNITURE.includes(n.label.trim().toLowerCase()))
        .map((n) => n.label);
    assert.deepEqual(bad, [], `scraped furniture still present: ${bad.join(', ')}`);
});

test('concept nodes carry a blurb for the index card', () => {
    const missing = graph.nodes.filter((n) => n.kind === 'concept' && !n.blurb?.trim());
    assert.equal(missing.length, 0, `${missing.length} concept nodes have no blurb`);
});

test('genuine shared ideas are ONE node with parent edges to each home', () => {
    const parentsOf = (id) =>
        graph.edges.filter((e) => e.kind === 'parent' && e.from === id).map((e) => e.to);
    for (const label of ['Haas effect', 'Comb filtering', 'Early reflections',
                         'Time-stretching', 'Warp markers', 'Headroom',
                         'Low-pass filter', 'File size calculations']) {
        const hits = graph.nodes.filter((n) => n.label === label);
        assert.equal(hits.length, 1, `"${label}" should be one hub node, found ${hits.length}`);
        assert.ok(parentsOf(hits[0].id).length >= 2,
            `"${label}" should belong to 2+ topics`);
    }
});

test('false friends stay SEPARATE nodes — same word, different concept', () => {
    // The compiler's norm() strips parentheses, so these would auto-merge.
    const drivers = graph.nodes.filter((n) => n.label.toLowerCase().startsWith('drivers'));
    assert.equal(drivers.length, 2, 'ASIO drivers and speaker drivers must not merge');

    const phantom = graph.nodes.filter((n) => n.label.toLowerCase().startsWith('phantom'));
    assert.equal(phantom.length, 2, 'phantom power and phantom centre must not merge');

    const quant = graph.nodes.filter((n) => /quantis/i.test(n.label));
    assert.ok(quant.length >= 3, 'MIDI quantise and digital quantisation must not merge');
});

test('every topic keeps its curated children', () => {
    const curated = JSON.parse(readFileSync(
        '/Users/mikelehnert/Obsidian/Professional/Planning-and-Admin/Overnight-Runs/2026-08-04/topic-subtopics-curated.json',
        'utf8'));
    const labels = new Set(graph.nodes.map((n) => n.label));
    for (const [topicId, entry] of Object.entries(curated)) {
        for (const s of entry.subtopics) {
            assert.ok(labels.has(s.label), `${topicId}: missing curated subtopic "${s.label}"`);
        }
    }
});
```

**Step 2: Run and confirm they FAIL**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/map-room-graph.test.mjs
```

Expected: the 4 Task-1 tests pass; the 5 new tests fail. Specifically you should see furniture like `Recall` listed, `"Haas effect" should be one hub node, found 1` (it exists once but with only one parent), and missing curated subtopics.

**Step 3: Commit the red tests**

```bash
git add tests/map-room-graph.test.mjs
git commit -m "test: define the curated-node swap (red)"
```

---

## Task 3: The remap table — REVIEW GATE

**Stop and get Mike's eye on this before writing code.** 32 concept ids are hard-referenced by `exam-routes.json` (30) and `whole-course.json` (2). Every one disappears in the swap. Each exam-route step also carries a Principal Examiner quotation, so repointing a step at the wrong concept corrupts teaching content, silently.

Automatic fuzzy matching is **not safe** — measured, it maps `Delay time` → `Decay time (RT60)` (different topic entirely) and collapses `Gentle compression`, `Heavy compression` and `Vocal compression` all onto `Glue compression`.

**Files:**
- Create: `lib/map-room/id-remap.json`

**Step 1: Write the table**

Clean mappings — a curated node clearly means the same thing:

```json
{
  "_note": "Old harvested id -> new curated id, for exam-routes and tours. Reviewed by Mike 2026-08-__. A target of a t- id means the step focuses the topic because no curated concept honestly matches.",
  "c-adsr": "c-adsr-envelope",
  "c-basic-waveforms": "c-waveforms",
  "c-square-wave-oscillators": "c-waveforms",
  "c-harmonic-content": "c-harmonic-content",
  "c-low-pass-filters": "c-low-pass-filter",
  "c-modulation-sources": "c-lfo-modulation",
  "c-cut-off-frequency": "c-gain-cut-off-frequency",
  "c-gain": "c-gain-cut-off-frequency",
  "c-high-pass-filter": "c-high-pass-filter",
  "c-high-shelf": "c-low-high-shelf-filters",
  "c-parametric-eq": "c-parametric-graphic-eq",
  "c-delay-time": "c-delay-time-feedback",
  "c-feedback": "c-delay-time-feedback",
  "c-tempo-sync": "c-tempo-synced-delay",
  "c-send-return-auxiliary": "c-pre-fader-post-fader-sends",
  "c-lfo-low-frequency-oscillator": "c-lfo-rate-depth-waveform",
  "c-drive-gain": "c-drive-tone",
  "c-overdrive": "c-overdrive",
  "c-limiting": "c-limiting",
  "c-threshold": "c-threshold-ratio",
  "c-vocal-compression": "c-compression",
  "c-hard-left-hard-right": "c-panning-conventions",
  "c-frequency-management-to-avoid-masking": "c-frequency-masking"
}
```

Judgement calls — **these are the ones Mike must confirm.** Each has no clean curated equivalent; the proposal is the nearest honest target, falling back to the topic node rather than inventing a link:

| Old node | Proposed target | Why it is a judgement call |
|---|---|---|
| `c-adding-sustain` (1.9) | `c-attack-release` | Adding sustain is a slow-attack effect, but the curated set has no node for the *outcome* |
| `c-gentle-compression` (1.9) | `c-threshold-ratio` | A settings descriptor, not a concept — could equally be the topic node |
| `c-heavy-compression` (1.9) | `c-threshold-ratio` | Same; note the 2023 route leans on this one heavily |
| `c-noise-reduction` (1.9) | `c-gating` | Gating is the dynamics tool for it; EQ's "Noise & hum reduction" is the wrong topic |
| `c-insert` (1.12r) | `t-reverb` | Insert-vs-send is a contrast the curated set expresses only from the send side |
| `c-frequencies` (1.11) | `t-eq` | Too vague to map honestly |
| `c-stereo-image` (1.10) | `t-stereo` | No curated equivalent |
| `c-stereo-delay-chorus` (1.10) | `t-stereo` | No curated equivalent |

**Step 2: Get sign-off**

Present the eight judgement calls to Mike. Do not proceed on assumption — a wrong target here puts an examiner's words next to the wrong concept.

**Step 3: Commit once confirmed**

```bash
git add lib/map-room/id-remap.json
git commit -m "data: remap table for route/tour ids across the curated swap"
```

---

## Task 4: Teach the compiler to use the curated overlay

**Files:**
- Modify: `scripts/compile-map-room-graph.py`

Three changes. Keep them surgical — the topic list, the wikilink cross-link pass, and the edge emitters all stay as they are.

**Step 0: Add the alias table (Mike approved 05 Aug)**

Measured: the swap would trade 6 hubs for 7 — net +1 — and four of the six lost
are good teaching links the curated set simply names differently. These aliases
preserve them. Post-swap hubs: 13.

```python
# Curated labels that mean the same thing as a twin in another topic, but are
# worded differently there. Without these, the swap silently destroys four
# working cross-topic links. Value is the canonical norm() key to merge onto.
ALIAS = {
    norm("Brickwall limiting"): norm("Limiting"),          # Mastering -> Dynamics
    norm("Delay time & feedback"): norm("Feedback"),       # Delay <-> Modulation
}
# Topics whose curated list omits a concept that genuinely belongs to them too.
# (label, owning topic id) pairs appended as extra parent edges, no new node.
EXTRA_HOMES = [
    ("Phantom power", "2.3"),   # Signals: phantom travels down the balanced line
    ("Pre-delay", "2.1"),       # Acoustics: pre-delay IS the direct-to-first-reflection gap
]
```

Apply `ALIAS` inside the hub-merge (map the normalised key through `ALIAS`
before the `by_norm` lookup), and emit `EXTRA_HOMES` as additional parent edges
after the main pass. Neither creates a node; both only add a second home.

**Step 1: Add the deny-list, next to `STOP` (around line 130)**

```python
# Labels that normalise to the same key but are DIFFERENT concepts. norm()
# strips parenthetical content, so "Drivers (ASIO/Core Audio)" and "Drivers
# (woofer & tweeter)" both become "driver" and would merge into one hub —
# a link that would actively mislead. Keys here are never merged; each
# owning topic keeps its own node.
NEVER_MERGE = {"driver", "phantom", "quantisation", "quantise"}
```

**Step 2: Change the concept source to the curated overlay**

Replace the per-topic harvest block (the `pick(sections, CAP_PER_TOPIC)` loop, around lines 270–290) so concepts come from the curated file, keeping the existing hub-merge that follows it:

```python
CURATED = Path("/Users/mikelehnert/Obsidian/Professional/Planning-and-Admin/"
               "Overnight-Runs/2026-08-04/topic-subtopics-curated.json")
curated = json.loads(CURATED.read_text())

# topic id ("1.11") -> curated key ("t-eq") via the display label
CURATED_KEY = {tid: "t-" + slug(label) for _, tid, label in TOPICS}
```

and inside the per-topic loop:

```python
entry = curated.get(CURATED_KEY[tid])
if not entry:
    raise SystemExit(f"no curated subtopics for {tid} — refusing to compile")
concepts = [(s["label"], s.get("blurb", ""), s.get("family", ""))
            for s in entry["subtopics"]]
```

**Step 3: Make ids stable and honour the deny-list**

Concept ids must be derived from the label, not from position — routes and the coming threads reference them permanently. Where a label is on the deny-list, scope the id to its topic so the two stay separate nodes:

```python
n = norm(term)
if n in NEVER_MERGE:
    node_id = f"c-{slug(TOPIC_LABEL[tid])}-{slug(term)}"   # scoped: never merges
elif n in by_norm:
    by_norm[n]["_owners"].append(tid)                       # genuine shared hub
    continue
else:
    node_id = f"c-{slug(term)}"
```

Carry `family` onto the node dict alongside `blurb`. Do not render it as a label anywhere.

**Step 4: Apply the remap to routes and tours**

Add a small pass at the end of the compiler, so the data files are rewritten in lockstep with the graph and can never drift:

```python
REMAP = json.loads(Path("lib/map-room/id-remap.json").read_text())
for path in ["lib/map-room/routes/exam-routes.json",
             "lib/map-room/tours/whole-course.json"]:
    p = Path(path)
    txt = p.read_text()
    for old, new in REMAP.items():
        if old.startswith("_"):
            continue
        txt = re.sub(rf'"{re.escape(old)}"', f'"{new}"', txt)
    p.write_text(txt)
```

**Step 5: Compile to a scratch file first and diff — do NOT overwrite yet**

The graph contains hand-authored work (1.12 Delay and 2.3 Signals were written by hand; 1.2 and 1.5 were supplemented). Confirm you are not destroying it:

```bash
python3 scripts/compile-map-room-graph.py /tmp/graph-new.json
python3 - <<'EOF'
import json
old = json.load(open('lib/map-room/graph.json'))
new = json.load(open('/tmp/graph-new.json'))
for tag, g in (('OLD', old), ('NEW', new)):
    kinds = {}
    for n in g['nodes']:
        kinds[n['kind']] = kinds.get(n['kind'], 0) + 1
    ek = {}
    for e in g['edges']:
        ek[e['kind']] = ek.get(e['kind'], 0) + 1
    print(tag, len(g['nodes']), 'nodes', kinds, '|', len(g['edges']), 'edges', ek)
EOF
```

Expected NEW: 23 topic nodes (unchanged), ~258 concept nodes (267 curated minus 9 merged hubs), parent edges ≈ 267, and **the 49 cross-topic edges unchanged** — those belong to step 2, not this one. If topic count is not 23, or cross-topic edges changed, stop and diagnose.

**Step 6: Promote and run the tests**

```bash
cp /tmp/graph-new.json lib/map-room/graph.json
npm test
```

Expected: all 9 tests in `map-room-graph.test.mjs` pass, plus every pre-existing suite still green at the count you recorded in Task 0.

**Step 7: Commit**

```bash
git add scripts/compile-map-room-graph.py lib/map-room/graph.json \
        lib/map-room/routes/exam-routes.json lib/map-room/tours/whole-course.json
git commit -m "Map Room: real subtopics on the nodes, not scraped spec prose"
```

Note the explicit paths. **Never `git add -A` in this repo** — concurrent sessions work here.

---

## Task 5: Verify it in a browser, not in your head

Static-export repo: `next start` fails and `serve -s` lies about routing. Use the honest server.

**Step 1: Build and serve**

```bash
npm run build
cd out && python3 -m http.server 4980
```

**Step 2: Check the room with DOM evidence, not screenshots**

Open `http://localhost:4980/map-room/`. The scene exposes `window.__mapRoomScene` for exactly this. In the console:

```javascript
const s = window.__mapRoomScene;
console.log('nodes drawn:', s.nodes.length);
console.log('furniture present:',
  s.nodes.filter(n => ['Recall','Mark allocation','What it does'].includes(n.label)).length);
console.log('Haas parents:', s.nodes.find(n => n.label === 'Haas effect'));
```

Expected: ~281 nodes drawn, zero furniture, Haas resolving to a single node.

**Step 3: Walk the 2023 exam route end to end**

Open the drawer, pick **The vocal chain (2023)**, and arrow through all steps. Every step must light nodes — a step that lights nothing means a remap target was wrong. Check each caption still describes what is lit.

Dismiss the site cookie banner first; it overlays the stage bottom-right.

**Step 4: Run the house build gates**

Use the `verify-house-build` skill before claiming this is done. Three gates, and the room must hold 1280×700 with no scroll.

---

## Task 6: Ship

**Step 1: Push and open a PR**

```bash
git push -u origin feat/map-room-curated-nodes
gh pr create --title "Map Room: curated subtopics replace the harvested concepts" \
  --body "Step 1 of the synoptic-threads design. 302 harvested concept nodes out, 267 curated subtopics in; ids now stable and label-derived; 9 genuine shared hubs light up; deny-list keeps ASIO drivers apart from speaker drivers. Exam routes and the tour repointed via lib/map-room/id-remap.json. Cross-topic edges untouched — that is step 2."
```

Merge via the GitHub PR, not locally — the shared checkout must never switch branches.

**Step 2: Verify on the deployed URL, not the preview**

After merge, check `https://resources.musictechstudio.co.uk/map-room`: still `noindex,nofollow`, still absent from `sitemap.xml`, nodes are the curated set.

**Step 3: Clean up the worktree**

```bash
cd "/Users/mikelehnert/Obsidian/Professional (AI)/interactive-resources"
git worktree remove ../ir-map-room-nodes
```

---

## Definition of done

- [ ] 9 tests green in `tests/map-room-graph.test.mjs`; every pre-existing suite still green
- [ ] Zero scraped furniture nodes remain
- [ ] 8 genuine shared ideas are single hub nodes with 2+ parents
- [ ] ASIO drivers and speaker drivers are separate nodes
- [ ] All four exam routes walk end to end with every step lighting nodes
- [ ] Verified on the deployed URL, still noindex and unlinked
- [ ] The shared checkout is still on `feat/map-room` with its 5 uncommitted files untouched

## Known follow-ups (do not do them here)

- `grades-dashboard/lib/member/map-room-mini/graph.json` still carries the same 325-node harvest. The member widget will keep showing "Mark allocation" until it gets the same swap.
- The Topic Room generates ids positionally (`s-${topicId}-${i}`). Fine there, since nothing references them externally — but if threads ever surface on topic pages, it will need the stable scheme this plan introduces.
- Steps 2 and 3 of the parent design: delete the 49 vague edges, draw pins as concept↔concept, then the three threads.
