'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { getAllResources, getResourcesByTopic } from '@/lib/resources';
import { theme, typography, borderRadius, spacing, transitions } from '@/lib/theme';

// Type icons for different resource types
const typeIcons = {
    interactive: '🎛️',
    demonstration: '📺',
    practice: '✏️',
    revision: '📚',
};

// Type labels
const typeLabels = {
    interactive: 'Interactive',
    demonstration: 'Demo',
    practice: 'Practice',
    revision: 'Revision',
};

// Interactive Resources Hub - Main Entry Page
// Public access, no login required
export default function ResourcesHub() {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const resources = getAllResources();
    const groupedResources = getResourcesByTopic();
    const t = theme.light; // Use light theme

    // Convert grouped object to array for rendering
    const groupedArray = useMemo(() => {
        return Object.entries(groupedResources).map(([topic, resources]) => ({
            topic,
            resources
        }));
    }, [groupedResources]);

    // Filter resources based on search query
    const filteredGroups = useMemo(() => {
        if (!searchQuery.trim()) {
            return groupedArray;
        }
        const query = searchQuery.toLowerCase();
        return groupedArray
            .map(group => ({
                topic: group.topic,
                resources: group.resources.filter(
                    r => r.title.toLowerCase().includes(query) ||
                         r.description.toLowerCase().includes(query) ||
                         group.topic.toLowerCase().includes(query) ||
                         (r.keywords && r.keywords.some(k => k.toLowerCase().includes(query)))
                )
            }))
            .filter(group => group.resources.length > 0);
    }, [searchQuery, groupedArray]);

    return (
        <div
            style={{
                minHeight: '100vh',
                background: t.bg.secondary,
                fontFamily: typography.fontFamily,
            }}
        >
            {/* Header */}
            <header
                style={{
                    background: t.bg.primary,
                    borderBottom: `1px solid ${t.border.subtle}`,
                    padding: `${spacing[6]} ${spacing[8]}`,
                }}
            >
                <div
                    style={{
                        maxWidth: '1200px',
                        margin: '0 auto',
                    }}
                >
                    {/* Badge */}
                    <div
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: spacing[2],
                            background: t.accent.successLight,
                            border: `1px solid ${t.accent.success}30`,
                            color: t.accent.success,
                            padding: `${spacing[1]} ${spacing[3]}`,
                            borderRadius: borderRadius.full,
                            fontSize: typography.size.xs,
                            fontWeight: typography.weight.semibold,
                            letterSpacing: typography.letterSpacing.wide,
                            textTransform: 'uppercase',
                            marginBottom: spacing[4],
                        }}
                    >
                        <span
                            style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: t.accent.success,
                            }}
                            aria-hidden="true"
                        />
                        A-Level Music Technology
                    </div>

                    <h1
                        style={{
                            fontSize: typography.size['4xl'],
                            fontWeight: typography.weight.bold,
                            color: t.text.primary,
                            marginBottom: spacing[2],
                            letterSpacing: typography.letterSpacing.tight,
                            lineHeight: typography.lineHeight.tight,
                        }}
                    >
                        Interactive Resources
                    </h1>

                    <p
                        style={{
                            color: t.text.secondary,
                            fontSize: typography.size.lg,
                            lineHeight: typography.lineHeight.relaxed,
                            maxWidth: '600px',
                        }}
                    >
                        Explore and learn with interactive tools. Practice concepts before taking assessments.
                    </p>
                </div>
            </header>

            {/* Main Content */}
            <main
                style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    padding: spacing[8],
                }}
                role="main"
                aria-label="Interactive resources"
            >
                {/* Search Bar */}
                <div style={{ marginBottom: spacing[8] }}>
                    <div
                        style={{
                            position: 'relative',
                            maxWidth: '400px',
                        }}
                    >
                        <input
                            type="text"
                            placeholder="Search resources..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setIsSearchFocused(false)}
                            style={{
                                width: '100%',
                                padding: `${spacing[3]} ${spacing[4]}`,
                                paddingLeft: spacing[10],
                                fontSize: typography.size.base,
                                fontFamily: typography.fontFamily,
                                borderRadius: borderRadius.lg,
                                border: `1px solid ${isSearchFocused ? t.border.focus : t.border.medium}`,
                                background: t.bg.primary,
                                color: t.text.primary,
                                outline: 'none',
                                boxShadow: isSearchFocused ? `0 0 0 3px ${t.accent.primary}20` : 'none',
                                transition: `all ${transitions.fast} ${transitions.easing}`,
                            }}
                            aria-label="Search resources"
                        />
                        <span
                            style={{
                                position: 'absolute',
                                left: spacing[4],
                                top: '50%',
                                transform: 'translateY(-50%)',
                                fontSize: '1.25rem',
                                opacity: 0.5,
                            }}
                            aria-hidden="true"
                        >
                            🔍
                        </span>
                    </div>
                </div>

                {/* Resource Groups by Topic */}
                {filteredGroups.length === 0 ? (
                    <div
                        style={{
                            textAlign: 'center',
                            padding: spacing[12],
                            color: t.text.tertiary,
                        }}
                    >
                        <p style={{ fontSize: typography.size.lg }}>
                            No resources found for "{searchQuery}"
                        </p>
                        <button
                            onClick={() => setSearchQuery('')}
                            style={{
                                marginTop: spacing[4],
                                padding: `${spacing[2]} ${spacing[4]}`,
                                background: t.accent.primary,
                                color: t.text.inverse,
                                border: 'none',
                                borderRadius: borderRadius.lg,
                                fontSize: typography.size.sm,
                                fontWeight: typography.weight.medium,
                                cursor: 'pointer',
                            }}
                        >
                            Clear search
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[8] }}>
                        {filteredGroups.map(group => (
                            <section key={group.topic}>
                                {/* Topic Header */}
                                <h2
                                    style={{
                                        fontSize: typography.size['2xl'],
                                        fontWeight: typography.weight.semibold,
                                        color: t.text.primary,
                                        marginBottom: spacing[4],
                                        paddingBottom: spacing[2],
                                        borderBottom: `2px solid ${t.border.subtle}`,
                                    }}
                                >
                                    {group.topic}
                                </h2>

                                {/* Resource Cards Grid */}
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                                        gap: spacing[4],
                                    }}
                                >
                                    {group.resources.map(resource => (
                                        <ResourceCard
                                            key={resource.id}
                                            resource={resource}
                                            theme={t}
                                        />
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer
                style={{
                    background: t.bg.primary,
                    borderTop: `1px solid ${t.border.subtle}`,
                    padding: `${spacing[6]} ${spacing[8]}`,
                    marginTop: spacing[12],
                }}
            >
                <div
                    style={{
                        maxWidth: '1200px',
                        margin: '0 auto',
                        textAlign: 'center',
                        color: t.text.tertiary,
                        fontSize: typography.size.sm,
                    }}
                >
                    <p>
                        Part of the A-Level Music Technology learning suite.{' '}
                        <a
                            href="https://waveform-assessment.vercel.app"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                color: t.text.link,
                                textDecoration: 'none',
                            }}
                        >
                            Go to Assessment Hub
                        </a>
                    </p>
                </div>
            </footer>
        </div>
    );
}

