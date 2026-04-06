'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { theme, typography, spacing, borderRadius, transitions } from '@/lib/theme';

const t = theme.light;

export default function ReadingPhase({ passage, scaffoldLevel, onComplete }) {
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [ready, setReady] = useState(false);
    const intervalRef = useRef(null);

    const wordCount = passage.text.split(/\s+/).length;
    const minTimeSeconds = Math.ceil((wordCount / 200) * 60);

    useEffect(() => {
        intervalRef.current = setInterval(() => {
            setTimeElapsed(prev => {
                const next = prev + 1;
                if (next >= minTimeSeconds) {
                    setReady(true);
                }
                return next;
            });
        }, 1000);
        return () => clearInterval(intervalRef.current);
    }, [minTimeSeconds]);

    const handleReady = useCallback(() => {
        clearInterval(intervalRef.current);
        onComplete({ readingTimeSeconds: timeElapsed });
    }, [timeElapsed, onComplete]);

    const showKeyTerms = scaffoldLevel === 'full' || scaffoldLevel === 'medium';
    const remainingSeconds = Math.max(0, minTimeSeconds - timeElapsed);

    const renderPassageText = () => {
        if (!showKeyTerms || !passage.keyTerms || passage.keyTerms.length === 0) {
            return passage.text;
        }

        let html = passage.text;
        passage.keyTerms.forEach(({ term, definition }) => {
            const regex = new RegExp(`\\b(${term})\\b`, 'gi');
            html = html.replace(regex, (match) =>
                `<span style="color:${t.accent.primary};border-bottom:1px dashed ${t.accent.primary};cursor:help" title="${definition}">${match}</span>`
            );
        });
        return <span dangerouslySetInnerHTML={{ __html: html }} />;
    };

    return (
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: spacing[4],
            }}>
                <span style={{
                    color: t.accent.primary,
                    fontSize: typography.size.sm,
                    fontWeight: typography.weight.medium,
                }}>
                    Read carefully — this passage will disappear
                </span>
                <span style={{
                    background: t.bg.tertiary,
                    color: t.text.secondary,
                    padding: `${spacing[1]} ${spacing[3]}`,
                    borderRadius: borderRadius.full,
                    fontSize: typography.size.sm,
                }}>
                    Reading...
                </span>
            </div>

            <div style={{
                background: t.bg.tertiary,
                padding: spacing[6],
                borderRadius: borderRadius.lg,
                lineHeight: typography.lineHeight.relaxed,
                fontSize: typography.size.base,
                color: t.text.primary,
                whiteSpace: 'pre-line',
            }}>
                {renderPassageText()}
            </div>

            <div style={{ textAlign: 'center', marginTop: spacing[6] }}>
                <button
                    onClick={handleReady}
                    disabled={!ready}
                    style={{
                        padding: `${spacing[3]} ${spacing[8]}`,
                        borderRadius: borderRadius.lg,
                        border: 'none',
                        background: ready ? t.accent.primary : t.border.medium,
                        color: ready ? 'white' : t.text.tertiary,
                        fontSize: typography.size.base,
                        fontWeight: typography.weight.semibold,
                        cursor: ready ? 'pointer' : 'not-allowed',
                        fontFamily: typography.fontFamily,
                        transition: `all ${transitions.normal} ${transitions.easing}`,
                    }}
                >
                    {ready
                        ? "I'm Ready — Show Questions"
                        : `Read for at least ${remainingSeconds}s more...`
                    }
                </button>
                <p style={{
                    color: t.text.tertiary,
                    fontSize: typography.size.xs,
                    marginTop: spacing[2],
                }}>
                    {ready
                        ? 'The passage will disappear when you continue'
                        : 'Take your time — the button activates when you\'ve had enough time to read'
                    }
                </p>
            </div>
        </div>
    );
}
