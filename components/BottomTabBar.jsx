'use client';

import { theme, glass, typography, spacing } from '@/lib/theme';

const TABS = [
    { id: 'explore', label: 'Explore', icon: '🎛️' },
    { id: 'learn', label: 'Learn', icon: '📖' },
    { id: 'revise', label: 'Revise', icon: '✏️' },
    { id: 'progress', label: 'Progress', icon: '📊' },
];

export default function BottomTabBar({ activeTab, onTabChange }) {
    return (
        <nav
            style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 100,
                background: glass.bg,
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderTop: '1px solid ' + glass.border,
                boxShadow: '0 -2px 16px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-around',
                    maxWidth: '500px',
                    margin: '0 auto',
                }}
            >
                {TABS.map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '2px',
                                padding: `${spacing[2]} 0`,
                                background: isActive ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                                borderRadius: isActive ? '12px' : '0',
                                border: 'none',
                                cursor: 'pointer',
                                fontFamily: typography.fontFamily,
                                WebkitTapHighlightColor: 'transparent',
                                transition: 'opacity 150ms ease',
                            }}
                        >
                            <span
                                style={{
                                    fontSize: '1.25rem',
                                    opacity: isActive ? 1 : 0.45,
                                    transition: 'opacity 150ms ease',
                                }}
                            >
                                {tab.icon}
                            </span>
                            <span
                                style={{
                                    fontSize: '0.65rem',
                                    fontWeight: isActive ? typography.weight.semibold : typography.weight.medium,
                                    color: isActive ? theme.light.accent.primary : theme.light.text.tertiary,
                                    letterSpacing: '0.01em',
                                    transition: 'color 150ms ease',
                                }}
                            >
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
