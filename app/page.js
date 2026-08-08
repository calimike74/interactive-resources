'use client';

import { useState, useEffect, useRef } from 'react';
import { getAllTopicDefs } from '@/lib/topics';
import { hasLearnContent } from '@/lib/learn/topics';
import { hasReviseContent } from '@/lib/questions';
import { theme, typography, borderRadius, spacing, transitions } from '@/lib/theme';
import LiquidHero from '@/components/LiquidHero';
import TopicCard from '@/components/TopicCard';
import BottomTabBar from '@/components/BottomTabBar';
import ProgressDashboard from '@/components/ProgressDashboard';
import BlurReveal from '@/components/BlurReveal';
import SlideUpWords from '@/components/SlideUpWords';
import CommandPalette from '@/components/CommandPalette';
import SplashCursor from '@/components/SplashCursor';

// Editorial palette — white surface (matches LiquidHero), warm-ink type.
const ED = {
    page: '#f5f4f2',
    ink: '#181410',
    inkSoft: '#4d463c',
    inkFade: '#8a8175',
    rule: '#d9d1be',
    visited: '#2d5d4f',
    serif: 'var(--font-fraunces), Georgia, serif',
    sans: 'var(--font-manrope), -apple-system, sans-serif',
    mono: 'var(--font-jbmono), ui-monospace, monospace',
};

// The other rooms of the estate — the subject map here, and the two
// reading rooms over on the grades site. Link only: those pages are
// finished surfaces.
const ROOMS = [
    {
        name: 'The Map Room',
        href: '/map-room',
        desc: 'The whole of Component 4 drawn as one map — every concept in its place.',
    },
    {
        name: 'The Library',
        href: 'https://member.musictechstudio.co.uk/the-library',
        desc: 'Every volume behind the course, with doors into the Reading Room and the curriculum.',
    },
    {
        name: 'The Reading Room',
        href: 'https://member.musictechstudio.co.uk/reading-room',
        desc: 'The reading list as a real shelf — take a volume down, turn it over.',
    },
];

// Free full-length books and the era playlist — static HTML pages in
// public/, one link each.
const BOOKS = [
    {
        name: 'The Story of the Studio',
        href: '/story-of-the-studio',
        desc: 'How recording grew up, 1930 to now · 82 pages · free PDF',
    },
    {
        name: 'The Story of Synthesis',
        href: '/story-of-synthesis',
        desc: 'A century of electronic sound · 69 pages · free PDF',
    },
    {
        name: 'The History of Recorded Music',
        href: '/recording-history',
        desc: 'Five eras as a listening playlist · 21 sourced milestones, every "first" flagged',
    },
];

