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
- **Walk the spec**: press ← → with nothing else running and the room steps
  through the 23 topics in spec order, card raised at each stop.
- **Exam routes**: four real Question 6s (2019–2023) lit as accumulating
  paths across the room, one step per processor or idea, each step carrying
  a line from that year's Principal Examiner's report.
- **Signal chain**: the top-right pill re-hangs the whole room as the studio
  chain, microphone to monitor; the flight between the two layouts is the
  lesson. Concept space brings it home.
- **Quiz me**: one node is lit with its name withheld; Reveal shows the
  name, the blurb, and lights its neighbours. Nothing is stored.
- **Sound**: switch it on, then hover a shaping/creating/theory topic that
  carries a sound — EQ sweeps, compression pumps, delay repeats — with a
  caption naming exactly what is heard.

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
