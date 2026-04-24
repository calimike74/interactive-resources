'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { theme, typography, borderRadius, spacing, transitions } from '@/lib/theme';
import { supabase } from '@/lib/supabase';

const SCAFFOLD_LEVELS = [
    { id: 'full', label: 'Full Support', description: 'All scaffolds visible', rank: 4 },
    { id: 'medium', label: 'Medium', description: 'Questions + sentence starters', rank: 3 },
    { id: 'minimal', label: 'Minimal', description: 'Questions only', rank: 2 },
    { id: 'independent', label: 'Independent', description: 'No scaffolds', rank: 1 },
];

const ESSAY_QUESTION = 'Figure 1 shows the insert chain applied to a lead vocal in a contemporary pop ballad. The vocalist sings with wide dynamic range and occasional sibilance. Evaluate the suitability of the settings to achieve an intelligible, forward vocal with a sense of space.';

// Scaffolds are deliberately phrased as QUESTIONS (not statements).
// Sentence starters are bland grammatical launchers only — no AO3/AO4 content
// is embedded, so copying a starter verbatim does not earn marks.
const PROCESSORS = [
    {
        id: 'hpf',
        label: '1. High-Pass Filter',
        description: '80 Hz, 12 dB/oct',
        scaffold: {
            question: 'What does a high-pass filter do, and what does the 12 dB/octave slope tell you about how steeply it rolls off?',
            sentenceStarter: 'The high-pass filter...',
            evaluationPrompt: 'Is 80 Hz a sensible cutoff for a lead vocal in this context, or could it remove anything musically useful? Consider what sits below 80 Hz on a typical close-mic\'d vocal.',
        },
    },
    {
        id: 'compressor',
        label: '2. Compressor',
        description: '4:1, −18 dB, 10 ms / 100 ms, soft knee, +4 dB makeup',
        scaffold: {
            question: 'What does each of the five knobs (threshold, ratio, attack, release, makeup gain) control, and what do the specific numbers shown mean in practice?',
            sentenceStarter: 'The compressor...',
            evaluationPrompt: 'Are these settings suitable for a vocalist with wide dynamic range? Consider whether the attack and release will preserve consonant clarity, and whether 4:1 with a −18 dB threshold risks over-compressing loud phrases.',
        },
    },
    {
        id: 'de-esser',
        label: '3. De-Esser',
        description: '6.5 kHz, Threshold −22 dB',
        scaffold: {
            question: 'What is a de-esser and how does it differ from a normal compressor? Why might it sit after the compressor rather than before it?',
            sentenceStarter: 'The de-esser...',
            evaluationPrompt: 'Is 6.5 kHz a sensible target for sibilance, and could placing the de-esser after the compressor (which can raise sibilance to the surface) be justified?',
        },
    },
    {
        id: 'parametric-eq',
        label: '4. Parametric EQ',
        description: '−3 dB @ 300 Hz · +4 dB @ 5 kHz · +2 dB shelf @ 10 kHz',
        scaffold: {
            question: 'What character would each of the three EQ moves give the vocal, and why are 300 Hz, 5 kHz, and 10 kHz common targets on a lead vocal?',
            sentenceStarter: 'The parametric EQ...',
            evaluationPrompt: 'Does the +4 dB boost at 5 kHz support the \'forward, intelligible\' brief, or does it risk re-introducing the sibilance the de-esser just removed? Is there tension between this EQ and the processor above it?',
        },
    },
    {
        id: 'plate-reverb',
        label: '5. Plate Reverb (Aux)',
        description: 'Pre-delay 20 ms · Decay 1.8 s · Mix 20%',
        scaffold: {
            question: 'What characterises a plate reverb compared with a hall or room, and what does the 20 ms pre-delay do for the sound?',
            sentenceStarter: 'The plate reverb...',
            evaluationPrompt: 'Is 20% wet appropriate for a vocal that needs to sit forward? Consider when you might automate the reverb level between verse and chorus, and whether an aux send is the right architecture here.',
        },
    },
];