// Mode descriptions shown under the hero
const MODE_INFO = {
    explore: {
        heading: 'Interactive Tools',
        subtitle: 'Hands-on tools to experiment with audio concepts.',
    },
    learn: {
        heading: 'Walkthroughs',
        subtitle: 'Step-by-step lessons through each topic.',
    },
    revise: {
        heading: 'Practice Quizzes',
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
        if (activeTab === 'revise') return hasReviseContent(topic.id);
        return false;
    };

    const activeTopics = topics.filter(getHasContent);
    const comingSoonTopics = topics.filter(t => !getHasContent(t));

    return (
        <div
            style={{
                minHeight: '100vh',
                background: ED.page,
                fontFamily: ED.sans,
                color: ED.ink,
                // Pad bottom for fixed tab bar + safe area
                paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))',
            }}
        >
            {/* Liquid Hero Banner with Splash Cursor overlay */}
            <div style={{ position: 'relative', overflow: 'hidden' }}>
                <LiquidHero
                    badge="A-Level Music Technology"
                    title={['Interactive Resources']}
                    tagline="Explore  •  Walkthroughs  •  Practice"
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
                {/* Mode heading — editorial */}
                <div style={{ marginBottom: spacing[6], position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing[4], marginBottom: spacing[2] }}>
                        <h2
                            style={{
                                fontFamily: ED.serif,
                                fontStyle: 'italic',
                                fontWeight: 400,
                                fontSize: '40px',
                                lineHeight: 1.05,
                                letterSpacing: '-0.02em',
                                color: ED.ink,
                                margin: 0,
                            }}
                        >
                            <BlurReveal key={`heading-${activeTab}`} duration={600} blur={10}>
                                {mode.heading}
                            </BlurReveal>
                        </h2>
                        <CommandPalette />
                    </div>
                    <p
                        style={{
                            fontFamily: ED.serif,
                            fontStyle: 'italic',
                            color: ED.inkSoft,
                            fontSize: '17px',
                            lineHeight: 1.5,
                            margin: 0,
                            maxWidth: '560px',
                        }}
                    >
                        <SlideUpWords key={`subtitle-${activeTab}`} text={mode.subtitle} delay={100} stagger={50} />
                    </p>
                    {activeTab === 'revise' && <div><TypewriterTeaser t={t} /></div>}
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
                                            fontFamily: ED.serif,
                                            fontStyle: 'italic',
                                            fontWeight: 400,
                                            fontSize: '22px',
                                            color: ED.inkSoft,
                                            marginBottom: spacing[4],
                                            paddingBottom: spacing[2],
                                            borderBottom: `1px solid ${ED.rule}`,
                                            display: 'flex',
                                            alignItems: 'baseline',
                                            gap: spacing[3],
                                        }}
                                    >
                                        In preparation
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

                {/* More rooms — the estate beyond the tools */}
                <section aria-label="More rooms" style={{ marginTop: spacing[8] }}>
                    <h3
                        style={{
                            fontFamily: ED.serif,
                            fontStyle: 'italic',
                            fontWeight: 400,
                            fontSize: '22px',
                            color: ED.inkSoft,
                            marginBottom: spacing[4],
                            paddingBottom: spacing[2],
                            borderBottom: `1px solid ${ED.rule}`,
                        }}
                    >
                        More rooms
                    </h3>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                            gap: spacing[5],
                        }}
                    >
                        {ROOMS.map((room) => (
                            <a
                                key={room.name}
                                href={room.href}
                                className="mts-room-link"
                                style={{ textDecoration: 'none', color: ED.ink, display: 'block' }}
                            >
                                <div
                                    style={{
                                        fontFamily: ED.serif,
                                        fontStyle: 'italic',
                                        fontSize: '20px',
                                        marginBottom: spacing[1] ?? '4px',
                                    }}
                                >
                                    {room.name}{' '}
                                    <span aria-hidden="true" style={{ color: ED.visited, fontSize: '15px' }}>
                                        →
                                    </span>
                                </div>
                                <p
                                    style={{
                                        fontFamily: ED.sans,
                                        fontSize: '14px',
                                        lineHeight: 1.5,
                                        color: ED.inkSoft,
                                        margin: 0,
                                        maxWidth: '38ch',
                                    }}
                                >
                                    {room.desc}
                                </p>
                            </a>
                        ))}
                    </div>
                    <style>{`
                        .mts-room-link:hover div { color: ${ED.visited}; }
                    `}</style>
                </section>

                {/* The bookshelf — two free full-length books, static PDF downloads */}
                <section aria-label="Free books" style={{ marginTop: spacing[8] }}>
                    <h3
                        style={{
                            fontFamily: ED.serif,
                            fontStyle: 'italic',
                            fontWeight: 400,
                            fontSize: '22px',
                            color: ED.inkSoft,
                            marginBottom: spacing[4],
                            paddingBottom: spacing[2],
                            borderBottom: `1px solid ${ED.rule}`,
                        }}
                    >
                        The bookshelf
                    </h3>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                            gap: spacing[5],
                        }}
                    >
                        {BOOKS.map((book) => (
                            <a
                                key={book.name}
                                href={book.href}
                                className="mts-book-link"
                                style={{ textDecoration: 'none', color: ED.ink, display: 'block' }}
                            >
                                <div
                                    style={{
                                        fontFamily: ED.serif,
                                        fontStyle: 'italic',
                                        fontSize: '20px',
                                        marginBottom: spacing[1] ?? '4px',
                                    }}
                                >
                                    {book.name}{' '}
                                    <span aria-hidden="true" style={{ color: ED.visited, fontSize: '15px' }}>
                                        →
                                    </span>
                                </div>
                                <p
                                    style={{
                                        fontFamily: ED.sans,
                                        fontSize: '14px',
                                        lineHeight: 1.5,
                                        color: ED.inkSoft,
                                        margin: 0,
                                        maxWidth: '38ch',
                                    }}
                                >
                                    {book.desc}
                                </p>
                            </a>
                        ))}
                    </div>
                    <style>{`
                        .mts-book-link:hover div { color: ${ED.visited}; }
                    `}</style>
                </section>
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

    const question = REVISION_QUESTIONS[questionIdx];
    const isComplete = !isDeleting && charIdx === question.length;

    return (
        <>
            {/* Visually-hidden live region: announces only when a full question is typed */}
            <span
                aria-live="polite"
                aria-atomic="true"
                style={{
                    position: 'absolute',
                    width: '1px',
                    height: '1px',
                    padding: 0,
                    margin: '-1px',
                    overflow: 'hidden',
                    clip: 'rect(0,0,0,0)',
                    whiteSpace: 'nowrap',
                    border: 0,
                }}
            >
                {isComplete ? displayed : ''}
            </span>
            <p
                style={{
                    fontFamily: typography.fontFamilyMono,
                    color: t.text.tertiary,
                    fontSize: typography.size.sm,
                    marginTop: spacing[3],
                    minHeight: '1.5em',
                }}
                aria-hidden="true"
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
        </>
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
