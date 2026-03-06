'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { theme, typography, spacing, borderRadius, transitions, glass } from '@/lib/theme';
import { findTerm, getQuizForTerm, getRandomTerm } from '@/lib/glossary';
import {
    Copy, ClipboardList, Highlighter, BookOpen, HelpCircle,
    Link2, ExternalLink, Maximize, Minimize, ArrowLeft,
    X, Check, ArrowRight, NotebookPen, Eye,
} from 'lucide-react';

const ICON_SIZE = 15;

const ContextMenuContext = createContext(null);

// Hook for resources to register custom menu items
export function useContextMenu() {
    const ctx = useContext(ContextMenuContext);
    if (!ctx) return { registerItems: () => {}, unregisterItems: () => {} };
    return ctx;
}

// Provider — wrap layout with this
export function ContextMenuProvider({ children }) {
    const [menu, setMenu] = useState({ open: false, x: 0, y: 0, items: [] });
    const [customItems, setCustomItems] = useState([]);
    const [popup, setPopup] = useState({ type: null, data: null, x: 0, y: 0 });
    const menuRef = useRef(null);
    const popupRef = useRef(null);
    const t = theme.light;

    const registerItems = useCallback((items) => setCustomItems(items), []);
    const unregisterItems = useCallback(() => setCustomItems([]), []);

    const closeMenu = useCallback(() => {
        setMenu(prev => ({ ...prev, open: false }));
    }, []);

    const closePopup = useCallback(() => {
        setPopup({ type: null, data: null, x: 0, y: 0 });
    }, []);

    // Detect a technical term from click context
    const detectTerm = useCallback((e) => {
        // 1. Check selected text
        const selection = window.getSelection()?.toString().trim();
        if (selection && selection.length < 60) {
            const found = findTerm(selection);
            if (found) return found;
        }

        // 2. Check data-term attribute on element or ancestors
        const termEl = e.target.closest('[data-term]');
        if (termEl) {
            const found = findTerm(termEl.dataset.term);
            if (found) return found;
        }

        // 3. Check the text content of the clicked element (for short text like labels)
        const text = e.target.textContent?.trim();
        if (text && text.length < 40) {
            const found = findTerm(text);
            if (found) return found;
        }

        return null;
    }, []);

    // Build items based on what was right-clicked
    const buildMenuItems = useCallback((e) => {
        const items = [];
        const selection = window.getSelection()?.toString().trim();
        const detectedTerm = detectTerm(e);

        // --- Context-aware items ---

        // Selected text actions
        if (selection) {
            items.push({
                id: 'copy',
                label: 'Copy',
                icon: <Copy size={ICON_SIZE} />,
                shortcut: '⌘C',
                action: () => navigator.clipboard.writeText(selection),
            });
            items.push({
                id: 'copy-notes',
                label: 'Copy to Notes',
                icon: <ClipboardList size={ICON_SIZE} />,
                action: () => {
                    const formatted = `- ${selection}`;
                    navigator.clipboard.writeText(formatted);
                    showToast('Copied to notes format');
                },
            });
            items.push({
                id: 'highlight',
                label: 'Highlight',
                icon: <Highlighter size={ICON_SIZE} />,
                action: () => highlightSelection(),
            });
            items.push({ id: 'sep-1', separator: true });
        }

        // Define This Term — if a glossary term was detected
        if (detectedTerm) {
            items.push({
                id: 'define',
                label: `Define: ${detectedTerm.term}`,
                icon: <BookOpen size={ICON_SIZE} />,
                action: () => {
                    setPopup({
                        type: 'definition',
                        data: detectedTerm,
                        x: menu.x || e.clientX,
                        y: menu.y || e.clientY,
                    });
                },
            });
            items.push({
                id: 'quiz-term',
                label: `Quiz: ${detectedTerm.term}`,
                icon: <HelpCircle size={ICON_SIZE} />,
                action: () => {
                    const quiz = getQuizForTerm(detectedTerm);
                    setPopup({
                        type: 'quiz',
                        data: { ...quiz, termEntry: detectedTerm },
                        x: menu.x || e.clientX,
                        y: menu.y || e.clientY,
                    });
                },
            });
            items.push({ id: 'sep-define', separator: true });
        }

        // Quick Quiz — always available (random term)
        if (!detectedTerm) {
            items.push({
                id: 'quiz-random',
                label: 'Quick Quiz',
                icon: <HelpCircle size={ICON_SIZE} />,
                action: () => {
                    const randomEntry = getRandomTerm();
                    const quiz = getQuizForTerm(randomEntry);
                    setPopup({
                        type: 'quiz',
                        data: { ...quiz, termEntry: randomEntry },
                        x: e.clientX,
                        y: e.clientY,
                    });
                },
            });
            items.push({ id: 'sep-quiz', separator: true });
        }

        // If right-clicked on a heading
        const heading = e.target.closest('h1, h2, h3, h4');
        if (heading) {
            items.push({
                id: 'copy-heading',
                label: 'Copy Section Title',
                icon: <Link2 size={ICON_SIZE} />,
                action: () => {
                    navigator.clipboard.writeText(heading.textContent.trim());
                    showToast('Section title copied');
                },
            });
        }

        // If right-clicked on an image
        const img = e.target.closest('img');
        if (img) {
            items.push({
                id: 'open-image',
                label: 'Open Image in New Tab',
                icon: <ExternalLink size={ICON_SIZE} />,
                action: () => window.open(img.src, '_blank'),
            });
        }

        // Resource-specific custom items
        if (customItems.length > 0) {
            if (items.length > 0) items.push({ id: 'sep-custom', separator: true });
            items.push(...customItems.map(item => ({
                ...item,
                action: () => item.action(e.target),
            })));
        }

        // --- Global items ---
        if (items.length > 0) items.push({ id: 'sep-global', separator: true });

        items.push({
            id: 'fullscreen',
            label: document.fullscreenElement ? 'Exit Full Screen' : 'Full Screen',
            icon: document.fullscreenElement ? <Minimize size={ICON_SIZE} /> : <Maximize size={ICON_SIZE} />,
            action: () => {
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                } else {
                    document.documentElement.requestFullscreen();
                }
            },
        });

        items.push({
            id: 'back',
            label: 'Back to Resources',
            icon: <ArrowLeft size={ICON_SIZE} />,
            action: () => { window.location.href = '/'; },
        });

        return items;
    }, [customItems, detectTerm, menu.x, menu.y]);

    // Handle right-click
    const handleContextMenu = useCallback((e) => {
        e.preventDefault();

        // Store coordinates before building items (they reference menu.x/y)
        const x = e.clientX;
        const y = e.clientY;

        // Build items need access to coordinates
        const tempMenu = { x, y };
        const items = buildMenuItems(e);

        // Position within viewport
        const menuWidth = 260;
        const menuHeight = items.length * 38;
        let finalX = x;
        let finalY = y;

        if (finalX + menuWidth > window.innerWidth) finalX = window.innerWidth - menuWidth - 8;
        if (finalY + menuHeight > window.innerHeight) finalY = window.innerHeight - menuHeight - 8;
        if (finalX < 8) finalX = 8;
        if (finalY < 8) finalY = 8;

        setMenu({ open: true, x: finalX, y: finalY, items });
    }, [buildMenuItems]);

    // Close menu on click/scroll/escape
    useEffect(() => {
        if (!menu.open) return;

        const handleClose = () => closeMenu();
        const handleEscape = (e) => { if (e.key === 'Escape') closeMenu(); };

        document.addEventListener('click', handleClose);
        document.addEventListener('scroll', handleClose, true);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('click', handleClose);
            document.removeEventListener('scroll', handleClose, true);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [menu.open, closeMenu]);

    // Close popup on escape
    useEffect(() => {
        if (!popup.type) return;
        const handleEscape = (e) => { if (e.key === 'Escape') closePopup(); };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [popup.type, closePopup]);

    // Keyboard nav in menu
    useEffect(() => {
        if (!menu.open || !menuRef.current) return;

        const buttons = menuRef.current.querySelectorAll('button[data-menu-item]');
        if (buttons.length === 0) return;

        let focusIndex = 0;
        buttons[0]?.focus();

        const handleKeyDown = (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                focusIndex = (focusIndex + 1) % buttons.length;
                buttons[focusIndex]?.focus();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                focusIndex = (focusIndex - 1 + buttons.length) % buttons.length;
                buttons[focusIndex]?.focus();
            }
        };

        menuRef.current.addEventListener('keydown', handleKeyDown);
        const ref = menuRef.current;
        return () => ref?.removeEventListener('keydown', handleKeyDown);
    }, [menu.open, menu.items]);

    return (
        <ContextMenuContext.Provider value={{ registerItems, unregisterItems }}>
            <div onContextMenu={handleContextMenu} style={{ minHeight: '100vh' }}>
                {children}
            </div>

            {/* Context Menu */}
            {menu.open && (
                <div
                    ref={menuRef}
                    role="menu"
                    style={{
                        position: 'fixed',
                        top: menu.y,
                        left: menu.x,
                        zIndex: 9999,
                        minWidth: '220px',
                        maxWidth: '300px',
                        background: glass.bg,
                        border: `1px solid ${glass.border}`,
                        borderRadius: borderRadius.xl,
                        boxShadow: glass.shadowHover,
                        padding: `${spacing[1]} 0`,
                        animation: 'contextMenuIn 120ms ease-out',
                        backdropFilter: 'blur(20px)',
                        overflow: 'hidden',
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {menu.items.map((item) =>
                        item.separator ? (
                            <div
                                key={item.id}
                                style={{
                                    height: '1px',
                                    background: t.border.subtle,
                                    margin: `${spacing[1]} ${spacing[3]}`,
                                }}
                            />
                        ) : (
                            <MenuItem key={item.id} item={item} onClose={closeMenu} theme={t} />
                        )
                    )}
                </div>
            )}

            {/* Definition Popup */}
            {popup.type === 'definition' && (
                <DefinitionPopup
                    ref={popupRef}
                    entry={popup.data}
                    x={popup.x}
                    y={popup.y}
                    onClose={closePopup}
                    onQuiz={() => {
                        const quiz = getQuizForTerm(popup.data);
                        setPopup({
                            type: 'quiz',
                            data: { ...quiz, termEntry: popup.data },
                            x: popup.x,
                            y: popup.y,
                        });
                    }}
                />
            )}

            {/* Quiz Popup */}
            {popup.type === 'quiz' && (
                <QuizPopup
                    ref={popupRef}
                    data={popup.data}
                    x={popup.x}
                    y={popup.y}
                    onClose={closePopup}
                    onNext={() => {
                        const next = getRandomTerm(popup.data.termEntry?.term);
                        const quiz = getQuizForTerm(next);
                        setPopup({
                            type: 'quiz',
                            data: { ...quiz, termEntry: next },
                            x: popup.x,
                            y: popup.y,
                        });
                    }}
                />
            )}
        </ContextMenuContext.Provider>
    );
}

// ============ Menu Item ============

function MenuItem({ item, onClose, theme: t }) {
    const [hovered, setHovered] = useState(false);

    return (
        <button
            data-menu-item
            role="menuitem"
            onClick={() => {
                item.action();
                onClose();
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                padding: `${spacing[2]} ${spacing[4]}`,
                background: hovered ? glass.bgHover : 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: typography.size.sm,
                color: t.text.primary,
                fontFamily: typography.fontFamily,
                textAlign: 'left',
                gap: spacing[3],
                transition: `background ${transitions.fast}`,
                outline: 'none',
                lineHeight: typography.lineHeight.normal,
            }}
        >
            <span style={{ width: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: t.text.tertiary }}>
                {item.icon}
            </span>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.label}
            </span>
            {item.shortcut && (
                <span style={{
                    color: t.text.tertiary,
                    fontSize: typography.size.xs,
                    fontFamily: typography.fontFamilyMono,
                    flexShrink: 0,
                }}>
                    {item.shortcut}
                </span>
            )}
        </button>
    );
}

// ============ Definition Popup ============

import { forwardRef } from 'react';

const DefinitionPopup = forwardRef(function DefinitionPopup({ entry, x, y, onClose, onQuiz }, ref) {
    const t = theme.light;

    // Position popup centrally, offset from click point
    const popupWidth = 360;
    let posX = Math.min(x, window.innerWidth - popupWidth - 16);
    let posY = y + 12;
    if (posY + 300 > window.innerHeight) posY = y - 280;
    if (posX < 16) posX = 16;

    const topicColors = {
        '1.3': { bg: '#EDE9FE', text: '#6D28D9', label: '1.3 Synthesis' },
        '1.6': { bg: '#DBEAFE', text: '#1D4ED8', label: '1.6 Acoustics' },
        '1.7': { bg: '#FEF3C7', text: '#B45309', label: '1.7 Effects' },
        '1.11': { bg: '#D1FAE5', text: '#047857', label: '1.11 EQ' },
        '2.5': { bg: '#FFE4E6', text: '#BE123C', label: '2.5 Numeracy' },
    };
    const topicStyle = topicColors[entry.topic] || { bg: t.bg.tertiary, text: t.text.secondary, label: entry.topic };

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 9998,
                    background: 'rgba(0,0,0,0.08)',
                }}
            />
            {/* Card */}
            <div
                ref={ref}
                style={{
                    position: 'fixed',
                    left: posX,
                    top: posY,
                    width: popupWidth,
                    zIndex: 9999,
                    background: glass.bg,
                    backdropFilter: 'blur(' + glass.blur + ')',
                    WebkitBackdropFilter: 'blur(' + glass.blur + ')',
                    border: `1px solid ${glass.border}`,
                    borderRadius: borderRadius['2xl'],
                    boxShadow: glass.shadowHover,
                    padding: spacing[6],
                    animation: 'contextMenuIn 150ms ease-out',
                    fontFamily: typography.fontFamily,
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing[3] }}>
                    <div>
                        <span style={{
                            display: 'inline-block',
                            padding: `${spacing[0.5]} ${spacing[2]}`,
                            background: topicStyle.bg,
                            color: topicStyle.text,
                            borderRadius: borderRadius.full,
                            fontSize: typography.size.xs,
                            fontWeight: typography.weight.medium,
                            marginBottom: spacing[2],
                        }}>
                            {topicStyle.label}
                        </span>
                        <h3 style={{
                            fontSize: typography.size.lg,
                            fontWeight: typography.weight.bold,
                            color: t.text.primary,
                            margin: 0,
                            lineHeight: typography.lineHeight.tight,
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing[2],
                        }}>
                            <BookOpen size={18} style={{ color: t.text.tertiary, flexShrink: 0 }} />
                            {entry.term}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: t.text.tertiary,
                            fontSize: '18px',
                            padding: spacing[1],
                            lineHeight: 1,
                        }}
                        aria-label="Close"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Definition */}
                <p style={{
                    color: t.text.secondary,
                    fontSize: typography.size.sm,
                    lineHeight: typography.lineHeight.relaxed,
                    margin: `0 0 ${spacing[4]} 0`,
                }}>
                    {entry.definition}
                </p>

                {/* Actions */}
                <div style={{ display: 'flex', gap: spacing[2], flexWrap: 'wrap' }}>
                    <PopupButton
                        icon={<NotebookPen size={13} />}
                        label="Copy to Notes"
                        onClick={() => {
                            navigator.clipboard.writeText(`**${entry.term}**: ${entry.definition}`);
                            showToast('Definition copied to notes');
                            onClose();
                        }}
                    />
                    <PopupButton
                        icon={<HelpCircle size={13} />}
                        label="Quiz Me"
                        primary
                        onClick={onQuiz}
                    />
                </div>
            </div>
        </>
    );
});

