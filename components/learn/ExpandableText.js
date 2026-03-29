'use client';

import { useRef, useState, useEffect } from 'react';
import { findExpansion, getExpandableWordIndices } from '@/lib/learn/expansions';

export default function ExpandableText({ text, topicColor = '#1a1a6e' }) {
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
    const containerRef = useRef(null);
    const expandIdRef = useRef(0);

    const hasSelection = selStart !== null && selEnd !== null && selStart !== selEnd;
    const selMin = selStart !== null && selEnd !== null ? Math.min(selStart, selEnd) : null;
    const selMax = selStart !== null && selEnd !== null ? Math.max(selStart, selEnd) : null;

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

    const triggerExpansion = async () => {
        if (selMin === null || selMax === null || isExpanding) return;
        setIsExpanding(true);
        setHistory((prev) => [...prev, segments]);

        const selectedText = getSelectedText();
        const id = `exp-${++expandIdRef.current}`;

        const newSegments = [
            ...segments.slice(0, selMin),
            { type: 'expanded', text: '', originalText: selectedText, id },
            ...segments.slice(selMax + 1),
        ];
        setSegments(newSegments);
        setExpandingId(id);
        setSelStart(null);
        setSelEnd(null);
        setOpenExpansions((prev) => new Set(prev).add(id));

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
        }
        // No API fallback on the live site — pre-generated only
        // If no match, show a gentle message
        if (!preGenerated) {
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

    const allWords = segments.map((s) => s.type === 'original' ? s.text : s.originalText);
    const expandableIndices = getExpandableWordIndices(allWords);

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

                        return (
                            <span key={`e-${seg.id}`} style={{ display: 'inline' }}>
                                <span
                                    data-idx={index}
                                    onClick={() => !isExpanding && toggleExpansion(seg.id)}
                                    style={{
                                        padding: '1px 6px',
                                        borderRadius: '4px',
                                        backgroundColor: isOpen ? topicColor + '18' : topicColor + '0C',
                                        color: topicColor,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        borderBottom: isOpen ? `2px solid ${topicColor}55` : '2px solid transparent',
                                    }}
                                >
                                    {seg.originalText}
                                </span>

                                {isOpen && (
                                    <span
                                        data-expansion-bubble
                                        style={{
                                            display: 'block',
                                            width: '100%',
                                            margin: '10px 0 14px 0',
                                            padding: '14px 16px',
                                            borderRadius: '10px',
                                            backgroundColor: topicColor + '08',
                                            borderLeft: `3px solid ${topicColor}40`,
                                            color: topicColor,
                                            fontSize: '0.9375rem',
                                            lineHeight: '1.7',
                                            opacity: 0,
                                            animation: 'expandBubbleReveal 0.45s ease forwards',
                                            animationDelay: '0.05s',
                                        }}
                                    >
                                        {isLoading && (
                                            <span style={{ color: topicColor, fontSize: '0.875rem' }}>
                                                Expanding...
                                            </span>
                                        )}
                                        {hasContent && (
                                            <span style={{ opacity: 0, animation: 'expandFadeIn 0.5s ease 0.15s forwards' }}>
                                                {seg.text}
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
                            style={{
                                display: 'inline',
                                cursor: 'pointer',
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
                    <button
                        onClick={triggerExpansion}
                        style={{
                            background: topicColor,
                            color: 'white',
                            padding: '8px 20px',
                            borderRadius: '9999px',
                            fontSize: '0.8125rem',
                            fontWeight: 500,
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: `0 3px 10px ${topicColor}30`,
                            transition: 'transform 0.15s ease',
                        }}
                    >
                        Expand Selection
                    </button>
                </div>
            )}

            {history.length > 0 && !isExpanding && !hasSelection && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px', animation: 'expandFadeIn 0.2s ease both' }}>
                    <button
                        onClick={handleUndo}
                        style={{
                            background: 'transparent',
                            color: '#9CA3AF',
                            padding: '6px 16px',
                            borderRadius: '9999px',
                            fontSize: '0.8125rem',
                            fontWeight: 500,
                            border: '1px solid #E5E7EB',
                            cursor: 'pointer',
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
