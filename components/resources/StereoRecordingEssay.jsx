'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { theme, typography, borderRadius, spacing, transitions } from '@/lib/theme';

const SCAFFOLD_LEVELS = [
    { id: 'full', label: 'Full Support', description: 'All scaffolds visible' },
    { id: 'medium', label: 'Medium', description: 'Questions + sentence starters' },
    { id: 'minimal', label: 'Minimal', description: 'Questions only' },
    { id: 'independent', label: 'Independent', description: 'No scaffolds' },
];

const ESSAY_QUESTION = 'Analyse the key characteristics of spaced pair, coincident (XY), and mid-side stereo recording techniques. Evaluate their suitability for different recording scenarios, considering factors such as stereo width, mono compatibility, and the recording environment.';

const TECHNIQUES = [
    {
        id: 'spaced-pair',
        label: 'Spaced Pair (AB)',
        description: 'Two microphones spaced apart, relying on time-of-arrival differences.',
        scaffold: {
            question: 'How does a spaced pair create a stereo image, and what are the consequences of using time-of-arrival differences?',
            sentenceStarter: 'A spaced pair relies on timing differences between the two microphones, which means...',
            evaluationPrompt: 'What are the advantages of the wide stereo image a spaced pair produces, and why might phase cancellation when summed to mono be a problem in certain contexts?',
        },
    },
    {
        id: 'coincident-xy',
        label: 'Coincident Pair (XY)',
        description: 'Two directional microphones with capsules at the same point, angled apart.',
        scaffold: {
            question: 'How does a coincident pair differ from a spaced pair in the way it creates stereo, and what does this mean for mono compatibility?',
            sentenceStarter: 'Because the capsules are at the same point, the stereo image depends on intensity rather than timing, so...',
            evaluationPrompt: 'Why does excellent mono compatibility come at the cost of a narrower stereo image, and in what situations is this trade-off worthwhile?',
        },
    },
    {
        id: 'mid-side',
        label: 'Mid-Side (MS)',
        description: 'A forward-facing cardioid (mid) and a sideways figure-of-eight (side), decoded after recording.',
        scaffold: {
            question: 'How is a mid-side recording decoded into stereo, and why does this give the engineer control over stereo width after recording?',
            sentenceStarter: 'The side signal needs to be decoded before it becomes a usable stereo image, which involves...',
            evaluationPrompt: 'Evaluate why mid-side is particularly valued in broadcast work. Consider what happens when the side signal is removed entirely and why this matters for mono playback.',
        },
    },
];

const EXTENSION_TOPICS = [
    {
        id: 'phase-cancellation',
        label: 'Phase Cancellation',
        description: 'When two microphones pick up the same source at different distances, the signals arrive at different times. If the peaks of one waveform align with the troughs of another, frequencies cancel out — thinning the sound. This is why checking phase relationships between overheads and close mics is critical.',
    },
];

const ESSAY_SECTIONS = [
    {
        id: 'response',
        label: 'Your Essay',
        placeholder: 'Write your full response here. Describe each technique and evaluate its suitability for different recording scenarios...',
        guidance: 'Cover all three techniques. For each, describe how it works (AO3) and evaluate its advantages, limitations, and best use cases (AO4). Use accurate technical vocabulary and compare the techniques against each other.',
        rows: 20,
    },
];

const SELF_ASSESSMENT = [
    { id: 'three-techniques', label: 'I described all three stereo techniques with accurate technical detail' },
    { id: 'technical-vocab', label: 'I used precise terminology (polar patterns, phase, mono compatibility, etc.)' },
    { id: 'evaluation', label: 'I evaluated advantages and limitations, not just described how they work' },
    { id: 'comparisons', label: 'I compared techniques against each other, not just described them individually' },
    { id: 'scenarios', label: 'I justified which technique suits specific recording scenarios' },
    { id: 'connectives', label: 'I used evaluative language (therefore, this suggests, consequently, however)' },
];

const MIN_CHECKED_TO_REVEAL = 4;

