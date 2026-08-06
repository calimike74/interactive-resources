#!/usr/bin/env python3
"""Map Room graph compiler.

Reads Curriculum-Topics/ Official Spec files (bold-bullet concept terms under
### headings) plus Cross-Curriculum Links wikilinks, and emits graph.json:
nodes {id,label,kind,component,parent,url?,blurb} /
edges {from,to,kind}. Shared concepts (same normalised label in 2+ topics)
merge into one hub node with parent edges to every owning topic.
"""
import json, re, sys, unicodedata
from pathlib import Path
from collections import OrderedDict, defaultdict

VAULT = Path("/Users/mikelehnert/Obsidian/Professional/Curriculum-Topics")
OUT = Path(sys.argv[1] if len(sys.argv) > 1 else "graph.json")
CAP_PER_TOPIC = 14

# folder name, topic id, display label
TOPICS = [
    ("1.1 Software and Hardware", "1.1", "Software and Hardware"),
    ("1.2 Microphones", "1.2", "Microphones"),
    ("1.3 Synthesis", "1.3", "Synthesis"),
    ("1.4 Sampling", "1.4", "Sampling"),
    ("1.5 Sequencing", "1.5", "Sequencing"),
    ("1.6 Audio Editing", "1.6", "Audio Editing"),
    ("1.7 Pitch and Rhythm Correction", "1.7", "Pitch and Rhythm Correction"),
    ("1.8 Automation", "1.8", "Automation"),
    ("1.9 Dynamic Processing", "1.9", "Dynamic Processing"),
    ("1.10 Stereo", "1.10", "Stereo"),
    ("1.11 EQ", "1.11", "EQ"),
    ("1.12 Delay", "1.12d", "Delay"),
    ("1.12 Reverb", "1.12r", "Reverb"),
    ("1.12 Modulation", "1.12m", "Modulation"),
    ("1.12 Distortion", "1.12x", "Distortion"),
    ("1.13 Balance and Blend", "1.13", "Balance and Blend"),
    ("1.14 Mastering", "1.14", "Mastering"),
    ("2.1 Acoustics", "2.1", "Acoustics"),
    ("2.2 Monitor Speakers", "2.2", "Monitor Speakers"),
    ("2.3 Signals", "2.3", "Signals"),
    ("2.4 Digital Analogue", "2.4", "Digital Analogue"),
    ("2.5 Numeracy", "2.5", "Numeracy"),
    ("2.6 Levels", "2.6", "Levels"),
]

ALT_SPEC = {"2.1": "2.1 Acoustics.md"}  # non-standard spec location, still parseable

# Hand-authored concepts for topics with no parseable spec file.
# Delay grounded in OneNote 1.12 pages (Haas/multitap/ping-pong ADV keywords,
# Cipriani & Giri ch.6); Signals grounded in the 2.3 spec content.
HAND_CONCEPTS = {
    "1.12d": [
        ("Delay time", "Gap between dry signal and repeat, in ms or note values"),
        ("Feedback", "Repeat fed back to the input — more feedback, more repeats"),
        ("Slapback", "Single short repeat, 60–120 ms — the 1950s rock-and-roll vocal"),
        ("Ping-pong delay", "Two crossed delay lines bounce repeats left and right"),
        ("Multitap delay", "Several parallel taps, each with its own time and level"),
        ("Haas effect", "Repeats within ~40 ms fuse with the source and read as one"),
        ("Tape delay", "Echo from a tape loop — darker each repeat, wow and flutter"),
        ("Tempo sync", "Delay time locked to note divisions of the project tempo"),
        ("Dotted-eighth delay", "Sync'd 3/16 repeat that weaves around the beat"),
        ("Wet/dry mix", "Balance of effected against unprocessed signal"),
        ("Delay calculations", "60000 ÷ BPM gives the crotchet in milliseconds"),
        ("Filtered feedback", "EQ inside the loop darkens each successive repeat"),
    ],
    "2.3": [
        ("Mic level", "Millivolts from a microphone — needs a preamp to be usable"),
        ("Line level", "Standard operating level of mixers and outboard gear"),
        ("Instrument level", "Guitar or bass pickup output — higher than mic, unbalanced"),
        ("Balanced cable", "Two signal conductors plus screen — noise cancels on arrival"),
        ("Unbalanced cable", "Single conductor plus screen — picks up interference over distance"),
        ("XLR", "Three-pin balanced connector for microphones"),
        ("Jack connections", "TS unbalanced or TRS balanced quarter-inch connectors"),
        ("Phantom power", "+48 V sent up the mic cable to power condenser capsules"),
        ("DI box", "Converts instrument level to balanced mic level for long runs"),
        ("Impedance", "Opposition to signal flow — mismatches lose level and tone"),
        ("Preamp gain", "First and most important level decision in the chain"),
        ("MIDI vs audio signal", "Control data versus the sound itself — one is instructions"),
    ],
}

