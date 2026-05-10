'use client';

import { useEffect, useState } from 'react';
import { theme, typography, borderRadius, spacing, transitions, glass, editorial as ED } from '@/lib/theme';

export default function SpecBanner({ topic }) {
    const t = theme.light;
    const storageKey = topic ? `spec-banner-${topic.id}-collapsed` : null;
    const [collapsed, setCollapsed] = useState(false);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        if (!storageKey) return;
        try {
            const stored = localStorage.getItem(storageKey);
            if (stored === '1') setCollapsed(true);
        } catch {}
        setHydrated(true);
    }, [storageKey]);

    if (!topic || !Array.isArray(topic.specSummary) || topic.specSummary.length === 0) {
        return null;
    }

    const toggle = () => {
        const next = !collapsed;
        setCollapsed(next);
        try {
            localStorage.setItem(storageKey, next ? '1' : '0');
        } catch {}
    };

    const tint = ED.accent;

    return (
        <section
            aria-label={`Specification reference for ${topic.name}`}
            style={{
                maxWidth: '1200px',
                margin: `${spacing[4]} auto 0`,
                padding: `0 ${spacing[6]}`,
            }}
        >
            <div
                style={{
                    background: glass.bg,
                    backdropFilter: `blur(${glass.blur})`,
                    WebkitBackdropFilter: `blur(${glass.blur})`,
                    border: `1px solid ${glass.border}`,
                    borderLeft: `3px solid ${tint}`,
                    borderRadius: borderRadius.lg,
                    boxShadow: glass.shadow,
                    padding: `${spacing[4]} ${spacing[5]}`,
                }}
            >
                <button
                    type="button"
                    onClick={toggle}
                    aria-expanded={!collapsed}
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: spacing[3],
                        background: 'transparent',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: typography.fontFamily,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3], flexWrap: 'wrap' }}>
                        <span
                            style={{
                                background: `${tint}1f`,
                                color: tint,
                                border: `1px solid ${tint}40`,
                                padding: `${spacing[1]} ${spacing[3]}`,
                                borderRadius: borderRadius.full,
                                fontSize: typography.size.xs,
                                fontWeight: typography.weight.semibold,
                                letterSpacing: '0.02em',
                            }}
                        >
                            Spec {topic.specRef} · {topic.name}
                        </span>
                        <span
                            style={{
                                fontSize: typography.size.sm,
                                fontWeight: typography.weight.medium,
                                color: t.text.primary,
                            }}
                        >
                            What the spec says you need to know
                        </span>
                    </div>
                    <span
                        aria-hidden="true"
                        style={{
                            color: t.text.secondary,
                            fontSize: typography.size.sm,
                            transition: `transform ${transitions.fast}`,
                            transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
                            display: 'inline-block',
                        }}
                    >
                        ▾
                    </span>
                </button>

                {hydrated && !collapsed && (
                    <ul
                        style={{
                            listStyle: 'none',
                            padding: 0,
                            margin: `${spacing[3]} 0 0`,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: spacing[2],
                        }}
                    >
                        {topic.specSummary.map((bullet, i) => (
                            <li
                                key={i}
                                style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: spacing[2],
                                    color: t.text.secondary,
                                    fontSize: typography.size.sm,
                                    lineHeight: 1.5,
                                }}
                            >
                                <span
                                    aria-hidden="true"
                                    style={{
                                        color: tint,
                                        flexShrink: 0,
                                        marginTop: '0.1em',
                                    }}
                                >
                                    •
                                </span>
                                <span>{bullet}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}
