'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { theme, typography, borderRadius, spacing } from '@/lib/theme';

// ── Studio Data Model ──────────────────────────────────────────────

const ROOM_COLOURS = {
    'studio-1': '#3B82F6',
    'studio-2': '#5F7058',
    'recital': '#B85A3F',
    'lobby': '#F59E0B',
    'console': '#3A4A35',
    'tla-red7': '#EF4444',
};

const PATCH_BAYS = {
    'PB1': { label: 'RocSoc Room Mic Lines', room: 'studio-1', connectors: 12 },
    'PB1-lobby': { label: 'Lobby Mic Lines', room: 'lobby', connectors: 2 },
    'PB2': { label: 'Patrick Shelley Mic Lines 1-12', room: 'studio-2', connectors: 12 },
    'PB3': { label: 'Patrick Shelley Mic Lines 13-24', room: 'studio-2', connectors: 12 },
    'PB4': { label: 'Recital Hall Mic Lines 1-12', room: 'recital', connectors: 12 },
    'PB5': { label: 'Recital Hall Mic Lines 13-24', room: 'recital', connectors: 9, extras: [{ label: 'TLA C-1 A', room: 'tla-red7' }, { label: 'TLA C-1 B', room: 'tla-red7' }, { label: 'RED 7', room: 'tla-red7' }] },
    'PB6': { label: 'Console Mic Inputs 1-16', room: 'console', connectors: 16 },
    'PB7': { label: 'Console Mic Inputs 17-32', room: 'console', connectors: 16 },
};

const TABS = [
    { id: 'studio-1', label: 'RocSoc Room', bays: ['PB1', 'PB1-lobby'] },
    { id: 'studio-2', label: 'Patrick Shelley', bays: ['PB2', 'PB3'] },
    { id: 'recital', label: 'Recital Hall', bays: ['PB4', 'PB5'] },
    { id: 'lobby', label: 'Lobby', bays: ['PB1-lobby'] },
    { id: 'console', label: 'Console', bays: ['PB6', 'PB7'] },
];

const PB8_INPUTS = 12;
const PB9_OUTPUTS = 24;

// ── Helpers ────────────────────────────────────────────────────────

/** Map PB8 input number (1-12) to Volt unit + input */
function pb8ToVolt(inputNum) {
    if (inputNum >= 1 && inputNum <= 6) {
        return { unit: 1, input: inputNum + 2 }; // inputs 3-8
    }
    if (inputNum >= 7 && inputNum <= 12) {
        return { unit: 2, input: inputNum - 4 }; // inputs 3-8
    }
    return null;
}

/** Get a human-readable label for a connector id like 'PB1-3' or 'PB5-extra-1' */
function connectorLabel(id) {
    if (!id) return '';
    // PB8 inputs
    const pb8Match = id.match(/^PB8-in-(\d+)$/);
    if (pb8Match) return `PB8 Input ${pb8Match[1]}`;
    // Room bay extras
    const extraMatch = id.match(/^(.+)-extra-(\d+)$/);
    if (extraMatch) {
        const bay = PATCH_BAYS[extraMatch[1]];
        if (bay && bay.extras) {
            const idx = parseInt(extraMatch[2], 10);
            return bay.extras[idx] ? bay.extras[idx].label : id;
        }
    }
    // Normal room bay connectors like PB1-3
    const normalMatch = id.match(/^(.+?)-(\d+)$/);
    if (normalMatch) {
        const bay = PATCH_BAYS[normalMatch[1]];
        if (bay) return `${bay.label.split(' ')[0]} ${bay.label.split(' ')[1] || ''} Line ${normalMatch[2]}`.replace(/\s+/g, ' ').trim();
        // Fallback for PB8-out etc
        return id.replace(/-/g, ' ').toUpperCase();
    }
    return id;
}

/** Get room for a connector id */
function connectorRoom(id) {
    if (!id) return null;
    const extraMatch = id.match(/^(.+)-extra-(\d+)$/);
    if (extraMatch) {
        const bay = PATCH_BAYS[extraMatch[1]];
        if (bay && bay.extras) {
            const idx = parseInt(extraMatch[2], 10);
            return bay.extras[idx] ? bay.extras[idx].room : bay.room;
        }
    }
    const normalMatch = id.match(/^(.+?)-(\d+)$/);
    if (normalMatch) {
        const bay = PATCH_BAYS[normalMatch[1]];
        if (bay) return bay.room;
    }
    return null;
}