# Supplements for spec files whose concepts sit in semicolon lists the
# parser can't safely split. Grounded in the Official Spec text of each file.
HAND_EXTRA = {
    "1.2": [
        ("Dynamic microphone", "Moving-coil capsule — robust, handles high SPL, no power needed"),
        ("Condenser microphone", "Charged capsule, needs phantom power — detailed high end"),
        ("Ribbon microphone", "Thin foil in a magnetic field — smooth, fragile, figure-of-8"),
        ("Polar patterns", "Cardioid, hypercardioid, figure-of-8, omni — where a mic listens"),
        ("Mic placement", "Distance and angle set tone, spill and room balance"),
        ("Off-axis response", "How frequency response changes away from the capsule's front"),
        ("Gain structure", "Set input gain for best signal-to-noise without clipping"),
        ("Phantom power", "+48 V sent up the mic cable to power condenser capsules"),
        ("Pad switch", "Attenuates a hot source before the preamp to prevent clipping"),
        ("Multi-mic recording", "Several mics on one source — drum kits, phase to manage"),
    ],
    "1.5": [
        ("MIDI controller keyboard", "Real-time note input performed into the sequencer"),
        ("Step input", "Non-real-time entry on a drum grid, one step at a time"),
        ("Pencil tool", "Drawing notes straight into the piano roll"),
        ("Quantise", "Snapping recorded notes to the nearest grid value"),
        ("Swing quantise", "Percentage quantise that keeps or adds groove"),
        ("Velocity", "How hard a note was struck — drives level and timbre"),
        ("Piano roll", "Grid editor where pitch is vertical and time horizontal"),
        ("List editor", "Every MIDI event as an editable row of numbers"),
        ("Note length editing", "Trimming and extending durations after input"),
    ],
}

# Curated cross-concept edges: the signal path spine and exam-thread links.
SIGNAL_PATH = [("1.2", "2.3"), ("2.3", "2.6"), ("2.6", "1.1"), ("1.1", "1.6"),
               ("1.6", "1.13"), ("1.13", "1.14"), ("1.14", "2.2")]
EXAM_LINKS = [("1.3", "1.11"), ("1.9", "2.6"), ("1.11", "2.5"), ("1.12d", "2.5"),
              ("1.4", "2.4"), ("1.10", "1.12d"), ("1.12r", "2.1"), ("1.7", "1.5")]

BULLET = re.compile(r"^\s*[-*]\s*\*\*(.+?)\*\*\s*[-–—:]*\s*(.*)$")
HEADING = re.compile(r"^(#{2,4})\s+(.*)$")
WIKILINK = re.compile(r"\[\[([12]\.\d+)[^\]]*\]\]")

def norm(label):
    s = unicodedata.normalize("NFKD", label.lower())
    s = re.sub(r"\(.*?\)", "", s)
    s = re.sub(r"[^a-z0-9]+", "", s)
    return s[:-1] if s.endswith("s") and len(s) > 4 else s

def slug(label):
    s = re.sub(r"[^a-z0-9]+", "-", label.lower()).strip("-")
    return s

STOP = {"definition", "problem", "solution", "connection", "applications",
        "application", "example", "examples", "note", "overview", "source",
        "teaching integration", "exam priority", "key skills assessed",
        "typical question formats", "mapped past paper questions", "electric",
        "limited answer", "detailed answer", "what to learn", "why", "how", "when",
        "assessment focus", "spec reference", "learning outcomes", "context",
        "general effects parameters", "music styles knowledge", "mathematical relationships"}