// ============ Quiz Popup ============

const QuizPopup = forwardRef(function QuizPopup({ data, x, y, onClose, onNext }, ref) {
    const t = theme.light;
    const [revealed, setRevealed] = useState(false);
    const [selected, setSelected] = useState(null);
    const [mode, setMode] = useState('mc'); // 'mc' = multiple choice, 'recall' = open recall

    const popupWidth = 400;
    let posX = Math.min(x, window.innerWidth - popupWidth - 16);
    let posY = y + 12;
    if (posY + 400 > window.innerHeight) posY = Math.max(16, y - 400);
    if (posX < 16) posX = 16;

    const handleNext = () => {
        setRevealed(false);
        setSelected(null);
        onNext();
    };

    return (
        <>
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 9998,
                    background: 'rgba(0,0,0,0.08)',
                }}
            />
            <div
                ref={ref}
                style={{
                    position: 'fixed',
                    left: posX,
                    top: posY,
                    width: popupWidth,
                    zIndex: 9999,
                    background: glass.bg,
                    backdropFilter: 'blur(' + glass.blur + ')',
                    WebkitBackdropFilter: 'blur(' + glass.blur + ')',
                    border: `1px solid ${glass.border}`,
                    borderRadius: borderRadius['2xl'],
                    boxShadow: glass.shadowHover,
                    padding: spacing[6],
                    animation: 'contextMenuIn 150ms ease-out',
                    fontFamily: typography.fontFamily,
                    maxHeight: '80vh',
                    overflowY: 'auto',
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[4] }}>
                    <h3 style={{
                        fontSize: typography.size.lg,
                        fontWeight: typography.weight.bold,
                        color: t.text.primary,
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing[2],
                    }}>
                        <HelpCircle size={18} style={{ color: t.text.tertiary }} />
                        Quick Quiz
                    </h3>
                    <div style={{ display: 'flex', gap: spacing[1], alignItems: 'center' }}>
                        {/* Mode toggle */}
                        <button
                            onClick={() => { setMode('mc'); setRevealed(false); setSelected(null); }}
                            style={{
                                padding: `${spacing[1]} ${spacing[2]}`,
                                borderRadius: borderRadius.md,
                                border: 'none',
                                fontSize: typography.size.xs,
                                fontFamily: typography.fontFamily,
                                cursor: 'pointer',
                                background: mode === 'mc' ? glass.bgPrimary : 'rgba(255, 255, 255, 0.4)',
                                color: mode === 'mc' ? t.text.inverse : t.text.secondary,
                                backdropFilter: mode === 'mc' ? 'blur(8px)' : 'none',
                                boxShadow: mode === 'mc' ? glass.shadowPrimary : 'none',
                                transition: `all ${transitions.fast}`,
                            }}
                        >
                            Multiple Choice
                        </button>
                        <button
                            onClick={() => { setMode('recall'); setRevealed(false); setSelected(null); }}
                            style={{
                                padding: `${spacing[1]} ${spacing[2]}`,
                                borderRadius: borderRadius.md,
                                border: 'none',
                                fontSize: typography.size.xs,
                                fontFamily: typography.fontFamily,
                                cursor: 'pointer',
                                background: mode === 'recall' ? glass.bgPrimary : 'rgba(255, 255, 255, 0.4)',
                                color: mode === 'recall' ? t.text.inverse : t.text.secondary,
                                backdropFilter: mode === 'recall' ? 'blur(8px)' : 'none',
                                boxShadow: mode === 'recall' ? glass.shadowPrimary : 'none',
                                transition: `all ${transitions.fast}`,
                            }}
                        >
                            Open Recall
                        </button>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: t.text.tertiary,
                                fontSize: '18px',
                                padding: spacing[1],
                                lineHeight: 1,
                                marginLeft: spacing[2],
                            }}
                            aria-label="Close"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Question */}
                <p style={{
                    fontSize: typography.size.base,
                    fontWeight: typography.weight.semibold,
                    color: t.text.primary,
                    marginBottom: spacing[4],
                    lineHeight: typography.lineHeight.snug,
                }}>
                    {data.question}
                </p>

                {/* Multiple choice mode */}
                {mode === 'mc' && data.options && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2], marginBottom: spacing[4] }}>
                        {data.options.map((opt, i) => {
                            const isSelected = selected === i;
                            const showResult = selected !== null;
                            let optBg = glass.bg;
                            let optBorder = t.border.subtle;

                            if (showResult) {
                                if (opt.correct) {
                                    optBg = '#D1FAE5';
                                    optBorder = '#059669';
                                } else if (isSelected && !opt.correct) {
                                    optBg = '#FEE2E2';
                                    optBorder = '#DC2626';
                                }
                            } else if (isSelected) {
                                optBg = '#EDE9FE';
                                optBorder = t.accent.primary;
                            }

                            return (
                                <button
                                    key={i}
                                    onClick={() => { if (selected === null) setSelected(i); }}
                                    style={{
                                        padding: `${spacing[3]} ${spacing[4]}`,
                                        background: optBg,
                                        border: `1.5px solid ${optBorder}`,
                                        borderRadius: borderRadius.lg,
                                        cursor: selected === null ? 'pointer' : 'default',
                                        textAlign: 'left',
                                        fontSize: typography.size.sm,
                                        color: t.text.primary,
                                        fontFamily: typography.fontFamily,
                                        lineHeight: typography.lineHeight.normal,
                                        backdropFilter: 'blur(8px)',
                                        transition: `all ${transitions.fast}`,
                                    }}
                                >
                                    <span style={{ fontWeight: typography.weight.medium, marginRight: spacing[2] }}>
                                        {String.fromCharCode(65 + i)}.
                                    </span>
                                    {opt.definition}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Open recall mode */}
                {mode === 'recall' && (
                    <div style={{ marginBottom: spacing[4] }}>
                        <p style={{
                            color: t.text.tertiary,
                            fontSize: typography.size.sm,
                            fontStyle: 'italic',
                            marginBottom: spacing[3],
                        }}>
                            Think of your answer, then reveal to check...
                        </p>

                        {!revealed ? (
                            <button
                                onClick={() => setRevealed(true)}
                                style={{
                                    width: '100%',
                                    padding: `${spacing[3]} ${spacing[4]}`,
                                    background: glass.bgPrimary,
                                    color: t.text.inverse,
                                    border: 'none',
                                    borderRadius: borderRadius.lg,
                                    cursor: 'pointer',
                                    fontSize: typography.size.sm,
                                    fontWeight: typography.weight.semibold,
                                    fontFamily: typography.fontFamily,
                                    backdropFilter: 'blur(8px)',
                                    boxShadow: glass.shadowPrimary,
                                    transition: `all ${transitions.fast}`,
                                }}
                            >
                                Reveal Answer
                            </button>
                        ) : (
                            <div style={{
                                padding: spacing[4],
                                background: '#D1FAE5',
                                border: `1.5px solid #059669`,
                                borderRadius: borderRadius.lg,
                                animation: 'contextMenuIn 150ms ease-out',
                            }}>
                                <p style={{
                                    color: t.text.primary,
                                    fontSize: typography.size.sm,
                                    lineHeight: typography.lineHeight.relaxed,
                                    margin: 0,
                                }}>
                                    {data.correctDefinition}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Feedback after answering */}
                {(selected !== null || revealed) && (
                    <div style={{ display: 'flex', gap: spacing[2], justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{
                            fontSize: typography.size.xs,
                            color: t.text.tertiary,
                            margin: 0,
                        }}>
                            {selected !== null && data.options[selected]?.correct && '✓ Correct!'}
                            {selected !== null && !data.options[selected]?.correct && '✗ Not quite — see the green option'}
                            {mode === 'recall' && revealed && 'How did you do?'}
                        </p>
                        <div style={{ display: 'flex', gap: spacing[2] }}>
                            <PopupButton icon={<ArrowRight size={13} />} label="Next Question" primary onClick={handleNext} />
                        </div>
                    </div>
                )}
            </div>
        </>
    );
});

// ============ Shared UI ============

function PopupButton({ label, onClick, primary, icon }) {
    const [hovered, setHovered] = useState(false);
    const t = theme.light;

    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: spacing[1],
                padding: `${spacing[2]} ${spacing[3]}`,
                background: primary
                    ? (hovered ? glass.bgPrimaryHover : glass.bgPrimary)
                    : (hovered ? glass.bgHover : glass.bg),
                color: primary ? t.text.inverse : t.text.primary,
                border: 'none',
                borderRadius: borderRadius.lg,
                cursor: 'pointer',
                fontSize: typography.size.xs,
                fontWeight: typography.weight.medium,
                fontFamily: typography.fontFamily,
                backdropFilter: 'blur(8px)',
                boxShadow: primary ? glass.shadowPrimary : glass.shadow,
                transition: `all ${transitions.fast}`,
            }}
        >
            {icon}
            {label}
        </button>
    );
}

function showToast(message) {
    const existing = document.getElementById('ctx-toast');
    if (existing) existing.remove();

    const t = theme.light;
    const toast = document.createElement('div');
    toast.id = 'ctx-toast';
    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: t.text.primary,
        color: t.text.inverse,
        padding: '10px 20px',
        borderRadius: '8px',
        fontSize: '14px',
        fontFamily: typography.fontFamily,
        zIndex: '10000',
        animation: 'contextMenuIn 150ms ease-out',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    });
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 300ms';
        setTimeout(() => toast.remove(), 300);
    }, 1800);
}

function highlightSelection() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const mark = document.createElement('mark');
    mark.style.background = '#FEF3C7';
    mark.style.borderRadius = '2px';
    mark.style.padding = '0 2px';

    try {
        range.surroundContents(mark);
        selection.removeAllRanges();
        showToast('Text highlighted');
    } catch {
        navigator.clipboard.writeText(selection.toString());
        showToast('Copied (highlight not possible across elements)');
    }
}
