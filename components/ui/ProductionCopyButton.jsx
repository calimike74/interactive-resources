'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { PRODUCTION_MODES } from '@/lib/copy-for-ai';
import { spacing, borderRadius, transitions } from '@/lib/theme';

const MODE_ICONS = {
    daw: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
            <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
            <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
            <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
        </svg>
    ),
    explain: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18h6" /><path d="M10 22h4" />
            <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
        </svg>
    ),
    experiment: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 3h6" /><path d="M10 3v4.4a1 1 0 0 1-.2.6L5 14" />
            <path d="M14 3v4.4a1 1 0 0 0 .2.6L19 14" />
            <path d="M5 21h14" /><path d="M5 14l4.5 7" /><path d="M19 14l-4.5 7" />
        </svg>
    ),
};

export default function ProductionCopyButton({ buildContent, accent = '#2563EB' }) {
    const [copied, setCopied] = useState(false);
    const [blurring, setBlurring] = useState(false);
    const [showModes, setShowModes] = useState(false);
    const [learnMode, setLearnMode] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const timeoutRef = useRef(null);
    const hintTimer = useRef(null);
    const popoverRef = useRef(null);
    const buttonRef = useRef(null);

    // Load learn mode from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem('copy-ai-learn-mode');
            if (stored === 'true') setLearnMode(true);
        } catch {}
    }, []);

    useEffect(() => {
        if (!showModes) return;
        function handleClickOutside(e) {
            if (popoverRef.current && !popoverRef.current.contains(e.target) &&
                buttonRef.current && !buttonRef.current.contains(e.target)) {
                setShowModes(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showModes]);

    const toggleLearnMode = useCallback(() => {
        setLearnMode(prev => {
            const next = !prev;
            try { localStorage.setItem('copy-ai-learn-mode', String(next)); } catch {}
            return next;
        });
    }, []);

    const handleCopy = useCallback(async (mode) => {
        setShowModes(false);
        const markdown = buildContent(mode, learnMode);

        try {
            await navigator.clipboard.writeText(markdown);

            setBlurring(true);
            setTimeout(() => {
                setCopied(true);
                setBlurring(false);
            }, 150);

            clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
                setBlurring(true);
                setTimeout(() => {
                    setCopied(false);
                    setBlurring(false);
                }, 150);
            }, 2000);
        } catch (err) {
            console.warn('Clipboard API unavailable:', err);
        }
    }, [buildContent, learnMode]);

    const handleButtonEnter = () => {
        if (showModes) return;
        clearTimeout(hintTimer.current);
        hintTimer.current = setTimeout(() => setShowHint(true), 400);
    };

    const handleButtonLeave = () => {
        clearTimeout(hintTimer.current);
        setShowHint(false);
    };

    const handleButtonClick = () => {
        setShowHint(false);
        clearTimeout(hintTimer.current);
        setShowModes(!showModes);
    };

    return (
        <div style={{ position: 'relative', display: 'inline-flex' }}>
            <button type="button"
                ref={buttonRef}
                onClick={handleButtonClick}
                onMouseEnter={handleButtonEnter}
                onMouseLeave={handleButtonLeave}
                aria-label={copied ? 'Copied!' : 'Copy for AI'}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 7,
                    height: 36,
                    borderRadius: 18,
                    border: `1.5px solid ${copied ? accent : '#D1D5DB'}`,
                    background: copied ? `${accent}15` : '#FFFFFF',
                    color: copied ? accent : '#6B7280',
                    cursor: 'pointer',
                    // WO-07: the icon-only circle failed its owner — Mike could
                    // not tell what "the copy thing" did. Visible label now,
                    // same behaviour.
                    padding: '0 14px',
                    fontSize: 13,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    filter: blurring ? 'blur(4px)' : 'blur(0px)',
                    transition: `all ${transitions.fast} ${transitions.easing}`,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
            >
                {copied ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                ) : (
                    // A recognisable copy glyph (two sheets), not the ambiguous
                    // three-sliders icon the review couldn't decode.
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="12" height="12" rx="2" />
                        <path d="M5 15V5a2 2 0 0 1 2-2h10" />
                    </svg>
                )}
                <span>{copied ? 'Copied!' : 'Copy for AI'}</span>
            </button>

            {/* Hover hint — explains what the button does */}
            {showHint && !showModes && !copied && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: '100%',
                        right: 0,
                        marginBottom: 8,
                        width: 200,
                        padding: '8px 12px',
                        borderRadius: borderRadius.lg,
                        border: '1px solid #E5E7EB',
                        background: '#FFFFFF',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        zIndex: 40,
                        pointerEvents: 'none',
                        animation: 'hintFadeIn 150ms ease-out',
                    }}
                >
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#1A1A2E', margin: '0 0 3px' }}>
                        Copy for AI
                    </p>
                    <p style={{ fontSize: 11, color: '#6B7280', margin: 0, lineHeight: 1.5 }}>
                        Copies your current settings to paste into ChatGPT or similar — get help recreating this in your DAW.
                    </p>
                    {/* Arrow */}
                    <div style={{
                        position: 'absolute',
                        bottom: -6,
                        right: 14,
                        width: 0,
                        height: 0,
                        borderLeft: '6px solid transparent',
                        borderRight: '6px solid transparent',
                        borderTop: '6px solid #FFFFFF',
                    }} />
                </div>
            )}

            {showModes && (
                <div
                    ref={popoverRef}
                    style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: 8,
                        width: 220,
                        borderRadius: borderRadius.lg,
                        border: '1px solid #E5E7EB',
                        background: '#FFFFFF',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
                        zIndex: 50,
                        overflow: 'hidden',
                    }}
                >
                    <div style={{ padding: '8px 14px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <p style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', margin: 0, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Copy for AI
                        </p>
                        <button type="button"
                            onClick={toggleLearnMode}
                            style={{
                                fontSize: 10,
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: 9999,
                                border: `1px solid ${learnMode ? accent : '#D1D5DB'}`,
                                background: learnMode ? accent : '#F3F4F6',
                                color: learnMode ? '#fff' : '#6B7280',
                                cursor: 'pointer',
                                transition: 'transform, opacity, background-color, color, border-color, box-shadow 200ms ease',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {learnMode ? 'Test me' : 'Teach me'}
                        </button>
                    </div>
                    {PRODUCTION_MODES.map((m) => (
                        <button type="button"
                            key={m.key}
                            onClick={() => handleCopy(m.key)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                width: '100%',
                                padding: '10px 14px',
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: `background ${transitions.fast} ${transitions.easing}`,
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#F8F9FA'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                        >
                            <span style={{ color: accent, flexShrink: 0 }}>
                                {MODE_ICONS[m.key]}
                            </span>
                            <span>
                                <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E', display: 'block' }}>
                                    {m.label}
                                </span>
                                <span style={{ fontSize: 11, color: '#6B7280' }}>
                                    {m.description}
                                </span>
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
