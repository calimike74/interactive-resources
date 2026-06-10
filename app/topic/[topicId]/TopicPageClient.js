'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, Eye, Pencil, RotateCcw, ClipboardCheck, Timer, Clock } from 'lucide-react';
import { theme, typography, borderRadius, spacing, transitions, glass, editorial as ED } from '@/lib/theme';
import { getAvailableTopics } from '@/lib/questions';
import { getQuizProgress } from '@/lib/quiz-persistence';
import { hasLearnContent } from '@/lib/learn/topics';
import Breadcrumbs from '@/components/Breadcrumbs';
import GlassMorphismGrid from '@/components/GlassMorphismGrid';

// Type labels for resource badges
const typeLabels = {
    interactive: 'Interactive',
    demonstration: 'Demo',
    practice: 'Practice',
    revision: 'Revision',
    assessment: 'Assessment',
};

// Editorial line-icon per resource type — replaces emoji clutter.
const typeIcons = {
    interactive: Sparkles,
    demonstration: Eye,
    practice: Pencil,
    revision: RotateCcw,
    assessment: ClipboardCheck,
};

export default function TopicPageClient({ topic, resources }) {
    const t = theme.light;
    const [progress, setProgress] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('revision_token');
        if (token && getAvailableTopics().includes(topic.id)) {
            getQuizProgress(token, topic.id).then(setProgress);
        }
    }, [topic.id]);

    return (
        <div
            style={{
                minHeight: '100vh',
                background: t.bg.secondary,
                fontFamily: typography.fontFamily,
            }}
        >
            {/* Topic Header */}
            {topic.heroVideo ? (
                <header
                    style={{
                        position: 'relative',
                        overflow: 'hidden',
                        minHeight: '280px',
                    }}
                >
                    <video
                        autoPlay
                        muted
                        playsInline
                        onLoadedData={(e) => { e.target.style.opacity = 1; }}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            opacity: 0,
                            transition: 'opacity 0.8s ease-out',
                        }}
                        src={topic.heroVideo}
                    />
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to bottom, rgba(24,20,16,0.35) 0%, rgba(24,20,16,0.65) 100%)',
                    }} />
                    <div style={{
                        position: 'relative',
                        maxWidth: '1200px',
                        margin: '0 auto',
                        padding: `${spacing[10]} ${spacing[8]} ${spacing[8]}`,
                    }}>
                        <Link
                            href="/"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: spacing[2],
                                color: 'rgba(255,255,255,0.8)',
                                textDecoration: 'none',
                                fontSize: typography.size.sm,
                                padding: `${spacing[2]} ${spacing[3]}`,
                                borderRadius: borderRadius.md,
                                background: 'rgba(255,255,255,0.15)',
                                backdropFilter: 'blur(8px)',
                                WebkitBackdropFilter: 'blur(8px)',
                                border: '1px solid rgba(255,255,255,0.3)',
                                boxShadow: glass.iconShadow,
                                transition: `all ${transitions.fast}`,
                                marginBottom: spacing[4],
                            }}
                        >
                            ← All Topics
                        </Link>

                        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3], marginBottom: spacing[2] }}>
                            <span
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    color: '#ffffff',
                                    padding: `${spacing[1]} ${spacing[3]}`,
                                    borderRadius: borderRadius.full,
                                    fontSize: typography.size.sm,
                                    fontWeight: typography.weight.semibold,
                                    backdropFilter: 'blur(8px)',
                                    WebkitBackdropFilter: 'blur(8px)',
                                    border: '1px solid rgba(255,255,255,0.3)',
                                    boxShadow: glass.iconShadow,
                                }}
                            >
                                {topic.specRef}
                            </span>
                        </div>

                        <h1
                            style={{
                                fontFamily: ED.serif,
                                fontStyle: 'italic',
                                fontWeight: 400,
                                fontSize: 'clamp(36px, 6vw, 56px)',
                                lineHeight: 1.05,
                                letterSpacing: '-0.02em',
                                color: '#ffffff',
                                marginBottom: spacing[2],
                                textShadow: '0 2px 12px rgba(0,0,0,0.35)',
                            }}
                        >
                            {topic.name}
                        </h1>
                        <p
                            style={{
                                color: 'rgba(255,255,255,0.85)',
                                fontSize: typography.size.base,
                                lineHeight: typography.lineHeight.relaxed,
                                maxWidth: '640px',
                            }}
                        >
                            {topic.description}
                        </p>
                    </div>
                </header>
            ) : (
                <header
                    style={{
                        position: 'relative',
                        background: 'white',
                        borderBottom: `1px solid ${ED.rule}`,
                        padding: `${spacing[10]} ${spacing[8]} ${spacing[10]}`,
                        overflow: 'hidden',
                        minHeight: '360px',
                    }}
                >
                    <GlassMorphismGrid rows={4} cols={14} revealRadius={320} />
                    <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 2, pointerEvents: 'none' }}>
                        <Link
                            href="/"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: spacing[2],
                                color: ED.inkSoft,
                                textDecoration: 'none',
                                fontSize: typography.size.sm,
                                marginBottom: spacing[8],
                                pointerEvents: 'auto',
                            }}
                        >
                            ← All Topics
                        </Link>

                        <div style={{ marginBottom: spacing[3] }}>
                            <span
                                style={{
                                    fontFamily: ED.mono,
                                    fontSize: '11px',
                                    fontWeight: 500,
                                    letterSpacing: '0.18em',
                                    textTransform: 'uppercase',
                                    color: ED.inkFade,
                                }}
                            >
                                Topic {topic.specRef}
                            </span>
                        </div>

                        <h1
                            style={{
                                fontFamily: ED.serif,
                                fontStyle: 'italic',
                                fontWeight: 400,
                                fontSize: 'clamp(44px, 8vw, 76px)',
                                lineHeight: 1.0,
                                letterSpacing: '-0.025em',
                                color: ED.ink,
                                marginBottom: spacing[5],
                                maxWidth: '900px',
                            }}
                        >
                            {topic.name}
                        </h1>
                        <div
                            aria-hidden="true"
                            style={{
                                width: '64px',
                                height: '1px',
                                background: ED.accent,
                                marginBottom: spacing[5],
                            }}
                        />
                        <p
                            style={{
                                color: ED.inkSoft,
                                fontSize: '17px',
                                lineHeight: 1.55,
                                maxWidth: '640px',
                            }}
                        >
                            {topic.description}
                        </p>
                    </div>
                </header>
            )}

            <Breadcrumbs />

            {/* Content Sections */}
            <main style={{ maxWidth: '1200px', margin: '0 auto', padding: spacing[8] }}>
                {/* Overview Section — topic spec orientation */}
                {topic.overview && (
                    <OverviewSection overview={topic.overview} theme={t} />
                )}

                {/* Learn Section */}
                <section style={{ marginBottom: spacing[10] }}>
                    <h2
                        style={{
                            fontSize: typography.size['2xl'],
                            fontWeight: typography.weight.semibold,
                            color: t.text.primary,
                            marginBottom: spacing[4],
                        }}
                    >
                        Learn
                    </h2>
                    {hasLearnContent(topic.id) ? (
                        <Link
                            href={`/learn/${topic.id}`}
                            style={{ textDecoration: 'none' }}
                        >
                            <div
                                style={{
                                    background: glass.bg,
                                    backdropFilter: 'blur(' + glass.blur + ')',
                                    WebkitBackdropFilter: 'blur(' + glass.blur + ')',
                                    borderRadius: borderRadius.xl,
                                    border: `1px solid ${ED.accentFaint}`,
                                    padding: `${spacing[6]} ${spacing[6]}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    cursor: 'pointer',
                                    transition: `all ${transitions.normal} ${transitions.easing}`,
                                    boxShadow: glass.shadow,
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = ED.accent;
                                    e.currentTarget.style.boxShadow = glass.shadowHover;
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = ED.accentFaint;
                                    e.currentTarget.style.boxShadow = glass.shadow;
                                    e.currentTarget.style.transform = 'none';
                                }}
                            >
                                <div>
                                    <h3 style={{
                                        fontSize: typography.size.lg,
                                        fontWeight: typography.weight.semibold,
                                        color: t.text.primary,
                                        marginBottom: spacing[1],
                                    }}>
                                        Start Learning
                                    </h3>
                                    <p style={{
                                        fontSize: typography.size.sm,
                                        color: t.text.secondary,
                                    }}>
                                        Step-by-step walkthrough with animated diagrams and inline quizzes
                                    </p>
                                </div>
                                <span style={{
                                    color: ED.accent,
                                    fontSize: typography.size.xl,
                                    fontWeight: typography.weight.semibold,
                                }}>
                                    →
                                </span>
                            </div>
                        </Link>
                    ) : (
                        <ComingSoonPlaceholder label="Guided lessons coming soon" theme={t} />
                    )}
                </section>

                {/* Explore Section — Interactive Tools */}
                <section style={{ marginBottom: spacing[10] }}>
                    <h2
                        style={{
                            fontSize: typography.size['2xl'],
                            fontWeight: typography.weight.semibold,
                            color: t.text.primary,
                            marginBottom: spacing[4],
                        }}
                    >
                        Explore
                    </h2>

                    {resources.length > 0 ? (
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                gap: spacing[4],
                            }}
                        >
                            {resources.map((resource, i) => (
                                <ResourceCard
                                    key={resource.id}
                                    resource={resource}
                                    theme={t}
                                    animationDelay={i * 80}
                                />
                            ))}
                        </div>
                    ) : (
                        <ComingSoonPlaceholder label="Interactive tools coming soon" theme={t} />
                    )}
                </section>

                {/* Revise Section */}
                <section style={{ marginBottom: spacing[10] }}>
                    <h2
                        style={{
                            fontSize: typography.size['2xl'],
                            fontWeight: typography.weight.semibold,
                            color: t.text.primary,
                            marginBottom: spacing[4],
                        }}
                    >
                        Revise
                    </h2>
                    {getAvailableTopics().includes(topic.id) ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
                            {/* Progress card — shown when student has history */}
                            {progress && (
                                <ProgressCard progress={progress} t={t} />
                            )}

                            {/* Start Revision link */}
                            <Link
                                href={`/revise/${topic.id}`}
                                style={{ textDecoration: 'none' }}
                            >
                                <div
                                    style={{
                                        background: glass.bg,
                                        backdropFilter: 'blur(' + glass.blur + ')',
                                        WebkitBackdropFilter: 'blur(' + glass.blur + ')',
                                        borderRadius: borderRadius.xl,
                                        border: `1px solid ${ED.accentFaint}`,
                                        padding: `${spacing[6]} ${spacing[6]}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        cursor: 'pointer',
                                        transition: `all ${transitions.normal} ${transitions.easing}`,
                                        boxShadow: glass.shadow,
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.borderColor = ED.accent;
                                        e.currentTarget.style.boxShadow = glass.shadowHover;
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = ED.accentFaint;
                                        e.currentTarget.style.boxShadow = glass.shadow;
                                        e.currentTarget.style.transform = 'none';
                                    }}
                                >
                                    <div>
                                        <h3 style={{
                                            fontSize: typography.size.lg,
                                            fontWeight: typography.weight.semibold,
                                            color: t.text.primary,
                                            marginBottom: spacing[1],
                                        }}>
                                            {progress ? 'Continue Revision' : 'Start Revision'}
                                        </h3>
                                        <p style={{
                                            fontSize: typography.size.sm,
                                            color: t.text.secondary,
                                        }}>
                                            Test your knowledge with multiple choice, calculation, and short answer questions
                                        </p>
                                    </div>
                                    <span style={{
                                        color: ED.accent,
                                        fontSize: typography.size.xl,
                                        fontWeight: typography.weight.semibold,
                                    }}>
                                        →
                                    </span>
                                </div>
                            </Link>

                            {/* Exam Mode link */}
                            <Link
                                href={`/exam/${topic.id}`}
                                style={{ textDecoration: 'none' }}
                            >
                                <div
                                    style={{
                                        background: glass.bg,
                                        backdropFilter: 'blur(' + glass.blur + ')',
                                        WebkitBackdropFilter: 'blur(' + glass.blur + ')',
                                        borderRadius: borderRadius.xl,
                                        border: `1px solid ${t.border.subtle}`,
                                        padding: `${spacing[5]} ${spacing[6]}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        cursor: 'pointer',
                                        transition: `all ${transitions.normal} ${transitions.easing}`,
                                        boxShadow: glass.shadow,
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.borderColor = t.border.medium;
                                        e.currentTarget.style.boxShadow = glass.shadowHover;
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = t.border.subtle;
                                        e.currentTarget.style.boxShadow = glass.shadow;
                                        e.currentTarget.style.transform = 'none';
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                                        <Timer size={20} strokeWidth={1.5} color={ED.inkSoft} aria-hidden="true" />
                                        <div>
                                            <h3 style={{
                                                fontSize: typography.size.base,
                                                fontWeight: typography.weight.semibold,
                                                color: t.text.secondary,
                                                marginBottom: spacing[0.5],
                                            }}>
                                                Exam Mode
                                            </h3>
                                            <p style={{
                                                fontSize: typography.size.xs,
                                                color: t.text.tertiary,
                                            }}>
                                                Answer every question once under timed conditions — you can&apos;t return to change answers.
                                            </p>
                                        </div>
                                    </div>
                                    <span style={{
                                        color: t.text.tertiary,
                                        fontSize: typography.size.lg,
                                    }}>
                                        →
                                    </span>
                                </div>
                            </Link>
                        </div>
                    ) : (
                        <ComingSoonPlaceholder label="Revision quizzes and flashcards coming soon" theme={t} />
                    )}
                </section>

            </main>
        </div>
    );
}

function ResourceCard({ resource, theme: t, animationDelay = 0 }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <Link
            href={`/${resource.id}`}
            style={{
                textDecoration: 'none',
                animation: `cardReveal 400ms ease-out ${animationDelay}ms both`,
            }}
        >
            <article
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    position: 'relative',
                    overflow: 'hidden',
                    background: glass.bg,
                    backdropFilter: 'blur(' + glass.blur + ')',
                    WebkitBackdropFilter: 'blur(' + glass.blur + ')',
                    borderRadius: borderRadius.xl,
                    border: `1px solid ${isHovered ? ED.accentMid : glass.border}`,
                    boxShadow: isHovered ? glass.shadowHover : glass.shadow,
                    padding: spacing[6],
                    cursor: 'pointer',
                    transition: `all ${transitions.normal} ${transitions.easing}`,
                    transform: isHovered ? 'translateY(-2px)' : 'none',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1 }}>
                    {/* Type icon (left) + type label (right) */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[4] }}>
                        {(() => {
                            const Icon = typeIcons[resource.type] || Sparkles;
                            return <Icon size={20} strokeWidth={1.5} color={ED.inkSoft} aria-hidden="true" />;
                        })()}
                        <span
                            style={{
                                fontFamily: ED.mono,
                                fontSize: '10px',
                                fontWeight: 500,
                                letterSpacing: '0.18em',
                                textTransform: 'uppercase',
                                color: ED.inkFade,
                            }}
                        >
                            {typeLabels[resource.type] || resource.type}
                        </span>
                    </div>

                    {/* Title */}
                    <h3
                        style={{
                            fontSize: typography.size.lg,
                            fontWeight: typography.weight.semibold,
                            color: t.text.primary,
                            marginBottom: spacing[2],
                            lineHeight: typography.lineHeight.tight,
                        }}
                    >
                        {resource.title}
                    </h3>

                    {/* Description */}
                    <p
                        style={{
                            color: t.text.secondary,
                            fontSize: typography.size.sm,
                            lineHeight: typography.lineHeight.relaxed,
                            flex: 1,
                        }}
                    >
                        {resource.description}
                    </p>

                    {/* Footer */}
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingTop: spacing[3],
                            marginTop: spacing[4],
                            borderTop: `1px solid ${glass.border}`,
                        }}
                    >
                        <span style={{ color: t.text.tertiary, fontSize: typography.size.xs, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} strokeWidth={1.5} aria-hidden="true" />
                            {resource.estimatedTime}
                        </span>
                        <span style={{ color: ED.accent, fontSize: typography.size.xs, fontWeight: typography.weight.medium }}>
                            Open →
                        </span>
                    </div>
                </div>
            </article>
        </Link>
    );
}

function ProgressCard({ progress, t }) {
    const hasBestScore = progress.bestScore !== null && progress.bestScore !== undefined;
    const scoreColor = !hasBestScore ? t.accent.info
        : progress.bestScore >= 70 ? t.accent.success
        : progress.bestScore >= 40 ? t.accent.warning
        : t.accent.error;

    const lastDate = new Date(progress.lastDate);
    const dateStr = lastDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

    return (
        <div style={{
            background: glass.bg,
            backdropFilter: 'blur(' + glass.blur + ')',
            WebkitBackdropFilter: 'blur(' + glass.blur + ')',
            borderRadius: borderRadius.xl,
            border: `1px solid ${glass.border}`,
            padding: `${spacing[5]} ${spacing[6]}`,
            boxShadow: glass.shadow,
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: spacing[4],
                flexWrap: 'wrap',
            }}>
                {/* Best score */}
                <div style={{ textAlign: 'center', minWidth: '70px' }}>
                    <p style={{
                        fontSize: typography.size['2xl'],
                        fontWeight: typography.weight.bold,
                        color: scoreColor,
                        lineHeight: 1,
                        marginBottom: spacing[1],
                    }}>
                        {hasBestScore ? `${progress.bestScore}%` : '—'}
                    </p>
                    <p style={{
                        fontSize: typography.size.xs,
                        color: t.text.tertiary,
                    }}>
                        Best score
                    </p>
                </div>

                {/* Attempts */}
                <div style={{ textAlign: 'center', minWidth: '70px' }}>
                    <p style={{
                        fontSize: typography.size['2xl'],
                        fontWeight: typography.weight.bold,
                        color: ED.accent,
                        lineHeight: 1,
                        marginBottom: spacing[1],
                    }}>
                        {progress.attempts}
                    </p>
                    <p style={{
                        fontSize: typography.size.xs,
                        color: t.text.tertiary,
                    }}>
                        {progress.attempts === 1 ? 'Attempt' : 'Attempts'}
                    </p>
                </div>

                {/* Last attempt */}
                <div style={{ textAlign: 'center', minWidth: '70px' }}>
                    <p style={{
                        fontSize: typography.size.lg,
                        fontWeight: typography.weight.semibold,
                        color: t.text.secondary,
                        lineHeight: 1,
                        marginBottom: spacing[1],
                    }}>
                        {dateStr}
                    </p>
                    <p style={{
                        fontSize: typography.size.xs,
                        color: t.text.tertiary,
                    }}>
                        Last revised
                    </p>
                </div>

                {/* Last score */}
                <div style={{ textAlign: 'center', minWidth: '70px' }}>
                    <p style={{
                        fontSize: typography.size.lg,
                        fontWeight: typography.weight.semibold,
                        color: t.text.secondary,
                        lineHeight: 1,
                        marginBottom: spacing[1],
                    }}>
                        {progress.lastScore !== null && progress.lastScore !== undefined ? `${progress.lastScore}%` : '—'}
                    </p>
                    <p style={{
                        fontSize: typography.size.xs,
                        color: t.text.tertiary,
                    }}>
                        Last score
                    </p>
                </div>
            </div>
        </div>
    );
}

function OverviewSection({ overview, theme: t }) {
    return (
        <section style={{ marginBottom: spacing[10] }}>
            <div
                style={{
                    background: glass.bg,
                    backdropFilter: 'blur(' + glass.blur + ')',
                    WebkitBackdropFilter: 'blur(' + glass.blur + ')',
                    borderRadius: borderRadius.xl,
                    border: `1px solid ${glass.border}`,
                    borderLeft: `1px solid ${ED.accentFaint}`,
                    padding: `${spacing[6]} ${spacing[7]}`,
                    boxShadow: glass.shadow,
                }}
            >
                {/* What you'll learn */}
                {overview.whatYoullLearn && overview.whatYoullLearn.length > 0 && (
                    <>
                        <h2
                            style={{
                                fontSize: typography.size.lg,
                                fontWeight: typography.weight.semibold,
                                color: t.text.primary,
                                marginBottom: spacing[3],
                                letterSpacing: '0.02em',
                            }}
                        >
                            What you&rsquo;ll learn
                        </h2>
                        <ul
                            style={{
                                listStyle: 'none',
                                padding: 0,
                                margin: `0 0 ${spacing[6]} 0`,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: spacing[2],
                            }}
                        >
                            {overview.whatYoullLearn.map((item, i) => (
                                <li
                                    key={i}
                                    style={{
                                        display: 'flex',
                                        gap: spacing[3],
                                        color: t.text.secondary,
                                        fontSize: typography.size.base,
                                        lineHeight: typography.lineHeight.relaxed,
                                    }}
                                >
                                    <span style={{ color: ED.accent, fontWeight: typography.weight.bold, flexShrink: 0 }}>→</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </>
                )}

                {/* Why it matters in the exam */}
                {overview.examRelevance && (
                    <>
                        <h2
                            style={{
                                fontSize: typography.size.lg,
                                fontWeight: typography.weight.semibold,
                                color: t.text.primary,
                                marginBottom: spacing[3],
                                letterSpacing: '0.02em',
                            }}
                        >
                            Why it matters in the exam
                        </h2>
                        <p
                            style={{
                                color: t.text.secondary,
                                fontSize: typography.size.base,
                                lineHeight: typography.lineHeight.relaxed,
                                marginBottom: spacing[6],
                            }}
                        >
                            {overview.examRelevance}
                        </p>
                    </>
                )}

                {/* Key words */}
                {overview.keyWords && overview.keyWords.length > 0 && (
                    <>
                        <h2
                            style={{
                                fontSize: typography.size.lg,
                                fontWeight: typography.weight.semibold,
                                color: t.text.primary,
                                marginBottom: spacing[3],
                                letterSpacing: '0.02em',
                            }}
                        >
                            Key words
                        </h2>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2] }}>
                            {overview.keyWords.map(word => (
                                <span
                                    key={word}
                                    style={{
                                        background: ED.accentTint,
                                        color: ED.accent,
                                        border: `1px solid ${ED.accentFaint}`,
                                        padding: `${spacing[1]} ${spacing[3]}`,
                                        borderRadius: borderRadius.full,
                                        fontSize: typography.size.sm,
                                        fontWeight: typography.weight.medium,
                                    }}
                                >
                                    {word}
                                </span>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}

function ComingSoonPlaceholder({ label, theme: t }) {
    return (
        <div
            style={{
                background: glass.bg,
                borderRadius: borderRadius.xl,
                border: `1px dashed ${glass.border}`,
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                padding: `${spacing[8]} ${spacing[6]}`,
                textAlign: 'center',
            }}
        >
            <p
                style={{
                    color: t.text.tertiary,
                    fontSize: typography.size.sm,
                    fontStyle: 'italic',
                }}
            >
                {label}
            </p>
        </div>
    );
}
