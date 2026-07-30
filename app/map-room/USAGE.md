# The Map Room — USAGE

## What it is

The whole of Component 4 hung in one dark room as a three-dimensional
force-directed graph: 23 topic spheres, ~300 concept nodes, and every real
connection between them, drawn from the vault's own spec files. Colour carries
meaning — five curriculum families (capture, creating sound, shaping sound,
the mix, theory), with shared ideas as brass pins. One built-in guided tour
("The whole course in 90 seconds") plays as camera moves over the graph.

Route: `/map-room` — `noindex,nofollow`, linked from no navigation.

## How to use it

- **Drag empty space** to turn the room; **scroll/pinch** to zoom;
  right-drag/two-finger to pan.
- **Grab any node and pull** — the simulation is live, so its neighbourhood
  moves with it.
- **Hover** lights a node's neighbourhood. Nothing opens on hover.
- **Click** a node to raise its index card. Topics with a live page carry an
  "Open this topic →" link — that link is the only navigation on the page.
- **Play the 90-second tour**: arrow keys step beats, Escape exits. Any
  gesture on the map pauses autoplay.

## What can change in plain language

- **Colours**: `palette.js` — one ink per topic (`TOPIC_INKS`), family names
  and swatches (`FAMILIES`), room atmosphere (`ROOM`).
- **The graph**: recompile with `scripts/compile-map-room-graph.py` after
  editing spec files in the vault; output is `lib/map-room/graph.json`.
- **Tours**: JSON only — `lib/map-room/tours/*.json`. A beat is
  `{ focus: [nodeIds], withNeighbours, caption }`; the camera frames the
  focus set itself, so layout changes never break a tour.
- **Physics**: `sim3d.js` (spring lengths, repulsion, damping).
- **Look of the scene**: `scene.js` (lighting, gloss, fog, label sizes,
  glow, motes).

## Limitations

- Needs WebGL; a paper fallback card explains this if the context fails.
- Topic labels declutter automatically (bigger node wins); a hidden label
  reappears as you zoom or turn.
- `prefers-reduced-motion`: no auto-rotate, no drifting motes, instant
  camera cuts, tour advances manually only.
- C3 is a later data pass — the schema already carries a `component` field.