const EXTENSION_TOPICS = [
    {
        id: 'processing-order',
        label: 'Processing Order',
        description: 'Why HPF first (so the compressor doesn\'t waste gain reduction on rumble), why de-ess after compression (compression raises sibilance to the surface), and why EQ after dynamics (you\'re shaping a controlled signal rather than one fighting its own peaks).',
    },
    {
        id: 'aux-vs-insert',
        label: 'Aux Send vs Insert',
        description: 'Reverb on an aux send keeps the dry signal intact and lets you share the same reverb across backing vocals for a cohesive space. An insert reverb ties the wet/dry ratio to that one channel only, which is less flexible.',
    },
    {
        id: 'automation-alternative',
        label: 'Automation as an Alternative',
        description: 'For a vocalist with very wide dynamic range, riding the fader (volume automation) can be more musical than pushing a single compressor harder. The settings shown assume one compressor is doing all the levelling work; serial compression or automation might be more suitable.',
    },
];

const ESSAY_SECTIONS = [
    {
        id: 'response',
        label: 'Your Essay',
        placeholder: 'Write your full response here. Work through each processor, explaining what it does and evaluating whether its settings suit the brief (intelligible, forward, spacious; wide dynamic range; sibilance)...',
        guidance: 'Cover all five processors in Figure 1. For each, explain what it does and what its settings mean (AO3), then evaluate whether those choices suit the stated context (AO4). Watch for tensions between processors — a strong answer spots where the chain fights itself.',
        rows: 20,
    },
];

const SELF_ASSESSMENT = [
    { id: 'identify-each', label: 'I named each processor in the chain and explained what it does (AO3)' },
    { id: 'explain-numbers', label: 'I explained what specific numerical settings mean (e.g. "4:1 ratio means...")' },
    { id: 'context', label: 'I connected my judgements to the stated brief (ballad, wide dynamic range, sibilance, forward, spacious)' },
    { id: 'order', label: 'I commented on the order of processing, not just each processor in isolation' },
    { id: 'tension', label: 'I spotted at least one tension, risk, or trade-off in the chain' },
    { id: 'evaluative-language', label: 'I used evaluative language (therefore, however, this suggests, consequently)' },
];

