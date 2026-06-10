'use client';

import Link from 'next/link';
import { theme, typography, borderRadius, spacing, transitions, glass, editorial as ED } from '@/lib/theme';
import Breadcrumbs from '@/components/Breadcrumbs';
import GlassMorphismGrid from '@/components/GlassMorphismGrid';

export default function LearnPickerClient({ topic, lessons, resources = [] }) {
    const t = theme.light;

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f5f4f2',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}>
            <Breadcrumbs />

            {/* Header — interactive glass-grid background with editorial text overlay */}
            <header style={{
                position: 'relative',
                padding: '4rem 1.5rem 3rem',
                background: 'white',
                borderBottom: `1px solid ${ED.rule}`,
                overflow: 'hidden',
                minHeight: '320px',
            }}>
                <GlassMorphismGrid rows={4} cols={14} revealRadius={300} />
                <div style={{ maxWidth: '960px', margin: '0 auto', position: 'relative', zIndex: 2, pointerEvents: 'none' }}>
                    <Link
                        href={`/topic/${topic.id}`}
                        style={{
                            fontSize: typography.size.sm,
                            color: ED.inkSoft,
                            textDecoration: 'none',
                            pointerEvents: 'auto',
                        }}
                    >
                        &larr; Back to {topic.name}
                    </Link>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginTop: '1.25rem',
                    }}>
                        <span style={{
                            fontFamily: ED.mono,
                            fontSize: '11px',
                            fontWeight: 500,
                            letterSpacing: '0.18em',
                            textTransform: 'uppercase',
                            color: ED.inkFade,
                        }}>
                            Topic {topic.specRef}
                        </span>
                    </div>

                    <h1 style={{
                        fontFamily: ED.serif,
                        fontStyle: 'italic',
                        fontWeight: 400,
                        fontSize: 'clamp(36px, 6vw, 60px)',
                        lineHeight: 1.0,
                        letterSpacing: '-0.025em',
                        color: ED.ink,
                        marginTop: '0.5rem',
                    }}>
                        Learn: {topic.name}
                    </h1>
                    <p style={{
                        fontSize: '16px',
                        color: ED.inkSoft,
                        marginTop: '0.75rem',
                        lineHeight: 1.55,
                        maxWidth: '560px',
                    }}>
                        Choose a lesson to work through. Each one builds understanding step by step with animated diagrams and knowledge checks. Each lesson takes about 10–15 minutes and ends with a quick knowledge check.
                    </p>

                    <div style={{
                        marginTop: '1rem',
                        fontSize: typography.size.sm,
                        color: ED.inkFade,
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
                    {lessons.map(lesson => (
                        <LessonCard
                            key={lesson.id}
                            lesson={lesson}
                            topicId={topic.id}
                            t={t}
                        />
                    ))}
                    {resources.map(resource => (
                        <ResourceCard
                            key={resource.id}
                            resource={resource}
                            t={t}
                        />
                    ))}
                </div>
            </main>
        </div>
    );
}

function CardShell({ href, children }) {
    return (
        <Link href={href} style={{ textDecoration: 'none' }}>
            <div
                style={{
                    background: glass.bg,
                    backdropFilter: 'blur(' + glass.blur + ')',
                    WebkitBackdropFilter: 'blur(' + glass.blur + ')',
                    borderRadius: borderRadius.xl,
                    border: `1px solid ${ED.accentFaint}`,
                    padding: spacing[6],
                    cursor: 'pointer',
                    transition: `all ${transitions.normal} ${transitions.easing}`,
                    boxShadow: glass.shadow,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.borderColor = ED.accent;
                    e.currentTarget.style.boxShadow = glass.shadowHover;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.borderColor = ED.accentFaint;
                    e.currentTarget.style.boxShadow = glass.shadow;
                    e.currentTarget.style.transform = 'none';
                }}
                onFocus={e => {
                    e.currentTarget.style.borderColor = ED.accent;
                    e.currentTarget.style.boxShadow = glass.shadowHover;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onBlur={e => {
                    e.currentTarget.style.borderColor = ED.accentFaint;
                    e.currentTarget.style.boxShadow = glass.shadow;
                    e.currentTarget.style.transform = 'none';
                }}
            >
                {children}
            </div>
        </Link>
    );
}

function LessonCard({ lesson, topicId, t }) {
    return (
        <CardShell href={`/learn/${topicId}/${lesson.id}`}>
            <div style={{
                fontFamily: ED.mono,
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: ED.inkFade,
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
                <span aria-hidden="true" style={{ color: ED.accent, fontSize: typography.size.lg, fontWeight: typography.weight.semibold }}>
                    &rarr;
                </span>
            </div>
        </CardShell>
    );
}

function ResourceCard({ resource, t }) {
    return (
        <CardShell href={resource.href}>
            <div style={{
                fontFamily: ED.mono,
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: ED.inkFade,
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
                <span aria-hidden="true" style={{ color: ED.accent, fontSize: typography.size.lg, fontWeight: typography.weight.semibold }}>
                    &rarr;
                </span>
            </div>
        </CardShell>
    );
}
