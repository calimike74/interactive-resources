'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { theme, glass, typography, borderRadius, spacing, transitions } from '@/lib/theme';
import { getResource } from '@/lib/resources';
import ExaminerHintBadge from '@/components/ui/ExaminerHintBadge';

// Spell-inspired: badge pops in with spring overshoot
function AnimatedBadge({ children, delay = 0, color, style = {} }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), delay + 10);
        return () => clearTimeout(timer);
    }, [delay]);

    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                opacity: visible ? 1 : 0,
                transform: visible ? 'scale(1)' : 'scale(0.5)',
                transition: `opacity 300ms ${transitions.easing} ${delay}ms, transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms`,
                willChange: 'opacity, transform',
                ...style,
            }}
        >
            {children}
        </span>
    );
}

// Spell-inspired: breathing glow behind coming-soon cards
function PulseGlow({ children, color, intensity = 0.18 }) {
    const [pulse, setPulse] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => setPulse(p => !p), 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{ position: 'relative' }}>
            <div
                style={{
                    position: 'absolute',
                    inset: '-2px -4px',
                    borderRadius: borderRadius.xl,
                    background: color,
                    opacity: pulse ? intensity : intensity * 0.2,
                    filter: 'blur(16px)',
                    transition: 'opacity 2s ease-in-out',
                    pointerEvents: 'none',
                    zIndex: 0,
                }}
                aria-hidden="true"
            />
            <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>
                {children}
            </div>
        </div>
    );
}

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
                overflow: 'visible',
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
            {/* Glow layer — clipped to card bounds */}
            {hasResources && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        overflow: 'hidden',
                        borderRadius: borderRadius.xl,
                        pointerEvents: 'none',
                        zIndex: 0,
                    }}
                    aria-hidden="true"
                >
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
                            opacity: isHovered ? 1 : 0,
                            transition: 'opacity 300ms ease',
                        }}
                    />
                </div>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
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
                        <ExaminerHintBadge topicCode={topic.specRef} topicColour={topic.colour} position="bottom" />
                    </div>
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
                            <AnimatedBadge delay={animationDelay + 300} color={topic.colour}>
                                <span style={{
                                    color: topic.colour,
                                    fontSize: typography.size.xs,
                                    fontWeight: typography.weight.semibold,
                                    background: topic.colour + '14',
                                    padding: `${spacing[0.5]} ${spacing[2]}`,
                                    borderRadius: borderRadius.full,
                                    border: `1px solid ${topic.colour}25`,
                                }}>
                                    {resourceCount} {resourceCount === 1 ? 'tool' : 'tools'}
                                </span>
                            </AnimatedBadge>
                            <AnimatedBadge delay={animationDelay + 420} color={topic.colour}>
                                <span style={{ color: t.text.tertiary, fontSize: typography.size.xs }}>
                                    Explore →
                                </span>
                            </AnimatedBadge>
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

                {/* Hover popover — list of tools in this topic */}
                {hasResources && isHovered && (
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '100%',
                            left: 0,
                            marginBottom: 10,
                            width: 220,
                            padding: '10px 14px',
                            borderRadius: borderRadius.lg,
                            border: `1px solid ${topic.colour}30`,
                            background: '#FFFFFF',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                            zIndex: 10,
                            pointerEvents: 'none',
                            animation: 'hintFadeIn 200ms ease-out',
                            maxHeight: 200,
                            overflowY: 'auto',
                        }}
                    >
                        <style>{`
                            @keyframes popoverItemReveal {
                                from { opacity: 0; transform: translateX(-6px); }
                                to   { opacity: 1; transform: translateX(0); }
                            }
                            .popover-resource-item {
                                animation: popoverItemReveal 300ms ease-out both;
                            }
                            @media (prefers-reduced-motion: reduce) {
                                .popover-resource-item { animation: none; }
                            }
                        `}</style>
                        <p style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: topic.colour,
                            margin: '0 0 6px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.03em',
                        }}>
                            Tools included
                        </p>
                        {topic.resourceIds.map((rid, idx) => {
                            const res = getResource(rid);
                            return (
                                <div
                                    key={rid}
                                    className="popover-resource-item"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        padding: '3px 0',
                                        animationDelay: `${idx * 50}ms`,
                                    }}
                                >
                                    <div style={{
                                        width: 5,
                                        height: 5,
                                        borderRadius: '50%',
                                        background: topic.colour,
                                        flexShrink: 0,
                                        opacity: 0.6,
                                    }} />
                                    <span style={{
                                        fontSize: 12,
                                        color: t.text.secondary,
                                        lineHeight: 1.4,
                                    }}>
                                        {res?.title || rid}
                                    </span>
                                </div>
                            );
                        })}
                        {/* Arrow */}
                        <div style={{
                            position: 'absolute',
                            bottom: -6,
                            left: 20,
                            width: 0,
                            height: 0,
                            borderLeft: '6px solid transparent',
                            borderRight: '6px solid transparent',
                            borderTop: '6px solid #FFFFFF',
                        }} />
                    </div>
                )}
            </div>
        </article>
    );

    if (!hasResources) {
        return (
            <PulseGlow color={topic.colour} intensity={0.18}>
                {card}
            </PulseGlow>
        );
    }

    return (
        <Link href={`/topic/${topic.id}`} style={{ textDecoration: 'none' }}>
            {card}
        </Link>
    );
}