const MODEL_ANSWER = 'Spaced pair (AB) uses two microphones positioned apart from each other, so the stereo image is created by tiny time-of-arrival differences as sound reaches each capsule. This produces a wide, spacious image with a strong sense of the room, making it well suited to orchestral or large-ensemble recording where ambience matters. However, because the image relies on timing rather than level, summing the signal to mono can cause phase cancellation, thinning or colouring the sound — a real risk in broadcast or streaming contexts where mono playback is still common.\n\nCoincident pair (XY) places two directional microphones with their capsules as close together as possible, angled apart so the stereo image is created by intensity differences alone rather than timing. Because both capsules receive the sound at effectively the same moment, XY collapses to mono with excellent phase coherence and no cancellation. The trade-off is a narrower, less enveloping image than a spaced pair, so XY suits situations demanding mono compatibility and accurate localisation — close-miked ensembles or broadcast interviews — more than it suits capturing room ambience.\n\nMid-side (MS) combines a forward-facing cardioid microphone (the mid signal) with a sideways-facing figure-of-eight microphone (the side signal). The stereo image is not fixed at the point of recording: after capture, the engineer decodes it by creating Left = Mid + Side and Right = Mid − Side, so stereo width can be adjusted, or collapsed entirely, during mixing. Removing the side signal leaves a pure mono mid signal with no phase issues at all, which is exactly why mid-side is particularly valued in broadcast work, where mono compatibility and post-recording flexibility both matter more than a fixed, maximally wide image.\n\nOverall, spaced pair prioritises width and ambience at the cost of mono safety; XY prioritises mono compatibility and accuracy at the cost of width; and mid-side offers both by deferring the width decision to the mix, at the cost of a slightly more complex setup and decoding stage. The right choice depends on the scenario: spaced pair for spacious orchestral capture where mono playback is unlikely, XY for broadcast or close-miked work needing guaranteed mono compatibility, and mid-side wherever post-production flexibility matters, such as any release that needs both stereo and mono versions.';

