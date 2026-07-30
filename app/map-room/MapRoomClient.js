'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';

/* The Map Room — the whole of Component 4 as one force-directed graph.
 *
 * Everything is drawn on one canvas; the DOM carries only the header, the
 * info card and the tour rail. Camera moves are the teaching mechanic
 * (graphcon-deck): a tour beat = a set of focus nodes + a caption, and the
 * camera fits itself to the focus set, so tours survive layout changes.
 *
 * Canvas cannot read CSS custom properties, so brand colours and font
 * families are hardcoded here from BRAND.md (Botanical Press).
 */

const C = {
    bg: '#F2EBE0',
    paper: '#F8F2E8',
    ink: '#1F2A1C',
    field: '#3A4A35',
    fieldSoft: '#5F7058',
    sienna: '#B85A3F',
    mustard: '#C99F44',
    muted: '#6B6F5C',
    line: '#D4C9B4',
};

/* next/font registers HASHED family names — the literal string 'Fraunces'
 * is not a loaded family, so a hardcoded ctx.font would silently fall back
 * to Georgia/system. Resolve the real names from the CSS variables at
 * runtime instead. */
function resolveFontStack(cssVar, fallback) {
    const probe = document.createElement('span');
    probe.style.fontFamily = `var(${cssVar})`;
    probe.style.position = 'absolute';
    probe.style.visibility = 'hidden';
    document.body.appendChild(probe);
    const fam = getComputedStyle(probe).fontFamily;
    probe.remove();
    return fam && fam !== 'initial' ? fam : fallback;
}

const EASE_HOUSE = [0.22, 1, 0.36, 1]; // matches --ease-house in globals.css
const TOUR_BEAT_MS = 7500;
const TWEEN_MS = 950;

/* ---------- small maths ---------- */

function mulberry32(seed) {
    let a = seed >>> 0;
    return () => {
        a |= 0; a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
}

/* Exact cubic-bezier(x1,y1,x2,y2) easing so the camera follows the house curve. */
function cubicBezier([x1, y1, x2, y2]) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sampleX = (t) => ((ax * t + bx) * t + cx) * t;
    const sampleY = (t) => ((ay * t + by) * t + cy) * t;
    const sampleDX = (t) => (3 * ax * t + 2 * bx) * t + cx;
    return (x) => {
        let t = x;
        for (let i = 0; i < 5; i++) {
            const err = sampleX(t) - x;
            const d = sampleDX(t);
            if (Math.abs(err) < 1e-4 || Math.abs(d) < 1e-6) break;
            t -= err / d;
        }
        return sampleY(Math.min(1, Math.max(0, t)));
    };
}
const easeHouse = cubicBezier(EASE_HOUSE);

/* ---------- component ---------- */

