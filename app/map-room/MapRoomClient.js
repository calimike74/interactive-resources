'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { MapRoomScene } from './scene';
import { RoomAudio, SOUND_CAPTIONS } from './audio';
import { ROOM, FAMILIES, topicInk, topicFamily } from './palette';

/* The Map Room — the whole of Component 4 in the round.
 *
 * The scene (scene.js) owns the three.js world; this component owns the
 * room's furniture and its four ways of moving through the course:
 * free orbit, the guided tour, the spec walk (arrow keys), and exam routes
 * (real Question 6s lit as paths). Navigation is still deliberate: hover
 * lights, click raises the card, the card's link is the only way out of
 * the room.
 */

const TOUR_BEAT_MS = 7500;

const GRAIN =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")";

/* Every topic leads somewhere, and the card says honestly where. Three cases:
 * a topic hub on this site, a bench that is already public (some of which are
 * assessments, not tools you can hear — so the verb comes from the data), and
 * the four topics whose only full page is inside membership. That last one is
 * a door, not a dead end: it says what is behind it. */
function TopicWayOut({ dest }) {
    if (!dest) return null;

    if (dest.kind === 'members') {
        const { chapters, papers, traps } = dest;
        return (
            <div className="mt-2.5 border-t pt-2.5" style={{ borderColor: ROOM.line }}>
                <p className="text-[12px] leading-snug" style={{ color: '#55594A' }}>
                    <span aria-hidden style={{ color: '#9B7530' }}>⬦ </span>
                    The full topic — {chapters} chapters, {papers} past-paper questions
                    with mark schemes and {traps} examiner traps — is part of membership.
                </p>
                <a href="https://grades.musictechstudio.co.uk/"
                    className="mt-1.5 inline-block text-[13px] font-medium"
                    style={{ color: ROOM.field }}>
                    See what&rsquo;s inside →
                </a>
            </div>
        );
    }

    const external = dest.href.startsWith('http');
    return (
        <a href={dest.href}
            {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className="mt-2.5 inline-block text-[13px] font-medium"
            style={{ color: ROOM.field }}>
            {dest.kind === 'bench'
                ? `${dest.verb} ${dest.label} →`
                : 'Open this topic →'}
        </a>
    );
}

const specKey = (parent) => {
    const m = /^(\d+)\.(\d+)([a-z]?)$/.exec(parent) || [];
    return [Number(m[1] || 9), Number(m[2] || 99), m[3] || ''];
};

export default function MapRoomClient({ graph, tour, examRoutes }) {
    const stageRef = useRef(null);
    const sceneRef = useRef(null);
    const audioRef = useRef(null);
    const [card, setCard] = useState(null);
    const [tourState, setTourState] = useState(null);
    const [routeState, setRouteState] = useState(null);   // { idx, step }
    const [routesOpen, setRoutesOpen] = useState(false);
    const [walkIdx, setWalkIdx] = useState(null);
    const [layoutMode, setLayoutMode] = useState('concept');
    const [soundOn, setSoundOn] = useState(false);
    const [nowHearing, setNowHearing] = useState(null);
    const [failed, setFailed] = useState(false);

    const modeRef = useRef({});
    modeRef.current = { tourState, routeState, walkIdx, card, soundOn };

    const specTopics = useMemo(
        () => graph.nodes
            .filter((n) => n.kind === 'topic')
            .sort((a, b) => {
                const ka = specKey(a.parent), kb = specKey(b.parent);
                return ka[0] - kb[0] || ka[1] - kb[1] || ka[2].localeCompare(kb[2]);
            }),
        [graph]
    );

    /* What a topic owns, and which of those it shares with another topic.
     * Shared ideas are counted from parent EDGES — a merged node keeps a
     * single `parent` field but carries an edge to every topic that owns it. */
    const childrenOf = useMemo(() => {
        const byId = new Map(graph.nodes.map((n) => [n.id, n]));
        const owners = new Map();     // concept id -> topic ids that claim it
        const kids = new Map();       // topic id   -> concept nodes
        for (const e of graph.edges) {
            if (e.kind !== 'parent') continue;
            const fromIsTopic = byId.get(e.from)?.kind === 'topic';
            const topicId = fromIsTopic ? e.from : e.to;
            const conceptId = fromIsTopic ? e.to : e.from;
            if (byId.get(topicId)?.kind !== 'topic' || !byId.get(conceptId)) continue;
            if (!owners.has(conceptId)) owners.set(conceptId, []);
            if (!kids.has(topicId)) kids.set(topicId, []);
            owners.get(conceptId).push(topicId);
            kids.get(topicId).push(conceptId);
        }
        return (topicId) => {
            const ids = kids.get(topicId) || [];
            const shared = ids.filter((id) => (owners.get(id) || []).length > 1);
            return {
                count: ids.length,
                shared: shared.map((id) => byId.get(id).label),
            };
        };
    }, [graph]);

    /* ----- scene lifecycle ----- */
    useEffect(() => {
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const scene = new MapRoomScene(stageRef.current, graph, {
            reduced,
            onSelect: (node) => {
                setCard(node ? { node } : null);
            },
            onUserGesture: () => {
                if (modeRef.current.tourState?.playing) {
                    setTourState((t) => ({ ...t, playing: false }));
                }
            },
            onHover: (node) => {
                const audio = audioRef.current;
                if (!modeRef.current.soundOn || !audio) return;
                if (node?.kind === 'topic' && SOUND_CAPTIONS[node.parent]) {
                    setNowHearing(audio.play(node.parent));
                } else {
                    audio.stop();
                    setNowHearing(null);
                }
            },
        });
        if (scene.failed) { setFailed(true); return undefined; }
        sceneRef.current = scene;
        window.__mapRoomScene = scene;   // read-only handle for DOM-evidence checks
        return () => { scene.dispose(); sceneRef.current = null; };
    }, [graph]);

    /* ----- shared exits ----- */
    const backToRoom = useCallback(() => {
        const scene = sceneRef.current;
        if (scene) {
            scene.setFocus(null);
            scene.clearSelection();
            scene.flyToFit(null, 1.08);
        }
        setCard(null);
        setTourState(null);
        setRouteState(null);
        setWalkIdx(null);
    }, []);

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
        setRouteState(null);
        setWalkIdx(null);
        setTourState({ beat: beatIdx, playing: playing && !scene.reduced });
    }, [tour, beatFocus]);

    useEffect(() => {
        if (!tourState?.playing) return undefined;
        const id = setTimeout(() => {
            if (tourState.beat < tour.beats.length - 1) goToBeat(tourState.beat + 1, true);
            else setTourState((t) => ({ ...t, playing: false }));
        }, TOUR_BEAT_MS);
        return () => clearTimeout(id);
    }, [tourState, tour, goToBeat]);

    /* ----- exam routes ----- */
    const goRouteStep = useCallback((idx, step) => {
        const scene = sceneRef.current;
        const route = examRoutes[idx];
        if (!scene || !route || step < 0 || step >= route.steps.length) return;
        const union = new Set();
        for (let s = 0; s <= step; s++) {
            for (const id of route.steps[s].focus) union.add(id);
        }
        scene.setFocus(union);
        scene.clearSelection();
        scene.flyToFit(union, 1.3);
        setCard(null);
        setTourState(null);
        setWalkIdx(null);
        setRouteState({ idx, step });
    }, [examRoutes]);

    /* ----- the spec walk ----- */
    const goWalk = useCallback((idx) => {
        const scene = sceneRef.current;
        const topic = specTopics[idx];
        if (!scene || !topic) return;
        const focus = new Set([topic.id]);
        for (const nb of scene.world.neighbours.get(topic.id) || []) focus.add(nb);
        scene.setFocus(focus);
        scene.clearSelection();
        scene.flyToFit(focus, 1.3);
        setTourState(null);
        setRouteState(null);
        setCard({ node: topic });
        setWalkIdx(idx);
    }, [specTopics]);

    const stepWalk = useCallback((dir) => {
        const { walkIdx: cur, card: c } = modeRef.current;
        let next;
        if (cur != null) {
            next = Math.min(specTopics.length - 1, Math.max(0, cur + dir));
        } else if (c?.node?.kind === 'topic') {
            const at = specTopics.findIndex((t) => t.id === c.node.id);
            next = Math.min(specTopics.length - 1, Math.max(0, at + dir));
        } else {
            next = dir > 0 ? 0 : specTopics.length - 1;
        }
        goWalk(next);
    }, [specTopics, goWalk]);

    /* ----- sound ----- */
    const toggleSound = useCallback(() => {
        if (modeRef.current.soundOn) {
            audioRef.current?.stop();
            setNowHearing(null);
            setSoundOn(false);
            return;
        }
        audioRef.current ||= new RoomAudio();
        window.__mapRoomAudio = audioRef.current;
        if (audioRef.current.enable()) setSoundOn(true);
    }, []);

    /* ----- layout ----- */
    const switchLayout = useCallback((mode) => {
        sceneRef.current?.setLayout(mode);
        setLayoutMode(mode);
    }, []);

    /* ----- keyboard ----- */
    useEffect(() => {
        const onKey = (e) => {
            const { tourState: ts, routeState: rs, walkIdx: wi } = modeRef.current;
            if (e.key === 'Escape') {
                setRoutesOpen(false);
                if (rs || ts || wi != null) { backToRoom(); return; }
                setCard(null);
                sceneRef.current?.clearSelection();
                return;
            }
            if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
            const dir = e.key === 'ArrowRight' ? 1 : -1;
            if (rs) {
                const route = examRoutes[rs.idx];
                goRouteStep(rs.idx, Math.min(route.steps.length - 1, Math.max(0, rs.step + dir)));
            } else if (ts) {
                goToBeat(Math.min(tour.beats.length - 1, Math.max(0, ts.beat + dir)), ts.playing);
            } else {
                stepWalk(dir);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [backToRoom, goToBeat, goRouteStep, stepWalk, tour, examRoutes]);

    /* ----- derived copy ----- */
    const beat = tourState ? tour.beats[tourState.beat] : null;
    const route = routeState ? examRoutes[routeState.idx] : null;
    const routeStep = route ? route.steps[routeState.step] : null;
    const cardNode = card?.node;
    const cardFamily = cardNode ? topicFamily(cardNode.parent) : null;
    const cardTopic = cardNode && cardNode.kind !== 'topic'
        ? graph.nodes.find((n) => n.kind === 'topic' && n.parent === cardNode.parent)
        : null;
    const topicChildren = cardNode?.kind === 'topic' ? childrenOf(cardNode.id) : null;
    const walkTopic = walkIdx != null ? specTopics[walkIdx] : null;
    const bottomRail = tourState || routeState;

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
                aria-label="A three-dimensional map of every Component 4 topic and concept, joined by their real connections. Drag to turn it, grab any node to pull the map about, use the arrow keys to walk the topics in spec order, or play a guided tour or exam route."
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
                    {!bottomRail && (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => goToBeat(0, true)}
                                className="pointer-events-auto rounded-lg px-4 py-2 text-[13px] font-medium transition-transform duration-150 hover:scale-[1.02]"
                                style={{ background: ROOM.ink, color: ROOM.bgBase }}
                            >
                                Play the 90-second tour
                            </button>
                            <button
                                type="button"
                                onClick={() => setRoutesOpen((o) => !o)}
                                className="pointer-events-auto rounded-lg border px-3 py-2 text-[12.5px] font-medium"
                                style={{ borderColor: 'rgba(242,235,224,0.3)', color: ROOM.ink }}
                            >
                                Exam routes
                            </button>
                        </div>
                    )}
                    <div className="mt-3 flex max-w-[300px] flex-wrap gap-x-3 gap-y-1 text-[11px]" style={{ color: ROOM.inkSoft }}>
                        {FAMILIES.map((f) => (
                            <span key={f.key}><span style={{ color: f.swatch }}>●</span> {f.label.toLowerCase()}</span>
                        ))}
                        <span><span style={{ color: ROOM.brass }}>●</span> shared idea</span>
                    </div>
                </div>
            )}

            {/* view + sound, top right */}
            {!failed && (
                <div className="absolute right-6 top-6 flex items-center gap-2">
                    <div className="relative grid grid-cols-2 rounded-lg border p-0.5"
                        style={{ borderColor: 'rgba(242,235,224,0.28)' }}>
                        <span aria-hidden className="absolute bottom-0.5 top-0.5 rounded-md"
                            style={{
                                left: 2, width: 'calc(50% - 2px)',
                                transform: layoutMode === 'studio' ? 'translateX(100%)' : 'translateX(0)',
                                transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                background: 'rgba(242,235,224,0.16)',
                            }} />
                        <button type="button" onClick={() => switchLayout('concept')}
                            aria-pressed={layoutMode === 'concept'}
                            className="relative z-10 rounded-md px-3 py-1.5 text-[11.5px] font-medium"
                            style={{ color: layoutMode === 'concept' ? ROOM.ink : ROOM.inkSoft }}>
                            Concept space
                        </button>
                        <button type="button" onClick={() => switchLayout('studio')}
                            aria-pressed={layoutMode === 'studio'}
                            className="relative z-10 rounded-md px-3 py-1.5 text-[11.5px] font-medium"
                            style={{ color: layoutMode === 'studio' ? ROOM.ink : ROOM.inkSoft }}>
                            Signal chain
                        </button>
                    </div>
                    <button type="button" onClick={toggleSound}
                        aria-pressed={soundOn}
                        className="rounded-lg border px-3 py-1.5 text-[11.5px] font-medium"
                        style={{
                            borderColor: 'rgba(242,235,224,0.28)',
                            color: soundOn ? ROOM.bgBase : ROOM.inkSoft,
                            background: soundOn ? ROOM.brass : 'transparent',
                        }}>
                        {soundOn ? 'Sound on' : 'Sound off'}
                    </button>
                </div>
            )}

            {/* exam routes drawer */}
            {!failed && routesOpen && !routeState && (
                <div className="absolute right-6 top-20 w-[min(320px,calc(100vw-48px))] rounded-xl border p-4 shadow-lg"
                    style={{ background: ROOM.paper, borderColor: ROOM.line }}>
                    <div className="text-[11px] uppercase tracking-wide" style={{ color: '#6B6F5C' }}>
                        Exam routes — real Question 6s
                    </div>
                    <p className="mt-1 text-[12px] leading-snug" style={{ color: '#6B6F5C' }}>
                        Every 20-marker is a journey across the room, not a visit to one island.
                        Pick a year and watch the path light.
                    </p>
                    <div className="mt-2 divide-y" style={{ borderColor: ROOM.line }}>
                        {examRoutes.map((r, i) => (
                            <button key={r.id} type="button" onClick={() => { setRoutesOpen(false); goRouteStep(i, 0); }}
                                className="block w-full py-2.5 text-left">
                                <div className="text-[14px] font-semibold"
                                    style={{ fontFamily: 'var(--font-fraunces), Georgia, serif', color: ROOM.paperInk }}>
                                    {r.year} — {r.title}
                                </div>
                                <div className="mt-0.5 text-[11.5px] leading-snug" style={{ color: '#6B6F5C' }}>
                                    {r.stem}
                                </div>
                                <div className="mt-0.5 text-[10.5px]"
                                    style={{ color: '#9B7530', fontFamily: 'var(--font-geist-mono), monospace' }}>
                                    {r.marks} marks · {r.steps.length} steps
                                </div>
                            </button>
                        ))}
                    </div>
                    <div className="mt-2 border-t pt-2 text-[10.5px]" style={{ borderColor: ROOM.line, color: '#6B6F5C' }}>
                        Drawn from the Principal Examiner&rsquo;s reports, 2019–2023.
                    </div>
                </div>
            )}

            {/* controls hint / now hearing, bottom right */}
            {!failed && !bottomRail && (
                <div className="pointer-events-none absolute bottom-5 right-6 max-w-[300px] text-right text-[11px] leading-relaxed"
                    style={{ color: ROOM.inkSoft, opacity: 0.85 }}>
                    {nowHearing ? (
                        <span style={{ color: ROOM.brass }}>You&rsquo;re hearing: {nowHearing}.</span>
                    ) : (
                        <>
                            drag to turn the room · scroll to zoom · ← → walk the spec<br />
                            grab any node and pull — the map moves with it
                            {soundOn && <><br />hover a green, gold or blue topic to hear it</>}
                        </>
                    )}
                </div>
            )}

            {/* index card — a topic is one of 23 headings in the spec, so it
                earns a fuller card than a single idea inside one */}
            {cardNode && (
                <div
                    className="absolute bottom-6 left-6 rounded-xl border shadow-lg"
                    style={{
                        background: ROOM.paper, borderColor: ROOM.line,
                        width: cardNode.kind === 'topic'
                            ? 'min(352px, calc(100vw - 48px))'
                            : 'min(300px, calc(100vw - 48px))',
                        padding: cardNode.kind === 'topic' ? '18px 18px 16px' : '16px',
                    }}
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
                    <div className={cardNode.kind === 'topic' ? 'mt-1 text-[21px] font-semibold leading-tight' : 'mt-0.5 text-[16px] font-semibold'}
                        style={{ fontFamily: 'var(--font-fraunces), Georgia, serif', color: ROOM.paperInk }}>
                        {cardNode.label}
                    </div>
                    {cardNode.blurb && (
                        <p className={cardNode.kind === 'topic' ? 'mt-1.5 text-[13px] leading-snug' : 'mt-1 text-[12.5px] leading-snug'}
                            style={{ color: cardNode.kind === 'topic' ? '#55594A' : '#6B6F5C' }}>
                            {/* curated blurbs already punctuate; topic lines do not */}
                            {/\.$/.test(cardNode.blurb) ? cardNode.blurb : `${cardNode.blurb}.`}
                        </p>
                    )}

                    {cardNode.kind === 'topic' && cardNode.teaches?.length > 0 && (
                        <div className="mt-3 border-t pt-2.5" style={{ borderColor: ROOM.line }}>
                            <div className="text-[10.5px] uppercase tracking-wide" style={{ color: '#8A6430' }}>
                                What you&rsquo;ll learn
                            </div>
                            <ul className="mt-1.5 space-y-1">
                                {cardNode.teaches.map((t) => (
                                    <li key={t} className="flex gap-2 text-[12.5px] leading-snug"
                                        style={{ color: '#55594A' }}>
                                        <span aria-hidden style={{ color: topicInk(cardNode.parent) }}>—</span>
                                        <span>{t}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {cardNode.kind === 'topic' && topicChildren && (
                        <div className="mt-3 border-t pt-2 text-[11px] leading-snug"
                            style={{ borderColor: ROOM.line, color: '#6B6F5C' }}>
                            <span style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
                                {topicChildren.count} ideas in the map
                            </span>
                            {topicChildren.shared.length > 0 && (
                                <>
                                    {' · '}
                                    <span style={{ color: '#9B7530' }}>
                                        {topicChildren.shared.length} shared with another topic
                                    </span>
                                    <div className="mt-0.5" style={{ color: '#9B7530' }}>
                                        {topicChildren.shared.join(' · ')}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {cardNode.kind === 'topic'
                        ? <TopicWayOut dest={cardNode.destination} />
                        : cardNode.url && (
                            <a href={cardNode.url}
                                className="mt-2.5 inline-block text-[13px] font-medium"
                                style={{ color: ROOM.field }}>
                                Open this topic →
                            </a>
                        )}
                </div>
            )}

            {/* spec-walk chip */}
            {walkTopic && !bottomRail && (
                <div className="absolute inset-x-0 bottom-6 flex justify-center px-4">
                    <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border px-4 py-2.5 shadow-lg"
                        style={{ background: ROOM.paper, borderColor: ROOM.line }}>
                        <button type="button" aria-label="Previous topic" onClick={() => stepWalk(-1)}
                            disabled={walkIdx === 0}
                            className="rounded-md px-2 py-1 text-[15px] disabled:opacity-30"
                            style={{ color: ROOM.field }}>←</button>
                        <div className="text-center">
                            <div className="text-[13px] font-semibold" style={{ color: ROOM.paperInk }}>
                                Walking the spec · {walkTopic.parent} {walkTopic.label}
                            </div>
                            <div className="mt-0.5 text-[10.5px] tracking-wide"
                                style={{ color: '#6B6F5C', fontFamily: 'var(--font-geist-mono), monospace' }}>
                                {walkIdx + 1} of {specTopics.length} · ← → to move · Esc to stop
                            </div>
                        </div>
                        <button type="button" aria-label="Next topic" onClick={() => stepWalk(1)}
                            disabled={walkIdx === specTopics.length - 1}
                            className="rounded-md px-2 py-1 text-[15px] disabled:opacity-30"
                            style={{ color: ROOM.field }}>→</button>
                    </div>
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
                        <button type="button" onClick={backToRoom}
                            className="ml-1 rounded-md border px-2.5 py-1 text-[11.5px]"
                            style={{ color: '#6B6F5C', borderColor: ROOM.line }}>
                            Esc
                        </button>
                    </div>
                </div>
            )}

            {/* exam route rail */}
            {route && routeStep && (
                <div className="absolute inset-x-0 bottom-6 flex justify-center px-4">
                    <div
                        className="pointer-events-auto flex max-w-[620px] items-center gap-3 rounded-2xl border px-4 py-3 shadow-lg"
                        style={{ background: ROOM.paper, borderColor: ROOM.line }}
                    >
                        <button type="button" aria-label="Previous step"
                            onClick={() => goRouteStep(routeState.idx, routeState.step - 1)}
                            disabled={routeState.step === 0}
                            className="rounded-md px-2 py-1 text-[15px] disabled:opacity-30"
                            style={{ color: ROOM.field }}>←</button>
                        <div className="min-w-0 flex-1">
                            <p aria-live="polite" className="text-[13.5px] leading-snug" style={{ color: ROOM.paperInk }}>
                                {routeStep.caption}
                            </p>
                            <p className="mt-1 text-[11px] italic leading-snug" style={{ color: '#8A6430' }}>
                                {routeStep.note}
                            </p>
                            <div className="mt-1 text-[10.5px] tracking-wide"
                                style={{ color: '#6B6F5C', fontFamily: 'var(--font-geist-mono), monospace' }}>
                                Step {routeState.step + 1} of {route.steps.length} · {route.year} — {route.title} · {route.marks} marks
                            </div>
                        </div>
                        <button type="button" aria-label="Next step"
                            onClick={() => goRouteStep(routeState.idx, routeState.step + 1)}
                            disabled={routeState.step === route.steps.length - 1}
                            className="rounded-md px-2 py-1 text-[15px] disabled:opacity-30"
                            style={{ color: ROOM.field }}>→</button>
                        <button type="button" onClick={backToRoom}
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