export default function VocalChannelStripEssay() {
    const t = theme.light;
    const [studentName, setStudentName] = useState('');
    const [scaffoldLevel, setScaffoldLevel] = useState('full');
    // Track every scaffold level the student opens during the session.
    // Seeded with 'full' because the page opens on Full Support by default —
    // a student has already seen those scaffolds before they touch anything.
    const [scaffoldLevelsUsed, setScaffoldLevelsUsed] = useState(() => new Set(['full']));
    const [essayContent, setEssayContent] = useState({});
    const [checkedItems, setCheckedItems] = useState({});
    const [showExtension, setShowExtension] = useState(false);
    const [activeProcessor, setActiveProcessor] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const tabListRef = useRef(null);
    const tabBtnRefs = useRef({});
    const [tabIndicator, setTabIndicator] = useState({ x: 0, width: 0, ready: false });

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

    const handleSubmit = async () => {
        if (!studentName.trim()) {
            alert('Please enter your name before submitting.');
            return;
        }
        const content = essayContent.response?.trim();
        if (!content || wordCount < 20) {
            alert('Please write at least 20 words before submitting.');
            return;
        }
        setSubmitting(true);
        try {
            const levelsUsed = Array.from(scaffoldLevelsUsed);
            const maxSupport = levelsUsed.reduce((best, id) => {
                const rank = SCAFFOLD_LEVELS.find(l => l.id === id)?.rank ?? 0;
                const bestRank = SCAFFOLD_LEVELS.find(l => l.id === best)?.rank ?? 0;
                return rank > bestRank ? id : best;
            }, levelsUsed[0]);

            const { error } = await supabase
                .from('essay_responses')
                .insert({
                    resource_id: 'vocal-channel-strip-essay',
                    student_name: studentName.trim(),
                    content,
                    word_count: wordCount,
                    scaffold_level: scaffoldLevel,
                    scaffold_levels_used: levelsUsed,
                    max_support_used: maxSupport,
                });
            if (error) throw error;
            setSubmitted(true);
        } catch (err) {
            alert('Error submitting: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        const scaffoldMeta = SCAFFOLD_LEVELS.find(l => l.id === scaffoldLevel);
        const visitedLabels = Array.from(scaffoldLevelsUsed)
            .map(id => SCAFFOLD_LEVELS.find(l => l.id === id)?.label)
            .filter(Boolean)
            .join(', ');
        return (
            <div style={{
                maxWidth: '500px',
                margin: '0 auto',
                padding: spacing[10],
                fontFamily: typography.fontFamily,
                textAlign: 'center',
            }}>
                <div style={{
                    background: t.bg.primary,
                    borderRadius: borderRadius['2xl'],
                    padding: spacing[8],
                    boxShadow: t.shadow.lg,
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: spacing[4] }}>✓</div>
                    <h2 style={{
                        fontSize: typography.size.xl,
                        fontWeight: typography.weight.bold,
                        color: t.text.primary,
                        marginBottom: spacing[2],
                    }}>
                        Essay Submitted
                    </h2>
                    <p style={{
                        fontSize: typography.size.sm,
                        color: t.text.secondary,
                        marginBottom: spacing[4],
                    }}>
                        Thanks {studentName}. Your teacher will mark your response.
                    </p>
                    <div style={{
                        fontSize: typography.size.xs,
                        color: t.text.tertiary,
                        fontFamily: typography.fontFamilyMono,
                        display: 'flex',
                        justifyContent: 'center',
                        gap: spacing[4],
                        marginBottom: spacing[2],
                    }}>
                        <span>{wordCount} words</span>
                        <span>·</span>
                        <span>Submitted on: {scaffoldMeta?.label || scaffoldLevel}</span>
                    </div>
                    <p style={{
                        fontSize: typography.size.xs,
                        color: t.text.tertiary,
                        margin: 0,
                    }}>
                        Scaffold levels opened during this session: <strong>{visitedLabels}</strong>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: spacing[6],
            fontFamily: typography.fontFamily,
        }}>
            {/* Hero */}
            <div style={{
                position: 'relative',
                overflow: 'hidden',
                width: '100vw',
                marginLeft: 'calc(-50vw + 50%)',
                marginBottom: spacing[6],
                minHeight: '240px',
                background: 'linear-gradient(135deg, #1a1a2e 0%, #2d2d4a 50%, #1a1a2e 100%)',
            }}>
                <div style={{
                    position: 'relative',
                    maxWidth: '720px', margin: '0 auto',
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
                        Vocal Channel Strip
                    </h1>
                    <p style={{
                        color: 'rgba(255,255,255,0.85)',
                        fontSize: typography.size.lg,
                        lineHeight: typography.lineHeight.relaxed,
                        maxWidth: '560px', margin: '0 auto',
                    }}>
                        20-mark extended response — AO3 (5) &amp; AO4 (15)
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
                        <button
                            key={level.id}
                            ref={el => { tabBtnRefs.current[level.id] = el; }}
                            onClick={() => {
                                setScaffoldLevel(level.id);
                                setScaffoldLevelsUsed(prev => {
                                    if (prev.has(level.id)) return prev;
                                    const next = new Set(prev);
                                    next.add(level.id);
                                    return next;
                                });
                            }}
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
                    Total: 20 marks — AO3 (5 marks) + AO4 (15 marks)
                </p>
            </div>

            {/* Main layout: Processor sidebar + Essay + Sticky Figure 1 */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '300px 1fr 340px',
                gap: spacing[6],
                marginBottom: spacing[6],
                alignItems: 'start',
            }}>
                {/* Processor prompts sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
                    {PROCESSORS.map(proc => (
                        <ProcessorCard
                            key={proc.id}
                            processor={proc}
                            level={scaffoldLevel}
                            isActive={activeProcessor === proc.id}
                            onToggle={() => setActiveProcessor(activeProcessor === proc.id ? null : proc.id)}
                            theme={t}
                        />
                    ))}

                    {/* Extension */}
                    <div style={{
                        background: t.bg.primary,
                        borderRadius: borderRadius.xl,
                        border: `1px solid ${t.border.subtle}`,
                        overflow: 'hidden',
                    }}>
                        <button
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
                                Extension — For Higher Marks
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
                                    Strong answers don&apos;t just describe each processor in isolation. They comment on how the chain works as a whole.
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
                                <textarea
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

                    {/* Name + Submit */}
                    <div style={{
                        marginTop: spacing[6],
                        padding: spacing[5],
                        background: t.bg.secondary,
                        borderRadius: borderRadius.lg,
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing[4],
                        flexWrap: 'wrap',
                    }}>
                        <input
                            type="text"
                            value={studentName}
                            onChange={(e) => setStudentName(e.target.value)}
                            placeholder="Your name"
                            style={{
                                flex: '1 1 200px',
                                padding: spacing[3],
                                borderRadius: borderRadius.lg,
                                border: `1px solid ${t.border.input}`,
                                fontSize: typography.size.base,
                                fontFamily: typography.fontFamily,
                                background: t.bg.primary,
                                color: t.text.primary,
                            }}
                        />
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || !studentName.trim() || wordCount < 20}
                            style={{
                                padding: `${spacing[3]} ${spacing[6]}`,
                                borderRadius: borderRadius.lg,
                                border: 'none',
                                cursor: submitting || !studentName.trim() || wordCount < 20 ? 'not-allowed' : 'pointer',
                                fontSize: typography.size.base,
                                fontWeight: typography.weight.semibold,
                                fontFamily: typography.fontFamily,
                                background: submitting || !studentName.trim() || wordCount < 20
                                    ? t.bg.tertiary
                                    : t.accent.primary,
                                color: submitting || !studentName.trim() || wordCount < 20
                                    ? t.text.tertiary
                                    : t.text.inverse,
                                transition: `all ${transitions.fast}`,
                            }}
                        >
                            {submitting ? 'Submitting...' : 'Submit Essay'}
                        </button>
                    </div>
                </div>

                {/* Sticky Figure 1 — stays visible while scrolling */}
                <div style={{
                    position: 'sticky',
                    top: spacing[4],
                    alignSelf: 'start',
                }}>
                    <div style={{
                        background: t.bg.primary,
                        borderRadius: borderRadius.xl,
                        border: `1px solid ${t.border.subtle}`,
                        padding: spacing[4],
                    }}>
                        <div style={{
                            fontSize: typography.size.xs,
                            fontWeight: typography.weight.semibold,
                            color: t.text.secondary,
                            textTransform: 'uppercase',
                            letterSpacing: typography.letterSpacing.wide,
                            marginBottom: spacing[2],
                        }}>
                            Figure 1
                        </div>
                        <a
                            href="/essays/figure-1-vocal-insert-chain.png"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'block',
                                background: t.bg.secondary,
                                borderRadius: borderRadius.lg,
                                padding: spacing[2],
                                cursor: 'zoom-in',
                            }}
                            title="Click to open full size in a new tab"
                        >
                            <img
                                src="/essays/figure-1-vocal-insert-chain.png"
                                alt="DAW channel strip showing five insert slots: high-pass filter at 80 Hz, compressor at 4:1 ratio with −18 dB threshold, de-esser at 6.5 kHz, parametric EQ with bands at 300 Hz, 5 kHz, and 10 kHz, and an aux send to plate reverb with 20 ms pre-delay, 1.8 s decay, 20% wet."
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    height: 'auto',
                                    borderRadius: borderRadius.md,
                                }}
                            />
                        </a>
                        <p style={{
                            fontSize: typography.size.xs,
                            color: t.text.tertiary,
                            margin: `${spacing[2]} 0 0`,
                            textAlign: 'center',
                            fontStyle: 'italic',
                        }}>
                            Click to enlarge
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ProcessorCard({ processor, level, isActive, onToggle, theme: t }) {
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
                    {processor.label}
                </div>
                <p style={{
                    fontSize: typography.size.xs,
                    color: t.text.tertiary,
                    margin: `${spacing[1]} 0 0`,
                    fontFamily: typography.fontFamilyMono,
                }}>
                    {processor.description}
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
            <button
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
                        {processor.label}
                    </div>
                    <p style={{
                        fontSize: typography.size.xs,
                        color: t.text.tertiary,
                        margin: `${spacing[1]} 0 0`,
                        fontFamily: typography.fontFamilyMono,
                    }}>
                        {processor.description}
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
                            {processor.scaffold.question}
                        </p>
                    </div>

                    {/* Sentence starter — full + medium (bland grammatical launcher, no AO3/AO4 content) */}
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
                                {processor.scaffold.sentenceStarter}
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
                                {processor.scaffold.evaluationPrompt}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
