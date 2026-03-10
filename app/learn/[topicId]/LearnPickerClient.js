'use client';

import Link from 'next/link';
import { theme, typography, borderRadius, spacing, transitions, glass } from '@/lib/theme';
import Breadcrumbs from '@/components/Breadcrumbs';

export default function LearnPickerClient({ topic, lessons, resources = [] }) {
    const t = theme.light;

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f5f4f2',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}>
            <Breadcrumbs />

            {/* Header */}
            <header style={{
                padding: '3rem 1.5rem 2.5rem',
                background: 'white',
                borderBottom: '1px solid #E5E7EB',
            }}>
                <div style={{ maxWidth: '960px', margin: '0 auto' }}>
                    <Link href={`/topic/${topic.id}`} style={{
                        fontSize: typography.size.sm,
                        color: t.text.tertiary,
                        textDecoration: 'none',
                    }}>
                        &larr; Back to {topic.name}
                    </Link>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginTop: '0.75rem',
                    }}>
                        <div style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '9999px',
                            background: topic.colour + '15',
                            color: topic.colour,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                        }}>
                            Topic {topic.specRef}
                        </div>
                    </div>

                    <h1 style={{
                        fontSize: '2rem',
                        fontWeight: 700,
                        color: t.text.primary,
                        marginTop: '0.5rem',
                        lineHeight: 1.2,
                    }}>
                        Learn: {topic.name}
                    </h1>
                    <p style={{
                        fontSize: typography.size.base,
                        color: t.text.secondary,
                        marginTop: '0.5rem',
                        lineHeight: 1.5,
                        maxWidth: '640px',
                    }}>
                        Choose a lesson to work through. Each one builds understanding step by step with animated diagrams and knowledge checks.
                    </p>

                    <div style={{
                        marginTop: '1rem',
                        fontSize: typography.size.sm,
                        color: t.text.tertiary,
                    }}>
                        {lessons.length + resources.length} {lessons.length + resources.length === 1 ? 'activity' : 'activities'} available
                    </div>
                </div>
            </header>

            {/* Lesson cards */}
            <main style={{
                maxWidth: '960px',
                margin: '0 auto',
                padding: `${spacing[8]} 1.5rem 4rem`,
            }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: spacing[5],
                }}>
                    {lessons.map((lesson, i) => (
                        <LessonCard
                            key={lesson.id}
                            lesson={lesson}
                            topicId={topic.id}
                            topicColour={topic.colour}
                            t={t}
                            index={i}
                        />
                    ))}
                    {resources.map((resource, i) => (
                        <ResourceCard
                            key={resource.id}
                            resource={resource}
                            topicColour={topic.colour}
                            t={t}
                            index={lessons.length + i}
                        />
                    ))}
                </div>
            </main>
        </div>
    );
}

function CardShell({ href, topicColour, index, children }) {
    return (
        <Link href={href} style={{ textDecoration: 'none' }}>
            <div
                style={{
                    background: glass.bg,
                    backdropFilter: 'blur(' + glass.blur + ')',
                    WebkitBackdropFilter: 'blur(' + glass.blur + ')',
                    borderRadius: borderRadius.xl,
                    border: `1px solid ${topicColour}30`,
                    padding: spacing[6],
                    cursor: 'pointer',
                    transition: `all ${transitions.normal} ${transitions.easing}`,
                    boxShadow: glass.shadow,
                    opacity: 0,
                    animation: `fadeSlideUp 0.4s ease-out ${index * 100}ms forwards`,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.borderColor = topicColour;
                    e.currentTarget.style.boxShadow = glass.shadowHover;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.borderColor = topicColour + '30';
                    e.currentTarget.style.boxShadow = glass.shadow;
                    e.currentTarget.style.transform = 'none';
                }}
            >
                {children}
            </div>

            <style jsx global>{`
                @keyframes fadeSlideUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </Link>
    );
}

function LessonCard({ lesson, topicId, topicColour, t, index }) {
    return (
        <CardShell href={`/learn/${topicId}/${lesson.id}`} topicColour={topicColour} index={index}>
            <div style={{
                display: 'inline-block',
                padding: '0.15rem 0.5rem',
                borderRadius: '9999px',
                background: topicColour + '12',
                color: topicColour,
                fontSize: '0.7rem',
                fontWeight: 600,
                letterSpacing: '0.025em',
                textTransform: 'uppercase',
                marginBottom: spacing[3],
            }}>
                {lesson.subtitle}
            </div>

            <h2 style={{
                fontSize: typography.size.xl,
                fontWeight: typography.weight.semibold,
                color: t.text.primary,
                marginBottom: spacing[2],
                lineHeight: 1.25,
            }}>
                {lesson.title}
            </h2>

            <p style={{
                fontSize: typography.size.sm,
                color: t.text.secondary,
                lineHeight: 1.5,
                marginBottom: spacing[4],
                flex: 1,
            }}>
                {lesson.description}
            </p>

            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <span style={{ fontSize: typography.size.xs, color: t.text.tertiary }}>
                    {lesson.rows.length} sections
                </span>
                <span style={{ color: topicColour, fontSize: typography.size.lg, fontWeight: typography.weight.semibold }}>
                    &rarr;
                </span>
            </div>
        </CardShell>
    );
}

function ResourceCard({ resource, topicColour, t, index }) {
    return (
        <CardShell href={resource.href} topicColour={topicColour} index={index}>
            <div style={{
                display: 'inline-block',
                padding: '0.15rem 0.5rem',
                borderRadius: '9999px',
                background: topicColour + '12',
                color: topicColour,
                fontSize: '0.7rem',
                fontWeight: 600,
                letterSpacing: '0.025em',
                textTransform: 'uppercase',
                marginBottom: spacing[3],
            }}>
                {resource.subtitle}
            </div>

            <h2 style={{
                fontSize: typography.size.xl,
                fontWeight: typography.weight.semibold,
                color: t.text.primary,
                marginBottom: spacing[2],
                lineHeight: 1.25,
            }}>
                {resource.title}
            </h2>

            <p style={{
                fontSize: typography.size.sm,
                color: t.text.secondary,
                lineHeight: 1.5,
                marginBottom: spacing[4],
                flex: 1,
            }}>
                {resource.description}
            </p>

            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <span style={{ fontSize: typography.size.xs, color: t.text.tertiary }}>
                    {resource.estimatedTime}
                </span>
                <span style={{ color: topicColour, fontSize: typography.size.lg, fontWeight: typography.weight.semibold }}>
                    &rarr;
                </span>
            </div>
        </CardShell>
    );
}
