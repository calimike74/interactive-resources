'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { theme, glass, typography, borderRadius, spacing, transitions } from '@/lib/theme';

export default function TopicCard({ topic, animationDelay = 0, comingSoon = false }) {
    const [isHovered, setIsHovered] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const cardRef = useRef(null);
    const t = theme.light;

    const hasResources = !comingSoon && topic.resourceIds.length > 0;
    const resourceCount = topic.resourceIds.length;

    const handleMouseMove = useCallback((e) => {
        const rect = cardRef.current?.getBoundingClientRect();
        if (!rect) return;
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }, []);

    const card = (
        <article
            ref={cardRef}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onMouseMove={handleMouseMove}
            style={{
                position: 'relative',
                overflow: 'hidden',
                background: glass.bg,
                backdropFilter: 'blur(' + glass.blur + ')',
                WebkitBackdropFilter: 'blur(' + glass.blur + ')',
                borderRadius: borderRadius.xl,
                border: `1px solid ${hasResources && isHovered ? topic.colour + '40' : t.border.subtle}`,
                boxShadow: hasResources && isHovered
                    ? `6px 6px 0 ${topic.colour}18, 0 8px 32px rgba(0, 0, 0, 0.08)`
                    : glass.shadow,
                padding: spacing[6],
                cursor: hasResources ? 'pointer' : 'default',
                transition: `all ${transitions.slow} ${transitions.easing}`,
                transform: hasResources && isHovered ? 'translate(-3px, -4px)' : 'none',
                opacity: hasResources ? 1 : 0.6,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                animation: `cardReveal 400ms ease-out ${animationDelay}ms both`,
            }}
        >
            {/* Glow layer */}
            {hasResources && (
                <div
                    style={{
                        position: 'absolute',
                        top: mousePos.y - 150,
                        left: mousePos.x - 150,
                        width: 300,
                        height: 300,
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${topic.colour}40 0%, ${topic.colour}15 40%, transparent 70%)`,
                        filter: 'blur(28px) saturate(3) brightness(1.1)',
                        pointerEvents: 'none',
                        opacity: isHovered ? 1 : 0,
                        transition: 'opacity 300ms ease',
                        zIndex: 0,
                    }}
                    aria-hidden="true"
                />
            )}

            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1 }}>
                {/* Header: colour accent bar + spec ref */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[3] }}>
                    <div
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: borderRadius.lg,
                            background: hasResources ? topic.colour + '18' : t.bg.tertiary,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <div
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: hasResources ? topic.colour : t.text.tertiary,
                            }}
                        />
                    </div>
                    <span
                        style={{
                            background: 'rgba(255, 255, 255, 0.5)',
                            color: t.text.tertiary,
                            padding: `${spacing[1]} ${spacing[2]}`,
                            borderRadius: borderRadius.md,
                            fontSize: typography.size.xs,
                            fontWeight: typography.weight.medium,
                        }}
                    >
                        {topic.specRef}
                    </span>
                </div>

                {/* Topic name */}
                <h3
                    style={{
                        fontSize: typography.size.lg,
                        fontWeight: typography.weight.semibold,
                        color: hasResources ? t.text.primary : t.text.tertiary,
                        marginBottom: spacing[2],
                        lineHeight: typography.lineHeight.tight,
                    }}
                >
                    {topic.name}
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
                    {topic.description}
                </p>

                {/* Footer: resource count or coming soon */}
                <div
                    style={{
                        paddingTop: spacing[3],
                        borderTop: `1px solid ${glass.border}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    {hasResources ? (
                        <>
                            <span style={{ color: topic.colour, fontSize: typography.size.xs, fontWeight: typography.weight.semibold }}>
                                {resourceCount} {resourceCount === 1 ? 'tool' : 'tools'}
                            </span>
                            <span style={{ color: t.text.tertiary, fontSize: typography.size.xs }}>
                                Explore →
                            </span>
                        </>
                    ) : (
                        <span
                            style={{
                                color: t.text.tertiary,
                                fontSize: typography.size.xs,
                                fontWeight: typography.weight.medium,
                                fontStyle: 'italic',
                            }}
                        >
                            Coming Soon
                        </span>
                    )}
                </div>
            </div>
        </article>
    );

    if (!hasResources) return card;

    return (
        <Link href={`/topic/${topic.id}`} style={{ textDecoration: 'none' }}>
            {card}
        </Link>
    );
}
