'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import NotesPanel from '@/components/learn/NotesPanel';
import { theme, typography, borderRadius, spacing, transitions } from '@/lib/theme';

const YOUTUBE_ID = 'rguok2Q95FE';

const KEY_TERMS = [
    { term: 'Equalization (EQ)', timestamp: '0:48' },
    { term: 'Frequency spectrum', timestamp: '0:55' },
    { term: 'Highpass filter', timestamp: '1:34' },
    { term: 'Cutoff frequency', timestamp: '1:49' },
    { term: 'Lowpass filter', timestamp: '2:07' },
    { term: 'Filter slope (dB/octave)', timestamp: '2:14' },
    { term: 'Bandpass filter', timestamp: '2:45' },
    { term: 'Bandwidth', timestamp: '2:55' },
    { term: 'Bandreject (notch) filter', timestamp: '3:12' },
    { term: 'Q factor', timestamp: '3:45' },
    { term: 'Graphic equalizer', timestamp: '4:35' },
    { term: 'Parallel filter routing', timestamp: '4:40' },
    { term: 'Fixed bands (1/3 octave)', timestamp: '4:51' },
    { term: 'Parametric equalizer', timestamp: '5:38' },
    { term: 'Series filter routing', timestamp: '5:42' },
    { term: 'Centre frequency / Gain / Q', timestamp: '5:53' },
    { term: 'Shelving filter', timestamp: '6:10' },
    { term: 'High shelf / Low shelf', timestamp: '6:27' },
];

const STORAGE_KEY = 'learn-eq-video-captured-terms';