/** Build signal path string for a connection */
function buildSignalPath(conn) {
    const fromLabel = connectorLabel(conn.from);
    const toLabel = connectorLabel(conn.to);
    const inputNum = parseInt(conn.to.replace('PB8-in-', ''), 10);
    const volt = pb8ToVolt(inputNum);
    const voltLabel = volt ? `Volt Unit ${volt.unit} Input ${volt.input}` : '';
    const dawChannel = volt ? `DAW Channel ${volt.input + (volt.unit - 1) * 8}` : '';
    const parts = [fromLabel, toLabel];
    if (voltLabel) parts.push(voltLabel);
    if (dawChannel) parts.push(dawChannel);
    return parts;
}

// ── Styles ─────────────────────────────────────────────────────────

const t = theme.light;

const styles = {
    page: {
        minHeight: '100vh',
        background: '#f5f4f2',
        fontFamily: typography.fontFamily,
        padding: spacing[6],
    },
    header: {
        textAlign: 'center',
        marginBottom: spacing[6],
    },
    title: {
        fontSize: typography.size['3xl'],
        fontWeight: typography.weight.bold,
        color: t.text.primary,
        marginBottom: spacing[2],
    },
    subtitle: {
        fontSize: typography.size.base,
        color: t.text.secondary,
        maxWidth: '640px',
        margin: '0 auto',
        lineHeight: typography.lineHeight.relaxed,
    },
    tabBar: {
        display: 'flex',
        justifyContent: 'center',
        gap: spacing[2],
        marginBottom: spacing[6],
        flexWrap: 'wrap',
    },
    columnsWrapper: {
        position: 'relative',
        maxWidth: '1200px',
        margin: '0 auto',
        marginBottom: spacing[6],
    },
    columns: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: spacing[4],
    },
    panel: {
        background: '#1a1a1a',
        borderRadius: borderRadius.xl,
        padding: spacing[4],
        minHeight: '320px',
    },
    panelTitle: {
        fontSize: typography.size.sm,
        fontWeight: typography.weight.semibold,
        color: '#fff',
        marginBottom: spacing[3],
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: typography.letterSpacing.wide,
    },
    baySection: {
        background: '#232323',
        borderRadius: borderRadius.lg,
        padding: spacing[3],
        marginBottom: spacing[3],
    },
    bayLabel: {
        fontSize: typography.size.xs,
        color: '#aaa',
        marginBottom: spacing[2],
        fontWeight: typography.weight.medium,
    },
    connectorGrid: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: spacing[1],
    },
    connector: {
        width: '28px',
        height: '28px',
        borderRadius: borderRadius.full,
        border: '2px solid #555',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '10px',
        color: '#999',
        cursor: 'default',
        background: '#2a2a2a',
        transition: 'transform, opacity, background-color, color, border-color, box-shadow 150ms',
        userSelect: 'none',
    },
    svgOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10,
    },
    voltWrapper: {
        maxWidth: '1200px',
        margin: '0 auto',
        marginBottom: spacing[6],
    },
    voltUnit: {
        backgroundColor: '#d4d4d4',
        borderRadius: borderRadius.lg,
        padding: spacing[4],
        backgroundImage: 'url(/images/Volt_U876.png.webp)',
        backgroundSize: '100% auto',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        minHeight: '120px',
        display: 'flex',
        alignItems: 'flex-end',
        position: 'relative',
        marginBottom: spacing[2],
    },
    voltLabel: {
        fontSize: typography.size.sm,
        fontWeight: typography.weight.semibold,
        color: '#fff',
        background: 'rgba(0,0,0,0.7)',
        padding: `${spacing[1]} ${spacing[3]}`,
        borderRadius: borderRadius.md,
    },
    voltIndicators: {
        position: 'absolute',
        top: spacing[2],
        right: spacing[3],
        display: 'flex',
        gap: '4px',
        flexWrap: 'wrap',
        maxWidth: '120px',
    },
    voltDot: {
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        border: '1px solid rgba(255,255,255,0.3)',
    },
    voltLegend: {
        background: '#232323',
        borderRadius: borderRadius.lg,
        padding: `${spacing[3]} ${spacing[4]}`,
        marginTop: spacing[2],
    },
    voltLegendTitle: {
        fontSize: typography.size.xs,
        fontWeight: typography.weight.semibold,
        color: '#888',
        textTransform: 'uppercase',
        letterSpacing: typography.letterSpacing.wide,
        marginBottom: spacing[2],
    },
    clearButton: {
        padding: `${spacing[1]} ${spacing[3]}`,
        borderRadius: borderRadius.md,
        border: '1px solid #555',
        background: 'transparent',
        color: '#999',
        fontSize: typography.size.xs,
        cursor: 'pointer',
        fontFamily: typography.fontFamily,
        transition: 'transform, opacity, background-color, color, border-color, box-shadow 200ms',
    },
    connectionCount: {
        fontSize: typography.size.xs,
        color: '#888',
        fontWeight: typography.weight.medium,
    },
    signalStrip: {
        maxWidth: '1200px',
        margin: '0 auto',
        background: '#232323',
        borderRadius: borderRadius.lg,
        padding: `${spacing[3]} ${spacing[4]}`,
        display: 'flex',
        alignItems: 'center',
        gap: spacing[3],
        flexWrap: 'wrap',
    },
    signalLabel: {
        fontSize: typography.size.sm,
        color: '#888',
        fontWeight: typography.weight.medium,
    },
    signalPlaceholder: {
        fontSize: typography.size.sm,
        color: '#555',
        fontStyle: 'italic',
    },
    signalStep: {
        fontSize: typography.size.sm,
        color: '#ddd',
        fontWeight: typography.weight.medium,
    },
    signalArrow: {
        fontSize: typography.size.sm,
        color: '#666',
    },
    cableTooltip: {
        position: 'absolute',
        background: 'rgba(0,0,0,0.9)',
        color: '#fff',
        fontSize: typography.size.xs,
        padding: `${spacing[1]} ${spacing[2]}`,
        borderRadius: borderRadius.md,
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        zIndex: 20,
        transform: 'translate(-50%, -100%)',
        marginTop: '-8px',
    },
};

