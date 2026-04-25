# EQ Spine Scroll Layout — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the EQ learn flow's grid layout with a scroll-tracked vertical spine that lights up nodes as students progress and triggers a ripple effect on completion.

**Architecture:** Single new component (`LearnSpineLayout`) renders the spine, alternating content sections, and ripple zone. Gated behind `topic.id === 'eq'` in the existing `LearnTopicPage`. All existing child components (ExpandableText, SectionAssessment, diagrams) are reused unchanged.

**Tech Stack:** React 19, Next.js App Router, inline styles (codebase convention), CSS @keyframes for animations, IntersectionObserver for scroll activation.

---

## Reference

**Demo file:** `demos/option-a-spine-layout.html` — the approved static HTML prototype. Match its visual behaviour.

**Key existing files:**
- `components/learn/LearnTopicPage.js` — current page wrapper, renders header + maps `topic.rows` through `LearnTopicRow`
- `components/learn/LearnTopicRow.js` — current row component with IntersectionObserver, diagram lazy-loading, assessment toggle
- `components/learn/ExpandableText.js` — underlined expandable terms (reuse as-is)
- `components/learn/SectionAssessment.js` — quiz with save-to-Supabase (reuse as-is)
- `components/learn/diagrams/index.js` — diagram registry mapping animation IDs to components
- `lib/learn/topics/eq.js` — EQ topic data (7 rows with id, heading, description, animation, assessment)
- `lib/learn/section-persistence.js` — `getTopicResponses` / `saveSectionResponse`
- `lib/theme.js` — design tokens (`theme.light`, `typography`, `spacing`, `borderRadius`)

**Topic colour:** EQ uses `#f97316` (orange). The spine gradient in the demo used `#6366F1` (indigo) for contrast — use the topic's own colour (`topicColor`) for the gradient and node fills so it works generically if rolled out later.

---

## Task 1: Create LearnSpineLayout component (structure + static rendering)

**Files:**
- Create: `components/learn/LearnSpineLayout.js`

**Step 1: Create the component file with spine structure**

Create `components/learn/LearnSpineLayout.js`. This component receives the same props as the current row-mapping section of `LearnTopicPage`:

```jsx
// Props: { topic, token, answeredSections }
// topic.rows is the array of section data
// topic.color is the topic accent colour
```

The component renders:
1. A container `div` with `position: relative`, `maxWidth: 960px`, `margin: 0 auto`, `padding: 3rem 1.5rem 0`
2. Inside it:
   - `.spine-track` — absolute-positioned 2px vertical line, `left: 50%`, full height, colour `#e5e7eb`
   - `.spine-fill` — absolute-positioned 2px line on top, `height: 0` (controlled by scroll JS later), gradient from `topicColor` to `#1a1a2e`
   - For each `topic.rows[i]`: a section wrapper using `display: flex`, with `flexDirection` alternating based on `i % 2`
   - Each section wrapper contains:
     - **Text side** (`flex: 1, maxWidth: calc(50% - 48px)`): section number badge, heading `<h3>`, `<ExpandableText>` component, assessment button + `<SectionAssessment>` (copy the toggle logic from `LearnTopicRow`)
     - **Node** (absolute positioned at `left: 50%`): 40px circle with the section number, initially grey border/background
     - **Diagram side** (`flex: 1, maxWidth: calc(50% - 48px)`): diagram container with `diagrams[row.animation]` component
3. After all sections: a ripple zone container with a centre dot and 7 concentric ring `div`s (sizes: 70, 130, 200, 280, 370, 470, 580px)
4. A "Topic complete" message div below the ripple zone

Reference the demo HTML (`demos/option-a-spine-layout.html`) for exact spacing, sizes, and style values. Use inline styles. Inject a `<style>` tag for `@keyframes` (ripple animation, blink cursor if needed) — same pattern as `ExpandableHint` in `LearnTopicPage.js`.