export default function MapRoomClient({ graph, tour }) {
    const canvasRef = useRef(null);
    const wrapRef = useRef(null);
    const router = useRouter();

    // Mutable world lives in a ref so the rAF loop never fights React.
    const world = useRef(null);
    const [card, setCard] = useState(null);          // {node, pinned}
    const [tourState, setTourState] = useState(null); // {beat, playing}
    const [ready, setReady] = useState(false);
    const tourRef = useRef(null);
    tourRef.current = tourState;

    const reduced = useMemo(
        () => typeof window !== 'undefined'
            && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        []
    );

    /* ----- build simulation state once ----- */
    useEffect(() => {
        const nodes = graph.nodes.map((n) => ({ ...n }));
        const byId = new Map(nodes.map((n) => [n.id, n]));
        const edges = graph.edges
            .filter((e) => byId.has(e.from) && byId.has(e.to))
            .map((e) => ({ ...e, a: byId.get(e.from), b: byId.get(e.to) }));

        const neighbours = new Map(nodes.map((n) => [n.id, new Set()]));
        const degree = new Map(nodes.map((n) => [n.id, 0]));
        for (const e of edges) {
            neighbours.get(e.from).add(e.to);
            neighbours.get(e.to).add(e.from);
            degree.set(e.from, degree.get(e.from) + 1);
            degree.set(e.to, degree.get(e.to) + 1);
        }
        // Shared hubs: concepts owned by 2+ topics — drawn sienna, labelled early.
        const parentCount = new Map();
        for (const e of edges) {
            if (e.kind === 'parent') parentCount.set(e.from, (parentCount.get(e.from) || 0) + 1);
        }

        const topics = nodes.filter((n) => n.kind === 'topic');
        topics.forEach((t, i) => {
            const angle = (i / topics.length) * Math.PI * 2 - Math.PI / 2;
            t.x = Math.cos(angle) * 640;
            t.y = Math.sin(angle) * 640;
        });
        for (const n of nodes) {
            if (n.kind === 'topic') continue;
            const rand = mulberry32(hashStr(n.id));
            const home = topics.find((t) => t.parent === n.parent) || { x: 0, y: 0 };
            n.x = home.x + (rand() - 0.5) * 160;
            n.y = home.y + (rand() - 0.5) * 160;
        }
        for (const n of nodes) { n.vx = 0; n.vy = 0; n.fixed = false; }
        for (const n of nodes) {
            n.r = n.kind === 'topic'
                ? Math.min(20, 12 + (degree.get(n.id) || 0) * 0.25)
                : (parentCount.get(n.id) || 0) > 1 ? 6.5 : 4;
            n.hub = n.kind !== 'topic' && (parentCount.get(n.id) || 0) > 1;
        }

        const frauncesStack = resolveFontStack('--font-fraunces', 'Georgia, serif');
        const geistStack = resolveFontStack('--font-geist-sans', 'sans-serif');

        world.current = {
            nodes, edges, byId, neighbours, degree,
            fontTopic: `600 13px ${frauncesStack}`,
            fontConcept: `400 10.5px ${geistStack}`,
            cam: { x: 0, y: 0, k: 0.001 },            // start pulled far out; intro tween lands us
            tween: null, alpha: 1.2, hover: null, needsFrame: true,
            drag: null, pinch: null, focus: null,      // focus: Set of node ids in tour beat
        };

        // Pre-settle so first paint is already a landscape, not an explosion.
        const settleTicks = reduced ? 600 : 160;
        for (let i = 0; i < settleTicks; i++) tick(world.current);
        if (reduced) world.current.alpha = 0;

        const fitAll = fitCamera(world.current, null, wrapRef.current, 90);
        if (reduced) {
            world.current.cam = fitAll;
        } else {
            world.current.cam = { ...fitAll, k: fitAll.k * 0.82 };
            startTween(world.current, fitAll, reduced);   // gentle arrival breath
        }
        setReady(true);
    }, [graph, reduced]);

    /* ----- physics ----- */
    function tick(w) {
        const { nodes, edges } = w;
        const alpha = Math.max(w.alpha, 0);
        if (alpha <= 0.015) return;
        for (const e of edges) {
            const rest = e.kind === 'parent' ? (e.a.kind === 'topic' || e.b.kind === 'topic' ? 120 : 90) : 460;
            const k = e.kind === 'parent' ? 0.05 : 0.012;
            const dx = e.b.x - e.a.x, dy = e.b.y - e.a.y;
            const d = Math.max(1, Math.hypot(dx, dy));
            const f = k * (d - rest) * alpha;
            const fx = (dx / d) * f, fy = (dy / d) * f;
            if (!e.a.fixed) { e.a.vx += fx; e.a.vy += fy; }
            if (!e.b.fixed) { e.b.vx -= fx; e.b.vy -= fy; }
        }
        const cutoff = 240, cutoff2 = cutoff * cutoff;
        for (let i = 0; i < nodes.length; i++) {
            const a = nodes[i];
            for (let j = i + 1; j < nodes.length; j++) {
                const b = nodes[j];
                const dx = b.x - a.x, dy = b.y - a.y;
                const d2 = dx * dx + dy * dy;
                if (d2 > cutoff2 || d2 === 0) continue;
                const d = Math.sqrt(d2);
                const mass = (a.kind === 'topic' ? 2.4 : 1) * (b.kind === 'topic' ? 2.4 : 1);
                const f = (900 * mass * alpha) / d2;
                const fx = (dx / d) * f, fy = (dy / d) * f;
                if (!a.fixed) { a.vx -= fx; a.vy -= fy; }
                if (!b.fixed) { b.vx += fx; b.vy += fy; }
            }
        }
        for (const n of nodes) {
            if (n.fixed) { n.vx = 0; n.vy = 0; continue; }
            n.vx -= n.x * 0.003 * alpha;
            n.vy -= n.y * 0.003 * alpha;
            n.vx *= 0.82; n.vy *= 0.82;
            n.x += n.vx; n.y += n.vy;
        }
        w.alpha *= 0.988;
    }

    /* ----- camera ----- */
    function fitCamera(w, ids, wrapEl, pad = 120) {
        const width = wrapEl?.clientWidth || 1280;
        const height = wrapEl?.clientHeight || 700;
        const set = ids && ids.size ? [...ids].map((id) => w.byId.get(id)).filter(Boolean) : w.nodes;
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (const n of set) {
            x0 = Math.min(x0, n.x - n.r); y0 = Math.min(y0, n.y - n.r);
            x1 = Math.max(x1, n.x + n.r); y1 = Math.max(y1, n.y + n.r);
        }
        const bw = Math.max(60, x1 - x0), bh = Math.max(60, y1 - y0);
        const k = Math.min(2.4, Math.max(0.1,
            Math.min((width - pad * 2) / bw, (height - pad * 2) / bh)));
        return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, k };
    }

    function startTween(w, target, reducedMotion) {
        if (reducedMotion) { w.cam = { ...target }; w.needsFrame = true; return; }
        w.tween = { from: { ...w.cam }, to: { ...target }, start: performance.now() };
        w.needsFrame = true;
    }

    /* ----- tour helpers ----- */
    const beatFocus = useCallback((beatIdx) => {
        const w = world.current;
        const beat = tour.beats[beatIdx];
        if (!beat || !beat.focus.length) return null;
        const set = new Set(beat.focus);
        if (beat.withNeighbours) {
            for (const id of beat.focus) {
                for (const nb of w.neighbours.get(id) || []) set.add(nb);
            }
        }
        return set;
    }, [tour]);

    const goToBeat = useCallback((beatIdx, playing) => {
        const w = world.current;
        if (!w || beatIdx < 0 || beatIdx >= tour.beats.length) return;
        const focus = beatFocus(beatIdx);
        w.focus = focus;
        w.lastBeatAt = performance.now();
        startTween(w, fitCamera(w, focus, wrapRef.current, focus ? 130 : 90), reduced);
        setCard(null);
        setTourState({ beat: beatIdx, playing: playing && !reduced });
    }, [tour, beatFocus, reduced]);

    const exitTour = useCallback(() => {
        const w = world.current;
        if (w) { w.focus = null; startTween(w, fitCamera(w, null, wrapRef.current, 90), reduced); }
        setTourState(null);
    }, [reduced]);

    /* ----- render loop ----- */
    useEffect(() => {
        if (!ready) return undefined;
        const canvas = canvasRef.current;
        const wrap = wrapRef.current;
        const ctx = canvas.getContext('2d');
        let raf = 0;
        let fontsIn = false;
        document.fonts?.ready?.then(() => { fontsIn = true; world.current.needsFrame = true; });

        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const resize = () => {
            canvas.width = wrap.clientWidth * dpr;
            canvas.height = wrap.clientHeight * dpr;
            canvas.style.width = `${wrap.clientWidth}px`;
            canvas.style.height = `${wrap.clientHeight}px`;
            world.current.needsFrame = true;
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(wrap);

        const frame = (now) => {
            raf = requestAnimationFrame(frame);
            const w = world.current;
            if (!w) return;

            const simActive = w.alpha > 0.015 && !reduced;
            if (simActive) { tick(w); w.needsFrame = true; }

            if (w.tween) {
                const t = Math.min(1, (now - w.tween.start) / TWEEN_MS);
                const e = easeHouse(t);
                w.cam = {
                    x: w.tween.from.x + (w.tween.to.x - w.tween.from.x) * e,
                    y: w.tween.from.y + (w.tween.to.y - w.tween.from.y) * e,
                    k: w.tween.from.k * Math.pow(w.tween.to.k / w.tween.from.k, e),
                };
                if (t >= 1) w.tween = null;
                w.needsFrame = true;
            }

            const ts = tourRef.current;
            if (ts?.playing && now - (w.lastBeatAt || 0) > TOUR_BEAT_MS) {
                if (ts.beat < tour.beats.length - 1) goToBeat(ts.beat + 1, true);
                else setTourState({ beat: ts.beat, playing: false });
            }

            if (!w.needsFrame) return;
            w.needsFrame = simActive || !!w.tween;
            draw(ctx, w, wrap.clientWidth, wrap.clientHeight, dpr, fontsIn);
        };
        raf = requestAnimationFrame(frame);
        return () => { cancelAnimationFrame(raf); ro.disconnect(); };
    }, [ready, reduced, tour, goToBeat]);

    /* ----- drawing ----- */
    function draw(ctx, w, width, height, dpr) {
        const { cam, nodes, edges, hover, focus, neighbours } = w;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.fillStyle = C.bg;
        ctx.fillRect(0, 0, width, height);

        // Soft press-paper vignette, not a flat field.
        const g = ctx.createRadialGradient(width * 0.5, height * 0.42, 80, width * 0.5, height * 0.42, Math.max(width, height) * 0.75);
        g.addColorStop(0, 'rgba(248,242,232,0.9)');
        g.addColorStop(1, 'rgba(232,222,204,0.55)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, width, height);

        const sx = (wx) => (wx - cam.x) * cam.k + width / 2;
        const sy = (wy) => (wy - cam.y) * cam.k + height / 2;

        const hoverSet = hover ? new Set([hover.id, ...(neighbours.get(hover.id) || [])]) : null;
        const dimFor = (idA, idB) => {
            if (focus) return focus.has(idA) && (idB === undefined || focus.has(idB)) ? 1 : 0.07;
            if (hoverSet) return hoverSet.has(idA) && (idB === undefined || hoverSet.has(idB)) ? 1 : 0.12;
            return 1;
        };

        // edges
        for (const e of edges) {
            const emph = dimFor(e.from, e.to);
            const x1 = sx(e.a.x), y1 = sy(e.a.y), x2 = sx(e.b.x), y2 = sy(e.b.y);
            if (Math.max(x1, x2) < -40 || Math.min(x1, x2) > width + 40
                || Math.max(y1, y2) < -40 || Math.min(y1, y2) > height + 40) continue;
            let stroke = C.ink, alpha = 0.13, lw = 1;
            if (e.kind === 'related') { stroke = C.fieldSoft; alpha = 0.22; }
            if (e.kind === 'signal-path') { stroke = C.sienna; alpha = 0.5; lw = 1.6; }
            if (e.kind === 'exam-link') { stroke = C.mustard; alpha = 0.55; lw = 1.4; ctx.setLineDash([5, 4]); }
            ctx.globalAlpha = alpha * (emph === 1 ? 1 : emph * 0.6);
            ctx.strokeStyle = stroke;
            ctx.lineWidth = lw;
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
            ctx.setLineDash([]);
        }

        // nodes
        for (const n of nodes) {
            const x = sx(n.x), y = sy(n.y);
            if (x < -30 || x > width + 30 || y < -30 || y > height + 30) continue;
            const emph = dimFor(n.id);
            const r = Math.max(1.6, n.r * Math.min(1.15, Math.max(0.6, cam.k)));
            ctx.globalAlpha = emph;
            ctx.fillStyle = n.kind === 'topic' ? C.field : n.hub ? C.sienna : C.muted;
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
            if (n.kind === 'topic') {
                ctx.globalAlpha = emph * 0.5;
                ctx.strokeStyle = C.paper; ctx.lineWidth = 1.5;
                ctx.stroke();
            }
            if ((hover?.id === n.id) || (focus?.has(n.id) && n.kind === 'topic')) {
                ctx.globalAlpha = Math.min(1, emph + 0.2);
                ctx.strokeStyle = C.mustard; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(x, y, r + 3.5, 0, Math.PI * 2); ctx.stroke();
            }
        }

        // labels — screen-space, halo in page colour, simple collision grid
        ctx.globalAlpha = 1;
        const taken = [];
        const collides = (bx, by, bw, bh) =>
            taken.some((t) => bx < t.x + t.w && bx + bw > t.x && by < t.y + t.h && by + bh > t.y);
        const conceptAlpha = Math.min(1, Math.max(0, (cam.k - 0.5) / 0.35));
        const ordered = [...nodes].sort((a, b) =>
            (b.kind === 'topic') - (a.kind === 'topic') || (b.hub === true) - (a.hub === true));
        for (const n of ordered) {
            const isTopic = n.kind === 'topic';
            if (!isTopic && conceptAlpha <= 0.02) continue;
            const emph = dimFor(n.id);
            if (emph < 0.5 && !isTopic) continue;
            const x = sx(n.x), y = sy(n.y);
            if (x < -80 || x > width + 80 || y < -40 || y > height + 40) continue;
            ctx.font = isTopic ? w.fontTopic : w.fontConcept;
            const label = n.label;
            const m = ctx.measureText(label);
            const bw2 = m.width + 8, bh2 = 16;
            const bx = x - bw2 / 2, by = y + n.r * cam.k + 4;
            if (collides(bx, by, bw2, bh2)) continue;
            taken.push({ x: bx, y: by, w: bw2, h: bh2 });
            ctx.globalAlpha = (isTopic ? 1 : conceptAlpha * 0.9) * emph;
            ctx.strokeStyle = C.bg; ctx.lineWidth = 3.5; ctx.lineJoin = 'round';
            ctx.strokeText(label, bx + 4, by + 11);
            ctx.fillStyle = isTopic ? C.ink : n.hub ? C.sienna : C.muted;
            ctx.fillText(label, bx + 4, by + 11);
        }
        ctx.globalAlpha = 1;
    }

    /* ----- interaction ----- */
    const hitTest = useCallback((clientX, clientY) => {
        const w = world.current;
        const wrap = wrapRef.current;
        if (!w || !wrap) return null;
        const rect = wrap.getBoundingClientRect();
        const px = clientX - rect.left, py = clientY - rect.top;
        const wx = (px - rect.width / 2) / w.cam.k + w.cam.x;
        const wy = (py - rect.height / 2) / w.cam.k + w.cam.y;
        let best = null, bestD = Infinity;
        for (const n of w.nodes) {
            const d = Math.hypot(n.x - wx, n.y - wy);
            const reach = n.r + 12 / w.cam.k;
            if (d < reach && d < bestD) { best = n; bestD = d; }
        }
        return best;
    }, []);

    const onPointerDown = useCallback((e) => {
        const w = world.current;
        if (!w) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        const node = hitTest(e.clientX, e.clientY);
        w.drag = {
            id: e.pointerId, node, moved: 0,
            lastX: e.clientX, lastY: e.clientY,
            points: new Map([[e.pointerId, { x: e.clientX, y: e.clientY }]]),
        };
        if (node) { node.fixed = true; }
    }, [hitTest]);

    const onPointerMove = useCallback((e) => {
        const w = world.current;
        if (!w) return;
        if (!w.drag) {
            const h = hitTest(e.clientX, e.clientY);
            if (h !== w.hover) { w.hover = h; w.needsFrame = true; setCard((c) => (c?.pinned ? c : h ? { node: h, pinned: false } : null)); }
            return;
        }
        const d = w.drag;
        d.points.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (d.points.size === 2) {   // pinch zoom
            const [p1, p2] = [...d.points.values()];
            const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
            if (d.pinchDist) {
                const f = dist / d.pinchDist;
                w.cam.k = Math.min(2.4, Math.max(0.08, w.cam.k * f));
                w.needsFrame = true;
                if (tourRef.current?.playing) setTourState((t) => ({ ...t, playing: false }));
            }
            d.pinchDist = dist;
            return;
        }
        const dx = e.clientX - d.lastX, dy = e.clientY - d.lastY;
        d.lastX = e.clientX; d.lastY = e.clientY;
        d.moved += Math.abs(dx) + Math.abs(dy);
        if (d.node) {
            d.node.x += dx / w.cam.k; d.node.y += dy / w.cam.k;
            if (!reduced) w.alpha = Math.max(w.alpha, 0.35);
        } else {
            w.cam.x -= dx / w.cam.k; w.cam.y -= dy / w.cam.k;
            w.tween = null;
            if (tourRef.current?.playing) setTourState((t) => ({ ...t, playing: false }));
        }
        w.needsFrame = true;
    }, [hitTest, reduced]);

    const onPointerUp = useCallback((e) => {
        const w = world.current;
        if (!w?.drag) return;
        const { node, moved } = w.drag;
        w.drag.points.delete(e.pointerId);
        if (w.drag.points.size === 0) w.drag = null; else return;
        if (node) node.fixed = false;
        if (node && moved < 5) {                       // a genuine click
            if (node.kind === 'topic' && node.url && !tourRef.current) {
                router.push(node.url);
                return;
            }
            setCard({ node, pinned: true });
            w.needsFrame = true;
        } else if (!node && moved < 5) {
            setCard(null);
        }
    }, [router]);

    const onWheel = useCallback((e) => {
        const w = world.current;
        const wrap = wrapRef.current;
        if (!w || !wrap) return;
        e.preventDefault();
        const rect = wrap.getBoundingClientRect();
        const px = e.clientX - rect.left - rect.width / 2;
        const py = e.clientY - rect.top - rect.height / 2;
        const f = Math.exp(-e.deltaY * 0.0016);
        const k2 = Math.min(2.4, Math.max(0.08, w.cam.k * f));
        // keep the point under the cursor still
        w.cam.x += px / w.cam.k - px / k2;
        w.cam.y += py / w.cam.k - py / k2;
        w.cam.k = k2;
        w.tween = null;
        w.needsFrame = true;
        if (tourRef.current?.playing) setTourState((t) => ({ ...t, playing: false }));
    }, []);

    useEffect(() => {
        const el = wrapRef.current;
        if (!el) return undefined;
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, [onWheel]);

    useEffect(() => {
        const onKey = (e) => {
            const ts = tourRef.current;
            if (e.key === 'Escape') { setCard(null); if (ts) exitTour(); return; }
            if (!ts) return;
            if (e.key === 'ArrowRight') goToBeat(Math.min(ts.beat + 1, tour.beats.length - 1), ts.playing);
            if (e.key === 'ArrowLeft') goToBeat(Math.max(ts.beat - 1, 0), ts.playing);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [exitTour, goToBeat, tour]);

    /* ----- DOM ----- */
    const beat = tourState ? tour.beats[tourState.beat] : null;
    const cardTopic = card && card.node.kind !== 'topic'
        ? graph.nodes.find((n) => n.kind === 'topic' && n.parent === card.node.parent)
        : null;

    return (
        <div ref={wrapRef} className="map-room-stage fixed inset-0 overflow-hidden select-none" style={{ background: C.bg }}>
            {/* the global footer would force a scrollbar under a full-viewport stage */}
            <style>{`body:has(.map-room-stage) footer { display: none; }`}</style>

            <canvas
                ref={canvasRef}
                role="img"
                aria-label="A map of every Component 4 topic and concept, joined by their real connections. Use the tour button for a guided walk."
                className="block h-full w-full touch-none cursor-grab active:cursor-grabbing"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
            />

            {/* header */}
            <div className="pointer-events-none absolute left-6 top-6 max-w-[340px]">
                <h1 style={{ fontFamily: 'var(--font-fraunces), Georgia, serif', color: C.ink }}
                    className="text-[28px] font-semibold leading-tight">
                    The Map Room
                </h1>
                <p className="mt-1 text-[13px] leading-snug" style={{ color: C.muted }}>
                    The whole of Component&nbsp;4, drawn as one map — every concept in its place.
                </p>
                {!tourState && (
                    <button
                        type="button"
                        onClick={() => goToBeat(0, true)}
                        className="pointer-events-auto mt-3 rounded-lg px-4 py-2 text-[13px] font-medium transition-transform duration-150 hover:scale-[1.02]"
                        style={{ background: C.field, color: C.paper, transitionTimingFunction: `cubic-bezier(${EASE_HOUSE})` }}
                    >
                        Play the 90-second tour
                    </button>
                )}
                <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px]" style={{ color: C.muted }}>
                    <span><span style={{ color: C.field }}>●</span> topic</span>
                    <span><span style={{ color: C.sienna }}>●</span> shared idea</span>
                    <span><span style={{ color: C.muted }}>●</span> concept</span>
                    <span className="opacity-70">drag to explore · scroll to zoom</span>
                </div>
            </div>

            {/* info card */}
            {card && !tourState && (
                <div
                    className="absolute bottom-6 left-6 max-w-[300px] rounded-xl border p-4 shadow-sm"
                    style={{ background: C.paper, borderColor: C.line }}
                >
                    <div className="text-[11px] uppercase tracking-wide" style={{ color: card.node.hub ? C.sienna : C.muted }}>
                        {card.node.kind === 'topic' ? `Topic ${card.node.parent}` : card.node.hub ? 'Shared idea' : `Inside ${card.node.parent} ${cardTopic?.label ?? ''}`}
                    </div>
                    <div className="mt-0.5 text-[16px] font-semibold" style={{ fontFamily: 'var(--font-fraunces), Georgia, serif', color: C.ink }}>
                        {card.node.label}
                    </div>
                    {card.node.blurb && (
                        <p className="mt-1 text-[12.5px] leading-snug" style={{ color: C.muted }}>{card.node.blurb}.</p>
                    )}
                    {card.node.url && (
                        <a href={card.node.url} className="mt-2 inline-block text-[13px] font-medium" style={{ color: C.field }}>
                            Open this topic →
                        </a>
                    )}
                </div>
            )}

            {/* tour rail */}
            {tourState && beat && (
                <div className="absolute inset-x-0 bottom-6 flex justify-center px-4">
                    <div
                        className="pointer-events-auto flex max-w-[560px] items-center gap-3 rounded-2xl border px-4 py-3 shadow-sm"
                        style={{ background: C.paper, borderColor: C.line }}
                    >
                        <button type="button" aria-label="Previous"
                            onClick={() => goToBeat(Math.max(tourState.beat - 1, 0), tourState.playing)}
                            disabled={tourState.beat === 0}
                            className="rounded-md px-2 py-1 text-[15px] disabled:opacity-30"
                            style={{ color: C.field }}>←</button>
                        <div className="min-w-0 flex-1">
                            <p aria-live="polite" className="text-[13.5px] leading-snug" style={{ color: C.ink }}>
                                {beat.caption}
                            </p>
                            <div className="mt-1 text-[10.5px] tracking-wide" style={{ color: C.muted, fontFamily: 'var(--font-geist-mono), monospace' }}>
                                {tourState.beat + 1} / {tour.beats.length} · {tour.title}
                            </div>
                        </div>
                        <button type="button" aria-label={tourState.playing ? 'Pause' : 'Play'}
                            onClick={() => setTourState((t) => ({ ...t, playing: !t.playing }))}
                            className="rounded-md px-2 py-1 text-[13px]"
                            style={{ color: C.sienna }}>
                            {tourState.playing ? '❚❚' : '▶'}
                        </button>
                        <button type="button" aria-label="Next"
                            onClick={() => goToBeat(Math.min(tourState.beat + 1, tour.beats.length - 1), tourState.playing)}
                            disabled={tourState.beat === tour.beats.length - 1}
                            className="rounded-md px-2 py-1 text-[15px] disabled:opacity-30"
                            style={{ color: C.field }}>→</button>
                        <button type="button" onClick={exitTour}
                            className="ml-1 rounded-md border px-2.5 py-1 text-[11.5px]"
                            style={{ color: C.muted, borderColor: C.line }}>
                            Esc
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
