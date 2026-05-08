'use client';

import { useState, useEffect, useRef } from 'react';
import { getAllTopicDefs } from '@/lib/topics';
import { hasLearnContent } from '@/lib/learn/topics';
import { theme, typography, borderRadius, spacing, transitions } from '@/lib/theme';
import LiquidHero from '@/components/LiquidHero';
import TopicCard from '@/components/TopicCard';
import TopicBookShelf from '@/components/TopicBookShelf';
import BottomTabBar from '@/components/BottomTabBar';
import ProgressDashboard from '@/components/ProgressDashboard';
import BlurReveal from '@/components/BlurReveal';
import SlideUpWords from '@/components/SlideUpWords';
import CommandPalette from '@/components/CommandPalette';
import GradientText from '@/components/GradientText';
import SplashCursor from '@/components/SplashCursor';
import ShapeBlur from '@/components/ShapeBlur';

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
        if (activeTab === 'learn') return hasLearnContent(topic.id);
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
            {/* Liquid Hero Banner with Splash Cursor overlay */}
            <div style={{ position: 'relative', overflow: 'hidden' }}>
                <LiquidHero
                    badge="A-Level Music Technology"
                    title={['Interactive Resources']}
                    tagline="Explore  •  Learn  •  Practice"
                />
                <SplashCursor
                    DENSITY_DISSIPATION={3}
                    VELOCITY_DISSIPATION={2}
                    SPLAT_RADIUS={0.15}
                    SPLAT_FORCE={4000}
                    CURL={5}
                    COLOR_UPDATE_SPEED={8}
                    TRANSPARENT={true}
                />
            </div>

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
                <div style={{ marginBottom: spacing[6], position: 'relative' }}>
                    {/* ShapeBlur — decorative backdrop behind heading */}
                    <div
                        style={{
                            position: 'absolute',
                            top: '-40px',
                            left: '-60px',
                            right: '-60px',
                            bottom: '-20px',
                            opacity: 0.12,
                            pointerEvents: 'none',
                            zIndex: 0,
                        }}
                    >
                        <ShapeBlur
                            variation={1}
                            shapeSize={1.0}
                            roundness={0.5}
                            borderSize={0.05}
                            circleSize={0.4}
                            circleEdge={0.6}
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[1], position: 'relative', zIndex: 1 }}>
                        <h2
                            style={{
                                fontSize: typography.size['2xl'],
                                fontWeight: typography.weight.bold,
                                margin: 0,
                            }}
                        >
                            <BlurReveal key={`heading-${activeTab}`} duration={600} blur={10}>
                                <GradientText
                                    colors={['#1A1A2E', '#2563EB', '#9B7530', '#1A1A2E']}
                                    animationSpeed={6}
                                    style={{ fontSize: 'inherit', fontWeight: 'inherit' }}
                                >
                                    {mode.heading}
                                </GradientText>
                            </BlurReveal>
                        </h2>
                        <CommandPalette />
                    </div>
                    <p
                        style={{
                            color: t.text.tertiary,
                            fontSize: typography.size.sm,
                            position: 'relative',
                            zIndex: 1,
                        }}
                    >
                        <SlideUpWords key={`subtitle-${activeTab}`} text={mode.subtitle} delay={100} stagger={50} />
                    </p>
                    {activeTab === 'revise' && <div style={{ position: 'relative', zIndex: 1 }}><TypewriterTeaser t={t} /></div>}
                </div>

                {/* Progress tab — dashboard */}
                {activeTab === 'progress' ? (
                    <ProgressDashboard />
                ) : !isLoaded ? (
                    /* Skeleton loading */
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                            gap: spacing[5],
                        }}
                    >
                        {Array.from({ length: 6 }).map((_, i) => (
                            <SkeletonCard key={i} theme={t} />
                        ))}
                    </div>
                ) : (
                    <>
                        {/* Book shelf — visual browse on explore tab */}
                        {activeTab === 'explore' && activeTopics.length > 0 && (
                            <div style={{ marginBottom: spacing[8] }}>
                                <TopicBookShelf topics={activeTopics} />
                            </div>
                        )}

                        {/* Active topics */}
                        {activeTopics.length > 0 && (
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                    gap: spacing[5],
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
                                        gap: spacing[5],
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
            <BottomTabBar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onPanelOption={(tabId, optionId) => {
                    // For now, log the selection — wire to actual routes later
                    console.log(`Panel option: ${tabId} → ${optionId}`);
                }}
            />
        </div>
    );
}

const REVISION_QUESTIONS = [
    'What is the Nyquist frequency?',
    'Define quantisation error.',
    'Explain the role of a compressor.',
    'How does FM synthesis work?',
    'What causes comb filtering?',
    'Describe the purpose of phantom power.',
];

function TypewriterTeaser({ t }) {
    const [displayed, setDisplayed] = useState('');
    const [questionIdx, setQuestionIdx] = useState(0);
    const [charIdx, setCharIdx] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const timerRef = useRef(null);

    useEffect(() => {
        const question = REVISION_QUESTIONS[questionIdx];

        if (!isDeleting && charIdx <= question.length) {
            timerRef.current = setTimeout(() => {
                setDisplayed(question.slice(0, charIdx));
                if (charIdx === question.length) {
                    // Pause before deleting
                    timerRef.current = setTimeout(() => setIsDeleting(true), 1800);
                } else {
                    setCharIdx(c => c + 1);
                }
            }, 45);
        } else if (isDeleting && charIdx >= 0) {
            timerRef.current = setTimeout(() => {
                setDisplayed(question.slice(0, charIdx));
                if (charIdx === 0) {
                    setIsDeleting(false);
                    setQuestionIdx((questionIdx + 1) % REVISION_QUESTIONS.length);
                } else {
                    setCharIdx(c => c - 1);
                }
            }, 25);
        }

        return () => clearTimeout(timerRef.current);
    }, [charIdx, isDeleting, questionIdx]);

    return (
        <p
            style={{
                fontFamily: typography.fontFamilyMono,
                color: t.text.tertiary,
                fontSize: typography.size.sm,
                marginTop: spacing[3],
                minHeight: '1.5em',
            }}
            aria-live="polite"
            aria-label="Sample revision question"
        >
            {displayed}
            <span
                style={{
                    display: 'inline-block',
                    width: '2px',
                    height: '1em',
                    background: t.accent.primary,
                    marginLeft: '2px',
                    verticalAlign: 'text-bottom',
                    animation: 'blink 1s step-end infinite',
                }}
                aria-hidden="true"
            />
        </p>
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
