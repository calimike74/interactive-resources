'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { typography, borderRadius, spacing, transitions } from '@/lib/theme';
import { getResource } from '@/lib/resources';
import ExaminerHintBadge from '@/components/ui/ExaminerHintBadge';

// Editorial palette — paper & ink, no per-topic colour noise.
const ED = {
    card: '#ffffff',
    paperWarm: '#faf6ec',
    ink: '#181410',
    inkSoft: '#4d463c',
    inkFade: '#8a8175',
    rule: '#d9d1be',
    ruleSoft: '#e8e1cc',
    visited: '#2d5d4f',
    gold: '#b88a2c',
    goldBg: '#f6e9c8',
    chase: '#a8541a',
    serif: 'var(--font-fraunces), Georgia, serif',
    sans: 'var(--font-manrope), -apple-system, sans-serif',
    mono: 'var(--font-jbmono), ui-monospace, monospace',
};

// Spell-inspired: badge pops in with a small spring overshoot
function AnimatedBadge({ children, delay = 0, style = {} }) {
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
                transition: `opacity 300ms ${transitions.easing} ${delay}ms, transform ${transitions.springDuration} ${transitions.spring} ${delay}ms`,
                willChange: 'opacity, transform',
                ...style,
            }}
        >
            {children}
        </span>
    );
}

