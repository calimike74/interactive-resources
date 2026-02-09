'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { theme, typography, spacing, borderRadius, transitions } from '@/lib/theme';

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
    const menuRef = useRef(null);
    const t = theme.light;

    // Resources can register their own context menu items
    const registerItems = useCallback((items) => {
        setCustomItems(items);
    }, []);

    const unregisterItems = useCallback(() => {
        setCustomItems([]);
    }, []);

    const close = useCallback(() => {
        setMenu(prev => ({ ...prev, open: false }));
    }, []);

    // Build items based on what was right-clicked
    const buildMenuItems = useCallback((e) => {
        const items = [];
        const selection = window.getSelection()?.toString().trim();

        // --- Context-aware items ---

        // Selected text actions
        if (selection) {
            items.push({
                id: 'copy',
                label: 'Copy',
                icon: '📋',
                shortcut: '⌘C',
                action: () => navigator.clipboard.writeText(selection),
            });
            items.push({
                id: 'copy-notes',
                label: 'Copy to Notes',
                icon: '📝',
                action: () => {
                    const formatted = `- ${selection}`;
                    navigator.clipboard.writeText(formatted);
                    showToast('Copied to notes format');
                },
            });
            items.push({
                id: 'highlight',
                label: 'Highlight',
                icon: '🖍️',
                action: () => {
                    highlightSelection();
                },
            });
            items.push({ id: 'sep-1', separator: true });
        }

        // If right-clicked on a heading, offer copy link
        const heading = e.target.closest('h1, h2, h3, h4');
        if (heading) {
            items.push({
                id: 'copy-heading',
                label: 'Copy Section Title',
                icon: '🔗',
                action: () => {
                    navigator.clipboard.writeText(heading.textContent.trim());
                    showToast('Section title copied');
                },
            });
        }

        // If right-clicked on an image or SVG
        const img = e.target.closest('img, svg');
        if (img && img.tagName === 'IMG') {
            items.push({
                id: 'open-image',
                label: 'Open Image in New Tab',
                icon: '🖼️',
                action: () => window.open(img.src, '_blank'),
            });
        }

        // Resource-specific custom items from the active resource
        if (customItems.length > 0) {
            if (items.length > 0) items.push({ id: 'sep-custom', separator: true });
            items.push(...customItems.map(item => ({
                ...item,
                // Let the custom item's action access the event target
                action: () => item.action(e.target),
            })));
        }

        // --- Global items (always present) ---
        if (items.length > 0) items.push({ id: 'sep-global', separator: true });

        items.push({
            id: 'print',
            label: 'Print Resource',
            icon: '🖨️',
            shortcut: '⌘P',
            action: () => window.print(),
        });

        items.push({
            id: 'fullscreen',
            label: document.fullscreenElement ? 'Exit Full Screen' : 'Full Screen',
            icon: '⛶',
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
            icon: '←',
            action: () => { window.location.href = '/'; },
        });

        return items;
    }, [customItems]);

    // Handle right-click
    const handleContextMenu = useCallback((e) => {
        e.preventDefault();
        const items = buildMenuItems(e);

        // Position menu within viewport
        const menuWidth = 220;
        const menuHeight = items.length * 38;
        let x = e.clientX;
        let y = e.clientY;

        if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 8;
        if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight - 8;
        if (x < 8) x = 8;
        if (y < 8) y = 8;

        setMenu({ open: true, x, y, items });
    }, [buildMenuItems]);

    // Close on outside click, Escape, or scroll
    useEffect(() => {
        if (!menu.open) return;

        const handleClose = () => close();
        const handleEscape = (e) => { if (e.key === 'Escape') close(); };

        document.addEventListener('click', handleClose);
        document.addEventListener('scroll', handleClose, true);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('click', handleClose);
            document.removeEventListener('scroll', handleClose, true);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [menu.open, close]);

    // Keyboard navigation within menu
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
        return () => menuRef.current?.removeEventListener('keydown', handleKeyDown);
    }, [menu.open, menu.items]);

    return (
        <ContextMenuContext.Provider value={{ registerItems, unregisterItems }}>
            <div onContextMenu={handleContextMenu} style={{ minHeight: '100vh' }}>
                {children}
            </div>

            {/* The floating menu */}
            {menu.open && (
                <div
                    ref={menuRef}
                    role="menu"
                    style={{
                        position: 'fixed',
                        top: menu.y,
                        left: menu.x,
                        zIndex: 9999,
                        minWidth: '200px',
                        background: t.bg.elevated,
                        border: `1px solid ${t.border.medium}`,
                        borderRadius: borderRadius.xl,
                        boxShadow: '0 12px 32px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08)',
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
                            <MenuItem key={item.id} item={item} onClose={close} theme={t} />
                        )
                    )}
                </div>
            )}
        </ContextMenuContext.Provider>
    );
}

// Individual menu item
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
                background: hovered ? t.bg.secondary : 'transparent',
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
            <span style={{
                width: '20px',
                textAlign: 'center',
                fontSize: '14px',
                flexShrink: 0,
            }}>
                {item.icon}
            </span>
            <span style={{ flex: 1 }}>{item.label}</span>
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

// Toast notification (non-blocking feedback)
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

// Highlight selected text with a yellow background
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
        // If selection spans multiple elements, copy instead
        navigator.clipboard.writeText(selection.toString());
        showToast('Copied (highlight not possible across elements)');
    }
}
