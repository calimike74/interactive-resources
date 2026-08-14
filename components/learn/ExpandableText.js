'use client';

import { useRef, useState, useEffect } from 'react';
import { findExpansion, getExpandableWordIndices, ALL_EXPANSIONS } from '@/lib/learn/expansions';
import { saveConfidence, getStudentConfidence } from '@/lib/learn/confidence-persistence';

// Depth colour system — each level gets progressively deeper
function getDepthColour(topicColor, depth) {
    const opacities = ['08', '14', '22'];
    const borderOpacities = ['40', '60', '80'];
    const d = Math.min(depth, opacities.length - 1);
    return {
        bg: topicColor + opacities[d],
        border: topicColor + borderOpacities[d],
    };
}

// Renders expanded text with chained expandable terms underlined
function ExpandableInlineText({ text, topicColor, depth }) {
    const words = text.split(/\s+/);
    const expandableIndices = getExpandableWordIndices(words);
    if (expandableIndices.size === 0) return text;
    return words.map((word, i) => (
        <span
            key={`chain-${i}-${word}`}
            style={{
                borderBottom: expandableIndices.has(i)
                    ? `1.5px dotted ${topicColor}55`
                    : undefined,
            }}
        >
            {word}{' '}
        </span>
    ));
}

export default function ExpandableText({ text, topicColor = '#1a1a6e', topicId, studentToken, onProgressChange }) {
    const [segments, setSegments] = useState(
        text.split(/\s+/).map((word) => ({ type: 'original', text: word }))
    );
    const [selStart, setSelStart] = useState(null);
    const [selEnd, setSelEnd] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isExpanding, setIsExpanding] = useState(false);
    const [expandingId, setExpandingId] = useState(null);
    const [history, setHistory] = useState([]);
    const [openExpansions, setOpenExpansions] = useState(new Set());
    const [exploredTerms, setExploredTerms] = useState(new Set());
    const containerRef = useRef(null);
    const expandIdRef = useRef(0);
    const totalTermsRef = useRef(0);

    const hasSelection = selStart !== null && selEnd !== null && selStart !== selEnd;
    const selMin = selStart !== null && selEnd !== null ? Math.min(selStart, selEnd) : null;
    const selMax = selStart !== null && selEnd !== null ? Math.max(selStart, selEnd) : null;

    const allWords = segments.map((s) => s.type === 'original' ? s.text : s.originalText);
    const expandableIndices = getExpandableWordIndices(allWords);

    // Count unique expandable terms in this text
    useEffect(() => {
        const lower = text.toLowerCase();
        const seen = new Set();
        let count = 0;
        for (const exp of ALL_EXPANSIONS) {
            if (lower.includes(exp.trigger.toLowerCase()) && !seen.has(exp.trigger)) {
                count++;
                seen.add(exp.trigger);
            }
        }
        totalTermsRef.current = count;
    }, [text]);

    // Report progress
    useEffect(() => {
        if (onProgressChange && totalTermsRef.current > 0) {
            onProgressChange(exploredTerms.size, totalTermsRef.current);
        }
    }, [exploredTerms, onProgressChange]);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const prevent = (e) => e.preventDefault();
        el.addEventListener('selectstart', prevent);
        return () => el.removeEventListener('selectstart', prevent);
    }, []);

    const getIndexAt = (x, y) => {
        const el = document.elementFromPoint(x, y);
        if (el && el.dataset && el.dataset.idx !== undefined) {
            return parseInt(el.dataset.idx, 10);
        }
        return null;
    };

    const handlePointerDown = (e) => {
        if (isExpanding) return;
        const target = e.target;
        if (target.closest('button') || target.closest('[data-expansion-bubble]')) return;
        const idx = getIndexAt(e.clientX, e.clientY);
        if (idx !== null) {
            setSelStart(idx);
            setSelEnd(idx);
            setIsDragging(true);
        } else {
            setSelStart(null);
            setSelEnd(null);
        }
    };

    const handlePointerMove = (e) => {
        if (!isDragging || isExpanding) return;
        const idx = getIndexAt(e.clientX, e.clientY);
        if (idx !== null) setSelEnd(idx);
    };

    const handlePointerUp = () => setIsDragging(false);

    const getSelectedText = () => {
        if (selMin === null || selMax === null) return '';
        return segments.slice(selMin, selMax + 1).map((s) => s.text).join(' ');
    };

    // Calculate depth based on whether we're inside an existing expansion
    const getDepthAtIndex = (index) => {
        for (let i = index - 1; i >= 0; i--) {
            const seg = segments[i];
            if (seg.type === 'expanded' && openExpansions.has(seg.id)) {
                return (seg.depth || 0) + 1;
            }
        }
        return 0;
    };

    const triggerExpansionForWord = async (wordIndex) => {
        if (isExpanding) return;
        setIsExpanding(true);
        setHistory((prev) => [...prev, segments]);
        const seg = segments[wordIndex];
        const selectedText = seg.text;
        const id = `exp-${++expandIdRef.current}`;
        const depth = getDepthAtIndex(wordIndex);
        const newSegments = [
            ...segments.slice(0, wordIndex),
            { type: 'expanded', text: '', originalText: selectedText, id, depth, confidence: 'none' },
            ...segments.slice(wordIndex + 1),
        ];
        setSegments(newSegments);
        setExpandingId(id);
        setSelStart(null);
        setSelEnd(null);
        setOpenExpansions((prev) => new Set(prev).add(id));
        setExploredTerms((prev) => new Set(prev).add(selectedText.toLowerCase()));
        const preGenerated = findExpansion(selectedText);
        if (preGenerated) {
            await new Promise((r) => setTimeout(r, 300));
            setSegments((prev) =>
                prev.map((s) =>
                    s.type === 'expanded' && s.id === id ? { ...s, text: preGenerated } : s
                )
            );
        } else {
            setSegments((prev) =>
                prev.map((s) =>
                    s.type === 'expanded' && s.id === id
                        ? { ...s, text: 'No additional detail available for this selection. Try highlighting one of the underlined key terms.' }
                        : s
                )
            );
        }
        setIsExpanding(false);
        setExpandingId(null);
    };

    const triggerExpansion = async () => {
        if (selMin === null || selMax === null || isExpanding) return;
        setIsExpanding(true);
        setHistory((prev) => [...prev, segments]);

        const selectedText = getSelectedText();
        const id = `exp-${++expandIdRef.current}`;
        const depth = getDepthAtIndex(selMin);

        const newSegments = [
            ...segments.slice(0, selMin),
            { type: 'expanded', text: '', originalText: selectedText, id, depth, confidence: 'none' },
            ...segments.slice(selMax + 1),
        ];
        setSegments(newSegments);
        setExpandingId(id);
        setSelStart(null);
        setSelEnd(null);
        setOpenExpansions((prev) => new Set(prev).add(id));
        setExploredTerms((prev) => new Set(prev).add(selectedText.toLowerCase()));

        const preGenerated = findExpansion(selectedText);

        if (preGenerated) {
            await new Promise((r) => setTimeout(r, 300));
            setSegments((prev) =>
                prev.map((seg) =>
                    seg.type === 'expanded' && seg.id === id
                        ? { ...seg, text: preGenerated }
                        : seg
                )
            );
        } else {
            setSegments((prev) =>
                prev.map((seg) =>
                    seg.type === 'expanded' && seg.id === id
                        ? { ...seg, text: 'No additional detail available for this selection. Try highlighting one of the underlined key terms.' }
                        : seg
                )
            );
        }

        setIsExpanding(false);
        setExpandingId(null);
    };

    const toggleExpansion = (id) => {
        setOpenExpansions((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleConfidence = (id, confidence) => {
        // Find the original text for this expansion (used as the DB key)
        const seg = segments.find((s) => s.type === 'expanded' && s.id === id);
        const termTrigger = seg ? seg.originalText : '';

        setSegments((prev) =>
            prev.map((s) =>
                s.type === 'expanded' && s.id === id ? { ...s, confidence } : s
            )
        );

        // Persist to Supabase if we have a student token
        if (studentToken && topicId && termTrigger) {
            saveConfidence({ studentToken, topicId, termTrigger, confidence });
        }

        if (confidence === 'got-it') {
            setTimeout(() => {
                setOpenExpansions((prev) => {
                    const next = new Set(prev);
                    next.delete(id);
                    return next;
                });
            }, 400);
        }
    };

    const handleUndo = () => {
        if (history.length === 0) return;
        setSegments(history[history.length - 1]);
        setHistory((h) => h.slice(0, -1));
        setSelStart(null);
        setSelEnd(null);
        setOpenExpansions(new Set());
    };

    const isSelected = (i) =>
        selMin !== null && selMax !== null && i >= selMin && i <= selMax;

    return (
        <div
            ref={containerRef}
            style={{ userSelect: 'none', touchAction: 'none' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
        >
            <div style={{ fontSize: '1rem', lineHeight: 1.65, color: '#374151', display: 'flow-root' }}>
                {segments.map((seg, index) => {
                    if (seg.type === 'expanded') {
                        const isOpen = openExpansions.has(seg.id);
                        const isLoading = expandingId === seg.id && !seg.text;
                        const hasContent = !!seg.text;
                        const depth = seg.depth || 0;
                        const colours = getDepthColour(topicColor, depth);
                        const conf = seg.confidence || 'none';

                        const pillBorderColour =
                            conf === 'got-it' ? '#10B981' : conf === 'confused' ? '#F59E0B' : isOpen ? colours.border : 'transparent';
                        const pillBg =
                            conf === 'got-it' ? 'rgba(16, 185, 129, 0.08)'
                            : conf === 'confused' ? 'rgba(245, 158, 11, 0.08)'
                            : isOpen ? topicColor + '18' : topicColor + '0C';
                        const pillTextColour =
                            conf === 'got-it' ? '#059669' : conf === 'confused' ? '#D97706' : topicColor;

                        return (
                            <span key={`e-${seg.id}`} style={{ display: 'inline' }}>
                                {/* Pill */}
                                <span
                                    data-idx={index}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => !isExpanding && toggleExpansion(seg.id)}
                                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !isExpanding && toggleExpansion(seg.id)}
                                    aria-expanded={isOpen}
                                    aria-label={`${seg.originalText}: ${isOpen ? 'collapse' : 'expand'} explanation`}
                                    style={{
                                        padding: '1px 6px',
                                        borderRadius: '4px',
                                        backgroundColor: pillBg,
                                        color: pillTextColour,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        borderBottom: `2px solid ${pillBorderColour}`,
                                    }}
                                >
                                    {conf === 'got-it' && <span style={{ marginRight: '3px' }}>&#10003;</span>}
                                    {conf === 'confused' && <span style={{ marginRight: '3px' }}>?</span>}
                                    {seg.originalText}
                                </span>

                                {/* Expansion bubble */}
                                {isOpen && (
                                    <span
                                        data-expansion-bubble
                                        style={{
                                            display: 'block',
                                            width: '100%',
                                            margin: '10px 0 14px 0',
                                            padding: '14px 16px',
                                            borderRadius: '10px',
                                            backgroundColor: colours.bg,
                                            borderLeft: `3px solid ${colours.border}`,
                                            color: topicColor,
                                            fontSize: '0.9375rem',
                                            lineHeight: '1.7',
                                            opacity: 0,
                                            animation: 'expandBubbleReveal 0.45s ease forwards',
                                            animationDelay: '0.05s',
                                        }}
                                    >
                                        {/* Depth indicator */}
                                        {depth > 0 && (
                                            <span style={{
                                                display: 'block',
                                                fontSize: '10px',
                                                fontWeight: 600,
                                                color: colours.border,
                                                marginBottom: '6px',
                                                letterSpacing: '0.05em',
                                                textTransform: 'uppercase',
                                            }}>
                                                {'\u25CF'.repeat(depth + 1)} Depth {depth + 1}
                                            </span>
                                        )}

                                        {/* Loading */}
                                        {isLoading && (
                                            <span style={{ color: topicColor, fontSize: '0.875rem' }}>
                                                Expanding...
                                            </span>
                                        )}

                                        {/* Expanded text with chained terms */}
                                        {hasContent && (
                                            <span style={{ opacity: 0, animation: 'expandFadeIn 0.5s ease 0.15s forwards' }}>
                                                <ExpandableInlineText text={seg.text} topicColor={topicColor} depth={depth + 1} />
                                            </span>
                                        )}

                                        {/* Confidence buttons — only shown when the student is signed in, so ratings actually persist */}
                                        {hasContent && conf === 'none' && studentToken && (
                                            <span style={{
                                                display: 'flex',
                                                gap: '8px',
                                                marginTop: '12px',
                                                opacity: 0,
                                                animation: 'expandFadeIn 0.4s ease 0.4s forwards',
                                            }}>
                                                <button type="button"
                                                    onClick={() => handleConfidence(seg.id, 'got-it')}
                                                    style={{
                                                        padding: '4px 12px', borderRadius: '9999px', fontSize: '12px',
                                                        fontWeight: 500, border: '1px solid #D1FAE5', background: '#ECFDF5',
                                                        color: '#059669', cursor: 'pointer', transition: 'all 0.15s ease',
                                                    }}
                                                >
                                                    &#10003; I get it
                                                </button>
                                                <button type="button"
                                                    onClick={() => handleConfidence(seg.id, 'confused')}
                                                    style={{
                                                        padding: '4px 12px', borderRadius: '9999px', fontSize: '12px',
                                                        fontWeight: 500, border: '1px solid #FEF3C7', background: '#FFFBEB',
                                                        color: '#D97706', cursor: 'pointer', transition: 'all 0.15s ease',
                                                    }}
                                                >
                                                    ? Still confused
                                                </button>
                                            </span>
                                        )}

                                        {hasContent && conf === 'none' && !studentToken && (
                                            <span style={{
                                                display: 'block',
                                                marginTop: '12px',
                                                fontSize: '12px',
                                                color: '#6B7280',
                                                fontStyle: 'italic',
                                                opacity: 0,
                                                animation: 'expandFadeIn 0.4s ease 0.4s forwards',
                                            }}>
                                                Sign in to flag this for revision or mark it as understood.
                                            </span>
                                        )}

                                        {conf === 'got-it' && (
                                            <span style={{ display: 'block', marginTop: '8px', fontSize: '12px', color: '#059669' }}>
                                                &#10003; Marked as understood
                                            </span>
                                        )}
                                        {conf === 'confused' && (
                                            <span style={{ display: 'block', marginTop: '8px', fontSize: '12px', color: '#D97706' }}>
                                                ? Flagged for revision
                                            </span>
                                        )}
                                    </span>
                                )}{' '}
                            </span>
                        );
                    }

                    const selected = isSelected(index) && !isExpanding;
                    const isExpandable = expandableIndices.has(index);
                    return (
                        <span
                            key={`o-${index}-${seg.text}`}
                            data-idx={index}
                            role={isExpandable ? 'button' : undefined}
                            tabIndex={isExpandable ? 0 : undefined}
                            aria-label={isExpandable ? `Expand ${seg.text}` : undefined}
                            onKeyDown={isExpandable ? (e) => {
                                if ((e.key === 'Enter' || e.key === ' ') && !isExpanding) {
                                    e.preventDefault();
                                    triggerExpansionForWord(index);
                                }
                            } : undefined}
                            style={{
                                display: 'inline',
                                cursor: isExpandable ? 'pointer' : 'default',
                                padding: '1px 1px',
                                borderRadius: '2px',
                                backgroundColor: selected ? 'rgba(255, 180, 140, 0.45)' : 'transparent',
                                borderBottom: isExpandable ? `1.5px dotted ${topicColor}55` : '1.5px solid transparent',
                                transition: 'background-color 0.15s ease',
                            }}
                        >
                            {seg.text}{' '}
                        </span>
                    );
                })}
                <span style={{ display: 'block', clear: 'both' }} />
            </div>

            {hasSelection && !isExpanding && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px', animation: 'expandFadeIn 0.2s ease both' }}>
                    <button type="button"
                        onClick={triggerExpansion}
                        style={{
                            background: topicColor, color: 'white', padding: '8px 20px',
                            borderRadius: '9999px', fontSize: '0.8125rem', fontWeight: 500,
                            border: 'none', cursor: 'pointer',
                            boxShadow: `0 3px 10px ${topicColor}30`,
                        }}
                    >
                        Expand Selection
                    </button>
                </div>
            )}

            {history.length > 0 && !isExpanding && !hasSelection && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px', animation: 'expandFadeIn 0.2s ease both' }}>
                    <button type="button"
                        onClick={handleUndo}
                        style={{
                            background: 'transparent', color: '#9CA3AF', padding: '6px 16px',
                            borderRadius: '9999px', fontSize: '0.8125rem', fontWeight: 500,
                            border: '1px solid #E5E7EB', cursor: 'pointer',
                        }}
                    >
                        Undo
                    </button>
                </div>
            )}

            <style>{`
                @keyframes expandBubbleReveal {
                    from { opacity: 0; transform: translateY(6px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes expandFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    );
}
