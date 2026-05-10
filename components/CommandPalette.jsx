'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getAllTopicDefs, getTopicForResource } from '@/lib/topics';
import { getAllResources } from '@/lib/resources';
import { theme, typography, borderRadius, spacing, transitions, glass, editorial as ED } from '@/lib/theme';

const t = theme.light;
const MAX_RESULTS = 10;

function getIsMac() {
    if (typeof navigator === 'undefined') return true;
    return /Mac|iPod|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
}

export default function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isMac, setIsMac] = useState(true);
    const inputRef = useRef(null);
    const listRef = useRef(null);
    const dialogRef = useRef(null);
    const router = useRouter();

    useEffect(() => {
        setIsMac(getIsMac());
    }, []);

    // Build searchable items once
    const items = useMemo(() => {
        const topics = getAllTopicDefs();
        const resources = getAllResources();
        const result = [];

        for (const resource of resources) {
            const parentTopic = getTopicForResource(resource.id);
            result.push({
                type: 'resource',
                id: resource.id,
                title: resource.title,
                description: resource.description,
                topicName: parentTopic?.name || resource.topic || '',
                topicColour: ED.accent,
                specRef: parentTopic?.specRef || '',
                href: `/${resource.id}`,
                keywords: resource.keywords || [],
            });
        }

        for (const topic of topics) {
            result.push({
                type: 'topic',
                id: topic.id,
                title: topic.name,
                description: topic.description,
                topicName: topic.name,
                topicColour: ED.accent,
                specRef: topic.specRef,
                href: `/topic/${topic.id}`,
                keywords: [],
            });
        }

        return result;
    }, []);

    // Filter results
    const results = useMemo(() => {
        if (!query.trim()) return [];
        const lower = query.toLowerCase();
        const matched = items.filter(item => {
            const hay = [
                item.title,
                item.description,
                item.topicName,
                item.specRef,
                ...item.keywords,
            ].join(' ').toLowerCase();
            return hay.includes(lower);
        });
        return matched.slice(0, MAX_RESULTS);
    }, [query, items]);

    // Reset selection when results change
    useEffect(() => {
        setSelectedIndex(0);
    }, [results]);

    // Scroll selected item into view
    useEffect(() => {
        if (!listRef.current) return;
        const selected = listRef.current.children[selectedIndex];
        if (selected) {
            selected.scrollIntoView({ block: 'nearest' });
        }
    }, [selectedIndex]);

    // Open/close handlers
    const openPalette = useCallback(() => {
        setOpen(true);
        setQuery('');
        setSelectedIndex(0);
    }, []);

    const closePalette = useCallback(() => {
        setOpen(false);
    }, []);

    // Keyboard shortcut: Cmd+K / Ctrl+K
    useEffect(() => {
        function handleKeyDown(e) {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                if (open) {
                    closePalette();
                } else {
                    openPalette();
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, openPalette, closePalette]);

    // Focus input when opening
    useEffect(() => {
        if (open) {
            // Small delay to allow animation start
            requestAnimationFrame(() => {
                inputRef.current?.focus();
            });
        }
    }, [open]);

    // Navigate to selected result
    const navigateTo = useCallback((item) => {
        closePalette();
        router.push(item.href);
    }, [closePalette, router]);

    // Keyboard navigation inside the dialog
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            closePalette();
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(i => (i < results.length - 1 ? i + 1 : i));
            return;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(i => (i > 0 ? i - 1 : 0));
            return;
        }
        if (e.key === 'Enter') {
            e.preventDefault();
            if (results[selectedIndex]) {
                navigateTo(results[selectedIndex]);
            }
            return;
        }
    }, [closePalette, results, selectedIndex, navigateTo]);

    // Focus trap
    const handleTab = useCallback((e) => {
        if (e.key === 'Tab') {
            e.preventDefault(); // trap focus inside
        }
    }, []);

    // Backdrop click
    const handleBackdropClick = useCallback((e) => {
        if (e.target === e.currentTarget) {
            closePalette();
        }
    }, [closePalette]);

    const shortcutHint = isMac ? '\u2318K' : 'Ctrl+K';

    return (
        <>
            {/* Search trigger button */}
            <button
                onClick={openPalette}
                aria-label="Search resources"
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: spacing[2],
                    padding: `${spacing[1]} ${spacing[3]}`,
                    background: t.bg.primary,
                    border: `1px solid ${t.border.subtle}`,
                    borderRadius: borderRadius.full,
                    cursor: 'pointer',
                    color: t.text.tertiary,
                    fontSize: typography.size.sm,
                    fontFamily: typography.fontFamily,
                    transition: `all ${transitions.fast} ${transitions.easing}`,
                    boxShadow: t.shadow.sm,
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.borderColor = t.border.medium;
                    e.currentTarget.style.boxShadow = t.shadow.md;
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.borderColor = t.border.subtle;
                    e.currentTarget.style.boxShadow = t.shadow.sm;
                }}
            >
                <SearchIcon size={14} />
                <span>Search</span>
                <kbd style={{
                    fontSize: typography.size.xs,
                    padding: `0 ${spacing[1]}`,
                    background: t.bg.secondary,
                    borderRadius: borderRadius.sm,
                    border: `1px solid ${t.border.subtle}`,
                    color: t.text.tertiary,
                    fontFamily: typography.fontFamily,
                    lineHeight: '1.6',
                }}>
                    {shortcutHint}
                </kbd>
            </button>

            {/* Modal overlay */}
            {open && (
                <div
                    onClick={handleBackdropClick}
                    onKeyDown={handleTab}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                        paddingTop: '15vh',
                        background: 'rgba(0, 0, 0, 0.4)',
                        backdropFilter: 'blur(4px)',
                        WebkitBackdropFilter: 'blur(4px)',
                        animation: `cmdPaletteFadeIn ${transitions.fast} ${transitions.easing} both`,
                    }}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Search resources"
                >
                    <div
                        ref={dialogRef}
                        onKeyDown={handleKeyDown}
                        style={{
                            width: '100%',
                            maxWidth: '520px',
                            margin: `0 ${spacing[4]}`,
                            background: t.bg.primary,
                            borderRadius: borderRadius.xl,
                            boxShadow: glass.shadow,
                            overflow: 'hidden',
                            animation: `cmdPaletteSlideIn ${transitions.normal} ${transitions.easing} both`,
                        }}
                    >
                        {/* Search input */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: `${spacing[4]} ${spacing[5]}`,
                            gap: spacing[3],
                            borderBottom: `1px solid ${t.border.subtle}`,
                        }}>
                            <SearchIcon size={18} color={t.text.tertiary} />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder={`Search resources... ${shortcutHint}`}
                                aria-label="Search resources"
                                autoComplete="off"
                                style={{
                                    flex: 1,
                                    border: 'none',
                                    outline: 'none',
                                    background: 'transparent',
                                    fontSize: typography.size.lg,
                                    fontFamily: typography.fontFamily,
                                    color: t.text.primary,
                                    lineHeight: typography.lineHeight.normal,
                                }}
                            />
                            <kbd
                                onClick={closePalette}
                                style={{
                                    fontSize: typography.size.xs,
                                    padding: `${spacing[0.5]} ${spacing[2]}`,
                                    background: t.bg.secondary,
                                    borderRadius: borderRadius.sm,
                                    border: `1px solid ${t.border.subtle}`,
                                    color: t.text.tertiary,
                                    fontFamily: typography.fontFamily,
                                    cursor: 'pointer',
                                    userSelect: 'none',
                                }}
                            >
                                esc
                            </kbd>
                        </div>

                        {/* Results area */}
                        <div style={{
                            maxHeight: '340px',
                            overflowY: 'auto',
                            padding: query.trim() ? spacing[2] : 0,
                        }}>
                            {query.trim() === '' ? (
                                <div style={{
                                    padding: `${spacing[6]} ${spacing[5]}`,
                                    textAlign: 'center',
                                    color: t.text.tertiary,
                                    fontSize: typography.size.sm,
                                }}>
                                    Start typing to search...
                                </div>
                            ) : results.length === 0 ? (
                                <div style={{
                                    padding: `${spacing[6]} ${spacing[5]}`,
                                    textAlign: 'center',
                                    color: t.text.tertiary,
                                    fontSize: typography.size.sm,
                                }}>
                                    No results found
                                </div>
                            ) : (
                                <ul
                                    ref={listRef}
                                    role="listbox"
                                    style={{
                                        listStyle: 'none',
                                        margin: 0,
                                        padding: 0,
                                    }}
                                >
                                    {results.map((item, i) => (
                                        <ResultItem
                                            key={`${item.type}-${item.id}`}
                                            item={item}
                                            isSelected={i === selectedIndex}
                                            onSelect={() => navigateTo(item)}
                                            onHover={() => setSelectedIndex(i)}
                                        />
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Footer hint */}
                        {results.length > 0 && (
                            <div style={{
                                padding: `${spacing[2]} ${spacing[5]}`,
                                borderTop: `1px solid ${t.border.subtle}`,
                                display: 'flex',
                                gap: spacing[4],
                                color: t.text.tertiary,
                                fontSize: typography.size.xs,
                            }}>
                                <span><kbd style={kbdStyle}>&uarr;</kbd><kbd style={kbdStyle}>&darr;</kbd> Navigate</span>
                                <span><kbd style={kbdStyle}>&crarr;</kbd> Open</span>
                                <span><kbd style={kbdStyle}>esc</kbd> Close</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Keyframe animations */}
            <style>{`
                @keyframes cmdPaletteFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes cmdPaletteSlideIn {
                    from { opacity: 0; transform: scale(0.96) translateY(-8px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </>
    );
}

const kbdStyle = {
    display: 'inline-block',
    padding: '0 4px',
    background: theme.light.bg.secondary,
    borderRadius: borderRadius.sm,
    border: `1px solid ${theme.light.border.subtle}`,
    fontSize: typography.size.xs,
    fontFamily: typography.fontFamily,
    lineHeight: '1.6',
    marginRight: '2px',
};

function ResultItem({ item, isSelected, onSelect, onHover }) {
    return (
        <li
            role="option"
            aria-selected={isSelected}
            onClick={onSelect}
            onMouseEnter={onHover}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing[3],
                padding: `${spacing[2]} ${spacing[3]}`,
                borderRadius: borderRadius.lg,
                cursor: 'pointer',
                background: isSelected ? t.bg.secondary : 'transparent',
                transition: `background ${transitions.fast} ${transitions.easing}`,
            }}
        >
            {/* Topic colour dot */}
            <span style={{
                width: '8px',
                height: '8px',
                borderRadius: borderRadius.full,
                background: item.topicColour,
                flexShrink: 0,
            }} />

            {/* Text content */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    fontSize: typography.size.sm,
                    fontWeight: typography.weight.medium,
                    color: t.text.primary,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                }}>
                    {item.title}
                </div>
                <div style={{
                    fontSize: typography.size.xs,
                    color: t.text.tertiary,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                }}>
                    {item.topicName}
                </div>
            </div>

            {/* Spec ref badge */}
            {item.specRef && (
                <span style={{
                    fontSize: typography.size.xs,
                    padding: `0 ${spacing[2]}`,
                    background: t.bg.tertiary,
                    color: t.text.tertiary,
                    borderRadius: borderRadius.full,
                    flexShrink: 0,
                    lineHeight: '1.8',
                }}>
                    {item.specRef}
                </span>
            )}

            {/* Type indicator */}
            {item.type === 'topic' && (
                <span style={{
                    fontSize: typography.size.xs,
                    color: t.text.tertiary,
                    flexShrink: 0,
                }}>
                    Topic
                </span>
            )}
        </li>
    );
}

function SearchIcon({ size = 16, color = 'currentColor' }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0 }}
        >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
        </svg>
    );
}
