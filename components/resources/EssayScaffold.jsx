'use client';

import React, { useState, useMemo } from 'react';
import { theme, typography, borderRadius, spacing, transitions } from '@/lib/theme';
import useSpotlightReveal from '@/hooks/useSpotlightReveal';
import { getDefaultExercise } from '@/lib/resources/essay-scaffolds';

const SCAFFOLD_LEVELS = [
    { id: 'full', label: 'Full Support', description: 'All scaffolds visible' },
    { id: 'medium', label: 'Medium', description: 'Questions + sentence starters' },
    { id: 'minimal', label: 'Minimal', description: 'Questions only' },
    { id: 'independent', label: 'Independent', description: 'No scaffolds' },
];

export default function EssayScaffold() {
    const t = theme.light;
    const exercise = getDefaultExercise();

    const [scaffoldLevel, setScaffoldLevel] = useState('full');
    const [activeZone, setActiveZone] = useState(null);
    const [essayContent, setEssayContent] = useState({});
    const [checkedItems, setCheckedItems] = useState({});

    const {
        canvasRef,
        containerRef,
        smoothPos,
        imagesLoaded,
        size,
        parallaxOffset,
        handleMouseMove: baseHandleMouseMove,
        handleMouseLeave: baseHandleMouseLeave,
    } = useSpotlightReveal({
        baseImage: exercise.baseImage,
        revealImage: exercise.revealImage,
        maskSize: 300,
        enableParallax: false,
    });

    // Zone detection on mouse move
    const handleMouseMove = (e) => {
        baseHandleMouseMove(e);

        // Detect active zone from smoothed position
        const canvas = canvasRef.current;
        if (!canvas || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const cx = (e.clientX - rect.left) * scaleX;
        const cy = (e.clientY - rect.top) * scaleY;

        // Normalise to 0-1
        const nx = cx / canvas.width;
        const ny = cy / canvas.height;

        const found = exercise.zones.find(z => {
            const b = z.bounds;
            return nx >= b.x && nx <= b.x + b.width && ny >= b.y && ny <= b.y + b.height;
        });

        setActiveZone(found || null);
    };

    const handleMouseLeave = () => {
        baseHandleMouseLeave();
        setActiveZone(null);
    };

    // Word count helper
    const wordCount = useMemo(() => {
        return Object.values(essayContent).reduce((total, text) => {
            if (!text) return total;
            return total + text.trim().split(/\s+/).filter(Boolean).length;
        }, 0);
    }, [essayContent]);

    const updateSection = (sectionId, value) => {
        setEssayContent(prev => ({ ...prev, [sectionId]: value }));
    };

    const toggleCheck = (id) => {
        setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: spacing[6],
            fontFamily: typography.fontFamily,
        }}>
            {/* Title + scaffold level toggle */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: spacing[4],
                marginBottom: spacing[6],
            }}>
                <div>
                    <h1 style={{
                        fontSize: typography.size['2xl'],
                        fontWeight: typography.weight.bold,
                        color: t.text.primary,
                        margin: 0,
                    }}>
                        {exercise.title}
                    </h1>
                    <p style={{
                        fontSize: typography.size.sm,
                        color: t.text.secondary,
                        margin: `${spacing[1]} 0 0`,
                    }}>
                        {exercise.description}
                    </p>
                </div>

                {/* Scaffold level selector */}
                <div style={{
                    display: 'flex',
                    gap: spacing[1],
                    background: t.bg.tertiary,
                    borderRadius: borderRadius.lg,
                    padding: spacing[1],
                }}>
                    {SCAFFOLD_LEVELS.map(level => (
                        <button
                            key={level.id}
                            onClick={() => setScaffoldLevel(level.id)}
                            title={level.description}
                            style={{
                                padding: `${spacing[2]} ${spacing[3]}`,
                                borderRadius: borderRadius.md,
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: typography.size.sm,
                                fontWeight: scaffoldLevel === level.id ? typography.weight.semibold : typography.weight.normal,
                                background: scaffoldLevel === level.id ? t.bg.primary : 'transparent',
                                color: scaffoldLevel === level.id ? t.text.primary : t.text.tertiary,
                                boxShadow: scaffoldLevel === level.id ? t.shadow.sm : 'none',
                                transition: `all ${transitions.fast}`,
                            }}
                        >
                            {level.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main layout: Image + Sidebar */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 360px',
                gap: spacing[6],
                marginBottom: spacing[6],
            }}>
                {/* Spotlight image */}
                <div
                    ref={containerRef}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    style={{
                        position: 'relative',
                        cursor: 'none',
                        borderRadius: borderRadius.xl,
                        overflow: 'hidden',
                        border: `1px solid ${t.border.subtle}`,
                    }}
                >
                    <canvas
                        ref={canvasRef}
                        width={size.width}
                        height={size.height}
                        style={{
                            width: '100%',
                            height: 'auto',
                            display: 'block',
                        }}
                    />
                    {!imagesLoaded && (
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: t.bg.tertiary,
                            color: t.text.tertiary,
                        }}>
                            Loading images...
                        </div>
                    )}
                    {imagesLoaded && !activeZone && (
                        <div style={{
                            position: 'absolute',
                            bottom: spacing[4],
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'rgba(0,0,0,0.7)',
                            color: '#fff',
                            padding: `${spacing[2]} ${spacing[4]}`,
                            borderRadius: borderRadius.full,
                            fontSize: typography.size.sm,
                            pointerEvents: 'none',
                            whiteSpace: 'nowrap',
                        }}>
                            Hover over the EQ to explore frequency bands
                        </div>
                    )}
                </div>

                {/* Scaffold sidebar */}
                <ScaffoldSidebar
                    zone={activeZone}
                    level={scaffoldLevel}
                    zones={exercise.zones}
                    theme={t}
                />
            </div>

            {/* Essay editor */}
            <div style={{
                background: t.bg.primary,
                borderRadius: borderRadius.xl,
                border: `1px solid ${t.border.subtle}`,
                padding: spacing[6],
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: spacing[4],
                }}>
                    <h2 style={{
                        fontSize: typography.size.xl,
                        fontWeight: typography.weight.semibold,
                        color: t.text.primary,
                        margin: 0,
                    }}>
                        Your Response
                    </h2>
                    <span style={{
                        fontSize: typography.size.sm,
                        color: t.text.tertiary,
                        fontFamily: typography.fontFamilyMono,
                    }}>
                        {wordCount} words
                    </span>
                </div>

                {/* Examiner tip */}
                {scaffoldLevel !== 'independent' && exercise.examinerTip && (
                    <div style={{
                        padding: spacing[3],
                        background: t.accent.warningLight,
                        borderRadius: borderRadius.lg,
                        borderLeft: `3px solid ${t.accent.warning}`,
                        marginBottom: spacing[5],
                        fontSize: typography.size.sm,
                        color: t.text.primary,
                        lineHeight: typography.lineHeight.relaxed,
                    }}>
                        <strong style={{ color: t.accent.warning }}>Examiner tip: </strong>
                        {exercise.examinerTip}
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[5] }}>
                    {exercise.essaySections.map(section => (
                        <div key={section.id}>
                            <label style={{
                                display: 'block',
                                fontSize: typography.size.sm,
                                fontWeight: typography.weight.semibold,
                                color: t.text.primary,
                                marginBottom: spacing[1],
                            }}>
                                {section.label}
                            </label>
                            {scaffoldLevel !== 'independent' && (
                                <p style={{
                                    fontSize: typography.size.xs,
                                    color: t.text.tertiary,
                                    margin: `0 0 ${spacing[2]}`,
                                    lineHeight: typography.lineHeight.relaxed,
                                }}>
                                    {section.guidance}
                                </p>
                            )}
                            <textarea
                                value={essayContent[section.id] || ''}
                                onChange={(e) => updateSection(section.id, e.target.value)}
                                placeholder={section.placeholder}
                                rows={8}
                                style={{
                                    width: '100%',
                                    padding: spacing[3],
                                    borderRadius: borderRadius.lg,
                                    border: `1px solid ${t.border.input}`,
                                    fontSize: typography.size.base,
                                    fontFamily: typography.fontFamily,
                                    lineHeight: typography.lineHeight.relaxed,
                                    resize: 'vertical',
                                    background: t.bg.secondary,
                                    color: t.text.primary,
                                    boxSizing: 'border-box',
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Self-assessment checklist */}
                <div style={{
                    marginTop: spacing[6],
                    padding: spacing[5],
                    background: t.bg.secondary,
                    borderRadius: borderRadius.lg,
                }}>
                    <h3 style={{
                        fontSize: typography.size.base,
                        fontWeight: typography.weight.semibold,
                        color: t.text.primary,
                        margin: `0 0 ${spacing[3]}`,
                    }}>
                        Self-Assessment Checklist
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                        {exercise.selfAssessment.map(item => (
                            <label
                                key={item.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: spacing[2],
                                    fontSize: typography.size.sm,
                                    color: t.text.secondary,
                                    cursor: 'pointer',
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={!!checkedItems[item.id]}
                                    onChange={() => toggleCheck(item.id)}
                                    style={{ accentColor: t.accent.primary }}
                                />
                                {item.label}
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Scaffold sidebar component
function ScaffoldSidebar({ zone, level, zones, theme: t }) {
    if (level === 'independent') {
        return (
            <div style={{
                background: t.bg.primary,
                borderRadius: borderRadius.xl,
                border: `1px solid ${t.border.subtle}`,
                padding: spacing[5],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: t.text.tertiary,
                fontSize: typography.size.sm,
                textAlign: 'center',
            }}>
                Independent mode — no scaffolds. Use the image to guide your analysis.
            </div>
        );
    }

    if (!zone) {
        return (
            <div style={{
                background: t.bg.primary,
                borderRadius: borderRadius.xl,
                border: `1px solid ${t.border.subtle}`,
                padding: spacing[5],
            }}>
                <h3 style={{
                    fontSize: typography.size.lg,
                    fontWeight: typography.weight.semibold,
                    color: t.text.primary,
                    margin: `0 0 ${spacing[3]}`,
                }}>
                    Frequency Bands
                </h3>
                <p style={{
                    fontSize: typography.size.sm,
                    color: t.text.tertiary,
                    margin: `0 0 ${spacing[4]}`,
                }}>
                    Hover over a frequency band on the EQ image to see writing prompts for that region.
                </p>
                {/* Zone list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                    {zones.map(z => (
                        <div
                            key={z.id}
                            style={{
                                padding: `${spacing[2]} ${spacing[3]}`,
                                background: t.bg.secondary,
                                borderRadius: borderRadius.md,
                                fontSize: typography.size.sm,
                                color: t.text.secondary,
                            }}
                        >
                            <strong>{z.label}</strong>
                            <span style={{ color: t.text.tertiary, marginLeft: spacing[2] }}>
                                {z.range}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div style={{
            background: t.bg.primary,
            borderRadius: borderRadius.xl,
            border: `2px solid ${t.accent.primary}`,
            padding: spacing[5],
            transition: `border-color ${transitions.fast}`,
        }}>
            {/* Zone header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing[2],
                marginBottom: spacing[4],
            }}>
                <span style={{
                    background: t.accent.infoLight,
                    color: t.accent.info,
                    padding: `${spacing[1]} ${spacing[3]}`,
                    borderRadius: borderRadius.full,
                    fontSize: typography.size.xs,
                    fontWeight: typography.weight.medium,
                }}>
                    {zone.range}
                </span>
                <h3 style={{
                    fontSize: typography.size.lg,
                    fontWeight: typography.weight.bold,
                    color: t.text.primary,
                    margin: 0,
                }}>
                    {zone.label}
                </h3>
            </div>

            {/* Guiding question — shown at Full and Medium and Minimal */}
            <div style={{
                marginBottom: spacing[4],
                padding: spacing[3],
                background: t.accent.infoLight,
                borderRadius: borderRadius.lg,
                borderLeft: `3px solid ${t.accent.info}`,
            }}>
                <div style={{
                    fontSize: typography.size.xs,
                    fontWeight: typography.weight.semibold,
                    color: t.accent.info,
                    marginBottom: spacing[1],
                    textTransform: 'uppercase',
                    letterSpacing: typography.letterSpacing.wide,
                }}>
                    Guiding Question
                </div>
                <p style={{
                    fontSize: typography.size.sm,
                    color: t.text.primary,
                    margin: 0,
                    lineHeight: typography.lineHeight.relaxed,
                }}>
                    {zone.scaffold.question}
                </p>
            </div>

            {/* Sentence starter — shown at Full and Medium */}
            {(level === 'full' || level === 'medium') && (
                <div style={{
                    marginBottom: spacing[4],
                    padding: spacing[3],
                    background: t.accent.successLight,
                    borderRadius: borderRadius.lg,
                    borderLeft: `3px solid ${t.accent.success}`,
                }}>
                    <div style={{
                        fontSize: typography.size.xs,
                        fontWeight: typography.weight.semibold,
                        color: t.accent.success,
                        marginBottom: spacing[1],
                        textTransform: 'uppercase',
                        letterSpacing: typography.letterSpacing.wide,
                    }}>
                        Sentence Starter
                    </div>
                    <p style={{
                        fontSize: typography.size.sm,
                        color: t.text.primary,
                        margin: 0,
                        lineHeight: typography.lineHeight.relaxed,
                        fontStyle: 'italic',
                    }}>
                        {zone.scaffold.sentenceStarter}
                    </p>
                </div>
            )}

            {/* Evaluation prompt — shown at Full only */}
            {level === 'full' && (
                <div style={{
                    padding: spacing[3],
                    background: t.accent.warningLight,
                    borderRadius: borderRadius.lg,
                    borderLeft: `3px solid ${t.accent.warning}`,
                }}>
                    <div style={{
                        fontSize: typography.size.xs,
                        fontWeight: typography.weight.semibold,
                        color: t.accent.warning,
                        marginBottom: spacing[1],
                        textTransform: 'uppercase',
                        letterSpacing: typography.letterSpacing.wide,
                    }}>
                        Extend Your Evaluation
                    </div>
                    <p style={{
                        fontSize: typography.size.sm,
                        color: t.text.primary,
                        margin: 0,
                        lineHeight: typography.lineHeight.relaxed,
                    }}>
                        {zone.scaffold.evaluationPrompt}
                    </p>
                </div>
            )}
        </div>
    );
}
