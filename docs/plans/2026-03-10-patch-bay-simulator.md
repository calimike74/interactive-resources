# Patch Bay Simulator Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an interactive patch bay simulator that teaches students how the studio's XLR patch bays (PB1-PB7) route signal through PB8 into the UA Volt 876 audio interfaces.

**Architecture:** Single React component with SVG overlay for cable drawing. Three-column layout: tabbed room bays (left), PB8/PB9 interface inputs (centre), Volt 876 photo with hotspots (right). State tracks connections as an array of `{from, to}` pairs. Cable rendering uses SVG bezier curves positioned absolutely over the layout.

**Tech Stack:** Next.js, React 19, SVG for cables, inline styles with lib/theme.js tokens, real photos as CSS background images.

---

### Task 1: Resource Metadata + Registration

**Files:**
- Create: `lib/resources/patch-bay-simulator.js`
- Modify: `lib/resources/index.js` (add import + registry entry)
- Modify: `app/[resourceId]/ResourcePageClient.js` (add import + component map entry)

**Step 1: Create metadata file**

```javascript
// lib/resources/patch-bay-simulator.js
const patchBaySimulator = {
    id: 'patch-bay-simulator',
    title: 'Patch Bay Simulator',
    description: 'Explore how our studio patch bays route microphone signals from different rooms through PB8 into the UA Volt 876 audio interfaces. Click connectors and drag cables to build signal paths.',
    topic: '2.5 Recording',
    relatedTopics: ['2.3 Signals'],
    type: 'interactive',
    icon: '🔌',
    estimatedTime: '10-15 minutes',
    learningObjectives: [
        'Understand how XLR patch bays route audio signals between rooms and the interface',
        'Identify which patch bay connects to which room in our studio',
        'Trace the full signal path from a room mic line through PB8 to the Volt 876',
        'Explain why inputs 1-2 on the Volt are dedicated studio interior connections',
    ],
    prepFor: [],
    component: 'PatchBaySimulator',
    keywords: ['patch bay', 'XLR', 'signal routing', 'Volt 876', 'audio interface', 'studio', 'recording'],
    difficulty: 'foundation',
};

export default patchBaySimulator;
```

**Step 2: Register in index.js**

Add to imports at bottom of import block:
```javascript
import patchBaySimulator from './patch-bay-simulator';
```

Add to resources object:
```javascript
'patch-bay-simulator': patchBaySimulator,
```

**Step 3: Register in ResourcePageClient.js**

Add to imports:
```javascript
import PatchBaySimulator from '@/components/resources/PatchBaySimulator';
```

Add to resourceComponents map:
```javascript
'PatchBaySimulator': PatchBaySimulator,
```

