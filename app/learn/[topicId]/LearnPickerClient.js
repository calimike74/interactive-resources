'use client';

import { useRef, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { theme, typography, borderRadius, spacing, transitions, glass, editorial as ED } from '@/lib/theme';
import Breadcrumbs from '@/components/Breadcrumbs';
import GlassMorphismGrid from '@/components/GlassMorphismGrid';
import { getProgress } from '@/lib/learn/course-progress';
import { withComponentPrefix } from '@/lib/topics';

const EMPTY_PROGRESS = {};
// No storage-event subscription: we don't need live cross-tab updates, and a
// fresh useSyncExternalStore snapshot is read on every mount anyway (which
// covers same-tab navigation back to this page after completing a chapter).
function noopSubscribe() { return () => {}; }
function getServerProgressSnapshot() { return EMPTY_PROGRESS; }

export default function LearnPickerClient({ topic, lessons, resources = [], rationale = null }) {
    const t = theme.light;
    const isCourse = lessons.length > 1;

    // SSR-safe external-store read: server always sees EMPTY_PROGRESS; client
    // reads localStorage once per mount and caches the reference so
    // useSyncExternalStore's snapshot stays stable across re-renders
    // (getProgress() would otherwise return a new object every call).
    const progressCache = useRef(null);
    if (!progressCache.current || progressCache.current.topicId !== topic.id) {
        progressCache.current = { topicId: topic.id, value: null };
    }
    const cache = progressCache.current;
    const progress = useSyncExternalStore(
        noopSubscribe,
        () => (cache.value ??= getProgress(topic.id)),
        getServerProgressSnapshot
    );
    const chapterIds = lessons.map(l => l.id);
    // Derived from the already-synced `progress` snapshot above — never read
    // storage directly here, or the first client render (before hydration
    // sync) would diverge from the server's empty-progress render.
    const continueId = chapterIds.find(id => progress[id] !== 'completed') ?? chapterIds[0];
    const continueLesson = lessons.find(l => l.id === continueId);
    const allComplete = chapterIds.length > 0 && chapterIds.every(id => progress[id] === 'completed');

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f5f4f2',
            fontFamily: 'var(--font-manrope), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
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
                            Topic {withComponentPrefix(topic.specRef)}
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
                        Walkthrough: {topic.name}
                    </h1>
                    <p style={{
                        fontSize: '16px',
                        color: ED.inkSoft,
                        marginTop: '0.75rem',
                        lineHeight: 1.55,
                        maxWidth: '560px',
                    }}>
                        {isCourse
                            ? 'Work through the chapters in order: each builds on the last.'
                            : (rationale ?? 'Choose a lesson to work through. Each one builds understanding step by step with animated diagrams and knowledge checks. Each lesson takes about 10–15 minutes and ends with a quick knowledge check.')}
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
                {isCourse && continueLesson && (
                    <Link
                        href={`/learn/${topic.id}/${continueId}`}
                        style={{ textDecoration: 'none', display: 'block', marginBottom: spacing[6] }}
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
                                    {allComplete ? 'Start again' : 'Continue'}, Chapter {continueLesson.chapterNumber ?? chapterIds.indexOf(continueId) + 1}: {continueLesson.title}
                                </h3>
                                <p style={{
                                    fontSize: typography.size.sm,
                                    color: t.text.secondary,
                                }}>
                                    {allComplete ? 'You\'ve completed every chapter: revisit from the start.' : 'Pick up where you left off.'}
                                </p>
                            </div>
                            <span style={{
                                color: ED.accent,
                                fontSize: typography.size.xl,
                                fontWeight: typography.weight.semibold,
                            }}>
                                &rarr;
                            </span>
                        </div>
                    </Link>
                )}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: spacing[5],
                }}>
                    {lessons.map((lesson, index) => (
                        <LessonCard
                            key={lesson.id}
                            lesson={lesson}
                            topicId={topic.id}
                            t={t}
                            isCourse={isCourse}
                            index={index}
                            completed={isCourse && progress[lesson.id] === 'completed'}
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

function LessonCard({ lesson, topicId, t, isCourse = false, index = 0, completed = false }) {
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
                {isCourse ? `CHAPTER ${lesson.chapterNumber ?? index + 1}` : lesson.subtitle}
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
                    {isCourse && completed && <span style={{ color: '#059669' }}> &middot; &#10003; completed</span>}
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
