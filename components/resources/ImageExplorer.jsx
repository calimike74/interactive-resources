'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { theme, typography, spacing, borderRadius, glass } from '@/lib/theme';
import DawToggle, { useDawChoice } from '@/components/ui/DawToggle';

const t = theme.light;

const CABLE_DRAGGING_COLOR = 'rgba(100, 100, 100, 0.4)';

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Parse text containing {{X}} tokens into React elements with inline coloured badges
function renderWithRefs(text, hotspots) {
    const hotspotMap = {};
    hotspots.forEach(h => { hotspotMap[h.label] = h; });

    const parts = text.split(/(\{\{[A-G]\}\})/g);
    return parts.map((part, i) => {
        const match = part.match(/^\{\{([A-G])\}\}$/);
        if (!match) return part;
        const hs = hotspotMap[match[1]];
        if (!hs) return part;
        return (
            <span key={i} style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: hs.color,
                color: '#fff',
                fontSize: '10px',
                fontWeight: 700,
                lineHeight: 1,
                verticalAlign: 'middle',
                margin: '0 2px',
                flexShrink: 0,
                boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
            }} title={hs.name}>
                {match[1]}
            </span>
        );
    });
}

// WO-10: configs may carry a `logic` block — a complete Logic Pro peer of
// the Ableton default. When present, a DAW toggle renders above the
// explorer and the core remounts (key) on switch so cable connections
// never dangle across devices. Configs without a logic block behave
// exactly as before.
export default function ImageExplorer({ logic, ...ableton }) {
    const [daw, choose] = useDawChoice();
    const useLogic = Boolean(logic) && daw === 'logic';
    const active = useLogic ? { ...ableton, ...logic } : ableton;
    return (
        <div>
            {logic && (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <DawToggle value={useLogic ? 'logic' : 'ableton'} onChange={choose} />
                </div>
            )}
            <ImageExplorerCore key={useLogic ? 'logic' : 'ableton'} {...active} />
        </div>
    );
}

