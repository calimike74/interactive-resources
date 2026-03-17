'use client';

import { useState, useEffect, useRef } from 'react';
import { theme, typography, spacing, borderRadius, transitions } from '@/lib/theme';

const t = theme.light;

// ─────────────────────────────────────────────
// 1. Animated Badge — scale-in with spring feel
// ─────────────────────────────────────────────
function AnimatedBadge({ children, delay = 0, color = t.accent.primary, style = {} }) {
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
                gap: '0.35em',
                padding: '0.2em 0.65em',
                fontSize: typography.size.xs,
                fontWeight: typography.weight.semibold,
                color: color,
                background: color + '14',
                border: `1px solid ${color}30`,
                borderRadius: borderRadius.full,
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

// ─────────────────────────────────────────────
// 2. CountUp — smooth number counter
// ─────────────────────────────────────────────
function CountUp({ target, duration = 1200, delay = 0, prefix = '', suffix = '', style = {} }) {
    const [count, setCount] = useState(0);
    const [started, setStarted] = useState(false);
    const frameRef = useRef(null);

    useEffect(() => {
        const timer = setTimeout(() => setStarted(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    useEffect(() => {
        if (!started) return;
        const startTime = performance.now();

        function tick(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic for a decelerating feel
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));
            if (progress < 1) {
                frameRef.current = requestAnimationFrame(tick);
            }
        }

        frameRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frameRef.current);
    }, [started, target, duration]);

    return (
        <span style={{
            fontVariantNumeric: 'tabular-nums',
            ...style,
        }}>
            {prefix}{count}{suffix}
        </span>
    );
}

// ─────────────────────────────────────────────
// 3. PulseGlow — breathing glow for "coming soon"
// ─────────────────────────────────────────────
function PulseGlow({ children, color = t.accent.info, intensity = 0.25, style = {} }) {
    const [pulse, setPulse] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => setPulse(p => !p), 1800);
        return () => clearInterval(interval);
    }, []);

    return (
        <span
            style={{
                display: 'inline-block',
                position: 'relative',
                ...style,
            }}
        >
            {/* Glow layer */}
            <span
                style={{
                    position: 'absolute',
                    inset: '-4px -8px',
                    borderRadius: borderRadius.lg,
                    background: color,
                    opacity: pulse ? intensity : intensity * 0.3,
                    filter: 'blur(12px)',
                    transition: 'opacity 1.8s ease-in-out',
                    pointerEvents: 'none',
                    zIndex: 0,
                }}
            />
            <span style={{ position: 'relative', zIndex: 1 }}>
                {children}
            </span>
        </span>
    );
}

