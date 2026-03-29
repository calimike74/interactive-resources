'use client';

import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import NotesPanel from '@/components/learn/NotesPanel';
import { theme, typography, borderRadius, spacing, transitions } from '@/lib/theme';

const YOUTUBE_ID = 'rguok2Q95FE';

export default function VideoOverviewClient() {
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
                            background: '#6366f115',
                            color: '#6366f1',
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
                        A cinematic overview of equalization covering filter types, graphic vs parametric EQ, Q factor and bandwidth. Take notes as you watch.
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
                {/* Recommendation hint */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing[2],
                    padding: `${spacing[3]} ${spacing[4]}`,
                    background: '#fefce8',
                    border: '1px solid #fde68a',
                    borderRadius: borderRadius.lg,
                    fontSize: typography.size.sm,
                    color: '#92400e',
                }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    <span>
                        <strong>Recommended:</strong> Complete the{' '}
                        <Link href="/learn/eq/eq-filters" style={{ color: '#92400e', fontWeight: 600 }}>
                            Equalisation lesson
                        </Link>
                        {' '}first to get the most from this video.
                    </span>
                </div>

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
