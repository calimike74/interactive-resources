'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { typography, spacing } from '@/lib/theme';

// ── Action panel options per tab ──
const PANEL_OPTIONS = {
    learn: [
        {
            id: 'continue',
            label: 'Continue',
            description: 'Pick up where you left off',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
            ),
        },
        {
            id: 'newTopic',
            label: 'New Topic',
            description: 'Browse all topics',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
                </svg>
            ),
        },
        {
            id: 'quickRecap',
            label: 'Quick Recap',
            description: '2-min refresher',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                </svg>
            ),
        },
    ],
    revise: [
        {
            id: 'quick5',
            label: 'Quick 5',
            description: '5 random questions',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
            ),
        },
        {
            id: 'topicQuiz',
            label: 'Topic Quiz',
            description: 'Pick a topic to test',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
                </svg>
            ),
        },
        {
            id: 'fullPaper',
            label: 'Full Paper',
            description: 'Timed practice paper',
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
            ),
        },
    ],
};

// ── Micro click sound via Web Audio API ──
function useClickSound() {
    const ctxRef = useRef(null);

    const play = useCallback(() => {
        try {
            if (!ctxRef.current) {
                ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }
            const ctx = ctxRef.current;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(1800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.03);

            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.04);
        } catch {
            // Audio not available — fail silently
        }
    }, []);

    return play;
}

const TABS = [
    {
        id: 'explore',
        label: 'Explore',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
            </svg>
        ),
    },
    {
        id: 'learn',
        label: 'Learn',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
        ),
    },
    {
        id: 'revise',
        label: 'Revise',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
        ),
    },
    {
        id: 'progress',
        label: 'Progress',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
        ),
    },
];

// Neumorphic colour tokens
const NEU = {
    bg: '#E8E7E4',
    shadowDark: 'rgba(0, 0, 0, 0.12)',
    shadowLight: 'rgba(255, 255, 255, 0.7)',
    iconInactive: '#B0AFA8',
    iconActive: '#1A1918',
    gold: '#C5A855',
    labelInactive: '#9C9B99',
    labelActive: '#1A1918',
};

// Tabs that have an action panel
const PANEL_TABS = new Set(Object.keys(PANEL_OPTIONS));

