'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { theme, typography, borderRadius, spacing, transitions, glass } from '@/lib/theme';
import { getAvailableTopics } from '@/lib/questions';
import { getQuizProgress } from '@/lib/quiz-persistence';
import { hasLearnContent } from '@/lib/learn/topics';

// Type labels for resource badges
const typeLabels = {
    interactive: 'Interactive',
    demonstration: 'Demo',
    practice: 'Practice',
    revision: 'Revision',
    assessment: 'Assessment',
};

export default function TopicPageClient({ topic, resources }) {
    const t = theme.light;
    const [progress, setProgress] = useState(null);

    useEffect(() => {
        const studentId = localStorage.getItem('revision_student_id');
        if (studentId && getAvailableTopics().includes(topic.id)) {
            getQuizProgress(studentId, topic.id).then(setProgress);
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
                        loop
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
                        background: 'linear-gradient(to bottom, rgba(26,26,46,0.4) 0%, rgba(26,26,46,0.7) 100%)',
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
                                fontSize: typography.size['3xl'],
                                fontWeight: typography.weight.bold,
                                color: '#ffffff',
                                marginBottom: spacing[2],
                                lineHeight: typography.lineHeight.tight,
                                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                backgroundImage: 'linear-gradient(90deg, #ffffff 0%, #ffffff 40%, rgba(255,255,255,0.5) 50%, #ffffff 60%, #ffffff 100%)',
                                backgroundSize: '200% 100%',
                                WebkitBackgroundClip: 'text',
                                backgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                animation: 'shimmerSweep 3s ease-in-out infinite',
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
                        background: t.bg.primary,
                        borderBottom: `3px solid ${topic.colour}`,
                        padding: `${spacing[6]} ${spacing[8]}`,
                    }}
                >
                    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                        <Link
                            href="/"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: spacing[2],
                                color: t.text.secondary,
                                textDecoration: 'none',
                                fontSize: typography.size.sm,
                                padding: `${spacing[2]} ${spacing[3]}`,
                                borderRadius: borderRadius.md,
                                background: glass.bg,
                                backdropFilter: 'blur(8px)',
                                WebkitBackdropFilter: 'blur(8px)',
                                border: '1px solid ' + glass.border,
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
                                    background: topic.colour + '18',
                                    color: topic.colour,
                                    padding: `${spacing[1]} ${spacing[3]}`,
                                    borderRadius: borderRadius.full,
                                    fontSize: typography.size.sm,
                                    fontWeight: typography.weight.semibold,
                                    backdropFilter: 'blur(8px)',
                                    WebkitBackdropFilter: 'blur(8px)',
                                    border: '1px solid ' + topic.colour + '30',
                                    boxShadow: glass.iconShadow,
                                }}
                            >
                                {topic.specRef}
                            </span>
                        </div>

                        <h1
                            style={{
                                fontSize: typography.size['3xl'],
                                fontWeight: typography.weight.bold,
                                color: t.text.primary,
                                marginBottom: spacing[2],
                                lineHeight: typography.lineHeight.tight,
                                backgroundImage: `linear-gradient(90deg, ${t.text.primary} 0%, ${t.text.primary} 40%, ${t.text.tertiary} 50%, ${t.text.primary} 60%, ${t.text.primary} 100%)`,
                                backgroundSize: '200% 100%',
                                WebkitBackgroundClip: 'text',
                                backgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                animation: 'shimmerSweep 3s ease-in-out infinite',
                            }}
                        >
                            {topic.name}
                        </h1>
                        <p
                            style={{
                                color: t.text.secondary,
                                fontSize: typography.size.base,
                                lineHeight: typography.lineHeight.relaxed,
                                maxWidth: '640px',
                            }}
                        >
                            {topic.description}
                        </p>
                    </div>
                </header>
            )}

            {/* Content Sections */}
            <main style={{ maxWidth: '1200px', margin: '0 auto', padding: spacing[8] }}>
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
                                    border: `1px solid ${topic.colour}40`,
                                    padding: `${spacing[6]} ${spacing[6]}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    cursor: 'pointer',
                                    transition: `all ${transitions.normal} ${transitions.easing}`,
                                    boxShadow: glass.shadow,
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = topic.colour;
                                    e.currentTarget.style.boxShadow = glass.shadowHover;
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = topic.colour + '40';
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
                                    color: topic.colour,
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
                                    topicColour={topic.colour}
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
                                <ProgressCard progress={progress} topicColour={topic.colour} t={t} />
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
                                        border: `1px solid ${topic.colour}40`,
                                        padding: `${spacing[6]} ${spacing[6]}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        cursor: 'pointer',
                                        transition: `all ${transitions.normal} ${transitions.easing}`,
                                        boxShadow: glass.shadow,
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.borderColor = topic.colour;
                                        e.currentTarget.style.boxShadow = glass.shadowHover;
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = topic.colour + '40';
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
                                        color: topic.colour,
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
                                        <span style={{ fontSize: '1.25rem' }}>⏱️</span>
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
                                                Timed, no going back
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

function ResourceCard({ resource, topicColour, theme: t, animationDelay = 0 }) {
    const [isHovered, setIsHovered] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const cardRef = useRef(null);

    const handleMouseMove = useCallback((e) => {
        const rect = cardRef.current?.getBoundingClientRect();
        if (!rect) return;
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }, []);

    return (
        <Link
            href={`/${resource.id}`}
            style={{
                textDecoration: 'none',
                animation: `cardReveal 400ms ease-out ${animationDelay}ms both`,
            }}
        >
            <article
                ref={cardRef}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onMouseMove={handleMouseMove}
                style={{
                    position: 'relative',
                    overflow: 'hidden',
                    background: glass.bg,
                    backdropFilter: 'blur(' + glass.blur + ')',
                    WebkitBackdropFilter: 'blur(' + glass.blur + ')',
                    borderRadius: borderRadius.xl,
                    border: `1px solid ${isHovered ? topicColour + '60' : glass.border}`,
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
                {/* Glow layer */}
                <div
                    style={{
                        position: 'absolute',
                        top: mousePos.y - 150,
                        left: mousePos.x - 150,
                        width: 300,
                        height: 300,
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${topicColour}40 0%, ${topicColour}15 40%, transparent 70%)`,
                        filter: 'blur(28px) saturate(3) brightness(1.1)',
                        pointerEvents: 'none',
                        opacity: isHovered ? 1 : 0,
                        transition: 'opacity 300ms ease',
                        zIndex: 0,
                    }}
                    aria-hidden="true"
                />

                <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1 }}>
                    {/* Header: icon + type badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing[3] }}>
                        <span style={{ fontSize: '2rem' }} aria-hidden="true">
                            {resource.icon || '🎛️'}
                        </span>
                        <span
                            style={{
                                background: 'rgba(255, 255, 255, 0.5)',
                                color: t.text.secondary,
                                padding: `${spacing[1]} ${spacing[2]}`,
                                borderRadius: borderRadius.md,
                                fontSize: typography.size.xs,
                                fontWeight: typography.weight.medium,
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
                        <span style={{ color: t.text.tertiary, fontSize: typography.size.xs }}>
                            ⏱️ {resource.estimatedTime}
                        </span>
                        <span style={{ color: topicColour, fontSize: typography.size.xs, fontWeight: typography.weight.medium }}>
                            Open →
                        </span>
                    </div>
                </div>
            </article>
        </Link>
    );
}

function ProgressCard({ progress, topicColour, t }) {
    const scoreColor = progress.bestScore >= 70 ? t.accent.success
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
                        {progress.bestScore}%
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
                        color: topicColour,
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
                        {progress.lastScore}%
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
