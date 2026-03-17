'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { theme, borderRadius, transitions } from '@/lib/theme';

/**
 * Click-triggered popover with portal rendering and viewport clamping.
 * Ported from grades-dashboard, adapted for inline styles + theme.js tokens.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.trigger - Element that triggers the popover
 * @param {React.ReactNode} props.children - Popover content
 * @param {'top'|'bottom'|'right'|'left'} [props.position='top'] - Position relative to trigger
 */
export default function Popover({ trigger, children, position = 'top' }) {
    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const [mounted, setMounted] = useState(false);
    const triggerRef = useRef(null);
    const popoverRef = useRef(null);

    useEffect(() => { setMounted(true); }, []);

    const updatePosition = useCallback(() => {
        const triggerEl = triggerRef.current;
        const popoverEl = popoverRef.current;
        if (!triggerEl || !popoverEl) return;

        const tr = triggerEl.getBoundingClientRect();
        const pr = popoverEl.getBoundingClientRect();
        const gap = 8;

        let top, left;

        switch (position) {
            case 'bottom':
                top = tr.bottom + gap + window.scrollY;
                left = tr.left + tr.width / 2 - pr.width / 2 + window.scrollX;
                break;
            case 'left':
                top = tr.top + tr.height / 2 - pr.height / 2 + window.scrollY;
                left = tr.left - pr.width - gap + window.scrollX;
                break;
            case 'right':
                top = tr.top + tr.height / 2 - pr.height / 2 + window.scrollY;
                left = tr.right + gap + window.scrollX;
                break;
            case 'top':
            default:
                top = tr.top - pr.height - gap + window.scrollY;
                left = tr.left + tr.width / 2 - pr.width / 2 + window.scrollX;
                break;
        }

        // Clamp to viewport
        const vw = window.innerWidth;
        if (left < 8) left = 8;
        if (left + pr.width > vw - 8) left = vw - pr.width - 8;

        setCoords({ top, left });
    }, [position]);

    const handleToggle = () => setOpen(prev => !prev);

    // Update position when opening
    useEffect(() => {
        if (open) requestAnimationFrame(updatePosition);
    }, [open, updatePosition]);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open]);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const onClick = (e) => {
            if (
                triggerRef.current && !triggerRef.current.contains(e.target) &&
                popoverRef.current && !popoverRef.current.contains(e.target)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, [open]);

    const t = theme.light;
    const arrowSize = 6;

    const arrowStyle = (() => {
        const base = { position: 'absolute', width: 0, height: 0 };
        const color = t.bg.elevated;
        switch (position) {
            case 'bottom':
                return { ...base, top: -arrowSize, left: '50%', transform: 'translateX(-50%)',
                    borderLeft: `${arrowSize}px solid transparent`, borderRight: `${arrowSize}px solid transparent`,
                    borderBottom: `${arrowSize}px solid ${color}` };
            case 'left':
                return { ...base, right: -arrowSize, top: '50%', transform: 'translateY(-50%)',
                    borderTop: `${arrowSize}px solid transparent`, borderBottom: `${arrowSize}px solid transparent`,
                    borderLeft: `${arrowSize}px solid ${color}` };
            case 'right':
                return { ...base, left: -arrowSize, top: '50%', transform: 'translateY(-50%)',
                    borderTop: `${arrowSize}px solid transparent`, borderBottom: `${arrowSize}px solid transparent`,
                    borderRight: `${arrowSize}px solid ${color}` };
            case 'top':
            default:
                return { ...base, bottom: -arrowSize, left: '50%', transform: 'translateX(-50%)',
                    borderLeft: `${arrowSize}px solid transparent`, borderRight: `${arrowSize}px solid transparent`,
                    borderTop: `${arrowSize}px solid ${color}` };
        }
    })();

    const translateOrigin = {
        top: 'translateY(4px)',
        bottom: 'translateY(-4px)',
        left: 'translateX(4px)',
        right: 'translateX(-4px)',
    };

    const popoverContent = open ? (
        <div
            ref={popoverRef}
            role="dialog"
            aria-modal="false"
            style={{
                position: 'absolute',
                top: coords.top,
                left: coords.left,
                zIndex: 50,
                maxWidth: 320,
                backgroundColor: t.bg.elevated,
                border: `1px solid ${t.border.medium}`,
                borderRadius: borderRadius.xl,
                boxShadow: t.shadow.lg,
                overflow: 'hidden',
                opacity: coords.top === 0 && coords.left === 0 ? 0 : 1,
                transform: coords.top === 0 && coords.left === 0 ? translateOrigin[position] : 'none',
                transition: `opacity ${transitions.normal} ${transitions.easing}, transform ${transitions.normal} ${transitions.easing}`,
            }}
        >
            <div style={arrowStyle} />
            {children}
        </div>
    ) : null;

    return (
        <>
            <button
                ref={triggerRef}
                onClick={handleToggle}
                aria-expanded={open}
                aria-haspopup="dialog"
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
            >
                {trigger}
            </button>
            {mounted && popoverContent && createPortal(popoverContent, document.body)}
        </>
    );
}