export default function StereoRecordingEssay() {
    const t = theme.light;
    const [scaffoldLevel, setScaffoldLevel] = useState('full');
    const [essayContent, setEssayContent] = useState({});
    const [checkedItems, setCheckedItems] = useState({});
    const [showExtension, setShowExtension] = useState(false);
    const [activeTechnique, setActiveTechnique] = useState(null);
    const [modelRevealed, setModelRevealed] = useState(false);
    const tabListRef = useRef(null);
    const tabBtnRefs = useRef({});
    const [tabIndicator, setTabIndicator] = useState({ x: 0, width: 0, ready: false });

    // Position sliding tab indicator
    const updateIndicator = useCallback(() => {
        const list = tabListRef.current;
        const btn = tabBtnRefs.current[scaffoldLevel];
        if (!list || !btn) return;
        const listRect = list.getBoundingClientRect();
        const btnRect = btn.getBoundingClientRect();
        setTabIndicator({ x: btnRect.left - listRect.left, width: btnRect.width, ready: true });
    }, [scaffoldLevel]);

    useEffect(() => { updateIndicator(); }, [updateIndicator]);

    useEffect(() => {
        window.addEventListener('resize', updateIndicator);
        return () => window.removeEventListener('resize', updateIndicator);
    }, [updateIndicator]);

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

    const checkedCount = Object.values(checkedItems).filter(Boolean).length;
    const canReveal = checkedCount >= MIN_CHECKED_TO_REVEAL && wordCount >= 20;

    return (
        <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: spacing[6],
            fontFamily: typography.fontFamily,
        }}>
            {/* Hero with video background */}
            <div style={{
                position: 'relative',
                overflow: 'hidden',
                width: '100vw',
                marginLeft: 'calc(-50vw + 50%)',
                marginBottom: spacing[6],
                minHeight: '240px',
            }}>
                <video aria-hidden="true"
                    autoPlay
                    muted
                    loop
                    playsInline
                    onLoadedData={(e) => {
                        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                            e.target.pause();
                        } else {
                            e.target.style.opacity = 1;
                        }
                    }}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: 0,
                        transition: 'opacity 0.8s ease-out',
                    }}
                    src="/stereo-recording-hero.mp4"
                />
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to bottom, rgba(26,26,46,0.4) 0%, rgba(26,26,46,0.7) 100%)',
                }} />
                <div style={{
                    position: 'relative',
                    maxWidth: '640px', margin: '0 auto',
                    padding: `${spacing[12]} ${spacing[6]} ${spacing[10]}`,
                    textAlign: 'center',
                }}>
                    <h1 style={{
                        fontSize: typography.size['4xl'],
                        fontWeight: typography.weight.bold,
                        color: '#ffffff',
                        lineHeight: typography.lineHeight.tight,
                        marginBottom: spacing[4],
                        textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    }}>
                        Stereo Recording Techniques
                    </h1>
                    <p style={{
                        color: 'rgba(255,255,255,0.85)',
                        fontSize: typography.size.lg,
                        lineHeight: typography.lineHeight.relaxed,
                        maxWidth: '480px', margin: '0 auto',
                    }}>
                        16-mark extended response — AO3 &amp; AO4
                    </p>
                </div>
            </div>

            {/* Scaffold toggle */}
            <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: spacing[4],
                marginBottom: spacing[6],
            }}>
                <div
                    ref={tabListRef}
                    style={{
                        display: 'flex',
                        position: 'relative',
                        background: t.bg.tertiary,
                        borderRadius: '100px',
                        padding: '4px',
                    }}
                >
                    {/* Sliding pill indicator */}
                    <div style={{
                        position: 'absolute',
                        top: '4px', bottom: '4px', left: '4px',
                        background: t.bg.primary,
                        borderRadius: '100px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
                        zIndex: 1,
                        width: tabIndicator.width ? `${tabIndicator.width}px` : 'auto',
                        transform: `translateX(${tabIndicator.x}px)`,
                        transition: tabIndicator.ready
                            ? 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                            : 'none',
                        willChange: 'transform, width',
                    }} />
                    {SCAFFOLD_LEVELS.map(level => (
                        <button type="button"
                            key={level.id}
                            ref={el => { tabBtnRefs.current[level.id] = el; }}
                            onClick={() => setScaffoldLevel(level.id)}
                            title={level.description}
                            style={{
                                flex: 1,
                                padding: `${spacing[2]} ${spacing[3]}`,
                                borderRadius: '100px',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: typography.size.sm,
                                fontFamily: typography.fontFamily,
                                fontWeight: scaffoldLevel === level.id ? typography.weight.semibold : typography.weight.medium,
                                background: 'transparent',
                                color: scaffoldLevel === level.id ? t.text.primary : t.text.tertiary,
                                position: 'relative',
                                zIndex: 2,
                                transition: 'color 0.3s ease',
                                whiteSpace: 'nowrap',
                                userSelect: 'none',
                                WebkitTapHighlightColor: 'transparent',
                            }}
                        >
                            {level.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Essay question */}
            <div style={{
                background: t.bg.primary,
                borderRadius: borderRadius.xl,
                border: `2px solid ${t.accent.info}`,
                padding: spacing[5],
                marginBottom: spacing[6],
            }}>
                <div style={{
                    fontSize: typography.size.xs,
                    fontWeight: typography.weight.semibold,
                    color: t.accent.info,
                    textTransform: 'uppercase',
                    letterSpacing: typography.letterSpacing.wide,
                    marginBottom: spacing[2],
                }}>
                    Essay Question
                </div>
                <p style={{
                    fontSize: typography.size.base,
                    color: t.text.primary,
                    margin: 0,
                    lineHeight: typography.lineHeight.relaxed,
                    fontWeight: typography.weight.medium,
                }}>
                    {ESSAY_QUESTION}
                </p>
                <p style={{
                    fontSize: typography.size.xs,
                    color: t.text.tertiary,
                    margin: `${spacing[3]} 0 0`,
                }}>
                    Total: 16 marks — AO3 (5 marks) + AO4 (11 marks)
                </p>
            </div>

            {/* Main layout: Techniques sidebar + Essay */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '340px 1fr',
                gap: spacing[6],
                marginBottom: spacing[6],
            }}>
                {/* Technique prompts sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
                    {/* Technique cards */}
                    {TECHNIQUES.map(tech => (
                        <TechniqueCard
                            key={tech.id}
                            technique={tech}
                            level={scaffoldLevel}
                            isActive={activeTechnique === tech.id}
                            onToggle={() => setActiveTechnique(activeTechnique === tech.id ? null : tech.id)}
                            theme={t}
                        />
                    ))}

                    {/* Extension for high achievers */}
                    <div style={{
                        background: t.bg.primary,
                        borderRadius: borderRadius.xl,
                        border: `1px solid ${t.border.subtle}`,
                        overflow: 'hidden',
                    }}>
                        <button type="button"
                            onClick={() => setShowExtension(!showExtension)}
                            style={{
                                width: '100%',
                                padding: `${spacing[3]} ${spacing[4]}`,
                                background: showExtension ? t.accent.warningLight : t.bg.primary,
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontFamily: typography.fontFamily,
                            }}
                        >
                            <span style={{
                                fontSize: typography.size.sm,
                                fontWeight: typography.weight.semibold,
                                color: t.accent.warning,
                            }}>
                                Extension — Advanced Techniques
                            </span>
                            <span style={{
                                fontSize: typography.size.xs,
                                color: t.text.tertiary,
                                transform: showExtension ? 'rotate(180deg)' : 'none',
                                transition: `transform ${transitions.fast}`,
                            }}>
                                ▼
                            </span>
                        </button>

                        {showExtension && (
                            <div style={{
                                padding: spacing[4],
                                display: 'flex',
                                flexDirection: 'column',
                                gap: spacing[3],
                            }}>
                                <p style={{
                                    fontSize: typography.size.xs,
                                    color: t.text.tertiary,
                                    margin: 0,
                                }}>
                                    For higher marks, reference these additional techniques to show breadth of knowledge:
                                </p>
                                {EXTENSION_TOPICS.map(topic => (
                                    <div key={topic.id} style={{
                                        padding: spacing[3],
                                        background: t.bg.secondary,
                                        borderRadius: borderRadius.md,
                                    }}>
                                        <div style={{
                                            fontSize: typography.size.sm,
                                            fontWeight: typography.weight.semibold,
                                            color: t.text.primary,
                                            marginBottom: spacing[1],
                                        }}>
                                            {topic.label}
                                        </div>
                                        <p style={{
                                            fontSize: typography.size.xs,
                                            color: t.text.secondary,
                                            margin: 0,
                                            lineHeight: typography.lineHeight.relaxed,
                                        }}>
                                            {topic.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
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
                        marginBottom: spacing[5],
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
                            color: wordCount > 0 ? t.text.secondary : t.text.tertiary,
                            fontFamily: typography.fontFamilyMono,
                        }}>
                            {wordCount} words
                        </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[5] }}>
                        {ESSAY_SECTIONS.map(section => (
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
                                <textarea aria-label={`Your essay response — ${section.label}`}
                                    value={essayContent[section.id] || ''}
                                    onChange={(e) => updateSection(section.id, e.target.value)}
                                    placeholder={section.placeholder}
                                    rows={section.rows}
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
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: spacing[3],
                        }}>
                            <h3 style={{
                                fontSize: typography.size.base,
                                fontWeight: typography.weight.semibold,
                                color: t.text.primary,
                                margin: 0,
                            }}>
                                Self-Assessment Checklist
                            </h3>
                            <span style={{
                                fontSize: typography.size.xs,
                                color: checkedCount === SELF_ASSESSMENT.length ? t.accent.success : t.text.tertiary,
                                fontFamily: typography.fontFamilyMono,
                            }}>
                                {checkedCount}/{SELF_ASSESSMENT.length}
                            </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                            {SELF_ASSESSMENT.map(item => (
                                <label
                                    key={item.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: spacing[2],
                                        fontSize: typography.size.sm,
                                        color: checkedItems[item.id] ? t.text.primary : t.text.secondary,
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

                    {/* Reveal-and-compare */}
                    <div style={{
                        marginTop: spacing[6],
                        padding: spacing[5],
                        background: t.bg.secondary,
                        borderRadius: borderRadius.lg,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: spacing[2],
                    }}>
                        <button type="button"
                            onClick={() => canReveal && setModelRevealed(true)}
                            disabled={!canReveal}
                            style={{
                                padding: `${spacing[3]} ${spacing[6]}`,
                                borderRadius: borderRadius.lg,
                                border: 'none',
                                cursor: canReveal ? 'pointer' : 'not-allowed',
                                fontSize: typography.size.base,
                                fontWeight: typography.weight.semibold,
                                fontFamily: typography.fontFamily,
                                background: canReveal ? t.accent.primary : t.bg.tertiary,
                                color: canReveal ? t.text.inverse : t.text.tertiary,
                                transition: `all ${transitions.fast}`,
                            }}
                        >
                            Compare to model answer
                        </button>
                        {!canReveal && (
                            <span style={{
                                fontSize: typography.size.xs,
                                color: t.text.tertiary,
                                fontFamily: typography.fontFamily,
                                textAlign: 'center',
                            }}>
                                Write at least 20 words and tick {MIN_CHECKED_TO_REVEAL} boxes above to unlock the model answer
                            </span>
                        )}
                    </div>

                    {modelRevealed && (
                        <div style={{
                            marginTop: spacing[6],
                            padding: spacing[5],
                            background: t.accent.successLight,
                            borderRadius: borderRadius.lg,
                            border: `1px solid ${t.accent.success}`,
                        }}>
                            <div style={{
                                fontSize: typography.size.xs,
                                fontWeight: typography.weight.semibold,
                                color: t.accent.success,
                                textTransform: 'uppercase',
                                letterSpacing: typography.letterSpacing.wide,
                                marginBottom: spacing[3],
                            }}>
                                Model Answer
                            </div>
                            {MODEL_ANSWER.split('\n\n').map((para, i) => (
                                <p key={i} style={{
                                    fontSize: typography.size.sm,
                                    color: t.text.primary,
                                    margin: i === 0 ? 0 : `${spacing[3]} 0 0`,
                                    lineHeight: typography.lineHeight.relaxed,
                                }}>
                                    {para}
                                </p>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function TechniqueCard({ technique, level, isActive, onToggle, theme: t }) {
    if (level === 'independent') {
        return (
            <div style={{
                background: t.bg.primary,
                borderRadius: borderRadius.xl,
                border: `1px solid ${t.border.subtle}`,
                padding: `${spacing[3]} ${spacing[4]}`,
            }}>
                <div style={{
                    fontSize: typography.size.sm,
                    fontWeight: typography.weight.semibold,
                    color: t.text.primary,
                }}>
                    {technique.label}
                </div>
                <p style={{
                    fontSize: typography.size.xs,
                    color: t.text.tertiary,
                    margin: `${spacing[1]} 0 0`,
                }}>
                    {technique.description}
                </p>
            </div>
        );
    }

    return (
        <div style={{
            background: t.bg.primary,
            borderRadius: borderRadius.xl,
            border: isActive ? `2px solid ${t.accent.primary}` : `1px solid ${t.border.subtle}`,
            overflow: 'hidden',
            transition: `border-color ${transitions.fast}`,
        }}>
            <button type="button"
                onClick={onToggle}
                style={{
                    width: '100%',
                    padding: `${spacing[3]} ${spacing[4]}`,
                    background: isActive ? t.accent.infoLight : t.bg.primary,
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: typography.fontFamily,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <div>
                    <div style={{
                        fontSize: typography.size.sm,
                        fontWeight: typography.weight.semibold,
                        color: t.text.primary,
                    }}>
                        {technique.label}
                    </div>
                    <p style={{
                        fontSize: typography.size.xs,
                        color: t.text.tertiary,
                        margin: `${spacing[1]} 0 0`,
                    }}>
                        {technique.description}
                    </p>
                </div>
                <span style={{
                    fontSize: typography.size.xs,
                    color: t.text.tertiary,
                    transform: isActive ? 'rotate(180deg)' : 'none',
                    transition: `transform ${transitions.fast}`,
                    flexShrink: 0,
                    marginLeft: spacing[2],
                }}>
                    ▼
                </span>
            </button>

            {isActive && (
                <div style={{ padding: spacing[4], display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
                    {/* Guiding question — all scaffold levels */}
                    <div style={{
                        padding: spacing[3],
                        background: t.accent.infoLight,
                        borderRadius: borderRadius.lg,
                        borderLeft: `3px solid ${t.accent.info}`,
                    }}>
                        <div style={{
                            fontSize: typography.size.xs,
                            fontWeight: typography.weight.semibold,
                            color: t.accent.info,
                            textTransform: 'uppercase',
                            letterSpacing: typography.letterSpacing.wide,
                            marginBottom: spacing[1],
                        }}>
                            Guiding Question
                        </div>
                        <p style={{
                            fontSize: typography.size.sm,
                            color: t.text.primary,
                            margin: 0,
                            lineHeight: typography.lineHeight.relaxed,
                        }}>
                            {technique.scaffold.question}
                        </p>
                    </div>

                    {/* Sentence starter — full + medium */}
                    {(level === 'full' || level === 'medium') && (
                        <div style={{
                            padding: spacing[3],
                            background: t.accent.successLight,
                            borderRadius: borderRadius.lg,
                            borderLeft: `3px solid ${t.accent.success}`,
                        }}>
                            <div style={{
                                fontSize: typography.size.xs,
                                fontWeight: typography.weight.semibold,
                                color: t.accent.success,
                                textTransform: 'uppercase',
                                letterSpacing: typography.letterSpacing.wide,
                                marginBottom: spacing[1],
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
                                {technique.scaffold.sentenceStarter}
                            </p>
                        </div>
                    )}

                    {/* Evaluation prompt — full only */}
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
                                textTransform: 'uppercase',
                                letterSpacing: typography.letterSpacing.wide,
                                marginBottom: spacing[1],
                            }}>
                                Evaluation Prompt (AO4)
                            </div>
                            <p style={{
                                fontSize: typography.size.sm,
                                color: t.text.primary,
                                margin: 0,
                                lineHeight: typography.lineHeight.relaxed,
                            }}>
                                {technique.scaffold.evaluationPrompt}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