**Important details from the existing code to preserve:**
- Assessment toggle: copy the `showAssessment`/`animating` state pattern from `LearnTopicRow.js:33-40` — button shows `?`, clicking crossfades description out and quiz in
- Assessment button styling: copy from `LearnTopicRow.js:64-87` — 24px circle, border colour based on `alreadyAnswered` state
- Diagram container: copy from `LearnTopicRow.js:136-146` — `#fafafa` background, `0.75rem` border-radius, `1px solid #E5E7EB`, `aspectRatio: '480 / 280'`
- Use `topic.color` everywhere the demo uses `#6366F1`

Each section needs its own `showAssessment` and `animating` state. Use an object or array keyed by section index:
```jsx
const [assessmentState, setAssessmentState] = useState({});
// assessmentState[i] = { show: bool, animating: bool }
```

**Step 2: Verify it renders**

Run: `cd interactive-resources && npm run dev`
Navigate to the EQ learn page. It won't show yet (not wired up), but confirm no import errors by checking the terminal output.

**Step 3: Commit**

```
feat: add LearnSpineLayout component skeleton
```

---

## Task 2: Wire up LearnTopicPage to use spine layout for EQ

**Files:**
- Modify: `components/learn/LearnTopicPage.js`

**Step 1: Import and conditionally render**

In `LearnTopicPage.js`, add:

```jsx
import LearnSpineLayout from './LearnSpineLayout';
```

In the JSX, replace the current `<main>` block (lines 96-112) with a conditional:

```jsx
{topic.id === 'eq' ? (
    <LearnSpineLayout
        topic={topic}
        token={token}
        answeredSections={answeredSections}
    />
) : (
    <main style={{ maxWidth: '960px', margin: '0 auto', padding: '1rem 1.5rem 4rem' }}>
        {topic.rows.map((row, i) => (
            <LearnTopicRow
                key={row.id}
                row={row}
                index={i}
                topicColor={topic.color}
                topicId={topic.id}
                studentToken={token}
                answeredSections={answeredSections}
            />
        ))}
    </main>
)}
```

**Step 2: Verify EQ uses spine, Compression uses rows**

Run dev server. Navigate to EQ learn page — should render the spine layout. Navigate to Compression learn page — should render the existing row layout unchanged.

**Step 3: Commit**

```
feat: gate EQ learn flow to use spine layout
```

---

## Task 3: Add scroll-tracked spine fill and node activation

**Files:**
- Modify: `components/learn/LearnSpineLayout.js`

**Step 1: Add IntersectionObserver for section visibility**

Each section needs a `ref`. Use a `useRef` array:

```jsx
const sectionRefs = useRef([]);
const [activeIndexes, setActiveIndexes] = useState(new Set());
```

Set up an `IntersectionObserver` in a `useEffect` that watches all section elements. When a section enters the viewport (threshold 0.3, rootMargin top offset to trigger at ~55% viewport height), add its index to `activeIndexes`. This controls:
- Section content opacity (0.25 → 1) and translateY (24px → 0)
- Node styling (grey → filled with topicColor, scale bounce)

**Step 2: Add scroll listener for spine fill**

```jsx
const containerRef = useRef(null);
const [fillHeight, setFillHeight] = useState(0);
```

In a `useEffect`, add a passive scroll listener. On each frame:
- Get container bounding rect
- Calculate `progress = (viewportTrigger - containerRect.top) / containerRect.height`
- Clamp 0–1, multiply by container height
- Set `fillHeight`

Apply to the spine-fill div: `style={{ height: fillHeight + 'px' }}`

**Step 3: Verify scroll behaviour**

Run dev server. Scroll through EQ page:
- Spine line should fill downward as you scroll
- Nodes should light up with topic colour when their section enters the viewport
- Content should fade in and slide up
- Scrolling back up should deactivate nodes (remove from `activeIndexes`)

**Step 4: Commit**

```
feat: add scroll-tracked spine fill and node activation
```

---

## Task 4: Add ripple termination effect

**Files:**
- Modify: `components/learn/LearnSpineLayout.js`

**Step 1: Add ripple state**

```jsx
const [rippleFired, setRippleFired] = useState(false);
```

In the scroll/intersection update logic: when `activeIndexes.size === topic.rows.length`, fire the ripple. When the last section scrolls back out, reset it.