export default function TopicCard({ topic, animationDelay = 0, comingSoon = false }) {
    const [isHovered, setIsHovered] = useState(false);

    const hasResources = !comingSoon && topic.resourceIds.length > 0;
    const resourceCount = topic.resourceIds.length;

    const card = (
        <article
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                position: 'relative',
                background: ED.card,
                borderRadius: borderRadius.lg,
                border: `1px solid ${isHovered && hasResources ? ED.inkFade : ED.rule}`,
                boxShadow: isHovered && hasResources
                    ? '0 1px 0 rgba(24,20,16,.04), 0 8px 24px -12px rgba(24,20,16,.18), 0 24px 48px -28px rgba(24,20,16,.18)'
                    : '0 1px 2px rgba(24,20,16,.04), 0 8px 16px -8px rgba(24,20,16,.08)',
                padding: spacing[6],
                cursor: hasResources ? 'pointer' : 'default',
                transition: `transform 220ms ${transitions.easing}, box-shadow 220ms, border-color 220ms`,
                transform: isHovered && hasResources ? 'translateY(-2px)' : 'none',
                opacity: hasResources ? 1 : 0.65,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                animation: `cardReveal 400ms ease-out ${animationDelay}ms both`,
                fontFamily: ED.sans,
            }}
        >
            {/* Header: unit code + spec ref */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    paddingBottom: spacing[3],
                    marginBottom: spacing[3],
                    borderBottom: `1px solid ${ED.ruleSoft}`,
                }}
            >
                <span
                    style={{
                        fontFamily: ED.mono,
                        fontSize: '10px',
                        fontWeight: 500,
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        color: ED.inkFade,
                    }}
                >
                    Unit
                    <span style={{ color: ED.ink, marginLeft: '4px' }}>{topic.specRef}</span>
                </span>
                <ExaminerHintBadge topicCode={topic.specRef} position="bottom" />
            </div>

            {/* Topic name — italic Fraunces */}
            <h3
                style={{
                    fontFamily: ED.serif,
                    fontStyle: 'italic',
                    fontWeight: 400,
                    fontSize: '24px',
                    lineHeight: 1.12,
                    letterSpacing: '-0.012em',
                    color: hasResources ? ED.ink : ED.inkSoft,
                    margin: `${spacing[1]} 0 ${spacing[3]}`,
                }}
            >
                {topic.name}
            </h3>

            {/* Description */}
            <p
                style={{
                    fontFamily: ED.sans,
                    fontSize: '13px',
                    lineHeight: 1.5,
                    color: ED.inkSoft,
                    margin: 0,
                    marginBottom: spacing[4],
                    flex: 1,
                }}
            >
                {topic.description}
            </p>

            {/* Footer: tool count + CTA */}
            <div
                style={{
                    paddingTop: spacing[3],
                    borderTop: `1px dashed ${ED.ruleSoft}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                }}
            >
                {hasResources ? (
                    <>
                        <AnimatedBadge delay={animationDelay + 300}>
                            <span
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'baseline',
                                    gap: '5px',
                                    fontFamily: ED.mono,
                                    fontSize: '9.5px',
                                    fontWeight: 500,
                                    letterSpacing: '0.12em',
                                    textTransform: 'uppercase',
                                    color: ED.inkSoft,
                                }}
                            >
                                <span
                                    style={{
                                        fontFamily: ED.serif,
                                        fontStyle: 'italic',
                                        fontSize: '22px',
                                        color: ED.ink,
                                        fontWeight: 400,
                                        lineHeight: 0.9,
                                    }}
                                >
                                    {resourceCount}
                                </span>
                                {resourceCount === 1 ? 'tool' : 'tools'}
                            </span>
                        </AnimatedBadge>
                        <AnimatedBadge delay={animationDelay + 420}>
                            <span
                                style={{
                                    fontFamily: ED.mono,
                                    fontSize: '9.5px',
                                    fontWeight: 500,
                                    letterSpacing: '0.14em',
                                    textTransform: 'uppercase',
                                    color: isHovered ? ED.visited : ED.inkFade,
                                    transition: 'color 180ms',
                                }}
                            >
                                Explore
                                <span
                                    style={{
                                        display: 'inline-block',
                                        marginLeft: '6px',
                                        transform: isHovered ? 'translateX(3px)' : 'none',
                                        transition: 'transform 180ms',
                                    }}
                                >
                                    →
                                </span>
                            </span>
                        </AnimatedBadge>
                    </>
                ) : (
                    <span
                        style={{
                            fontFamily: ED.serif,
                            fontStyle: 'italic',
                            fontSize: '13px',
                            color: ED.chase,
                        }}
                    >
                        In preparation
                    </span>
                )}
            </div>

            {/* Hover popover — list of tools in this topic, editorial style */}
            {hasResources && isHovered && (
                <div
                    aria-hidden="true"
                    style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: 0,
                        marginBottom: 10,
                        width: 240,
                        padding: '12px 14px',
                        borderRadius: borderRadius.lg,
                        border: `1px solid ${ED.rule}`,
                        background: ED.card,
                        boxShadow: '0 14px 32px -10px rgba(24,20,16,.22), 0 2px 6px -2px rgba(24,20,16,.08)',
                        zIndex: 10,
                        pointerEvents: 'none',
                        animation: 'hintFadeIn 200ms ease-out',
                        maxHeight: 220,
                        overflowY: 'auto',
                        fontFamily: ED.sans,
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
                    <p
                        style={{
                            fontFamily: ED.mono,
                            fontSize: '9.5px',
                            fontWeight: 500,
                            letterSpacing: '0.16em',
                            textTransform: 'uppercase',
                            color: ED.inkFade,
                            margin: '0 0 8px',
                        }}
                    >
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
                                    alignItems: 'baseline',
                                    gap: 8,
                                    padding: '4px 0',
                                    animationDelay: `${idx * 50}ms`,
                                }}
                            >
                                <span
                                    style={{
                                        fontFamily: ED.mono,
                                        fontSize: '8.5px',
                                        color: ED.inkFade,
                                        fontVariantNumeric: 'tabular-nums',
                                        flexShrink: 0,
                                    }}
                                >
                                    {String(idx + 1).padStart(2, '0')}
                                </span>
                                <span
                                    style={{
                                        fontFamily: ED.serif,
                                        fontStyle: 'italic',
                                        fontSize: '14px',
                                        color: ED.ink,
                                        lineHeight: 1.3,
                                    }}
                                >
                                    {res?.title || rid}
                                </span>
                            </div>
                        );
                    })}
                    {/* Arrow tail */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: -7,
                            left: 24,
                            width: 0,
                            height: 0,
                            borderLeft: '7px solid transparent',
                            borderRight: '7px solid transparent',
                            borderTop: `7px solid ${ED.card}`,
                            filter: `drop-shadow(0 1px 0 ${ED.rule})`,
                        }}
                    />
                </div>
            )}
        </article>
    );

    if (!hasResources) {
        return card;
    }

    return (
        <Link href={`/topic/${topic.id}`} style={{ textDecoration: 'none' }}>
            {card}
        </Link>
    );
}
