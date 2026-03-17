'use client';

import { useState, useRef, useEffect } from 'react';
import { typography, spacing } from '@/lib/theme';

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

export default function BottomTabBar({ activeTab, onTabChange }) {
    const [bouncing, setBouncing] = useState(null);

    const handleTabChange = (tabId) => {
        if (tabId === activeTab) return;
        setBouncing(tabId);
        onTabChange(tabId);
        setTimeout(() => setBouncing(null), 400);
    };

    return (
        <nav
            style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 100,
                display: 'flex',
                justifyContent: 'center',
                paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
                paddingTop: '12px',
                pointerEvents: 'none',
            }}
        >
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
                            <button
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
                                    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
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
    );
}