export default function VideoOverviewClient() {
    const t = theme.light;
    const [captured, setCaptured] = useState(new Set());

    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) setCaptured(new Set(JSON.parse(stored)));
        } catch {}
    }, []);

    const toggleTerm = useCallback((term) => {
        setCaptured(prev => {
            const next = new Set(prev);
            if (next.has(term)) {
                next.delete(term);
            } else {
                next.add(term);
            }
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
            } catch {}
            return next;
        });
    }, []);

    const progress = KEY_TERMS.length > 0 ? Math.round((captured.size / KEY_TERMS.length) * 100) : 0;

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
                borderBottom: `1px solid ${t.border.subtle}`,
            }}>
                <div style={{ maxWidth: '960px', margin: '0 auto' }}>
                    <Link href="/learn/eq" style={{
                        fontSize: typography.size.sm,
                        color: t.text.tertiary,
                        textDecoration: 'none',
                    }}>
                        &larr; Back to EQ &amp; Filters
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
                            background: '#16a34a15',
                            color: '#16a34a',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                        }}>
                            Topic 1.11
                        </div>
                        <div style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '9999px',
                            background: '#3A4A3515',
                            color: '#3A4A35',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                        }}>
                            Video Overview
                        </div>
                    </div>

                    <h1 style={{
                        fontSize: '2rem',
                        fontWeight: 700,
                        color: t.text.primary,
                        marginTop: '0.5rem',
                        lineHeight: 1.2,
                    }}>
                        EQ &amp; Filters — Video Overview
                    </h1>
                    <p style={{
                        fontSize: typography.size.base,
                        color: t.text.secondary,
                        marginTop: '0.5rem',
                        lineHeight: 1.5,
                        maxWidth: '640px',
                    }}>
                        Watch this overview before your lesson. As each key term comes up, tap it below to mark it as captured, then write what you learned in your notes.
                    </p>
                </div>
            </header>

            {/* Main content */}
            <main style={{
                maxWidth: '960px',
                margin: '0 auto',
                padding: `${spacing[8]} 1.5rem 4rem`,
                display: 'flex',
                flexDirection: 'column',
                gap: spacing[6],
            }}>
                {/* YouTube embed */}
                <div style={{
                    borderRadius: borderRadius.xl,
                    overflow: 'hidden',
                    boxShadow: t.shadow.lg,
                    border: `1px solid ${t.border.subtle}`,
                    background: '#000',
                }}>
                    <div style={{
                        position: 'relative',
                        width: '100%',
                        paddingBottom: '56.25%',
                    }}>
                        <iframe
                            src={`https://www.youtube-nocookie.com/embed/${YOUTUBE_ID}?rel=0&modestbranding=1`}
                            title="EQ & Filters — Video Overview"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                border: 'none',
                            }}
                        />
                    </div>
                </div>

                {/* Key terms checklist */}
                <div style={{
                    border: `1px solid ${t.border.subtle}`,
                    borderRadius: borderRadius.xl,
                    overflow: 'hidden',
                    background: 'white',
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: `${spacing[3]} ${spacing[4]}`,
                        borderBottom: `1px solid ${t.border.subtle}`,
                        background: t.bg.secondary,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.text.tertiary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 11 12 14 22 4" />
                                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                            </svg>
                            <span style={{
                                fontSize: typography.size.sm,
                                fontWeight: typography.weight.semibold,
                                color: t.text.secondary,
                            }}>
                                Key Terms — tap each one as you hear it discussed
                            </span>
                        </div>
                        <span style={{
                            fontSize: typography.size.xs,
                            color: progress === 100 ? t.accent.success : t.text.tertiary,
                            fontWeight: typography.weight.medium,
                        }}>
                            {captured.size}/{KEY_TERMS.length} captured
                        </span>
                    </div>

                    {/* Progress bar */}
                    <div style={{
                        height: 3,
                        background: t.bg.secondary,
                    }}>
                        <div style={{
                            height: '100%',
                            width: `${progress}%`,
                            background: progress === 100 ? t.accent.success : '#16a34a',
                            transition: `width ${transitions.normal} ${transitions.easing}`,
                        }} />
                    </div>

                    {/* Term bubbles */}
                    <div style={{
                        padding: spacing[4],
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: spacing[2],
                    }}>
                        {KEY_TERMS.map(({ term, timestamp }) => {
                            const isCaptured = captured.has(term);
                            return (
                                <button
                                    key={term}
                                    onClick={() => toggleTerm(term)}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '0.35rem 0.75rem',
                                        borderRadius: '9999px',
                                        border: `1px solid ${isCaptured ? '#16a34a' : t.border.medium}`,
                                        background: isCaptured ? '#16a34a12' : 'white',
                                        color: isCaptured ? '#16a34a' : t.text.secondary,
                                        fontSize: typography.size.sm,
                                        fontWeight: isCaptured ? 600 : 400,
                                        cursor: 'pointer',
                                        transition: `all ${transitions.fast} ${transitions.easing}`,
                                        textDecoration: isCaptured ? 'none' : 'none',
                                    }}
                                >
                                    {isCaptured && (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    )}
                                    <span>{term}</span>
                                    <span style={{
                                        fontSize: '0.7rem',
                                        color: isCaptured ? '#16a34a80' : t.text.tertiary,
                                        fontVariantNumeric: 'tabular-nums',
                                    }}>
                                        {timestamp}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Notes panel */}
                <NotesPanel storageKey="learn-notes-eq-video-overview" />

                {/* Next steps */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: spacing[4],
                }}>
                    <NextStepCard
                        href="/autofilter-image-explorer"
                        title="Auto Filter Interface"
                        description="Explore filter type, slope, frequency, resonance and sidechain."
                        t={t}
                    />
                    <NextStepCard
                        href="/eq8-image-explorer"
                        title="EQ Eight Interface"
                        description="Explore band selectors, frequency, gain and Q."
                        t={t}
                    />
                </div>
            </main>
        </div>
    );
}

function NextStepCard({ href, title, description, t }) {
    return (
        <Link href={href} style={{ textDecoration: 'none' }}>
            <div
                style={{
                    background: 'white',
                    borderRadius: borderRadius.xl,
                    border: `1px solid ${t.border.subtle}`,
                    padding: spacing[5],
                    transition: `all ${transitions.normal} ${transitions.easing}`,
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.borderColor = '#16a34a';
                    e.currentTarget.style.boxShadow = t.shadow.md;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.borderColor = t.border.subtle;
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'none';
                }}
            >
                <div style={{
                    fontSize: typography.size.xs,
                    fontWeight: 600,
                    color: '#16a34a',
                    textTransform: 'uppercase',
                    letterSpacing: '0.025em',
                    marginBottom: spacing[2],
                }}>
                    Next step
                </div>
                <h3 style={{
                    fontSize: typography.size.base,
                    fontWeight: typography.weight.semibold,
                    color: t.text.primary,
                    marginBottom: spacing[1],
                }}>
                    {title}
                </h3>
                <p style={{
                    fontSize: typography.size.sm,
                    color: t.text.secondary,
                    lineHeight: 1.5,
                    margin: 0,
                }}>
                    {description}
                </p>
            </div>
        </Link>
    );
}
