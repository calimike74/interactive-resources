'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { theme, typography, spacing, borderRadius } from '@/lib/theme';

const t = theme.light;

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// Strip {{X}} tokens from text for clean display
function stripRefs(text) {
    return text.replace(/\{\{[A-G]\}\}/g, '').replace(/\s{2,}/g, ' ').trim();
}

export default function ImageExplorerAssessment({ imageSrc, imageAlt, hotspots, title, skipNameStage = false }) {
    const [stage, setStage] = useState(skipNameStage ? 2 : 1); // 1 = name matching, 2 = description matching
    const [placements, setPlacements] = useState({}); // { hotspotId: draggedItemId }
    const [feedback, setFeedback] = useState({}); // { hotspotId: 'correct' | 'incorrect' }
    const [hintsUsed, setHintsUsed] = useState(new Set());
    const [submitted, setSubmitted] = useState(false);
    const [dragItem, setDragItem] = useState(null);
    const [dragOverZone, setDragOverZone] = useState(null);
    const [kbSelected, setKbSelected] = useState(null); // item id selected via keyboard/click-to-select
    // Start in the hotspots' natural (unshuffled) order so the server-rendered
    // HTML and the client's first render are identical, then shuffle client-side
    // only, after mount — calling Math.random() during the render that gets
    // server-rendered would produce a different order server vs. client and
    // React would fail to reconcile the mismatched markup on hydration.
    const [shuffledNames, setShuffledNames] = useState(() => hotspots.map(h => ({ id: h.id, label: h.label, name: h.name })));
    const [shuffledDescs, setShuffledDescs] = useState(() => hotspots.map(h => ({ id: h.id, label: h.label, clue: h.matchClue || stripRefs(h.description) })));

    useEffect(() => {
        setShuffledNames(prev => shuffle(prev));
        setShuffledDescs(prev => shuffle(prev));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const foundationHotspots = hotspots.filter(h => h.level === 'foundation');
    const allHotspots = hotspots;
    const activeHotspots = stage === 1 ? foundationHotspots : allHotspots;
    const dragItems = stage === 1 ? shuffledNames.filter(n => foundationHotspots.some(h => h.id === n.id)) : shuffledDescs;

    // Items not yet placed
    const placedIds = new Set(Object.values(placements));
    const availableItems = dragItems.filter(item => !placedIds.has(item.id));

    const score = Object.values(feedback).filter(v => v === 'correct').length;
    const total = activeHotspots.length;

    const handleDragStart = useCallback((e, itemId) => {
        setDragItem(itemId);
        e.dataTransfer.effectAllowed = 'move';
    }, []);

    const handleDragOver = useCallback((e, hotspotId) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverZone(hotspotId);
    }, []);

    const handleDragLeave = useCallback(() => {
        setDragOverZone(null);
    }, []);

    const handleDrop = useCallback((e, hotspotId) => {
        e.preventDefault();
        setDragOverZone(null);
        if (!dragItem) return;

        // If zone already has a correct answer, don't allow override
        if (feedback[hotspotId] === 'correct') return;

        // Place the item
        setPlacements(prev => {
            // Remove item from any previous placement
            const cleaned = {};
            for (const [k, v] of Object.entries(prev)) {
                if (v !== dragItem) cleaned[k] = v;
            }
            cleaned[hotspotId] = dragItem;
            return cleaned;
        });

        if (stage === 1) {
            // Immediate feedback for Stage 1
            const isCorrect = dragItem === hotspotId;
            setFeedback(prev => ({ ...prev, [hotspotId]: isCorrect ? 'correct' : 'incorrect' }));

            if (!isCorrect) {
                // Remove incorrect placement after a brief delay
                setTimeout(() => {
                    setPlacements(prev => {
                        const cleaned = { ...prev };
                        if (cleaned[hotspotId] === dragItem) delete cleaned[hotspotId];
                        return cleaned;
                    });
                    setFeedback(prev => {
                        const cleaned = { ...prev };
                        if (cleaned[hotspotId] === 'incorrect') delete cleaned[hotspotId];
                        return cleaned;
                    });
                }, 800);
            }
        }

        setDragItem(null);
    }, [dragItem, feedback, stage]);

    // Shared placement logic used by both drag-drop and click-to-select
    const placeItem = useCallback((itemId, hotspotId) => {
        if (feedback[hotspotId] === 'correct') return;
        setPlacements(prev => {
            const cleaned = {};
            for (const [k, v] of Object.entries(prev)) {
                if (v !== itemId) cleaned[k] = v;
            }
            cleaned[hotspotId] = itemId;
            return cleaned;
        });
        if (stage === 1) {
            const isCorrect = itemId === hotspotId;
            setFeedback(prev => ({ ...prev, [hotspotId]: isCorrect ? 'correct' : 'incorrect' }));
            if (!isCorrect) {
                setTimeout(() => {
                    setPlacements(prev => {
                        const cleaned = { ...prev };
                        if (cleaned[hotspotId] === itemId) delete cleaned[hotspotId];
                        return cleaned;
                    });
                    setFeedback(prev => {
                        const cleaned = { ...prev };
                        if (cleaned[hotspotId] === 'incorrect') delete cleaned[hotspotId];
                        return cleaned;
                    });
                }, 800);
            }
        }
    }, [feedback, stage]);

    // Click-to-select: clicking an item selects it; clicking a zone places the selected item
    const handleItemClick = useCallback((itemId) => {
        setKbSelected(prev => prev === itemId ? null : itemId);
    }, []);

    const handleZoneClick = useCallback((hotspotId) => {
        if (!kbSelected) return;
        placeItem(kbSelected, hotspotId);
        setKbSelected(null);
    }, [kbSelected, placeItem]);

    const handleItemKeyDown = useCallback((e, itemId) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setKbSelected(prev => prev === itemId ? null : itemId);
        }
    }, []);

    const handleZoneKeyDown = useCallback((e, hotspotId) => {
        if ((e.key === 'Enter' || e.key === ' ') && kbSelected) {
            e.preventDefault();
            placeItem(kbSelected, hotspotId);
            setKbSelected(null);
        }
    }, [kbSelected, placeItem]);

    const handleSubmitStage2 = () => {
        const newFeedback = {};
        activeHotspots.forEach(h => {
            if (placements[h.id] === h.id) {
                newFeedback[h.id] = 'correct';
            } else if (placements[h.id]) {
                newFeedback[h.id] = 'incorrect';
            }
        });
        setFeedback(newFeedback);
        setSubmitted(true);
    };

    const handleHint = (hotspotId) => {
        const hotspot = hotspots.find(h => h.id === hotspotId);
        if (!hotspot) return;
        setHintsUsed(prev => new Set([...prev, hotspotId]));
    };

    const resetStage = () => {
        setPlacements({});
        setFeedback({});
        setHintsUsed(new Set());
        setSubmitted(false);
    };

    const goToStage2 = () => {
        setStage(2);
        resetStage();
    };

    const stageComplete = stage === 1
        ? Object.values(feedback).filter(v => v === 'correct').length === foundationHotspots.length
        : submitted;

    return (
        <div style={{
            padding: `${spacing[6]} ${spacing[4]}`,
            maxWidth: '900px',
            margin: '0 auto',
            fontFamily: typography.fontFamily,
        }}>
            <style>{`
                @keyframes fadeSlideIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-4px); }
                    75% { transform: translateX(4px); }
                }
                @keyframes correctPop {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); }
                }
            `}</style>

            {/* Header */}
            <h1 style={{
                fontSize: typography.size['2xl'],
                fontWeight: typography.weight.bold,
                color: t.text.primary,
                marginBottom: spacing[1],
            }}>{title || 'Controls Assessment'}</h1>

            {/* Stage indicator */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing[3],
                marginBottom: spacing[5],
            }}>
                {!skipNameStage && (
                    <>
                        <StagePill active={stage === 1} label="Stage 1: Name the Controls" done={stage > 1} />
                        <span style={{ color: t.text.tertiary, fontSize: typography.size.sm }}>then</span>
                    </>
                )}
                <StagePill active={stage === 2} label={skipNameStage ? 'Match Descriptions' : 'Stage 2: Match Descriptions'} done={false} />
            </div>

            {/* Instructions */}
            <p style={{
                fontSize: typography.size.sm,
                color: t.text.secondary,
                marginBottom: spacing[5],
                lineHeight: typography.lineHeight.relaxed,
            }}>
                {stage === 1
                    ? 'Drag each control name from the bank below and drop it onto the matching coloured zone. You\'ll get immediate feedback — use hints if you\'re stuck.'
                    : 'Now match each description to the correct control. Drop descriptions onto the named zones — the Submit button will appear once you start placing.'}
            </p>

            {/* Image with zones */}
            <div>
                <div style={{
                    position: 'relative',
                    borderRadius: `${borderRadius.xl} ${borderRadius.xl} 0 0`,
                    overflow: 'hidden',
                    background: t.bg.tertiary,
                    boxShadow: t.shadow.md,
                }}>
                    <img
                        src={imageSrc}
                        alt={imageAlt}
                        draggable={false}
                        style={{ display: 'block', width: '100%', height: 'auto' }}
                    />
                    {hotspots.map((hotspot) => {
                        if (!hotspot.anchor) return null;
                        const isActive = activeHotspots.some(h => h.id === hotspot.id);
                        const fb = feedback[hotspot.id];
                        return (
                            <div
                                key={`anchor-${hotspot.id}`}
                                aria-hidden="true"
                                style={{
                                    position: 'absolute',
                                    left: `${hotspot.anchor.x}%`,
                                    top: `${hotspot.anchor.y}%`,
                                    transform: 'translate(-50%, -50%)',
                                    width: 28,
                                    height: 28,
                                    borderRadius: '50%',
                                    background: fb === 'correct' ? hotspot.color : '#FFFFFF',
                                    color: fb === 'correct' ? '#FFFFFF' : hotspot.color,
                                    border: `2px solid ${hotspot.color}`,
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '13px',
                                    fontWeight: typography.weight.bold,
                                    fontFamily: typography.fontFamily,
                                    opacity: isActive ? 1 : 0.45,
                                    pointerEvents: 'none',
                                    transition: 'background 0.2s ease, color 0.2s ease',
                                }}
                            >
                                {hotspot.label}
                            </div>
                        );
                    })}
                </div>

                {/* Drop zones strip */}
                <div style={{
                    display: 'flex',
                    borderRadius: `0 0 ${borderRadius.xl} ${borderRadius.xl}`,
                    overflow: 'hidden',
                    boxShadow: t.shadow.sm,
                }}>
                    {hotspots.map((hotspot, i) => {
                        const isActive = activeHotspots.some(h => h.id === hotspot.id);
                        const fb = feedback[hotspot.id];
                        const isOver = dragOverZone === hotspot.id;
                        const placed = placements[hotspot.id];
                        const placedItem = dragItems.find(item => item.id === placed);
                        const hasHint = hintsUsed.has(hotspot.id);

                        const isKbTarget = kbSelected && isActive && fb !== 'correct';
                        return (
                            <div
                                key={hotspot.id}
                                tabIndex={isKbTarget ? 0 : undefined}
                                role={isKbTarget ? 'button' : undefined}
                                aria-label={isKbTarget ? `Place selected item in ${hotspot.name}` : hotspot.name}
                                onDragOver={isActive && fb !== 'correct' ? (e) => handleDragOver(e, hotspot.id) : undefined}
                                onDragLeave={isActive ? handleDragLeave : undefined}
                                onDrop={isActive ? (e) => handleDrop(e, hotspot.id) : undefined}
                                onClick={isKbTarget ? () => handleZoneClick(hotspot.id) : undefined}
                                onKeyDown={isKbTarget ? (e) => handleZoneKeyDown(e, hotspot.id) : undefined}
                                style={{
                                    flex: hotspot.zone.width,
                                    height: stage === 2 ? 72 : 52,
                                    background: !isActive ? 'rgba(0,0,0,0.08)'
                                        : fb === 'correct' ? hexToRgba(hotspot.color, 0.95)
                                        : fb === 'incorrect' ? '#FEE2E2'
                                        : isOver ? hexToRgba(hotspot.color, 0.7)
                                        : hexToRgba(hotspot.color, 0.25),
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 2,
                                    padding: '4px 6px',
                                    transition: 'transform, opacity, background-color, color, border-color, box-shadow 0.2s ease',
                                    cursor: isKbTarget ? 'pointer' : isActive && fb !== 'correct' ? 'default' : 'not-allowed',
                                    borderRight: i < hotspots.length - 1 ? '2px solid rgba(255,255,255,0.4)' : 'none',
                                    animation: fb === 'incorrect' ? 'shake 0.3s ease' : fb === 'correct' ? 'correctPop 0.3s ease' : 'none',
                                    position: 'relative',
                                    outline: isKbTarget ? `2px solid ${hotspot.color}` : 'none',
                                }}
                            >
                                {/* Stage 2: show the name always */}
                                {stage === 2 && isActive && (
                                    <span style={{
                                        fontSize: '10px',
                                        fontWeight: typography.weight.bold,
                                        color: fb === 'correct' ? '#fff' : hotspot.color,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.04em',
                                    }}>
                                        {hotspot.label}. {hotspot.name}
                                    </span>
                                )}

                                {/* Stage 1: show label badge only */}
                                {stage === 1 && isActive && (
                                    <span style={{
                                        width: 22,
                                        height: 22,
                                        borderRadius: '50%',
                                        background: fb === 'correct' ? 'rgba(255,255,255,0.9)' : hexToRgba(hotspot.color, 0.5),
                                        color: fb === 'correct' ? hotspot.color : '#fff',
                                        fontSize: typography.size.xs,
                                        fontWeight: typography.weight.bold,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}>
                                        {hotspot.label}
                                    </span>
                                )}

                                {/* Correct answer display */}
                                {fb === 'correct' && stage === 1 && (
                                    <span style={{
                                        color: '#fff',
                                        fontSize: '10px',
                                        fontWeight: typography.weight.semibold,
                                        textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                                        textAlign: 'center',
                                        lineHeight: 1.2,
                                    }}>
                                        {hotspot.name}
                                    </span>
                                )}

                                {/* Inactive zone label */}
                                {!isActive && (
                                    <span style={{
                                        color: 'rgba(0,0,0,0.25)',
                                        fontSize: '10px',
                                        fontWeight: typography.weight.medium,
                                    }}>
                                        {hotspot.label}
                                    </span>
                                )}

                                {/* Stage 2: show placed description snippet */}
                                {stage === 2 && placed && placedItem && (
                                    <span style={{
                                        fontSize: '9px',
                                        color: fb === 'correct' ? '#fff' : fb === 'incorrect' ? '#991B1B' : t.text.secondary,
                                        textAlign: 'center',
                                        lineHeight: 1.2,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        maxWidth: '100%',
                                    }}>
                                        {placedItem.clue.slice(0, 60)}...
                                    </span>
                                )}

                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Drag items bank */}
            <div style={{
                marginTop: spacing[5],
                padding: spacing[4],
                background: '#FFFFFF',
                borderRadius: borderRadius.xl,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
            }}>
                <div style={{
                    fontSize: '11px',
                    fontWeight: typography.weight.semibold,
                    color: t.text.tertiary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: spacing[3],
                }}>
                    {stage === 1 ? 'Control Names' : 'Descriptions'} — drag to zones above
                </div>

                {availableItems.length === 0 && !stageComplete && (
                    <p style={{ color: t.text.tertiary, fontSize: typography.size.sm, textAlign: 'center', padding: spacing[3] }}>
                        All items placed. {stage === 2 && !submitted ? 'Click Submit to check.' : ''}
                    </p>
                )}

                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: spacing[2],
                }}>
                    {availableItems.map(item => {
                        const isKbSelected = kbSelected === item.id;
                        return (
                            <div
                                key={item.id}
                                draggable
                                tabIndex={0}
                                role="button"
                                aria-pressed={isKbSelected}
                                aria-label={stage === 1 ? item.name : item.clue}
                                onDragStart={(e) => handleDragStart(e, item.id)}
                                onClick={() => handleItemClick(item.id)}
                                onKeyDown={(e) => handleItemKeyDown(e, item.id)}
                                style={{
                                    padding: stage === 1 ? `${spacing[2]} ${spacing[3]}` : `${spacing[2]} ${spacing[3]}`,
                                    background: isKbSelected ? '#DBEAFE' : '#F8F9FA',
                                    border: isKbSelected ? '1.5px solid #3B82F6' : '1.5px solid rgba(0,0,0,0.08)',
                                    borderRadius: borderRadius.lg,
                                    cursor: 'grab',
                                    fontSize: stage === 1 ? typography.size.sm : '12px',
                                    fontWeight: stage === 1 ? typography.weight.medium : typography.weight.normal,
                                    color: t.text.primary,
                                    fontFamily: typography.fontFamily,
                                    lineHeight: 1.4,
                                    maxWidth: stage === 2 ? '280px' : 'auto',
                                    userSelect: 'none',
                                    transition: 'transform, opacity, background-color, color, border-color, box-shadow 0.15s ease',
                                    outline: 'none',
                                }}
                            >
                                {stage === 1 ? item.name : item.clue}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Hint buttons (Stage 1 only) */}
            {stage === 1 && !stageComplete && (
                <div style={{ marginTop: spacing[3], display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: spacing[2],
                        alignItems: 'center',
                    }}>
                        <span style={{
                            fontSize: '11px',
                            color: t.text.tertiary,
                            fontWeight: typography.weight.medium,
                        }}>
                            Need a hint?
                        </span>
                        {activeHotspots.filter(h => feedback[h.id] !== 'correct' && !hintsUsed.has(h.id)).map(h => (
                            <button type="button"
                                key={h.id}
                                onClick={() => handleHint(h.id)}
                                style={{
                                    padding: '3px 10px',
                                    background: hexToRgba(h.color, 0.08),
                                    border: `1px solid ${hexToRgba(h.color, 0.2)}`,
                                    borderRadius: borderRadius.full,
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    fontWeight: typography.weight.medium,
                                    color: h.color,
                                    fontFamily: typography.fontFamily,
                                }}
                            >
                                Hint for {h.label}
                            </button>
                        ))}
                    </div>

                    {/* Revealed hints — show matchClue once requested */}
                    {activeHotspots.filter(h => hintsUsed.has(h.id) && feedback[h.id] !== 'correct').map(h => (
                        <div
                            key={`hint-${h.id}`}
                            style={{
                                padding: `${spacing[2]} ${spacing[3]}`,
                                background: hexToRgba(h.color, 0.08),
                                border: `1px solid ${hexToRgba(h.color, 0.25)}`,
                                borderRadius: borderRadius.lg,
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: spacing[2],
                            }}
                        >
                            <span style={{
                                flexShrink: 0,
                                width: 22,
                                height: 22,
                                borderRadius: '50%',
                                background: h.color,
                                color: '#fff',
                                fontSize: '11px',
                                fontWeight: typography.weight.bold,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                {h.label}
                            </span>
                            <span style={{
                                fontSize: '12px',
                                color: t.text.secondary,
                                lineHeight: 1.4,
                            }}>
                                {h.matchClue || stripRefs(h.description)}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Submit button (Stage 2 only) */}
            {stage === 2 && !submitted && Object.keys(placements).length > 0 && (
                <div style={{ marginTop: spacing[4], display: 'flex', gap: spacing[3] }}>
                    <button type="button"
                        onClick={handleSubmitStage2}
                        style={{
                            padding: `${spacing[3]} ${spacing[6]}`,
                            background: t.accent.primary,
                            color: '#fff',
                            border: 'none',
                            borderRadius: borderRadius.lg,
                            cursor: 'pointer',
                            fontSize: typography.size.sm,
                            fontWeight: typography.weight.semibold,
                            fontFamily: typography.fontFamily,
                        }}
                    >
                        Submit Answers
                    </button>
                    <button type="button"
                        onClick={resetStage}
                        style={{
                            padding: `${spacing[3]} ${spacing[5]}`,
                            background: 'transparent',
                            color: t.text.tertiary,
                            border: `1px solid ${t.border.subtle}`,
                            borderRadius: borderRadius.lg,
                            cursor: 'pointer',
                            fontSize: typography.size.sm,
                            fontFamily: typography.fontFamily,
                        }}
                    >
                        Reset
                    </button>
                </div>
            )}

            {/* Results / transition */}
            {stageComplete && (
                <div style={{
                    marginTop: spacing[5],
                    padding: spacing[5],
                    background: '#FFFFFF',
                    borderRadius: borderRadius.xl,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
                    animation: 'fadeSlideIn 0.3s ease-out',
                }}>
                    {stage === 1 && (
                        <>
                            <h3 style={{
                                fontSize: typography.size.lg,
                                fontWeight: typography.weight.bold,
                                color: t.accent.success,
                                marginBottom: spacing[2],
                            }}>
                                Stage 1 Complete
                            </h3>
                            <p style={{
                                fontSize: typography.size.sm,
                                color: t.text.secondary,
                                marginBottom: spacing[4],
                            }}>
                                You identified all {foundationHotspots.length} foundation controls
                                {hintsUsed.size > 0 ? ` (${hintsUsed.size} hint${hintsUsed.size > 1 ? 's' : ''} used)` : ' without any hints'}.
                                Ready for the next challenge?
                            </p>
                            <button type="button"
                                onClick={goToStage2}
                                style={{
                                    padding: `${spacing[3]} ${spacing[6]}`,
                                    background: t.accent.primary,
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: borderRadius.lg,
                                    cursor: 'pointer',
                                    fontSize: typography.size.sm,
                                    fontWeight: typography.weight.semibold,
                                    fontFamily: typography.fontFamily,
                                }}
                            >
                                Continue to Stage 2
                            </button>
                        </>
                    )}

                    {stage === 2 && submitted && (
                        <>
                            <h3 style={{
                                fontSize: typography.size.lg,
                                fontWeight: typography.weight.bold,
                                color: score === total ? t.accent.success : t.accent.warning,
                                marginBottom: spacing[2],
                            }}>
                                {score === total ? 'Perfect Score!' : `${score} of ${total} correct`}
                            </h3>

                            {/* Show corrections for incorrect answers */}
                            {score < total && (
                                <div style={{ marginTop: spacing[3], display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                                    {activeHotspots.filter(h => feedback[h.id] !== 'correct').map(h => (
                                        <div key={h.id} style={{
                                            padding: spacing[3],
                                            background: '#FEF3C7',
                                            borderRadius: borderRadius.lg,
                                            borderLeft: `4px solid ${h.color}`,
                                        }}>
                                            <div style={{
                                                fontSize: typography.size.sm,
                                                fontWeight: typography.weight.semibold,
                                                color: t.text.primary,
                                                marginBottom: spacing[1],
                                            }}>
                                                {h.label}. {h.name}
                                            </div>
                                            <div style={{
                                                fontSize: '12px',
                                                color: t.text.secondary,
                                                lineHeight: 1.5,
                                            }}>
                                                {stripRefs(h.description)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div style={{ marginTop: spacing[4], display: 'flex', gap: spacing[3] }}>
                                <button type="button"
                                    onClick={resetStage}
                                    style={{
                                        padding: `${spacing[3]} ${spacing[5]}`,
                                        background: t.accent.primary,
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: borderRadius.lg,
                                        cursor: 'pointer',
                                        fontSize: typography.size.sm,
                                        fontWeight: typography.weight.semibold,
                                        fontFamily: typography.fontFamily,
                                    }}
                                >
                                    Try Again
                                </button>
                                {score < total && !skipNameStage && (
                                    <button type="button"
                                        onClick={() => { setStage(1); resetStage(); }}
                                        style={{
                                            padding: `${spacing[3]} ${spacing[5]}`,
                                            background: 'transparent',
                                            color: t.text.tertiary,
                                            border: `1px solid ${t.border.subtle}`,
                                            borderRadius: borderRadius.lg,
                                            cursor: 'pointer',
                                            fontSize: typography.size.sm,
                                            fontFamily: typography.fontFamily,
                                        }}
                                    >
                                        Back to Stage 1
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

function StagePill({ active, label, done }) {
    return (
        <span style={{
            padding: `${spacing[1]} ${spacing[3]}`,
            borderRadius: borderRadius.full,
            fontSize: typography.size.xs,
            fontWeight: typography.weight.semibold,
            fontFamily: typography.fontFamily,
            background: done ? '#D1FAE5' : active ? t.accent.primary : '#F3F4F6',
            color: done ? '#065F46' : active ? '#fff' : t.text.tertiary,
            border: `1px solid ${done ? '#A7F3D0' : active ? t.accent.primary : t.border.subtle}`,
        }}>
            {done ? '✓ ' : ''}{label}
        </span>
    );
}