// ── Component ──────────────────────────────────────────────────────

export default function PatchBaySimulator() {
    const [activeTab, setActiveTab] = useState('studio-1');
    const [connections, setConnections] = useState([]);
    const [dragging, setDragging] = useState(null); // { from, room, mouseX, mouseY }
    const [hoveredCable, setHoveredCable] = useState(null); // connection index
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const [cablePositions, setCablePositions] = useState([]); // cached cable coords
    const [pulsingConnector, setPulsingConnector] = useState(null); // PB8 input id for pulse
    const [deletedCable, setDeletedCable] = useState(null); // brief flash on delete

    const connectorRefs = useRef(new Map());
    const columnsRef = useRef(null);

    const currentTab = TABS.find((tab) => tab.id === activeTab);
    const activeBays = currentTab ? currentTab.bays : [];
    const roomColour = ROOM_COLOURS[activeTab] || '#888';

    // ── Ref registration ───────────────────────────────────────────
    const setConnectorRef = useCallback((id, el) => {
        if (el) {
            connectorRefs.current.set(id, el);
        } else {
            connectorRefs.current.delete(id);
        }
    }, []);

    // ── Cable position calculation ─────────────────────────────────
    const recalcCablePositions = useCallback(() => {
        if (!columnsRef.current) return;
        const containerRect = columnsRef.current.getBoundingClientRect();
        const positions = connections.map((conn) => {
            const fromEl = connectorRefs.current.get(conn.from);
            const toEl = connectorRefs.current.get(conn.to);
            if (!fromEl || !toEl) return null;
            const fromRect = fromEl.getBoundingClientRect();
            const toRect = toEl.getBoundingClientRect();
            return {
                x1: fromRect.left + fromRect.width / 2 - containerRect.left,
                y1: fromRect.top + fromRect.height / 2 - containerRect.top,
                x2: toRect.left + toRect.width / 2 - containerRect.left,
                y2: toRect.top + toRect.height / 2 - containerRect.top,
            };
        });
        setCablePositions(positions);
    }, [connections]);

    // Recalculate on connections change, tab change, and resize
    useEffect(() => {
        // Small delay to allow DOM to settle after tab change
        const timer = setTimeout(recalcCablePositions, 50);
        return () => clearTimeout(timer);
    }, [recalcCablePositions, activeTab]);

    useEffect(() => {
        const handleResize = () => recalcCablePositions();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [recalcCablePositions]);

    // ── Drag & Drop ────────────────────────────────────────────────
    const isRoomConnector = (id) => {
        // Room connectors are sources (not PB8-in, PB8-out, PB9)
        return id && !id.startsWith('PB8-') && !id.startsWith('PB9');
    };

    const isPB8Input = (id) => {
        return id && id.startsWith('PB8-in-');
    };

    const handleDragStart = useCallback((connectorId, room, e) => {
        e.preventDefault();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        setDragging({ from: connectorId, room, mouseX: clientX, mouseY: clientY });
    }, []);

    useEffect(() => {
        if (!dragging) return;

        const handleMove = (e) => {
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            setDragging((prev) => prev ? { ...prev, mouseX: clientX, mouseY: clientY } : null);
        };

        const handleEnd = (e) => {
            const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
            const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;

            // Check if we landed on a PB8 input
            const el = document.elementFromPoint(clientX, clientY);
            const target = el ? el.closest('[data-connector-id]') : null;
            const targetId = target ? target.getAttribute('data-connector-id') : null;

            if (targetId && isPB8Input(targetId)) {
                setConnections((prev) => {
                    // Prevent duplicate: one source per PB8 input
                    const filtered = prev.filter((c) => c.to !== targetId);
                    return [...filtered, { from: dragging.from, to: targetId, room: dragging.room }];
                });
                // Trigger connection pulse
                setPulsingConnector(targetId);
                setTimeout(() => setPulsingConnector(null), 600);
            }

            setDragging(null);
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleEnd);
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('touchend', handleEnd);

        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleEnd);
        };
    }, [dragging]);

    // ── Delete cable on right-click ────────────────────────────────
    const handleCableRightClick = useCallback((e, idx) => {
        e.preventDefault();
        setDeletedCable(idx);
        setTimeout(() => {
            setConnections((prev) => prev.filter((_, i) => i !== idx));
            setHoveredCable(null);
            setDeletedCable(null);
        }, 200);
    }, []);

    const handleClearAll = useCallback(() => {
        setConnections([]);
        setHoveredCable(null);
    }, []);

    // ── Connector sets for connected state ─────────────────────────
    const connectedSources = new Set(connections.map((c) => c.from));
    const connectedTargets = new Map(); // PB8-in-X -> room colour
    connections.forEach((c) => {
        connectedTargets.set(c.to, ROOM_COLOURS[c.room] || '#10B981');
    });

    // ── Volt input mapping from connections ────────────────────────
    const voltInputs = []; // { unit, input, colour }
    connections.forEach((c) => {
        const inputNum = parseInt(c.to.replace('PB8-in-', ''), 10);
        const volt = pb8ToVolt(inputNum);
        if (volt) {
            voltInputs.push({ ...volt, colour: ROOM_COLOURS[c.room] || '#10B981' });
        }
    });
    const voltUnit1Inputs = voltInputs.filter((vi) => vi.unit === 1);
    const voltUnit2Inputs = voltInputs.filter((vi) => vi.unit === 2);

    // Connection count for PB8 header
    const connectionCount = connections.length;

    // ── Signal path for hovered cable ──────────────────────────────
    const hoveredPath = hoveredCable !== null && connections[hoveredCable]
        ? buildSignalPath(connections[hoveredCable])
        : null;

    // ── Render connectors ──────────────────────────────────────────
    const renderConnectors = (bayId, count, colour, extras, type) => {
        const items = [];
        for (let i = 1; i <= count; i++) {
            const id = `${bayId}-${i}`;
            const isSource = type === 'room';
            const isTarget = type === 'pb8-input';
            const isConnectedSource = connectedSources.has(id);
            const targetColour = connectedTargets.get(id);
            const isDropTarget = isTarget && dragging;

            const connStyle = {
                ...styles.connector,
                borderColor: targetColour || colour,
                cursor: isSource ? 'grab' : (isTarget ? 'crosshair' : 'default'),
            };

            // Connected source: filled background
            if (isConnectedSource && isSource) {
                connStyle.background = colour;
                connStyle.color = '#fff';
                connStyle.borderColor = colour;
            }

            // Connected PB8 input: filled with source room colour
            if (targetColour && isTarget) {
                connStyle.background = targetColour;
                connStyle.color = '#fff';
                connStyle.borderColor = targetColour;
            }

            // Drop target highlight during drag
            if (isDropTarget && !targetColour) {
                connStyle.borderColor = '#10B981';
                connStyle.boxShadow = '0 0 6px rgba(16,185,129,0.5)';
            }

            // Pulse animation on successful connection
            if (pulsingConnector === id) {
                connStyle.animation = 'connectorPulse 0.6s ease-out';
            }

            const handlers = {};
            if (isSource) {
                const room = connectorRoom(id) || 'studio-1';
                handlers.onMouseDown = (e) => handleDragStart(id, room, e);
                handlers.onTouchStart = (e) => handleDragStart(id, room, e);
            }

            items.push(
                <div
                    key={id}
                    data-connector-id={id}
                    ref={(el) => setConnectorRef(id, el)}
                    style={connStyle}
                    className="pbs-connector"
                    {...handlers}
                >
                    {i}
                </div>
            );
        }
        if (extras) {
            extras.forEach((extra, idx) => {
                const id = `${bayId}-extra-${idx}`;
                const extraColour = ROOM_COLOURS[extra.room] || '#888';
                const isConnectedSource = connectedSources.has(id);
                const extraStyle = {
                    ...styles.connector,
                    borderColor: extraColour,
                    cursor: type === 'room' ? 'grab' : 'default',
                };
                if (isConnectedSource) {
                    extraStyle.background = extraColour;
                    extraStyle.color = '#fff';
                }
                const handlers = {};
                if (type === 'room') {
                    handlers.onMouseDown = (e) => handleDragStart(id, extra.room, e);
                    handlers.onTouchStart = (e) => handleDragStart(id, extra.room, e);
                }
                items.push(
                    <div
                        key={id}
                        data-connector-id={id}
                        ref={(el) => setConnectorRef(id, el)}
                        style={extraStyle}
                        title={extra.label}
                        {...handlers}
                    >
                        E{idx + 1}
                    </div>
                );
            });
        }
        return items;
    };

    // ── SVG cable rendering ────────────────────────────────────────
    const renderCables = () => {
        const containerRect = columnsRef.current
            ? columnsRef.current.getBoundingClientRect()
            : null;

        return (
            <svg style={styles.svgOverlay}>
                {/* Existing connections */}
                {cablePositions.map((pos, idx) => {
                    if (!pos) return null;
                    const conn = connections[idx];
                    if (!conn) return null;
                    const colour = ROOM_COLOURS[conn.room] || '#10B981';
                    const midX = (pos.x1 + pos.x2) / 2;
                    const maxY = Math.max(pos.y1, pos.y2);
                    const isHovered = hoveredCable === idx;
                    const isDeleting = deletedCable === idx;
                    return (
                        <g
                            key={`cable-${idx}`}
                            style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                            onMouseEnter={(e) => {
                                setHoveredCable(idx);
                                if (containerRect) {
                                    setTooltipPos({
                                        x: midX,
                                        y: Math.min(pos.y1, pos.y2) - 10,
                                    });
                                }
                            }}
                            onMouseLeave={() => setHoveredCable(null)}
                            onContextMenu={(e) => handleCableRightClick(e, idx)}
                        >
                            {/* Invisible wider hit area */}
                            <path
                                d={`M ${pos.x1} ${pos.y1} Q ${midX} ${maxY + 30} ${pos.x2} ${pos.y2}`}
                                fill="none"
                                stroke="transparent"
                                strokeWidth={14}
                            />
                            {/* Visible cable */}
                            <path
                                d={`M ${pos.x1} ${pos.y1} Q ${midX} ${maxY + 30} ${pos.x2} ${pos.y2}`}
                                fill="none"
                                stroke={isDeleting ? '#EF4444' : colour}
                                strokeWidth={isHovered ? 4 : 3}
                                strokeLinecap="round"
                                opacity={isDeleting ? 0.3 : (isHovered ? 1 : 0.8)}
                                style={isDeleting ? { transition: 'opacity 200ms, stroke 200ms' } : undefined}
                            />
                            {/* Endpoint dots */}
                            <circle cx={pos.x1} cy={pos.y1} r={5} fill={colour} />
                            <circle cx={pos.x2} cy={pos.y2} r={5} fill={colour} />
                        </g>
                    );
                })}

                {/* Live dragging cable */}
                {dragging && containerRect && (() => {
                    const fromEl = connectorRefs.current.get(dragging.from);
                    if (!fromEl) return null;
                    const fromRect = fromEl.getBoundingClientRect();
                    const x1 = fromRect.left + fromRect.width / 2 - containerRect.left;
                    const y1 = fromRect.top + fromRect.height / 2 - containerRect.top;
                    const x2 = dragging.mouseX - containerRect.left;
                    const y2 = dragging.mouseY - containerRect.top;
                    const midX = (x1 + x2) / 2;
                    const maxY = Math.max(y1, y2);
                    const colour = ROOM_COLOURS[dragging.room] || '#888';
                    return (
                        <g>
                            <path
                                d={`M ${x1} ${y1} Q ${midX} ${maxY + 30} ${x2} ${y2}`}
                                fill="none"
                                stroke={colour}
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeDasharray="6 4"
                                opacity={0.7}
                            />
                            <circle cx={x1} cy={y1} r={5} fill={colour} opacity={0.7} />
                        </g>
                    );
                })()}
            </svg>
        );
    };

    return (
        <div style={styles.page} className="pbs-root">
            {/* Responsive + animation styles */}
            <style>{`
                @keyframes connectorPulse {
                    0% { box-shadow: 0 0 0 0 rgba(16,185,129,0.7); }
                    50% { box-shadow: 0 0 12px 4px rgba(16,185,129,0.4); }
                    100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
                }
                .pbs-connector:hover {
                    box-shadow: 0 0 8px rgba(255,255,255,0.2) !important;
                }
                @media (max-width: 1023px) {
                    .pbs-root .pbs-columns {
                        grid-template-columns: 1fr !important;
                    }
                    .pbs-root .pbs-tab-btn {
                        padding: 10px 20px !important;
                        font-size: 15px !important;
                    }
                }
            `}</style>

            {/* Header */}
            <div style={styles.header}>
                <h1 style={styles.title}>Patch Bay Simulator</h1>
                <p style={styles.subtitle}>
                    Explore how our studio patch bays route microphone signals from different rooms
                    through PB8 into the UA Volt 876 audio interfaces.
                </p>
                {connectionCount > 0 && (
                    <button type="button"
                        onClick={handleClearAll}
                        style={{ ...styles.clearButton, marginTop: spacing[3] }}
                    >
                        Clear All Connections
                    </button>
                )}
            </div>

            {/* Tab Navigation */}
            <div style={styles.tabBar}>
                {TABS.map((tab) => {
                    const isActive = tab.id === activeTab;
                    const tabColour = ROOM_COLOURS[tab.id] || '#888';
                    return (
                        <button type="button"
                            key={tab.id}
                            className="pbs-tab-btn"
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: `${spacing[2]} ${spacing[4]}`,
                                borderRadius: borderRadius.full,
                                border: `2px solid ${tabColour}`,
                                background: isActive ? tabColour : 'transparent',
                                color: isActive ? '#fff' : tabColour,
                                fontSize: typography.size.sm,
                                fontWeight: typography.weight.semibold,
                                cursor: 'pointer',
                                transition: 'transform, opacity, background-color, color, border-color, box-shadow 200ms',
                                fontFamily: typography.fontFamily,
                            }}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Three-Column Layout with SVG overlay */}
            <div ref={columnsRef} style={styles.columnsWrapper}>
                <div style={styles.columns} className="pbs-columns">
                    {/* Column 1: Room Patch Bays */}
                    <div style={styles.panel}>
                        <div style={{ ...styles.panelTitle, color: roomColour }}>
                            {currentTab ? currentTab.label : 'Room'} Patch Bays
                        </div>
                        {activeBays.map((bayId) => {
                            const bay = PATCH_BAYS[bayId];
                            if (!bay) return null;
                            const colour = ROOM_COLOURS[bay.room] || '#888';
                            return (
                                <div key={bayId} style={styles.baySection}>
                                    <div style={styles.bayLabel}>
                                        {bayId} &mdash; {bay.label}
                                    </div>
                                    <div style={styles.connectorGrid}>
                                        {renderConnectors(bayId, bay.connectors, colour, bay.extras, 'room')}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Column 2: PB8 (Central Router) */}
                    <div style={styles.panel}>
                        <div style={styles.panelTitle}>PB8 &mdash; Central Router</div>
                        <div style={{ ...styles.connectionCount, textAlign: 'center', marginTop: `-${spacing[2]}`, marginBottom: spacing[2] }}>
                            {connectionCount}/{PB8_INPUTS} inputs patched
                        </div>
                        <div style={styles.baySection}>
                            <div style={styles.bayLabel}>Inputs (from Room Bays)</div>
                            <div style={styles.connectorGrid}>
                                {renderConnectors('PB8-in', PB8_INPUTS, '#10B981', null, 'pb8-input')}
                            </div>
                        </div>
                        <div style={styles.baySection}>
                            <div style={styles.bayLabel}>Outputs (to Volt 876)</div>
                            <div style={styles.connectorGrid}>
                                {renderConnectors('PB8-out', PB8_INPUTS, '#10B981', null, 'pb8-output')}
                            </div>
                        </div>
                    </div>

                    {/* Column 3: PB9 (Expansion / Returns) */}
                    <div style={styles.panel}>
                        <div style={styles.panelTitle}>PB9 &mdash; Expansion</div>
                        <div style={styles.baySection}>
                            <div style={styles.bayLabel}>Outputs (24 channels)</div>
                            <div style={styles.connectorGrid}>
                                {renderConnectors('PB9', PB9_OUTPUTS, '#F59E0B', null, 'other')}
                            </div>
                        </div>
                    </div>
                </div>

                {/* SVG Cable Overlay */}
                {renderCables()}

                {/* Cable tooltip */}
                {hoveredCable !== null && connections[hoveredCable] && (
                    <div style={{ ...styles.cableTooltip, left: tooltipPos.x, top: tooltipPos.y }}>
                        {buildSignalPath(connections[hoveredCable]).join('  →  ')}
                    </div>
                )}
            </div>

            {/* Volt 876 Section - Two stacked units */}
            <div style={styles.voltWrapper}>
                {/* Unit 1 */}
                <div style={styles.voltUnit}>
                    <span style={styles.voltLabel}>Volt 876 &mdash; Unit 1 (IN 1-8)</span>
                    {voltUnit1Inputs.length > 0 && (
                        <div style={styles.voltIndicators}>
                            {voltUnit1Inputs.map((vi, idx) => (
                                <div
                                    key={idx}
                                    style={{ ...styles.voltDot, background: vi.colour }}
                                    title={`Unit 1 Input ${vi.input}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
                {/* Unit 2 */}
                <div style={styles.voltUnit}>
                    <span style={styles.voltLabel}>Volt 876 &mdash; Unit 2 (IN 1-8)</span>
                    {voltUnit2Inputs.length > 0 && (
                        <div style={styles.voltIndicators}>
                            {voltUnit2Inputs.map((vi, idx) => (
                                <div
                                    key={idx}
                                    style={{ ...styles.voltDot, background: vi.colour }}
                                    title={`Unit 2 Input ${vi.input}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
                {/* Input Mapping Legend */}
                <div style={styles.voltLegend}>
                    <div style={styles.voltLegendTitle}>Input Mapping</div>
                    <div style={{ fontSize: typography.size.sm, color: '#10B981', marginBottom: spacing[1] }}>
                        IN 1-2: Studio interior microphones (always connected)
                    </div>
                    <div style={{ fontSize: typography.size.sm, color: '#3B82F6' }}>
                        IN 3-8: From PB8 (patched from rooms)
                    </div>
                </div>
            </div>

            {/* Signal Path Strip */}
            <div style={styles.signalStrip}>
                <span style={styles.signalLabel}>Signal Path:</span>
                {hoveredPath ? (
                    hoveredPath.map((step, i) => (
                        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                            {i > 0 && <span style={styles.signalArrow}>→</span>}
                            <span style={styles.signalStep}>{step}</span>
                        </span>
                    ))
                ) : (
                    <span style={styles.signalPlaceholder}>
                        {connections.length > 0
                            ? 'Hover a cable to trace the signal path...'
                            : 'Connect a room mic line to PB8 to trace the signal path'}
                    </span>
                )}
            </div>
        </div>
    );
}
