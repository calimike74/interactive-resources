'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getAllResources, getResourcesByTopic } from '@/lib/resources';
import { theme, typography, borderRadius, spacing, transitions } from '@/lib/theme';

// Skeleton card component for loading state
function SkeletonCard({ theme: t }) {
    const shimmerBg = `linear-gradient(90deg, ${t.bg.tertiary} 0%, ${t.bg.secondary} 50%, ${t.bg.tertiary} 100%)`;
    const blockStyle = (width, height) => ({
        width,
        height,
        borderRadius: borderRadius.md,
        background: shimmerBg,
        backgroundSize: '800px 100%',
        animation: 'shimmer 1.5s ease-in-out infinite',
    });

    return (
        <div
            style={{
                background: t.bg.primary,
                borderRadius: borderRadius.xl,
                border: `1px solid ${t.border.subtle}`,
                boxShadow: t.shadow.sm,
                padding: spacing[6],
                height: '220px',
                display: 'flex',
                flexDirection: 'column',
            }}
            aria-hidden="true"
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing[3] }}>
                <div style={blockStyle('2rem', '2rem')} />
                <div style={blockStyle('60px', '20px')} />
            </div>
            <div style={{ ...blockStyle('75%', '20px'), marginBottom: spacing[2] }} />
            <div style={{ ...blockStyle('100%', '14px'), marginBottom: spacing[1] }} />
            <div style={{ ...blockStyle('85%', '14px'), marginBottom: 'auto' }} />
            <div style={{ borderTop: `1px solid ${t.border.subtle}`, paddingTop: spacing[3], display: 'flex', justifyContent: 'space-between' }}>
                <div style={blockStyle('70px', '14px')} />
                <div style={blockStyle('100px', '14px')} />
            </div>
        </div>
    );
}

// Type icons for different resource types
const typeIcons = {
    interactive: '🎛️',
    demonstration: '📺',
    practice: '✏️',
    revision: '📚',
    assessment: '📊',
};

// Type labels
const typeLabels = {
    interactive: 'Interactive',
    demonstration: 'Demo',
    practice: 'Practice',
    revision: 'Revision',
    assessment: 'Assessment',
};

// Tab definitions for filter
const typeTabs = [
    { key: 'all', label: 'All' },
    { key: 'interactive', label: 'Interactive' },
    { key: 'demonstration', label: 'Demo' },
    { key: 'practice', label: 'Practice' },
    { key: 'revision', label: 'Revision' },
    { key: 'assessment', label: 'Assessment' },
];

