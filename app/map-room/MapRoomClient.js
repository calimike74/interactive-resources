'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MapRoomScene } from './scene';
import { ROOM, FAMILIES, topicInk, topicFamily } from './palette';

/* The Map Room — the whole of Component 4 in the round.
 *
 * The scene (scene.js) owns the three.js world; this component owns the
 * room's furniture: title, legend, the index card, the tour rail, and the
 * atmosphere behind the canvas. Navigation happens only through the card's
 * link — hover lights a neighbourhood, click raises the card, nothing more.
 */

const TOUR_BEAT_MS = 7500;

const GRAIN =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")";

export default function MapRoomClient({ graph, tour }) {
    const stageRef = useRef(null);
    const sceneRef = useRef(null);
    const [card, setCard] = useState(null);
    const [tourState, setTourState] = useState(null);
    const [failed, setFailed] = useState(false);
    const tourRef = useRef(null);
    tourRef.current = tourState;

    /* ----- scene lifecycle ----- */
    useEffect(() => {
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const scene = new MapRoomScene(stageRef.current, graph, {
            reduced,
            onSelect: (node) => setCard(node ? { node } : null),
            onUserGesture: () => {
                if (tourRef.current?.playing) setTourState((t) => ({ ...t, playing: false }));
            },
        });
        if (scene.failed) { setFailed(true); return undefined; }
        sceneRef.current = scene;
        window.__mapRoomScene = scene;   // read-only handle for DOM-evidence checks
        return () => { scene.dispose(); sceneRef.current = null; };
    }, [graph]);

    /* ----- tour ----- */
    const beatFocus = useCallback((beatIdx) => {
        const scene = sceneRef.current;
        const beat = tour.beats[beatIdx];
        if (!scene || !beat || !beat.focus.length) return null;
        const set = new Set(beat.focus);
        if (beat.withNeighbours) {
            for (const id of beat.focus) {
                for (const nb of scene.world.neighbours.get(id) || []) set.add(nb);
            }
        }
        return set;
    }, [tour]);

    const goToBeat = useCallback((beatIdx, playing) => {
        const scene = sceneRef.current;
        if (!scene || beatIdx < 0 || beatIdx >= tour.beats.length) return;
        const focus = beatFocus(beatIdx);
        scene.setFocus(focus);
        scene.clearSelection();
        scene.flyToFit(focus, focus ? 1.28 : 1.08);
        setCard(null);
        setTourState({ beat: beatIdx, playing: playing && !scene.reduced });
    }, [tour, beatFocus]);

    const exitTour = useCallback(() => {
        const scene = sceneRef.current;
        if (scene) { scene.setFocus(null); scene.flyToFit(null, 1.08); }
        setTourState(null);
    }, []);

    useEffect(() => {
        if (!tourState?.playing) return undefined;
        const id = setTimeout(() => {
            if (tourState.beat < tour.beats.length - 1) goToBeat(tourState.beat + 1, true);
            else setTourState((t) => ({ ...t, playing: false }));
        }, TOUR_BEAT_MS);
        return () => clearTimeout(id);
    }, [tourState, tour, goToBeat]);

    /* ----- keyboard ----- */
    useEffect(() => {
        const onKey = (e) => {
            const ts = tourRef.current;
            if (e.key === 'Escape') {
                setCard(null);
                sceneRef.current?.clearSelection();
                if (ts) exitTour();
                return;
            }
            if (!ts) return;
            if (e.key === 'ArrowRight') goToBeat(Math.min(ts.beat + 1, tour.beats.length - 1), ts.playing);
            if (e.key === 'ArrowLeft') goToBeat(Math.max(ts.beat - 1, 0), ts.playing);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [exitTour, goToBeat, tour]);

    /* ----- derived card copy ----- */
    const beat = tourState ? tour.beats[tourState.beat] : null;
    const cardNode = card?.node;
    const cardFamily = cardNode ? topicFamily(cardNode.parent) : null;
    const cardTopic = cardNode && cardNode.kind !== 'topic'
        ? graph.nodes.find((n) => n.kind === 'topic' && n.parent === cardNode.parent)
        : null;

    return (
        <div
            className="map-room-stage fixed inset-0 select-none overflow-hidden"
            style={{
                background: `
                    radial-gradient(72% 58% at 50% 46%, rgba(199, 149, 73, 0.17), transparent 64%),
                    radial-gradient(120% 55% at 50% 108%, ${ROOM.lamp}, transparent 60%),
                    linear-gradient(180deg, ${ROOM.bgTop} 0%, ${ROOM.bgMid} 52%, ${ROOM.bgBase} 100%)`,
            }}
        >
            {/* the global footer would force a scrollbar under a full-viewport stage */}
            <style>{`body:has(.map-room-stage) footer { display: none; }`}</style>

            {/* canvas mount */}
            <div
                ref={stageRef}
                role="img"
                aria-label="A three-dimensional map of every Component 4 topic and concept, joined by their real connections. Drag to turn it, grab any node to pull the map about, use the tour button for a guided walk."
                className="absolute inset-0"
            />

            {/* atmosphere: grain + vignette over the scene, under the furniture */}
            <div aria-hidden className="pointer-events-none absolute inset-0"
                style={{ backgroundImage: GRAIN, opacity: 0.05, mixBlendMode: 'overlay' }} />
            <div aria-hidden className="pointer-events-none absolute inset-0"
                style={{ background: 'radial-gradient(115% 85% at 50% 42%, transparent 58%, rgba(5,9,6,0.5) 100%)' }} />

            {failed && (
                <div className="absolute inset-0 flex items-center justify-center p-6">
                    <div className="max-w-[380px] rounded-xl border p-5 text-center"
                        style={{ background: ROOM.paper, borderColor: ROOM.line, color: ROOM.paperInk }}>
                        <div className="text-[17px] font-semibold"
                            style={{ fontFamily: 'var(--font-fraunces), Georgia, serif' }}>
                            The Map Room is drawn in WebGL
                        </div>
                        <p className="mt-2 text-[13px] leading-snug" style={{ color: '#6B6F5C' }}>
                            This browser could not open a 3D canvas, so the map cannot be drawn here.
                            A current version of Safari, Chrome or Firefox will open it.
                        </p>
                    </div>
                </div>
            )}

            {/* header */}
            {!failed && (
                <div className="pointer-events-none absolute left-6 top-6 max-w-[360px]">
                    <h1 style={{ fontFamily: 'var(--font-fraunces), Georgia, serif', color: ROOM.ink }}
                        className="text-[28px] font-semibold leading-tight">
                        The Map Room
                    </h1>
                    <p className="mt-1 text-[13px] leading-snug" style={{ color: ROOM.inkSoft }}>
                        The whole of Component&nbsp;4, hung in one room — every concept in its place.
                    </p>
                    {!tourState && (
                        <button
                            type="button"
                            onClick={() => goToBeat(0, true)}
                            className="pointer-events-auto mt-3 rounded-lg px-4 py-2 text-[13px] font-medium transition-transform duration-150 hover:scale-[1.02]"
                            style={{ background: ROOM.ink, color: ROOM.bgBase }}
                        >
                            Play the 90-second tour
                        </button>
                    )}
                    <div className="mt-3 flex max-w-[300px] flex-wrap gap-x-3 gap-y-1 text-[11px]" style={{ color: ROOM.inkSoft }}>
                        {FAMILIES.map((f) => (
                            <span key={f.key}><span style={{ color: f.swatch }}>●</span> {f.label.toLowerCase()}</span>
                        ))}
                        <span><span style={{ color: ROOM.brass }}>●</span> shared idea</span>
                    </div>
                </div>
            )}

            {/* controls hint */}
            {!failed && !tourState && (
                <div className="pointer-events-none absolute bottom-5 right-6 text-right text-[11px] leading-relaxed"
                    style={{ color: ROOM.inkSoft, opacity: 0.75 }}>
                    drag to turn the room · scroll to zoom<br />
                    grab any node and pull — the map moves with it
                </div>
            )}

            {/* index card */}
            {cardNode && (
                <div
                    className="absolute bottom-6 left-6 max-w-[300px] rounded-xl border p-4 shadow-lg"
                    style={{ background: ROOM.paper, borderColor: ROOM.line }}
                >
                    <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide"
                        style={{ color: '#6B6F5C' }}>
                        <span aria-hidden style={{ color: cardNode.hub ? '#9B7530' : topicInk(cardNode.parent) }}>●</span>
                        {cardNode.kind === 'topic'
                            ? `Topic ${cardNode.parent} · ${cardFamily?.label ?? ''}`
                            : cardNode.hub
                                ? 'Shared idea — lives in more than one topic'
                                : `Inside ${cardNode.parent} ${cardTopic?.label ?? ''}`}
                    </div>
                    <div className="mt-0.5 text-[16px] font-semibold"
                        style={{ fontFamily: 'var(--font-fraunces), Georgia, serif', color: ROOM.paperInk }}>
                        {cardNode.label}
                    </div>
                    {cardNode.blurb && (
                        <p className="mt-1 text-[12.5px] leading-snug" style={{ color: '#6B6F5C' }}>
                            {cardNode.blurb}.
                        </p>
                    )}
                    {cardNode.url && (
                        <a href={cardNode.url} className="mt-2 inline-block text-[13px] font-medium"
                            style={{ color: ROOM.field }}>
                            Open this topic →
                        </a>
                    )}
                </div>
            )}

            {/* tour rail */}
            {tourState && beat && (
                <div className="absolute inset-x-0 bottom-6 flex justify-center px-4">
                    <div
                        className="pointer-events-auto flex max-w-[560px] items-center gap-3 rounded-2xl border px-4 py-3 shadow-lg"
                        style={{ background: ROOM.paper, borderColor: ROOM.line }}
                    >
                        <button type="button" aria-label="Previous"
                            onClick={() => goToBeat(Math.max(tourState.beat - 1, 0), tourState.playing)}
                            disabled={tourState.beat === 0}
                            className="rounded-md px-2 py-1 text-[15px] disabled:opacity-30"
                            style={{ color: ROOM.field }}>←</button>
                        <div className="min-w-0 flex-1">
                            <p aria-live="polite" className="text-[13.5px] leading-snug" style={{ color: ROOM.paperInk }}>
                                {beat.caption}
                            </p>
                            <div className="mt-1 text-[10.5px] tracking-wide"
                                style={{ color: '#6B6F5C', fontFamily: 'var(--font-geist-mono), monospace' }}>
                                {tourState.beat + 1} / {tour.beats.length} · {tour.title}
                            </div>
                        </div>
                        <button type="button" aria-label={tourState.playing ? 'Pause' : 'Play'}
                            onClick={() => setTourState((t) => ({ ...t, playing: !t.playing }))}
                            className="rounded-md px-2 py-1 text-[13px]"
                            style={{ color: '#B85A3F' }}>
                            {tourState.playing ? '❚❚' : '▶'}
                        </button>
                        <button type="button" aria-label="Next"
                            onClick={() => goToBeat(Math.min(tourState.beat + 1, tour.beats.length - 1), tourState.playing)}
                            disabled={tourState.beat === tour.beats.length - 1}
                            className="rounded-md px-2 py-1 text-[15px] disabled:opacity-30"
                            style={{ color: ROOM.field }}>→</button>
                        <button type="button" onClick={exitTour}
                            className="ml-1 rounded-md border px-2.5 py-1 text-[11.5px]"
                            style={{ color: '#6B6F5C', borderColor: ROOM.line }}>
                            Esc
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