// ─────────────────────────────────────────────
// Demo page layout
// ─────────────────────────────────────────────
export default function SpellDemos() {
    const [badgeKey, setBadgeKey] = useState(0);
    const [counterKey, setCounterKey] = useState(0);

    const sectionStyle = {
        background: t.bg.primary,
        borderRadius: borderRadius.xl,
        border: `1px solid ${t.border.subtle}`,
        padding: spacing[8],
        marginBottom: spacing[6],
    };

    const labelStyle = {
        fontSize: typography.size.xs,
        fontWeight: typography.weight.semibold,
        color: t.text.tertiary,
        textTransform: 'uppercase',
        letterSpacing: typography.letterSpacing.wide,
        marginBottom: spacing[2],
    };

    const headingStyle = {
        fontSize: typography.size['2xl'],
        fontWeight: typography.weight.bold,
        color: t.text.primary,
        marginBottom: spacing[2],
    };

    const descStyle = {
        fontSize: typography.size.sm,
        color: t.text.secondary,
        lineHeight: typography.lineHeight.relaxed,
        marginBottom: spacing[6],
        maxWidth: '540px',
    };

    const buttonStyle = {
        padding: `${spacing[2]} ${spacing[4]}`,
        fontSize: typography.size.sm,
        fontWeight: typography.weight.medium,
        color: t.accent.primary,
        background: t.accent.primary + '10',
        border: `1px solid ${t.accent.primary}30`,
        borderRadius: borderRadius.lg,
        cursor: 'pointer',
        transition: `all ${transitions.normal} ${transitions.easing}`,
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: t.bg.secondary,
            fontFamily: typography.fontFamily,
            padding: spacing[8],
        }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <p style={labelStyle}>Spell UI Prototypes</p>
                <h1 style={{
                    fontSize: typography.size['4xl'],
                    fontWeight: typography.weight.bold,
                    color: t.text.primary,
                    marginBottom: spacing[1],
                }}>
                    Three Effects
                </h1>
                <p style={{
                    fontSize: typography.size.base,
                    color: t.text.tertiary,
                    marginBottom: spacing[10],
                }}>
                    Tap &ldquo;Replay&rdquo; to see each animation again.
                </p>

                {/* ── 1. Animated Badge ── */}
                <div style={sectionStyle}>
                    <p style={labelStyle}>01 / Animated Badge</p>
                    <h2 style={headingStyle}>Scale-in with spring overshoot</h2>
                    <p style={descStyle}>
                        Badges pop in from half-size with a spring curve that overshoots slightly before settling.
                        Good for resource counts, spec references, or status indicators on TopicCards.
                    </p>

                    <div key={badgeKey} style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[3], marginBottom: spacing[5] }}>
                        <AnimatedBadge delay={0} color={t.accent.success}>
                            <span style={{ fontSize: '0.7em' }}>●</span> 5 Resources
                        </AnimatedBadge>
                        <AnimatedBadge delay={120} color={t.accent.primary}>
                            Spec 1.3
                        </AnimatedBadge>
                        <AnimatedBadge delay={240} color={t.accent.warning}>
                            In Progress
                        </AnimatedBadge>
                        <AnimatedBadge delay={360} color={t.accent.error}>
                            Needs Review
                        </AnimatedBadge>
                        <AnimatedBadge delay={480} color={t.accent.info}>
                            New
                        </AnimatedBadge>
                    </div>

                    <button style={buttonStyle} onClick={() => setBadgeKey(k => k + 1)}>
                        Replay
                    </button>
                </div>

                {/* ── 2. CountUp ── */}
                <div style={sectionStyle}>
                    <p style={labelStyle}>02 / Smooth Number Counter</p>
                    <h2 style={headingStyle}>Numbers that count up, not just appear</h2>
                    <p style={descStyle}>
                        Stats accelerate then ease to a stop. Uses requestAnimationFrame for smooth 60fps.
                        Perfect for the Progress dashboard — topics covered, quiz scores, streaks.
                    </p>

                    <div key={counterKey} style={{ display: 'flex', gap: spacing[10], flexWrap: 'wrap', marginBottom: spacing[5] }}>
                        <div>
                            <div style={{
                                fontSize: '2.5rem',
                                fontWeight: typography.weight.bold,
                                color: t.accent.primary,
                                lineHeight: 1.1,
                            }}>
                                <CountUp target={37} duration={1000} suffix="" />
                            </div>
                            <div style={{ fontSize: typography.size.sm, color: t.text.tertiary, marginTop: spacing[1] }}>
                                Resources
                            </div>
                        </div>
                        <div>
                            <div style={{
                                fontSize: '2.5rem',
                                fontWeight: typography.weight.bold,
                                color: t.accent.success,
                                lineHeight: 1.1,
                            }}>
                                <CountUp target={84} duration={1400} delay={200} suffix="%" />
                            </div>
                            <div style={{ fontSize: typography.size.sm, color: t.text.tertiary, marginTop: spacing[1] }}>
                                Average Score
                            </div>
                        </div>
                        <div>
                            <div style={{
                                fontSize: '2.5rem',
                                fontWeight: typography.weight.bold,
                                color: t.accent.warning,
                                lineHeight: 1.1,
                            }}>
                                <CountUp target={12} duration={800} delay={400} />
                            </div>
                            <div style={{ fontSize: typography.size.sm, color: t.text.tertiary, marginTop: spacing[1] }}>
                                Day Streak
                            </div>
                        </div>
                    </div>

                    <button style={buttonStyle} onClick={() => setCounterKey(k => k + 1)}>
                        Replay
                    </button>
                </div>

                {/* ── 3. PulseGlow ── */}
                <div style={sectionStyle}>
                    <p style={labelStyle}>03 / Pulse Glow</p>
                    <h2 style={headingStyle}>Breathing glow for &ldquo;Coming Soon&rdquo;</h2>
                    <p style={descStyle}>
                        A soft, rhythmic glow that pulses behind text or cards. Signals that content is on the way
                        without being distracting. The color and intensity are configurable per topic.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[5] }}>
                        {/* As a text label */}
                        <div>
                            <PulseGlow color={t.accent.info}>
                                <span style={{
                                    fontSize: typography.size.lg,
                                    fontWeight: typography.weight.semibold,
                                    color: t.text.secondary,
                                }}>
                                    Coming Soon
                                </span>
                            </PulseGlow>
                        </div>

                        {/* As a card treatment */}
                        <div style={{ display: 'flex', gap: spacing[4], flexWrap: 'wrap' }}>
                            {[
                                { name: 'Mixing & Mastering', color: '#8B5CF6' },
                                { name: 'MIDI & Sequencing', color: '#06B6D4' },
                                { name: 'Studio Acoustics', color: '#F59E0B' },
                            ].map((topic) => (
                                <PulseGlow key={topic.name} color={topic.color} intensity={0.2}>
                                    <div style={{
                                        background: t.bg.primary,
                                        border: `1px solid ${t.border.subtle}`,
                                        borderRadius: borderRadius.xl,
                                        padding: `${spacing[4]} ${spacing[5]}`,
                                        minWidth: '180px',
                                    }}>
                                        <div style={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: borderRadius.full,
                                            background: topic.color,
                                            marginBottom: spacing[2],
                                        }} />
                                        <div style={{
                                            fontSize: typography.size.sm,
                                            fontWeight: typography.weight.semibold,
                                            color: t.text.primary,
                                            marginBottom: spacing[1],
                                        }}>
                                            {topic.name}
                                        </div>
                                        <div style={{
                                            fontSize: typography.size.xs,
                                            color: t.text.tertiary,
                                            fontStyle: 'italic',
                                        }}>
                                            Coming soon
                                        </div>
                                    </div>
                                </PulseGlow>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Back link */}
                <div style={{ textAlign: 'center', paddingTop: spacing[4] }}>
                    <a
                        href="/"
                        style={{
                            fontSize: typography.size.sm,
                            color: t.text.tertiary,
                            textDecoration: 'underline',
                            textUnderlineOffset: '3px',
                        }}
                    >
                        Back to Resources Hub
                    </a>
                </div>
            </div>
        </div>
    );
}
