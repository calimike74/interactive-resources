# The Map Room — usage

**What it is.** `/map-room` draws the whole of Component 4 as one force-directed
graph: 23 topic nodes, ~300 concept nodes compiled from the vault's
`Curriculum-Topics/` Official Spec files, and the connections between them.
"Play the 90-second tour" walks the camera across the map, one caption per beat
— graphcon-deck's slides-as-camera-moves idea. The page is `noindex,nofollow`
and linked from no navigation.

**How to use it.**
- Drag to pan, scroll/pinch to zoom. Labels for concepts appear as you zoom in.
- Hover lights up a node's neighbourhood; click a concept to pin its card.
- Clicking a moss topic node with a live `/topic/` page navigates there.
- In the tour: ← → step beats, ▶ auto-advances (7.5 s per beat), Esc exits to
  free exploration.

**What can be changed in plain language.**
- *The map's content* — edit `lib/map-room/graph.json`, or re-run
  `python3 scripts/compile-map-room-graph.py lib/map-room/graph.json`
  (Obsidian vault must be on disk; the script reads
  `Professional/Curriculum-Topics/`). Hand-supplemented topics and curated
  cross-links live in dictionaries at the top of that script.
- *The tour* — edit `lib/map-room/tours/whole-course.json`. A beat is a list of
  node ids to focus plus a caption; the camera frames the focus set
  automatically, so no coordinates are ever needed. New tours are new JSON
  files wired up in `page.js`.
- *Colours/fonts* — constants at the top of `MapRoomClient.js` (canvas cannot
  read CSS variables; values are hardcoded from BRAND.md).

**Limitations.**
- C4 only for now; the `component` field in graph.json is ready for C3 nodes.
- Three topics' concepts are hand-authored (1.12 Delay, 2.3 Signals) or
  supplemented (1.2, 1.5) because their vault spec files aren't in the
  bold-bullet format the parser reads.
- Concept-level nodes don't deep-link into pages yet; only topic nodes carry
  URLs (the 11 topics with live `/topic/` hubs).
- Reduced-motion users get a settled, static map with instant camera cuts and
  no auto-play.