export default function BottomTabBar({ activeTab, onTabChange, onPanelOption }) {
    const [bouncing, setBouncing] = useState(null);
    const [openPanel, setOpenPanel] = useState(null); // 'learn' | 'revise' | null
    const panelRef = useRef(null);
    const playClick = useClickSound();

    const panelOptions = openPanel ? PANEL_OPTIONS[openPanel] : [];

    // Close panel when clicking outside
    useEffect(() => {
        if (!openPanel) return;
        const handleClickOutside = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setOpenPanel(null);
            }
        };
        document.addEventListener('pointerdown', handleClickOutside);
        return () => document.removeEventListener('pointerdown', handleClickOutside);
    }, [openPanel]);

    // Move focus to first panel button when panel opens
    useEffect(() => {
        if (!openPanel) return;
        const firstButton = panelRef.current?.querySelector('button');
        if (firstButton) firstButton.focus();
    }, [openPanel]);

    // Close panel when switching away from its tab
    useEffect(() => {
        if (openPanel && activeTab !== openPanel) setOpenPanel(null);
    }, [activeTab, openPanel]);

    const handleTabChange = (tabId) => {
        playClick();

        // Tabs with action panels
        if (PANEL_TABS.has(tabId)) {
            if (activeTab === tabId) {
                // Already on this tab — toggle panel
                setOpenPanel(prev => prev === tabId ? null : tabId);
            } else {
                // Switch to tab and open its panel
                onTabChange(tabId);
                setOpenPanel(tabId);
            }
            setBouncing(tabId);
            setTimeout(() => setBouncing(null), 400);
            return;
        }

        if (tabId === activeTab) return;
        setOpenPanel(null);
        setBouncing(tabId);
        onTabChange(tabId);
        setTimeout(() => setBouncing(null), 400);
    };

    const handlePanelOption = (tabId, optionId) => {
        playClick();
        setOpenPanel(null);
        if (onPanelOption) onPanelOption(tabId, optionId);
    };

    return (
        <>
        <nav
            ref={panelRef}
            style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
                paddingTop: '12px',
                pointerEvents: 'none',
            }}
        >
            {/* ── Action panel (Learn / Revise) ── */}
            <div
                style={{
                    maxWidth: '340px',
                    width: '90%',
                    overflow: 'hidden',
                    maxHeight: openPanel ? '220px' : '0px',
                    opacity: openPanel ? 1 : 0,
                    transition: 'max-height 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease',
                    marginBottom: openPanel ? '8px' : '0px',
                    pointerEvents: openPanel ? 'auto' : 'none',
                }}
            >
                <div
                    onKeyDown={(e) => { if (e.key === 'Escape') setOpenPanel(null); }}
                    style={{
                        background: NEU.bg,
                        borderRadius: '20px',
                        padding: '12px',
                        boxShadow: [
                            `6px 6px 14px ${NEU.shadowDark}`,
                            `-6px -6px 14px ${NEU.shadowLight}`,
                            `inset 1px 1px 2px rgba(255, 255, 255, 0.3)`,
                        ].join(', '),
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                    }}
                >
                    {panelOptions.map((option, i) => (
                        <button type="button"
                            key={option.id}
                            onClick={() => handlePanelOption(openPanel, option.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px 14px',
                                border: 'none',
                                borderRadius: '14px',
                                background: 'transparent',
                                cursor: 'pointer',
                                fontFamily: typography.fontFamily,
                                WebkitTapHighlightColor: 'transparent',
                                transition: 'background 0.15s ease',
                                width: '100%',
                                textAlign: 'left',
                                // Staggered entrance
                                opacity: openPanel ? 1 : 0,
                                transform: openPanel ? 'translateY(0)' : 'translateY(8px)',
                                transitionDelay: openPanel ? `${i * 60}ms` : '0ms',
                                transitionProperty: 'opacity, transform, background',
                                transitionDuration: '0.3s, 0.3s, 0.15s',
                            }}
                            onPointerEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.6)';
                            }}
                            onPointerLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                            }}
                        >
                            <span
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '10px',
                                    background: '#FFFFFF',
                                    border: `1.5px solid ${NEU.gold}`,
                                    color: NEU.iconActive,
                                    flexShrink: 0,
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                                }}
                            >
                                {option.icon}
                            </span>
                            <div>
                                <div
                                    style={{
                                        fontSize: typography.size.sm,
                                        fontWeight: 600,
                                        color: NEU.iconActive,
                                        lineHeight: 1.2,
                                    }}
                                >
                                    {option.label}
                                </div>
                                <div
                                    style={{
                                        fontSize: '0.7rem',
                                        color: NEU.labelInactive,
                                        lineHeight: 1.3,
                                    }}
                                >
                                    {option.description}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Tab bar ── */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 18px',
                    borderRadius: '50px',
                    background: NEU.bg,
                    boxShadow: [
                        `6px 6px 14px ${NEU.shadowDark}`,
                        `-6px -6px 14px ${NEU.shadowLight}`,
                        `inset 1px 1px 2px rgba(255, 255, 255, 0.3)`,
                    ].join(', '),
                    pointerEvents: 'auto',
                }}
            >
                {TABS.map((tab, i) => {
                    const isActive = activeTab === tab.id;
                    const isBouncing = bouncing === tab.id;

                    return (
                        <div key={tab.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {/* Divider after first item */}
                            {i === 1 && (
                                <span
                                    style={{
                                        width: '1px',
                                        height: '28px',
                                        background: '#D0CFC8',
                                        flexShrink: 0,
                                        marginRight: '6px',
                                    }}
                                />
                            )}
                            <button type="button"
                                onClick={() => handleTabChange(tab.id)}
                                aria-label={tab.label}
                                aria-current={isActive ? 'page' : undefined}
                                style={{
                                    width: '56px',
                                    height: '56px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '2px',
                                    border: isActive ? `2px solid ${NEU.gold}` : 'none',
                                    borderRadius: isActive ? '16px' : '50%',
                                    background: isActive ? '#FFFFFF' : 'transparent',
                                    boxShadow: isActive
                                        ? [
                                            '0 3px 10px rgba(0, 0, 0, 0.08)',
                                            '0 -1px 6px rgba(255, 255, 255, 0.5)',
                                            '0 0 12px rgba(197, 168, 85, 0.12)',
                                        ].join(', ')
                                        : 'none',
                                    cursor: 'pointer',
                                    fontFamily: typography.fontFamily,
                                    WebkitTapHighlightColor: 'transparent',
                                    transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                    transform: isBouncing ? 'scale(1.12)' : 'scale(1)',
                                    color: isActive ? NEU.iconActive : NEU.iconInactive,
                                    padding: 0,
                                }}
                            >
                                <span
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'color 0.2s ease',
                                    }}
                                >
                                    {tab.icon}
                                </span>
                                <span
                                    style={{
                                        fontSize: '0.55rem',
                                        fontWeight: isActive ? 600 : 500,
                                        color: isActive ? NEU.labelActive : NEU.labelInactive,
                                        letterSpacing: '0.01em',
                                        transition: 'color 0.2s ease',
                                        lineHeight: 1,
                                    }}
                                >
                                    {tab.label}
                                </span>
                            </button>
                        </div>
                    );
                })}
            </div>

            <style jsx global>{`
                @keyframes neu-bounce {
                    0% { transform: scale(1); }
                    40% { transform: scale(1.15); }
                    70% { transform: scale(0.95); }
                    100% { transform: scale(1); }
                }
            `}</style>
        </nav>

        {/* The bar is position:fixed, so it reserves no space in the document
            and everything after it — including the global SiteFooter, which the
            root layout renders after {children} — could slide underneath it.
            At maximum scroll that left Privacy and Cookie preferences literally
            unclickable: elementFromPoint at the centre of each returned this
            bar rather than the control, and there was nowhere further to
            scroll. A cookie-preferences control a user cannot reach is a
            problem beyond looking unfinished, on a site whose members are
            16–18.

            This spacer gives the bar back the room it occupies. Height matches
            the bar's resting height (measured 100px on the live site) plus the
            iOS safe-area inset the bar itself pads for. Deliberately not tied
            to the open-panel state: the panel is a transient overlay, and a
            spacer that changed height would shift the page under the reader. */}
        <div
            aria-hidden="true"
            style={{ height: 'calc(100px + env(safe-area-inset-bottom, 0px))' }}
        />
        </>
    );
}