// Interactive Resources Hub - Main Entry Page
// Public access, no login required
export default function ResourcesHub() {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [activeType, setActiveType] = useState('all');
    const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 });
    const [isLoaded, setIsLoaded] = useState(false);
    const tabsRef = useRef({});
    const tabContainerRef = useRef(null);

    const resources = getAllResources();
    const groupedResources = getResourcesByTopic();
    const t = theme.light; // Use light theme

    // Trigger loaded state after mount for skeleton -> content transition
    useEffect(() => {
        const timer = setTimeout(() => setIsLoaded(true), 100);
        return () => clearTimeout(timer);
    }, []);

    // Measure tab positions for sliding pill
    const measureTabs = useCallback(() => {
        const activeTabEl = tabsRef.current[activeType];
        const containerEl = tabContainerRef.current;
        if (activeTabEl && containerEl) {
            const containerRect = containerEl.getBoundingClientRect();
            const tabRect = activeTabEl.getBoundingClientRect();
            setPillStyle({
                left: tabRect.left - containerRect.left,
                width: tabRect.width,
            });
        }
    }, [activeType]);

    useEffect(() => {
        measureTabs();
        window.addEventListener('resize', measureTabs);
        return () => window.removeEventListener('resize', measureTabs);
    }, [measureTabs]);

    // Convert grouped object to array for rendering
    const groupedArray = useMemo(() => {
        return Object.entries(groupedResources).map(([topic, resources]) => ({
            topic,
            resources
        }));
    }, [groupedResources]);

    // Filter resources based on search query AND type filter
    const filteredGroups = useMemo(() => {
        return groupedArray
            .map(group => {
                let filtered = group.resources;

                // Apply type filter
                if (activeType !== 'all') {
                    filtered = filtered.filter(r => r.type === activeType);
                }

                // Apply search filter
                if (searchQuery.trim()) {
                    const query = searchQuery.toLowerCase();
                    filtered = filtered.filter(
                        r => r.title.toLowerCase().includes(query) ||
                             r.description.toLowerCase().includes(query) ||
                             group.topic.toLowerCase().includes(query) ||
                             (r.keywords && r.keywords.some(k => k.toLowerCase().includes(query)))
                    );
                }

                return { topic: group.topic, resources: filtered };
            })
            .filter(group => group.resources.length > 0);
    }, [searchQuery, activeType, groupedArray]);

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
                <div style={{ marginBottom: spacing[4] }}>
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

                {/* Type Filter Tabs */}
                <div style={{ marginBottom: spacing[8] }}>
                    <div
                        ref={tabContainerRef}
                        style={{
                            position: 'relative',
                            display: 'inline-flex',
                            gap: spacing[1],
                            background: t.bg.tertiary,
                            borderRadius: borderRadius.full,
                            padding: spacing[1],
                        }}
                        role="tablist"
                        aria-label="Filter by resource type"
                    >
                        {/* Sliding pill */}
                        <div
                            style={{
                                position: 'absolute',
                                top: spacing[1],
                                left: pillStyle.left,
                                width: pillStyle.width,
                                height: `calc(100% - ${spacing[1]} - ${spacing[1]})`,
                                background: '#2563EB',
                                borderRadius: borderRadius.full,
                                transition: `all 300ms cubic-bezier(0.34, 1.56, 0.64, 1)`,
                                zIndex: 0,
                            }}
                            aria-hidden="true"
                        />
                        {typeTabs.map((tab, tabIndex) => {
                            const isActive = activeType === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    ref={el => { tabsRef.current[tab.key] = el; }}
                                    onClick={() => setActiveType(tab.key)}
                                    role="tab"
                                    aria-selected={isActive}
                                    style={{
                                        position: 'relative',
                                        zIndex: 1,
                                        padding: `${spacing[2]} ${spacing[4]}`,
                                        fontSize: typography.size.sm,
                                        fontWeight: isActive ? typography.weight.semibold : typography.weight.medium,
                                        fontFamily: typography.fontFamily,
                                        color: isActive ? t.text.inverse : t.text.secondary,
                                        background: 'transparent',
                                        border: 'none',
                                        borderRadius: borderRadius.full,
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                        transition: `color 200ms ${transitions.easing}`,
                                        animation: `tabSlideIn 300ms ease-out ${tabIndex * 40}ms both`,
                                    }}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Resource Groups by Topic */}
                {!isLoaded ? (
                    /* Skeleton loading state */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[8] }}>
                        {[0, 1].map(groupIdx => (
                            <section key={groupIdx}>
                                <div style={{
                                    width: '200px',
                                    height: '28px',
                                    borderRadius: borderRadius.md,
                                    background: `linear-gradient(90deg, ${t.bg.tertiary} 0%, ${t.bg.secondary} 50%, ${t.bg.tertiary} 100%)`,
                                    backgroundSize: '800px 100%',
                                    animation: 'shimmer 1.5s ease-in-out infinite',
                                    marginBottom: spacing[4],
                                }} />
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                                    gap: spacing[4],
                                }}>
                                    {[0, 1, 2].map(i => (
                                        <SkeletonCard key={i} theme={t} />
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                ) : filteredGroups.length === 0 ? (
                    <div
                        style={{
                            textAlign: 'center',
                            padding: spacing[12],
                            color: t.text.tertiary,
                        }}
                    >
                        <p style={{ fontSize: typography.size.lg }}>
                            No resources found
                            {searchQuery ? ` for "${searchQuery}"` : ''}
                            {activeType !== 'all' ? ` in ${typeTabs.find(t => t.key === activeType)?.label}` : ''}
                        </p>
                        <button
                            onClick={() => { setSearchQuery(''); setActiveType('all'); }}
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
                            Clear filters
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[8] }}>
                        {(() => {
                            let cardIndex = 0;
                            return filteredGroups.map(group => (
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
                                        {group.resources.map(resource => {
                                            const delay = cardIndex * 60;
                                            cardIndex++;
                                            return (
                                                <ResourceCard
                                                    key={resource.id}
                                                    resource={resource}
                                                    theme={t}
                                                    animationDelay={delay}
                                                />
                                            );
                                        })}
                                    </div>
                                </section>
                            ));
                        })()}
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