// Resource Card Component
function ResourceCard({ resource, theme: t }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <Link
            href={`/${resource.id}`}
            style={{ textDecoration: 'none' }}
        >
            <article
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    background: t.bg.primary,
                    borderRadius: borderRadius.xl,
                    border: `1px solid ${isHovered ? t.accent.primary : t.border.subtle}`,
                    boxShadow: isHovered ? t.shadow.md : t.shadow.sm,
                    padding: spacing[6],
                    cursor: 'pointer',
                    transition: `all ${transitions.normal} ${transitions.easing}`,
                    transform: isHovered ? 'translateY(-2px)' : 'none',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {/* Header with icon and type badge */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: spacing[3],
                    }}
                >
                    <span style={{ fontSize: '2rem' }} aria-hidden="true">
                        {resource.icon || typeIcons[resource.type] || '📖'}
                    </span>
                    <span
                        style={{
                            background: t.bg.tertiary,
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
                        marginBottom: spacing[4],
                        flex: 1,
                    }}
                >
                    {resource.description}
                </p>

                {/* Footer metadata */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: spacing[3],
                        borderTop: `1px solid ${t.border.subtle}`,
                    }}
                >
                    <span
                        style={{
                            color: t.text.tertiary,
                            fontSize: typography.size.xs,
                        }}
                    >
                        ⏱️ {resource.estimatedTime}
                    </span>
                    {resource.prepFor && resource.prepFor.length > 0 && (
                        <span
                            style={{
                                color: t.accent.info,
                                fontSize: typography.size.xs,
                                fontWeight: typography.weight.medium,
                            }}
                        >
                            Prep for assessment
                        </span>
                    )}
                </div>
            </article>
        </Link>
    );
}