**Step 4: Verify** - `npm run dev` should start without errors (component doesn't exist yet, but that's fine - it won't crash until you navigate to the route).

---

### Task 2: Patch Bay Data Model

**Files:**
- Create: `components/resources/PatchBaySimulator.jsx` (scaffold with data)

Create the component with the complete studio data model. This is the source of truth for all patch bay labels, connector counts, and routing rules.

```javascript
// Studio patch bay configuration
const ROOM_COLOURS = {
    'studio-1': '#3B82F6',    // Blue
    'studio-2': '#8B5CF6',    // Purple
    'recital': '#EC4899',     // Pink
    'lobby': '#F59E0B',       // Amber
    'console': '#6366F1',     // Indigo
    'tla-red7': '#EF4444',    // Red
};

const PATCH_BAYS = {
    'PB1': {
        label: 'Studio 1 Live Room Mic Lines',
        room: 'studio-1',
        connectors: 12, // Lines 1-12
        extraLabel: null,
    },
    'PB1-lobby': {
        label: 'Lobby Mic Lines',
        room: 'lobby',
        connectors: 2, // Lines 1-2
        parentBay: 'PB1', // shares physical bay with PB1
    },
    'PB2': {
        label: 'Studio 2 Mic Lines 1-12',
        room: 'studio-2',
        connectors: 12,
    },
    'PB3': {
        label: 'Studio 2 Mic Lines 13-24',
        room: 'studio-2',
        connectors: 12,
    },
    'PB4': {
        label: 'Recital Hall Mic Lines 1-12',
        room: 'recital',
        connectors: 12,
    },
    'PB5': {
        label: 'Recital Hall Mic Lines 13-24',
        room: 'recital',
        connectors: 9, // 13-21, plus TLA C-1 A, TLA C-1 B, RED 7
        extras: [
            { label: 'TLA C-1 A', room: 'tla-red7' },
            { label: 'TLA C-1 B', room: 'tla-red7' },
            { label: 'RED 7', room: 'tla-red7' },
        ],
    },
    'PB6': {
        label: 'Console Mic Inputs 1-16',
        room: 'console',
        connectors: 16,
    },
    'PB7': {
        label: 'Console Mic Inputs 17-32',
        room: 'console',
        connectors: 16,
    },
};

// Tab groupings (what appears in the tab bar)
const TABS = [
    { id: 'studio-1', label: 'Studio 1', bays: ['PB1', 'PB1-lobby'] },
    { id: 'studio-2', label: 'Studio 2', bays: ['PB2', 'PB3'] },
    { id: 'recital', label: 'Recital Hall', bays: ['PB4', 'PB5'] },
    { id: 'lobby', label: 'Lobby', bays: ['PB1-lobby'] },
    { id: 'console', label: 'Console', bays: ['PB6', 'PB7'] },
];

// PB8: 12 inputs that route to Volt 876
// Inputs 1-6 -> Volt Unit 1 Inputs 3-8
// Inputs 7-12 -> Volt Unit 2 Inputs 3-8
const PB8_INPUTS = 12;

// PB9: 24 desk outputs (can also route to PB8)
const PB9_OUTPUTS = 24;
```

The component scaffold should render a placeholder `<div>` with "Patch Bay Simulator" text and export default. Verify it renders at `localhost:3001/patch-bay-simulator`.

---

### Task 3: Three-Column Layout + Tab Navigation

**Files:**
- Modify: `components/resources/PatchBaySimulator.jsx`

Build the three-column layout with inline styles using theme tokens:

- **Left column** (480px): Tab bar at top, active tab shows that room's patch bay connectors
- **Centre column** (320px): PB8 (12 inputs) + PB9 (24 outputs)
- **Right column** (flex): Volt 876 photo with overlay
- **Signal path strip** (full width, 44px): Shows routing when cable hovered/selected

State:
```javascript
const [activeTab, setActiveTab] = useState('studio-1');
const [connections, setConnections] = useState([]); // [{from: 'PB1-3', to: 'PB8-5'}, ...]
const [dragging, setDragging] = useState(null); // {from: 'PB1-3', mouseX, mouseY} or null
const [hoveredCable, setHoveredCable] = useState(null); // index into connections
```

Verify: Three columns render with tabs, clicking tabs switches content.

---

### Task 4: XLR Connector Component + Connector Grid

**Files:**
- Modify: `components/resources/PatchBaySimulator.jsx`

Build an inline `XLRConnector` sub-component:
- Renders a circular connector (30px) with the 3-pin XLR pattern as inner circles
- Number label below
- Colour border matching room colour
- `onMouseDown` / `onTouchStart` handler to begin cable drag
- Highlight state when it's a valid drop target during drag
- "Connected" state with filled colour when cable is attached

Render grids of connectors for:
- Active room bay (from PATCH_BAYS data)
- PB8 (12 inputs, blue accent)
- PB9 (24 outputs, orange accent)

Use the patch bay photo as a background behind the connector grid (CSS `backgroundImage` on the container div).

Verify: Connectors render in correct quantities per bay. Clicking a room connector logs to console.

---

### Task 5: Cable Drag + Drop Interaction

**Files:**
- Modify: `components/resources/PatchBaySimulator.jsx`

Implement the core interaction:

1. **Mouse/touch down on room connector** -> sets `dragging` state with source ID and captures connector's screen position
2. **Mouse/touch move** -> updates `dragging.mouseX/mouseY` for live cable preview
3. **Mouse/touch up on PB8 connector** -> creates connection, adds to `connections` array
4. **Mouse/touch up elsewhere** -> cancels drag

Use `useRef` for the container element to calculate relative positions. Use `useCallback` with global `window` event listeners (same pattern as CompressorExplorer.jsx):

```javascript
useEffect(() => {
    const handleMove = (e) => { /* update drag position */ };
    const handleUp = (e) => { /* check if over PB8 connector, create/cancel */ };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);
    return () => { /* cleanup */ };
}, [dragging]);
```

Connector position tracking: Use `useRef` to store a Map of connector ID -> DOM element ref. On drag start/end, call `getBoundingClientRect()` to get positions for cable endpoints.

Verify: Can click a room connector, see a live cable follow the mouse, and drop on PB8 to create a connection.

---

### Task 6: SVG Cable Rendering

**Files:**
- Modify: `components/resources/PatchBaySimulator.jsx`

Render cables as SVG bezier curves in an absolutely-positioned SVG overlay that covers the entire component:

```javascript
// Cable component
function Cable({ fromPos, toPos, colour, isHovered, onHover, label }) {
    const midX = (fromPos.x + toPos.x) / 2;
    const droopY = Math.max(fromPos.y, toPos.y) + 30; // gravity droop
    const d = `M ${fromPos.x} ${fromPos.y} Q ${midX} ${droopY} ${toPos.x} ${toPos.y}`;

    return (
        <g onMouseEnter={() => onHover(true)} onMouseLeave={() => onHover(false)}>
            {/* Hit area (wider invisible stroke) */}
            <path d={d} stroke="transparent" strokeWidth={12} fill="none" />
            {/* Visible cable */}
            <path d={d} stroke={colour} strokeWidth={isHovered ? 4 : 3}
                  fill="none" strokeLinecap="round" opacity={isHovered ? 1 : 0.8} />
            {/* Endpoint dots */}
            <circle cx={fromPos.x} cy={fromPos.y} r={6} fill={colour} />
            <circle cx={toPos.x} cy={toPos.y} r={6} fill={colour} />
            {/* Hover label */}
            {isHovered && (
                <foreignObject x={midX - 100} y={droopY - 30} width={200} height={24}>
                    <div style={{background: colour, color: '#fff', borderRadius: 4,
                                 padding: '2px 8px', fontSize: 10, fontFamily: 'monospace',
                                 textAlign: 'center', whiteSpace: 'nowrap'}}>
                        {label}
                    </div>
                </foreignObject>
            )}
        </g>
    );
}
```

Also render the "live" dragging cable (from source connector to mouse position) using the same path style but dashed.

Use `ResizeObserver` or recalculate positions on window resize to keep cables aligned.

Verify: Cables render between connected points with colour coding and hover labels.

---

### Task 7: Signal Path Strip + Volt 876 Hotspots

**Files:**
- Modify: `components/resources/PatchBaySimulator.jsx`

**Signal path strip:** Render at the bottom of the component. When hovering a cable or connector, show the full signal path:
```
Studio 1 Line 3  >  PB8 Input 2  >  Volt Unit 1 Input 4  >  DAW Channel 4
```

Map PB8 inputs to Volt inputs:
- PB8 1-6 -> Volt Unit 1, Inputs 3-8
- PB8 7-12 -> Volt Unit 2, Inputs 3-8

**Volt 876 panel:** Use the `Volt_U876.png.webp` photo as background image. Overlay hotspot indicators on each input position:
- Inputs 1-2: Always green (studio interior, permanently connected)
- Inputs 3-8: Grey when empty, light up with room colour when a PB8 connection maps to them

The hotspot positions will need manual pixel coordinates mapped to the photo. Define these as constants:
```javascript
const VOLT_INPUT_POSITIONS = {
    1: { x: '8%', y: '35%' },   // Input 1 combo jack
    2: { x: '15%', y: '35%' },  // Input 2 combo jack
    3: { x: '33%', y: '55%' },  // Input 3
    // ... etc, tuned to match the photo
};
```

Verify: Signal path updates on hover. Volt inputs light up when connected.

---

### Task 8: Cable Management (Delete + Clear)

**Files:**
- Modify: `components/resources/PatchBaySimulator.jsx`

- **Right-click or long-press** a cable to delete it (remove from connections array)
- **"Clear All" button** in the header to reset all connections
- **Connection count** display: "3/12 inputs patched"
- Prevent duplicate connections (can't connect two sources to same PB8 input)

Verify: Can delete individual cables and clear all. Duplicate prevention works.

---

### Task 9: Visual Polish + Responsive

**Files:**
- Modify: `components/resources/PatchBaySimulator.jsx`

- Add subtle glow effect on connector hover (box-shadow)
- Animate cable creation (CSS transition on opacity)
- Add "empty state" hint text when no cables exist
- Responsive: On screens < 1024px, stack columns vertically (room bays + PB8 on top, Volt below)
- Ensure touch works on iPad (primary student device)

Verify: `npm run build` passes. Test on localhost at various viewport widths.

---

### Task 10: Final Build + Deploy Check

**Step 1:** Run `npm run build` in `/interactive-resources/`
**Step 2:** Fix any build errors
**Step 3:** Test at `localhost:3001/patch-bay-simulator`
**Step 4:** Verify the resource appears in the topic listing on the home page

---

## File Summary

| File | Action |
|------|--------|
| `lib/resources/patch-bay-simulator.js` | Create (metadata) |
| `lib/resources/index.js` | Modify (add import + registry) |
| `app/[resourceId]/ResourcePageClient.js` | Modify (add import + component map) |
| `components/resources/PatchBaySimulator.jsx` | Create (main component) |
| `public/images/Patch_Bay.png` | Exists (room bay photo) |
| `public/images/Volt_U876.png.webp` | Exists (interface photo) |