# Labels that normalise to the same key but are DIFFERENT concepts. norm()
# strips parenthetical content, so "Drivers (ASIO/Core Audio)" and "Drivers
# (woofer & tweeter)" both become "driver" and would merge into one hub — a
# link that would actively mislead. Keys here are never merged.
NEVER_MERGE = {"driver", "phantom", "quantisation", "quantise"}

# Curated labels meaning the same thing as a twin worded differently elsewhere.
ALIAS = {
    norm("Brickwall limiting"): norm("Limiting"),      # Mastering -> Dynamics
    norm("Delay time & feedback"): norm("Feedback"),   # Delay <-> Modulation
}
# Topics whose curated list omits a concept that genuinely belongs to them too.
EXTRA_HOMES = [
    ("Phantom power", "2.3"),   # Signals: phantom travels the balanced line
    ("Pre-delay", "2.1"),       # Acoustics: the direct-to-first-reflection gap
]

TOPIC_LABELS = {l.lower() for _, _, l in TOPICS}

NORM_TOPICS = None

def bad_term(t):
    global NORM_TOPICS
    if NORM_TOPICS is None:
        NORM_TOPICS = {norm(l) for l in TOPIC_LABELS}
    tl = t.lower()
    if len(t) < 3 and t not in ("Q", "EQ"):
        return True
    return (tl in STOP or re.match(r"^\d\.\d", t) or "question" in tl
            or "assess" in tl or "component" in tl or tl in TOPIC_LABELS
            or norm(t) in NORM_TOPICS)

NORM_TOPIC_LABELS = None  # set after norm() is defined

def clean_term(t):
    t = re.sub(r"\[\[|\]\]", "", t)
    t = t.strip().rstrip(":").strip()
    t = re.sub(r"\s+", " ", t)
    return ukise(t)

UKISE = [("synchronized", "synchronised"), ("synchronization", "synchronisation"),
         ("optimized", "optimised"), ("optimization", "optimisation"),
         ("equalization", "equalisation"), ("equalizer", "equaliser"),
         ("normalized", "normalised"), ("normalization", "normalisation"),
         ("color", "colour"), ("analyzing", "analysing"), ("analyze", "analyse"),
         ("customized", "customised"), ("utilize", "utilise"), ("center", "centre")]

def ukise(s):
    for us, uk in UKISE:
        s = s.replace(us, uk).replace(us.capitalize(), uk.capitalize())
    return s

def clean_blurb(d):
    d = re.sub(r"\*\*", "", d).strip().rstrip(".")
    d = re.sub(r"\s+", " ", d)
    return ukise(d)[:110]

BOLD_LINE = re.compile(r"^\*\*(.+?)\*\*\s*$")
PLAIN_BULLET = re.compile(r"^\s*[-*]\s+(?!\*\*)(.+)$")
TABLE_ROW = re.compile(r"^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*$")

def add(sections, current, term, blurb):
    term = clean_term(term)
    if term and len(term) <= 48 and not bad_term(term):
        sections.setdefault(current, []).append((term, clean_blurb(blurb)))

def parse_spec(path):
    """Three source shapes: bold bullets, standalone bold headings whose blurb
    is the first plain sub-bullet, and | Term | Definition | tables."""
    sections = OrderedDict()
    current, pending, in_table = "General", None, False
    for line in path.read_text(encoding="utf-8").splitlines():
        h = HEADING.match(line)
        if h:
            current, pending, in_table = h.group(2).strip(), None, False
            continue
        row = TABLE_ROW.match(line)
        if row:
            a, b = row.group(1), row.group(2)
            if a.lower() == "term":
                in_table = True
                continue
            if in_table and not set(a) <= {"-", " "}:
                add(sections, current, a, b)
            continue
        in_table = False
        b = BULLET.match(line)
        if b:
            pending = None
            add(sections, current, b.group(1), b.group(2))
            continue
        bl = BOLD_LINE.match(line)
        if bl:
            pending = clean_term(bl.group(1))
            continue
        pb = PLAIN_BULLET.match(line)
        if pb and pending:
            add(sections, current, pending, pb.group(1))
            pending = None
    return sections