function ImageExplorerCore({ imageSrc, imageAlt, hotspots, title, instruction, daw, dawNote }) {
    const [connections, setConnections] = useState([]);
    const [dragging, setDragging] = useState(null);
    const [hoveredHotspot, setHoveredHotspot] = useState(null);
    const [connectorPaths, setConnectorPaths] = useState([]);
    const [isMobile, setIsMobile] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [boxPos, setBoxPos] = useState(null);
    const [boxDragging, setBoxDragging] = useState(null);
    const [expandedQ, setExpandedQ] = useState({}); // { hotspotId: questionIndex }
    const [selectedId, setSelectedId] = useState(null); // hotspot id for detail panel
    const [kbSelectMode, setKbSelectMode] = useState(false); // keyboard selection mode

    const pageRef = useRef(null);
    const imageContainerRef = useRef(null);
    const zoneRefs = useRef({});
    const connectorBoxRef = useRef(null);
    const plugRef = useRef(null);
    const cardRefs = useRef({});
    const pathRefs = useRef({});
    const animationKeyRef = useRef(0);

    const connectedIds = new Set(connections.map(c => c.hotspotId));

    // Initialise box position once page renders.
    // On narrow viewports there's no room beside the image, so the card goes
    // below the image (and stays clamped inside the viewport) instead of
    // floating off the right edge.
    useEffect(() => {
        if (!boxPos && imageContainerRef.current) {
            const rect = imageContainerRef.current.getBoundingClientRect();
            const mobile = window.innerWidth < 768;
            const boxWidth = mobile ? 280 : 340;
            const margin = 16;
            if (mobile) {
                setBoxPos({
                    x: Math.max(margin, Math.min(rect.left, window.innerWidth - boxWidth - margin)),
                    y: rect.bottom + margin,
                });
            } else {
                setBoxPos({
                    x: rect.right + 20,
                    y: Math.min(Math.max(rect.top + 20, 20), window.innerHeight - 200),
                });
            }
        }
    }, [imageLoaded, boxPos]);

    // Responsive check
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // Start cable drag from the plug
    const handlePlugMouseDown = useCallback((e) => {
        e.preventDefault();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        setDragging({ startX: clientX, startY: clientY, mouseX: clientX, mouseY: clientY });
    }, []);

    // Mouse/touch move during cable drag
    useEffect(() => {
        if (!dragging) return;

        const handleMove = (e) => {
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            setDragging(prev => ({ ...prev, mouseX: clientX, mouseY: clientY }));

            // Check if hovering over a zone
            let found = null;
            for (const hs of hotspots) {
                const el = zoneRefs.current[hs.id];
                if (!el) continue;
                const r = el.getBoundingClientRect();
                if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) {
                    found = hs.id;
                    break;
                }
            }
            setHoveredHotspot(found);
        };

        const handleUp = () => {
            if (hoveredHotspot && !connectedIds.has(hoveredHotspot)) {
                setConnections(prev => [...prev, { id: Date.now(), hotspotId: hoveredHotspot }]);
                setSelectedId(hoveredHotspot);
                animationKeyRef.current += 1;
            }
            setDragging(null);
            setHoveredHotspot(null);
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('touchend', handleUp);
        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleUp);
        };
    }, [dragging, hoveredHotspot, hotspots, connectedIds]);

    // Box dragging (move the floating box)
    useEffect(() => {
        if (!boxDragging) return;

        const handleMove = (e) => {
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            setBoxPos({
                x: clientX - boxDragging.offsetX,
                y: clientY - boxDragging.offsetY,
            });
        };

        const handleUp = () => setBoxDragging(null);

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('touchend', handleUp);
        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleUp);
        };
    }, [boxDragging]);

    const handleBoxMouseDown = useCallback((e) => {
        if (e.target.closest('[data-plug]') || e.target.closest('[data-close]')) return;
        e.preventDefault();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const box = connectorBoxRef.current;
        if (!box) return;
        const rect = box.getBoundingClientRect();
        setBoxDragging({
            offsetX: clientX - rect.left,
            offsetY: clientY - rect.top,
        });
    }, []);

    const disconnect = useCallback((hotspotId) => {
        setConnections(prev => prev.filter(c => c.hotspotId !== hotspotId));
        setSelectedId(prev => prev === hotspotId ? null : prev);
        animationKeyRef.current += 1;
    }, []);

    // Keyboard: Enter/Space on plug enters selection mode; Enter/Space on a zone connects it
    const handlePlugKeyDown = useCallback((e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setKbSelectMode(prev => !prev);
        }
    }, []);

    const handleZoneKeyDown = useCallback((e, hotspotId) => {
        if (!kbSelectMode) return;
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setConnections(prev => {
                if (prev.some(c => c.hotspotId === hotspotId)) return prev;
                animationKeyRef.current += 1;
                return [...prev, { id: Date.now(), hotspotId }];
            });
            setSelectedId(hotspotId);
            setKbSelectMode(false);
        }
    }, [kbSelectMode]);

    // Entering selection mode moves focus straight to the first unconnected zone,
    // instead of leaving it on the plug — otherwise the next Tab press walks
    // through whatever comes after the plug in DOM order (page footer, cookie
    // banner, etc.) rather than reaching a zone at all.
    useEffect(() => {
        if (!kbSelectMode) return;
        const connectedNow = new Set(connections.map(c => c.hotspotId));
        const firstAvailable = hotspots.find(h => !connectedNow.has(h.id));
        if (firstAvailable) {
            zoneRefs.current[firstAvailable.id]?.focus();
        }
        // Only re-run when selection mode toggles on — connections/hotspots are
        // read fresh from this render's closure at that moment.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [kbSelectMode]);

    // Calculate SVG paths between zones and their matching explanation cards
    const recalcPaths = useCallback(() => {
        if (!pageRef.current || !connectorBoxRef.current) return;
        const pageRect = pageRef.current.getBoundingClientRect();
        const boxRect = connectorBoxRef.current.getBoundingClientRect();
        const newPaths = [];

        // Single entry point on the left edge of the box
        const bx = boxRect.left - pageRect.left;
        const by = boxRect.top + 24 - pageRect.top;

        connections.forEach(conn => {
            const zone = zoneRefs.current[conn.hotspotId];
            if (!zone) return;
            const zRect = zone.getBoundingClientRect();
            const mx = zRect.left + zRect.width / 2 - pageRect.left;
            const my = zRect.top - pageRect.top; // top edge of zone, above the labels

            const hs = hotspots.find(h => h.id === conn.hotspotId);
            const color = hs?.color || '#888';

            const midX = (mx + bx) / 2;
            const d = `M ${mx},${my} C ${midX},${my} ${midX},${by} ${bx},${by}`;

            newPaths.push({ id: conn.hotspotId, d, color });
        });

        setConnectorPaths(newPaths);
    }, [connections, hotspots]);

    useEffect(() => {
        recalcPaths();
    }, [recalcPaths, imageLoaded, boxPos]);

    useEffect(() => {
        if (!pageRef.current) return;
        const observer = new ResizeObserver(() => recalcPaths());
        observer.observe(pageRef.current);

        // Recalc on scroll since the floating box is position:fixed
        const handleScroll = () => recalcPaths();
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            observer.disconnect();
            window.removeEventListener('scroll', handleScroll);
        };
    }, [recalcPaths]);

    // Animate path draw-on
    useEffect(() => {
        connectorPaths.forEach(({ id }) => {
            const pathEl = pathRefs.current[id];
            if (pathEl) {
                const length = pathEl.getTotalLength();
                pathEl.style.strokeDasharray = length;
                pathEl.style.strokeDashoffset = length;
                pathEl.getBoundingClientRect();
                pathEl.style.transition = 'stroke-dashoffset 0.6s ease-out';
                pathEl.style.strokeDashoffset = '0';
            }
        });
    }, [connectorPaths]);

    // Dragging cable SVG path (from plug to mouse)
    const getDraggingPath = () => {
        if (!dragging || !pageRef.current || !plugRef.current) return null;
        const pageRect = pageRef.current.getBoundingClientRect();
        const plugRect = plugRef.current.getBoundingClientRect();
        const sx = plugRect.left + plugRect.width / 2 - pageRect.left;
        const sy = plugRect.top + plugRect.height / 2 - pageRect.top;
        const ex = dragging.mouseX - pageRect.left;
        const ey = dragging.mouseY - pageRect.top;
        const midX = (sx + ex) / 2;
        return `M ${sx},${sy} C ${midX},${sy} ${midX},${ey} ${ex},${ey}`;
    };

    const connectedHotspots = hotspots.filter(h => connectedIds.has(h.id));

    return (
        <div ref={pageRef} style={{
            padding: `${spacing[6]} ${spacing[4]}`,
            maxWidth: '1200px',
            margin: '0 auto',
            position: 'relative',
            minHeight: '80vh',
        }}>
            <style>{`
                @keyframes zonePulse {
                    0%, 100% { opacity: 0.55; }
                    50% { opacity: 0.85; }
                }
                @keyframes fadeSlideIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes plugGlow {
                    0%, 100% { box-shadow: 0 0 4px rgba(100, 100, 100, 0.3); }
                    50% { box-shadow: 0 0 12px rgba(100, 100, 100, 0.6); }
                }
            `}</style>

            {/* Title and instruction */}
            {title && (
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], flexWrap: 'wrap', marginBottom: spacing[2] }}>
                    <h1 style={{
                        fontSize: typography.size['2xl'],
                        fontWeight: typography.weight.bold,
                        color: t.text.primary,
                        margin: 0,
                        fontFamily: 'var(--font-fraunces), Georgia, serif',
                    }}>{title}</h1>
                    {daw && (
                        <span style={{
                            fontSize: typography.size.xs,
                            fontWeight: typography.weight.semibold,
                            color: t.text.secondary,
                            background: t.bg.tertiary,
                            borderRadius: borderRadius.full,
                            padding: `${spacing[1]} ${spacing[3]}`,
                            fontFamily: typography.fontFamily,
                        }}>{daw} device</span>
                    )}
                </div>
            )}
            {dawNote && (
                <p style={{
                    fontSize: typography.size.sm,
                    color: t.text.tertiary,
                    marginBottom: spacing[3],
                    fontFamily: typography.fontFamily,
                    lineHeight: typography.lineHeight.relaxed,
                }}>
                    {dawNote}
                </p>
            )}
            {instruction && (
                <p style={{
                    fontSize: typography.size.base,
                    color: t.text.secondary,
                    marginBottom: spacing[6],
                    fontFamily: typography.fontFamily,
                }}>
                    {instruction}
                </p>
            )}

            {/* Image — completely pristine, no overlays */}
            <div
                ref={imageContainerRef}
                style={{
                    maxWidth: isMobile ? '100%' : '65%',
                }}
            >
                <div style={{
                    borderRadius: `${borderRadius.xl} ${borderRadius.xl} 0 0`,
                    overflow: 'hidden',
                    background: t.bg.tertiary,
                    boxShadow: t.shadow.md,
                }}>
                    <img
                        src={imageSrc}
                        alt={imageAlt}
                        onLoad={() => setImageLoaded(true)}
                        draggable={false}
                        style={{ display: 'block', width: '100%', height: 'auto' }}
                    />
                </div>

                {/* Annotation strip directly below the image */}
                <div style={{
                    display: 'flex',
                    height: 48,
                    borderRadius: `0 0 ${borderRadius.xl} ${borderRadius.xl}`,
                    overflow: 'hidden',
                    boxShadow: t.shadow.sm,
                }}>
                    {hotspots.map((hotspot, i) => {
                        const isConnected = connectedIds.has(hotspot.id);
                        const isHovered = hoveredHotspot === hotspot.id;

                        return (
                            <div
                                key={hotspot.id}
                                ref={el => { zoneRefs.current[hotspot.id] = el; }}
                                role={kbSelectMode && !isConnected ? 'button' : undefined}
                                tabIndex={kbSelectMode && !isConnected ? 0 : undefined}
                                aria-label={hotspot.name}
                                title={hotspot.name}
                                onKeyDown={(e) => handleZoneKeyDown(e, hotspot.id)}
                                style={{
                                    flex: hotspot.zone.width,
                                    height: '100%',
                                    background: hotspot.color,
                                    opacity: isConnected ? 1 : isHovered ? 0.95 : undefined,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6,
                                    padding: '0 4px',
                                    animation: (!isConnected && !isHovered) ? 'zonePulse 2.5s ease-in-out infinite' : 'none',
                                    transition: 'opacity 0.2s ease',
                                    cursor: kbSelectMode && !isConnected ? 'pointer' : 'default',
                                    borderRight: i < hotspots.length - 1 ? '2px solid rgba(255,255,255,0.4)' : 'none',
                                    overflow: 'hidden',
                                    outline: kbSelectMode && !isConnected ? '2px solid rgba(255,255,255,0.7)' : 'none',
                                }}
                            >
                                <span style={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.92)',
                                    color: hotspot.color,
                                    fontSize: typography.size.xs,
                                    fontWeight: typography.weight.bold,
                                    fontFamily: typography.fontFamily,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                                }}>
                                    {hotspot.label}
                                </span>
                                {/* On narrow viewports there isn't room to show the name without
                                    truncating to unreadable fragments — the badge + colour + title
                                    tooltip carry identity instead; the full name still appears in
                                    the connected-items list and detail panel once a zone connects. */}
                                {!isMobile && (
                                    <span style={{
                                        color: '#FFFFFF',
                                        fontSize: '11px',
                                        fontWeight: typography.weight.semibold,
                                        fontFamily: typography.fontFamily,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                                        lineHeight: 1.2,
                                    }}>
                                        {hotspot.name}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Level bracket annotations below the strip */}
                {(() => {
                    // Build contiguous runs of the same level
                    const totalWidth = hotspots.reduce((sum, h) => sum + h.zone.width, 0);
                    const runs = [];
                    let cumLeft = 0;
                    hotspots.forEach(h => {
                        const pctLeft = (cumLeft / totalWidth) * 100;
                        const pctWidth = (h.zone.width / totalWidth) * 100;
                        const level = h.level || 'foundation';
                        const lastRun = runs[runs.length - 1];
                        if (lastRun && lastRun.level === level) {
                            lastRun.max = pctLeft + pctWidth;
                            lastRun.labels.push(h.label);
                        } else {
                            runs.push({ level, min: pctLeft, max: pctLeft + pctWidth, labels: [h.label] });
                        }
                        cumLeft += h.zone.width;
                    });

                    const bracketColor = 'rgba(0,0,0,0.3)';
                    const bracketHeight = 10;
                    const labelGap = 4;

                    return (
                        <div style={{ position: 'relative', height: 42, marginTop: 6 }}>
                            {runs.map((run, i) => {
                                const isFoundation = run.level === 'foundation';
                                return (
                                    <div key={i} style={{
                                        position: 'absolute',
                                        left: `${run.min}%`,
                                        width: `${run.max - run.min}%`,
                                        top: 0,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                    }}>
                                        {/* SVG bracket shape */}
                                        <svg
                                            width="100%"
                                            height={bracketHeight + labelGap}
                                            viewBox={`0 0 100 ${bracketHeight + labelGap}`}
                                            preserveAspectRatio="none"
                                            style={{ display: 'block', overflow: 'visible' }}
                                        >
                                            <line x1="2" y1="0" x2="2" y2={bracketHeight} stroke={bracketColor} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                                            <line x1="2" y1={bracketHeight} x2="98" y2={bracketHeight} stroke={bracketColor} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                                            <line x1="98" y1="0" x2="98" y2={bracketHeight} stroke={bracketColor} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                                            <line x1="50" y1={bracketHeight} x2="50" y2={bracketHeight + labelGap} stroke={bracketColor} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                                        </svg>
                                        {/* Level label */}
                                        <span style={{
                                            fontSize: '10px',
                                            fontWeight: typography.weight.semibold,
                                            fontFamily: typography.fontFamily,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.06em',
                                            color: isFoundation ? '#166534' : '#9A3412',
                                            background: isFoundation ? '#F0FDF4' : '#FFF7ED',
                                            padding: '2px 10px',
                                            borderRadius: '8px',
                                            marginTop: 2,
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {isFoundation ? 'Foundation' : 'Advanced'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    );
                })()}
            </div>

            {/* Detail panel — full description + guided questions for selected control */}
            {selectedId && connectedIds.has(selectedId) && (() => {
                const hotspot = hotspots.find(h => h.id === selectedId);
                if (!hotspot) return null;
                const isFoundation = hotspot.level === 'foundation';
                const activeQ = expandedQ[hotspot.id];

                return (
                    <div style={{
                        maxWidth: isMobile ? '100%' : '65%',
                        marginTop: spacing[4],
                        background: '#FFFFFF',
                        borderRadius: borderRadius.xl,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
                        overflow: 'hidden',
                        display: 'flex',
                        animation: 'fadeSlideIn 0.3s ease-out',
                    }}>
                        {/* Colour accent stripe */}
                        <div style={{ width: 5, flexShrink: 0, background: hotspot.color }} />
                        <div style={{ flex: 1, padding: spacing[5] }}>
                            {/* Header */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: spacing[2],
                                marginBottom: spacing[3],
                            }}>
                                <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 28,
                                    height: 28,
                                    borderRadius: '50%',
                                    background: hotspot.color,
                                    color: '#fff',
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    fontFamily: typography.fontFamily,
                                    flexShrink: 0,
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                                }}>
                                    {hotspot.label}
                                </span>
                                <h3 style={{
                                    fontSize: typography.size.lg,
                                    fontWeight: typography.weight.bold,
                                    color: t.text.primary,
                                    fontFamily: 'var(--font-fraunces), Georgia, serif',
                                    margin: 0,
                                    flex: 1,
                                    letterSpacing: '-0.01em',
                                }}>
                                    {hotspot.name}
                                </h3>
                                <span style={{
                                    fontSize: '10px',
                                    fontWeight: typography.weight.semibold,
                                    fontFamily: typography.fontFamily,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    padding: '3px 10px',
                                    borderRadius: '10px',
                                    background: isFoundation ? '#F0FDF4' : '#FFF7ED',
                                    color: isFoundation ? '#166534' : '#9A3412',
                                }}>
                                    {isFoundation ? 'Foundation' : 'Advanced'}
                                </span>
                                <button type="button"
                                    onClick={() => setSelectedId(null)}
                                    aria-label="Close detail panel"
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: t.text.tertiary,
                                        fontSize: typography.size.lg,
                                        padding: spacing[1],
                                        lineHeight: 1,
                                    }}
                                >
                                    &times;
                                </button>
                            </div>

                            {/* Description */}
                            <p style={{
                                fontSize: typography.size.sm,
                                color: t.text.secondary,
                                fontFamily: typography.fontFamily,
                                lineHeight: 1.65,
                                margin: 0,
                            }}>
                                {renderWithRefs(hotspot.description, hotspots)}
                            </p>

                            {/* Guided questions */}
                            {hotspot.questions && hotspot.questions.length > 0 && (
                                <div style={{ marginTop: spacing[4] }}>
                                    <div style={{
                                        fontSize: '11px',
                                        fontWeight: typography.weight.semibold,
                                        color: t.text.tertiary,
                                        fontFamily: typography.fontFamily,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        marginBottom: spacing[3],
                                    }}>
                                        Common questions
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {hotspot.questions.map((item, qi) => (
                                            <div key={qi}>
                                                <button type="button"
                                                    onClick={() => setExpandedQ(prev => ({
                                                        ...prev,
                                                        [hotspot.id]: prev[hotspot.id] === qi ? null : qi,
                                                    }))}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'flex-start',
                                                        gap: 8,
                                                        width: '100%',
                                                        textAlign: 'left',
                                                        background: activeQ === qi ? hexToRgba(hotspot.color, 0.04) : 'transparent',
                                                        border: `1px solid ${activeQ === qi ? hexToRgba(hotspot.color, 0.15) : 'rgba(0,0,0,0.06)'}`,
                                                        borderRadius: '10px',
                                                        padding: '10px 14px',
                                                        cursor: 'pointer',
                                                        fontFamily: typography.fontFamily,
                                                        fontSize: '13px',
                                                        fontWeight: typography.weight.medium,
                                                        color: t.text.primary,
                                                        lineHeight: 1.45,
                                                        transition: 'transform, opacity, background-color, color, border-color, box-shadow 0.15s ease',
                                                    }}
                                                >
                                                    <span style={{
                                                        color: hotspot.color,
                                                        fontSize: '13px',
                                                        lineHeight: 1.45,
                                                        flexShrink: 0,
                                                        fontWeight: 700,
                                                    }}>?</span>
                                                    {item.q}
                                                </button>
                                                {activeQ === qi && (
                                                    <div style={{
                                                        padding: '12px 16px',
                                                        fontSize: '13px',
                                                        color: t.text.secondary,
                                                        fontFamily: typography.fontFamily,
                                                        lineHeight: 1.6,
                                                        borderLeft: `3px solid ${hexToRgba(hotspot.color, 0.3)}`,
                                                        marginLeft: 16,
                                                        marginTop: 6,
                                                        animation: 'fadeSlideIn 0.2s ease-out',
                                                    }}>
                                                        {renderWithRefs(item.a, hotspots)}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })()}

            {/* SVG overlay for all connector lines */}
            <svg style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 25,
                overflow: 'visible',
            }}>
                {/* Established connections */}
                {connectorPaths.map(({ id, d, color }) => (
                    <path
                        key={`${id}-${animationKeyRef.current}`}
                        ref={el => { pathRefs.current[id] = el; }}
                        d={d}
                        fill="none"
                        stroke={color}
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        opacity={0.8}
                    />
                ))}

                {/* Active dragging cable */}
                {dragging && getDraggingPath() && (
                    <path
                        d={getDraggingPath()}
                        fill="none"
                        stroke={hoveredHotspot
                            ? (hotspots.find(h => h.id === hoveredHotspot)?.color || '#888')
                            : CABLE_DRAGGING_COLOR}
                        strokeWidth={hoveredHotspot ? 3 : 2}
                        strokeLinecap="round"
                        strokeDasharray={hoveredHotspot ? 'none' : '8 4'}
                        opacity={0.9}
                    />
                )}
            </svg>

            {/* Floating connector box */}
            {boxPos && (
                <div
                    ref={connectorBoxRef}
                    onMouseDown={handleBoxMouseDown}
                    onTouchStart={handleBoxMouseDown}
                    style={{
                        position: 'fixed',
                        left: boxPos.x,
                        top: boxPos.y,
                        width: isMobile ? 280 : 340,
                        zIndex: 30,
                        background: glass.bg,
                        backdropFilter: `blur(${glass.blur})`,
                        WebkitBackdropFilter: `blur(${glass.blur})`,
                        border: `1px solid ${glass.border}`,
                        borderRadius: borderRadius['2xl'],
                        boxShadow: glass.shadowHover,
                        cursor: boxDragging ? 'grabbing' : 'grab',
                        userSelect: 'none',
                        touchAction: 'none',
                    }}
                >
                    {/* Header with drag handle + plug */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing[3],
                        padding: `${spacing[3]} ${spacing[4]}`,
                        borderBottom: `1px solid ${t.border.subtle}`,
                    }}>
                        {/* Plug connector point */}
                        <div
                            ref={plugRef}
                            data-plug="true"
                            tabIndex={0}
                            role="button"
                            aria-label={kbSelectMode ? 'Selection mode active — press Enter or Space on a zone to connect' : 'Connect cable — drag to a zone, or press Enter to enter keyboard selection mode'}
                            onMouseDown={handlePlugMouseDown}
                            onTouchStart={handlePlugMouseDown}
                            onKeyDown={handlePlugKeyDown}
                            style={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                background: kbSelectMode ? '#2563EB' : t.text.secondary,
                                border: '3px solid rgba(255,255,255,0.8)',
                                cursor: 'crosshair',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                animation: connections.length === 0 && !kbSelectMode ? 'plugGlow 2s ease-in-out infinite' : 'none',
                                outline: 'none',
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{
                                fontSize: typography.size.sm,
                                fontWeight: typography.weight.semibold,
                                color: t.text.primary,
                                fontFamily: typography.fontFamily,
                            }}>
                                {dragging ? 'Drop on a coloured zone...' : 'Drag cable to a zone'}
                            </div>
                            <div style={{
                                fontSize: typography.size.xs,
                                color: t.text.tertiary,
                                fontFamily: typography.fontFamily,
                            }}>
                                {connections.length === 0
                                    ? 'Drag from the dot to a colour below the image'
                                    : `${connections.length} of ${hotspots.length} connected`}
                            </div>
                        </div>
                        {/* Grip handle */}
                        <div style={{ color: t.text.tertiary, fontSize: typography.size.base, letterSpacing: '2px' }}>
                            ⋮⋮
                        </div>
                    </div>

                    {/* Compact connected list */}
                    <div style={{
                        maxHeight: 320,
                        overflowY: 'auto',
                        padding: connectedHotspots.length > 0 ? `${spacing[2]} ${spacing[3]}` : 0,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                    }}>
                        {connectedHotspots.length === 0 && (
                            <div style={{
                                padding: `${spacing[5]} ${spacing[4]}`,
                                textAlign: 'center',
                            }}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={t.text.tertiary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto', marginBottom: spacing[2] }}>
                                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                    <path d="M2 17l10 5 10-5" />
                                    <path d="M2 12l10 5 10-5" />
                                </svg>
                                <p style={{
                                    color: t.text.tertiary,
                                    fontSize: typography.size.xs,
                                    fontFamily: typography.fontFamily,
                                    margin: 0,
                                    lineHeight: typography.lineHeight.relaxed,
                                }}>
                                    Drag a cable from the dot above to any coloured zone below the image.
                                </p>
                            </div>
                        )}

                        {connectedHotspots.map(hotspot => {
                            const isSelected = selectedId === hotspot.id;
                            const isFoundation = hotspot.level === 'foundation';

                            return (
                            <button type="button"
                                key={hotspot.id}
                                ref={el => { cardRefs.current[hotspot.id] = el; }}
                                data-close="true"
                                onClick={() => setSelectedId(isSelected ? null : hotspot.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    width: '100%',
                                    padding: '8px 10px',
                                    background: isSelected ? hexToRgba(hotspot.color, 0.06) : '#FFFFFF',
                                    borderTop: `1.5px solid ${isSelected ? hexToRgba(hotspot.color, 0.3) : 'rgba(0,0,0,0.06)'}`,
                                    borderRight: `1.5px solid ${isSelected ? hexToRgba(hotspot.color, 0.3) : 'rgba(0,0,0,0.06)'}`,
                                    borderBottom: `1.5px solid ${isSelected ? hexToRgba(hotspot.color, 0.3) : 'rgba(0,0,0,0.06)'}`,
                                    borderLeft: `4px solid ${hotspot.color}`,
                                    borderRadius: borderRadius.lg,
                                    cursor: 'pointer',
                                    animation: 'fadeSlideIn 0.3s ease-out',
                                    transition: 'transform, opacity, background-color, color, border-color, box-shadow 0.15s ease',
                                    textAlign: 'left',
                                    fontFamily: typography.fontFamily,
                                }}
                            >
                                <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 20,
                                    height: 20,
                                    borderRadius: '50%',
                                    background: hotspot.color,
                                    color: '#fff',
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    flexShrink: 0,
                                }}>
                                    {hotspot.label}
                                </span>
                                <span style={{
                                    flex: 1,
                                    fontSize: '12px',
                                    fontWeight: isSelected ? typography.weight.semibold : typography.weight.medium,
                                    color: t.text.primary,
                                }}>
                                    {hotspot.name}
                                </span>
                                <span style={{
                                    fontSize: '9px',
                                    fontWeight: typography.weight.semibold,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em',
                                    padding: '1px 6px',
                                    borderRadius: '8px',
                                    background: isFoundation ? '#F0FDF4' : '#FFF7ED',
                                    color: isFoundation ? '#166534' : '#9A3412',
                                    flexShrink: 0,
                                }}>
                                    {isFoundation ? 'F' : 'A'}
                                </span>
                                <span
                                    data-close="true"
                                    onClick={(e) => { e.stopPropagation(); disconnect(hotspot.id); }}
                                    style={{
                                        color: t.text.tertiary,
                                        fontSize: '14px',
                                        lineHeight: 1,
                                        cursor: 'pointer',
                                        flexShrink: 0,
                                        padding: '0 2px',
                                    }}
                                >
                                    &times;
                                </span>
                            </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
