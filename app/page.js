'use client';

import { useState, useEffect } from 'react';
import { getAllTopicDefs } from '@/lib/topics';
import { theme, typography, borderRadius, spacing } from '@/lib/theme';
import LiquidHero from '@/components/LiquidHero';
import TopicCard from '@/components/TopicCard';
import BottomTabBar from '@/components/BottomTabBar';

// Mode descriptions shown under the hero
const MODE_INFO = {
    explore: {
        heading: 'Interactive Tools',
        subtitle: 'Hands-on tools to experiment with audio concepts.',
    },
    learn: {
        heading: 'Guided Lessons',
        subtitle: 'Step-by-step walkthroughs of each topic.',
    },
    revise: {
        heading: 'Revision & Quizzes',
        subtitle: 'Test your knowledge with quick-fire questions.',
    },
    progress: {
        heading: 'Your Progress',
        subtitle: 'Track what you\'ve covered and where to focus next.',
    },
};

export default function ResourcesHub() {
    const [activeTab, setActiveTab] = useState('explore');
    const [isLoaded, setIsLoaded] = useState(false);
    const t = theme.light;
    const topics = getAllTopicDefs();
    const mode = MODE_INFO[activeTab];

    useEffect(() => {
        const timer = setTimeout(() => setIsLoaded(true), 100);
        return () => clearTimeout(timer);
    }, []);

    // Determine which topics have content for the current mode
    const getHasContent = (topic) => {
        if (activeTab === 'explore') return topic.resourceIds.length > 0;
        // Learn and Revise have no content yet — all coming soon
        return false;
    };

    const activeTopics = topics.filter(getHasContent);
    const comingSoonTopics = topics.filter(t => !getHasContent(t));

    return (
        <div
            style={{
                minHeight: '100vh',
                background: t.bg.secondary,
                fontFamily: typography.fontFamily,
                // Pad bottom for fixed tab bar + safe area
                paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))',
            }}
        >
            {/* Liquid Hero Banner */}
            <LiquidHero
                badge="A-Level Music Technology"
                title={['Interactive Resources']}
                tagline="Explore  •  Learn  •  Practice"
            />

            {/* Main Content */}
            <main
                style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    padding: spacing[8],
                }}
                role="main"
            >
                {/* Mode heading */}
                <div style={{ marginBottom: spacing[6] }}>
                    <h2
                        style={{
                            fontSize: typography.size['2xl'],
                            fontWeight: typography.weight.bold,
                            color: t.text.primary,
                            marginBottom: spacing[1],
                        }}
                    >
                        {mode.heading}
                    </h2>
                    <p
                        style={{
                            color: t.text.tertiary,
                            fontSize: typography.size.sm,
                        }}
                    >
                        {mode.subtitle}
                    </p>
                </div>

                {/* Progress tab — placeholder */}
                {activeTab === 'progress' ? (
                    <div
                        style={{
                            background: t.bg.primary,
                            borderRadius: borderRadius.xl,
                            border: `1px dashed ${t.border.medium}`,
                            padding: `${spacing[12]} ${spacing[6]}`,
                            textAlign: 'center',
                        }}
                    >
                        <p style={{ color: t.text.tertiary, fontSize: typography.size.sm, fontStyle: 'italic' }}>
                            Progress tracking coming soon
                        </p>
                    </div>
                ) : !isLoaded ? (
                    /* Skeleton loading */
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                            gap: spacing[4],
                        }}
                    >
                        {Array.from({ length: 6 }).map((_, i) => (
                            <SkeletonCard key={i} theme={t} />
                        ))}
                    </div>
                ) : (
                    <>
                        {/* Active topics */}
                        {activeTopics.length > 0 && (
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                    gap: spacing[4],
                                    marginBottom: comingSoonTopics.length > 0 ? spacing[8] : 0,
                                }}
                            >
                                {activeTopics.map((topic, i) => (
                                    <TopicCard key={topic.id} topic={topic} animationDelay={i * 60} />
                                ))}
                            </div>
                        )}

                        {/* Coming Soon topics */}
                        {comingSoonTopics.length > 0 && (
                            <>
                                {activeTopics.length > 0 && (
                                    <h3
                                        style={{
                                            fontSize: typography.size.lg,
                                            fontWeight: typography.weight.medium,
                                            color: t.text.tertiary,
                                            marginBottom: spacing[4],
                                            paddingBottom: spacing[2],
                                            borderBottom: `1px solid ${t.border.subtle}`,
                                        }}
                                    >
                                        Coming Soon
                                    </h3>
                                )}
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                        gap: spacing[4],
                                    }}
                                >
                                    {comingSoonTopics.map((topic, i) => (
                                        <TopicCard
                                            key={topic.id}
                                            topic={topic}
                                            comingSoon
                                            animationDelay={(activeTopics.length + i) * 60}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                )}
            </main>

            {/* Bottom Tab Bar */}
            <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
    );
}

function SkeletonCard({ theme: t }) {
    const shimmerBg = `linear-gradient(90deg, ${t.bg.tertiary} 0%, ${t.bg.secondary} 50%, ${t.bg.tertiary} 100%)`;
    const block = (width, height) => ({
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
                <div style={block('2.5rem', '2.5rem')} />
                <div style={block('40px', '20px')} />
            </div>
            <div style={{ ...block('65%', '20px'), marginBottom: spacing[2] }} />
            <div style={{ ...block('100%', '14px'), marginBottom: spacing[1] }} />
            <div style={{ ...block('85%', '14px'), marginBottom: 'auto' }} />
            <div style={{ borderTop: `1px solid ${t.border.subtle}`, paddingTop: spacing[3], display: 'flex', justifyContent: 'space-between' }}>
                <div style={block('50px', '14px')} />
                <div style={block('70px', '14px')} />
            </div>
        </div>
    );
}