def pick(sections, cap):
    """Round-robin across sections so every spec area is represented."""
    chosen, seen = [], set()
    queues = [list(v) for v in sections.values() if v]
    while queues and len(chosen) < cap:
        for q in list(queues):
            if not q:
                queues.remove(q); continue
            term, blurb = q.pop(0)
            n = norm(term)
            if n in seen:
                continue
            seen.add(n)
            chosen.append((term, blurb))
            if len(chosen) >= cap:
                break
    return chosen

# Where each topic sends a student now lives beside its card copy, in
# data/map-room/topic-summaries.json — one file owns what the card says and
# where it goes. All 23 have a destination: a topic hub here, a bench that is
# already public, or an honest members door where no free page exists.

nodes, edges = [], []
by_norm = {}          # normalised label -> node dict (for cross-topic merge)
report = defaultdict(dict)

# A topic node used to carry an empty blurb, so clicking the biggest thing in
# the room showed a name and a link and nothing else. These are hand-written
# from each topic's own spec file; the compiler only places them.
SUMMARIES = json.loads(
    (Path(__file__).resolve().parent.parent
     / "data/map-room/topic-summaries.json").read_text())

for folder, tid, label in TOPICS:
    summary = SUMMARIES.get(tid)
    if not summary:
        raise SystemExit(f"no topic summary for {tid} — refusing to compile")
    dest = summary.get("destination")
    if not dest:
        raise SystemExit(f"no destination for {tid} — refusing to compile")
    tn = {"id": f"t-{slug(label)}", "label": label, "kind": "topic",
          "component": "c4", "parent": tid,
          "blurb": summary["blurb"], "teaches": summary["teaches"],
          "destination": dest}
    if dest.get("href"):
        tn["url"] = dest["href"]
    nodes.append(tn)

topic_node_id = {tid: f"t-{slug(label)}" for _, tid, label in TOPICS}
TOPIC_LABEL = {tid: label for _, tid, label in TOPICS}

# Concepts come from the hand-curated subtopic overlay, not the harvested
# spec prose — see docs/plans/2026-08-05-map-room-node-swap.md.
CURATED = Path("/Users/mikelehnert/Obsidian/Professional/Planning-and-Admin/"
               "Overnight-Runs/2026-08-04/topic-subtopics-curated.json")
curated = json.loads(CURATED.read_text())
CURATED_KEY = {tid: "t-" + slug(label) for _, tid, label in TOPICS}

for folder, tid, label in TOPICS:
    entry = curated.get(CURATED_KEY[tid])
    if not entry:
        raise SystemExit(f"no curated subtopics for {tid} — refusing to compile")
    concepts = [(s["label"], s.get("blurb", ""), s.get("family", ""))
                for s in entry["subtopics"]]
    report[tid]["source"] = "curated"
    report[tid]["count"] = len(concepts)

    for term, blurb, family in concepts:
        n = norm(term)
        n = ALIAS.get(n, n)
        if n in NEVER_MERGE:
            node = {"id": f"c-{slug(TOPIC_LABEL[tid])}-{slug(term)}", "label": term,
                    "kind": "concept", "component": "c4", "parent": tid,
                    "blurb": blurb, "family": family}
            nodes.append(node)
            edges.append({"from": node["id"], "to": topic_node_id[tid], "kind": "parent"})
            continue
        # Same normalised key AND the same literal wording -> genuinely one
        # concept, merge into the existing hub. Same key but DIFFERENT
        # wording (e.g. "Resonance (Q)" vs "Resonance") is not a safe merge:
        # collapsing it would silently drop one topic's exact curated label
        # from the graph, which every-topic-keeps-its-curated-children
        # guards against. Fall through and give it its own node instead.
        if n in by_norm and by_norm[n]["label"] == term:  # shared hub — second owner
            node = by_norm[n]
            node["kind"] = "concept"
            edges.append({"from": node["id"], "to": topic_node_id[tid], "kind": "parent"})
            report[tid].setdefault("shared", []).append(term)
            continue
        node = {"id": f"c-{slug(term)}", "label": term, "kind": "concept",
                "component": "c4", "parent": tid, "blurb": blurb, "family": family}
        if any(x["id"] == node["id"] for x in nodes):
            node["id"] = f"c-{tid.replace('.', '')}-{slug(term)}"
        by_norm[n] = node
        nodes.append(node)
        edges.append({"from": node["id"], "to": topic_node_id[tid], "kind": "parent"})