**Step 2: Apply CSS classes for ripple animation**

The ripple zone already has the ring divs from Task 1. Add a `className` or conditional inline style:
- Dot: background changes from `#e5e7eb` to `topicColor`, add `boxShadow`
- Rings: apply the `ripple` animation via a `<style>` tag keyframe. Use `animationDelay` on each ring (0.12s increments)
- Complete message: opacity 0 → 1 with `transition-delay: 1s`

The `@keyframes` block (injected via `<style>` tag):
```css
@keyframes spine-ripple {
    0% { transform: translate(-50%, -50%) scale(0); border-color: rgba(TOPIC_RGB, 0.3); }
    100% { transform: translate(-50%, -50%) scale(1); border-color: rgba(TOPIC_RGB, 0); }
}
```

Since `topicColor` is a hex value, convert to RGB for the rgba() in the keyframe. Use a small helper or hardcode for the EQ trial.

**Step 3: Verify ripple**

Run dev server. Scroll all the way down past section 7:
- Dot should fill with colour
- Rings should emanate outward with staggered timing
- "Topic complete" message should fade in
- Scroll back up past section 7 — ripple should reset
- Scroll back down — ripple should fire again

**Step 4: Commit**

```
feat: add ripple completion effect to spine layout
```

---

## Task 5: Add responsive mobile layout

**Files:**
- Modify: `components/learn/LearnSpineLayout.js`

**Step 1: Add media query handling**

Use a `useEffect` + `matchMedia` hook to detect `max-width: 768px`:

```jsx
const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobile(mq.matches);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
}, []);
```

When `isMobile`:
- All sections use `flexDirection: 'column'`, add `paddingLeft: 48px`
- Text content: `maxWidth: '100%'`, no right/left padding
- Spacer/diagram: stacks below text, full width
- Node: `left: 0` instead of `50%`
- Spine track/fill: `left: 24px` instead of `50%`
- Ripple zone: align left

**Step 2: Verify on mobile**

Use browser dev tools to toggle responsive view at 375px width. Confirm:
- Single column layout
- Spine on the left edge
- Content reads naturally top-to-bottom
- Diagrams stack below their text sections
- Ripple still fires at the bottom

**Step 3: Commit**

```
feat: add responsive mobile layout for spine
```

---

## Task 6: Add lazy diagram loading

**Files:**
- Modify: `components/learn/LearnSpineLayout.js`

**Step 1: Gate diagram rendering on visibility**

The `activeIndexes` Set already tracks which sections are in view. Use it to conditionally render diagrams (same pattern as `LearnTopicRow.js:21-31`):

```jsx
{DiagramComponent && activeIndexes.has(i) && <DiagramComponent />}
```

This means diagrams only mount when their section scrolls into view, matching the existing lazy-loading behaviour.

**Step 2: Verify lazy loading**

Open browser dev tools Network tab. Load the EQ page. Scroll slowly — diagram canvases should only start rendering when their section enters the viewport, not all at once on page load.

**Step 3: Commit**

```
feat: lazy-load diagrams in spine layout on scroll
```

---

## Task 7: Final polish and build verification

**Files:**
- No new files

**Step 1: Run production build**

```bash
cd interactive-resources && npm run build
```

Fix any build errors (unused imports, missing dependencies).

**Step 2: Visual check**

Run `npm run dev` and do a full scroll-through of:
- EQ learn page — spine layout, all 7 sections, ripple fires, assessments work, expandable terms work
- Compression learn page — unchanged row layout, everything still works

**Step 3: Commit any fixes**

```
fix: polish and build verification for spine layout
```

---

## Task 8: Clean up demo files

**Files:**
- Delete: `demos/ripple-scroll-spine.html` (initial rough demo)
- Keep: `demos/option-a-spine-layout.html` (approved design reference)
- Delete: `demos/option-b-side-rail.html` (rejected option)

**Step 1: Remove files**

```bash
rm demos/ripple-scroll-spine.html demos/option-b-side-rail.html
```

**Step 2: Commit**

```
chore: remove unused demo files
```