# EXTRA_HOMES: topics whose curated list omits a concept that genuinely
# belongs to them too. Additional parent edges only — never new nodes.
for home_label, home_tid in EXTRA_HOMES:
    home_n = ALIAS.get(norm(home_label), norm(home_label))
    home_node = by_norm.get(home_n)
    if not home_node:
        raise SystemExit(f"EXTRA_HOMES: no existing node for {home_label!r} (norm {home_n!r})")
    edges.append({"from": home_node["id"], "to": topic_node_id[home_tid], "kind": "parent"})
    report[home_tid].setdefault("shared", []).append(home_label)

# topic<->topic edges from Cross-Curriculum Links files
seen_pairs = set()
for folder, tid, label in TOPICS:
    xl = VAULT / folder / "01 - Curriculum Materials" / "Cross-Curriculum Links.md"
    if not xl.exists():
        continue
    for m in WIKILINK.finditer(xl.read_text(encoding="utf-8")):
        other = m.group(1)
        # 1.12 family: wikilinks say bare 1.12 — map to delay as family anchor
        tgt = "1.12d" if other == "1.12" else other
        if tgt not in topic_node_id or tgt == tid:
            continue
        pair = tuple(sorted([tid, tgt]))
        if pair in seen_pairs:
            continue
        seen_pairs.add(pair)
        edges.append({"from": topic_node_id[tid], "to": topic_node_id[tgt], "kind": "related"})

for a, b in SIGNAL_PATH:
    edges.append({"from": topic_node_id[a], "to": topic_node_id[b], "kind": "signal-path"})
for a, b in EXAM_LINKS:
    pair = tuple(sorted([a, b]))
    if pair not in seen_pairs:
        edges.append({"from": topic_node_id[a], "to": topic_node_id[b], "kind": "exam-link"})

# validation
ids = {n["id"] for n in nodes}
dangling = [e for e in edges if e["from"] not in ids or e["to"] not in ids]
deg = defaultdict(int)
for e in edges:
    deg[e["from"]] += 1; deg[e["to"]] += 1
orphans = [n["id"] for n in nodes if deg[n["id"]] == 0]

OUT.write_text(json.dumps({"nodes": nodes, "edges": edges}, indent=1))
shared_hubs = [n["label"] for n in nodes if
               sum(1 for e in edges if e["kind"] == "parent" and e["from"] == n["id"]) > 1]

print(f"nodes: {len(nodes)}  ({sum(1 for n in nodes if n['kind']=='topic')} topics)")
print(f"edges: {len(edges)}  (parent {sum(1 for e in edges if e['kind']=='parent')}, "
      f"related {sum(1 for e in edges if e['kind']=='related')}, "
      f"signal-path {sum(1 for e in edges if e['kind']=='signal-path')}, "
      f"exam-link {sum(1 for e in edges if e['kind']=='exam-link')})")
print(f"shared hubs ({len(shared_hubs)}): {', '.join(sorted(shared_hubs)[:25])}")
print(f"dangling edges: {len(dangling)}   orphan nodes: {orphans or 'none'}")
for tid in sorted(report):
    r = report[tid]
    print(f"  {tid:<6} {r.get('count','?'):>3} concepts   {r.get('source','')}"
          + (f"   shared: {len(r['shared'])}" if 'shared' in r else ""))

# Rewrite routes and tours through the id-remap, as a final pass, so those
# data files can never drift from the graph the compiler just emitted.
REMAP = json.loads(Path("lib/map-room/id-remap.json").read_text())
for path in ["lib/map-room/routes/exam-routes.json",
             "lib/map-room/tours/whole-course.json"]:
    p = Path(path)
    txt = p.read_text()
    for old, new in REMAP.items():
        if old.startswith("_"):
            continue
        txt = re.sub(rf'"{re.escape(old)}"', f'"{new}"', txt)
    # Two old ids can remap onto the same new one, leaving a focus set that
    # names the same node twice. Harmless to the renderer (focusSet is a Set)
    # but it makes the data read as if a step lights more than it does.
    data = json.loads(txt)
    for step in ([s for r in data.get("routes", []) for s in r["steps"]]
                 + data.get("beats", [])):
        step["focus"] = list(dict.fromkeys(step["focus"]))
    p.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
