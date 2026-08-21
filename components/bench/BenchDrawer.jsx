'use client';

import { useEffect, useRef } from 'react';
import styles from './bench.module.css';

// The right-edge drawer Mike asked for everywhere (1.12 note, on the Tape
// Lab: "the page blurs in the background. It only opens up to a certain
// part on the right-hand side, so I can still see where I am"). Behaviour
// lifted from BPMDelayCalculator.jsx's .tl-drawer; re-skinned to the bench
// tokens. Tabs in the fixed order Reference · Teacher notes · Connections.
//
// Props: tabs = [{ id, label, render }], open = tab id or null,
// onChange(tabId|null). Escape closes; focus goes into the panel on open
// and back to the handle button that opened it on close.

export const DRAWER_TABS = ['reference', 'teacher', 'connections'];

export function DrawerHandle({ tabs, open, onChange }) {
    return (
        <nav className={styles.handle} aria-label="Bench drawer">
            {tabs.map((t) => (
                <button
                    key={t.id}
                    type="button"
                    className={styles.handleBtn}
                    aria-expanded={open === t.id}
                    aria-controls="bench-drawer"
                    data-drawer-handle={t.id}
                    onClick={(e) => onChange(open === t.id ? null : t.id, e.currentTarget)}
                >
                    {t.label}
                </button>
            ))}
        </nav>
    );
}

export function BenchDrawer({ tabs, open, onChange, opener }) {
    const panelRef = useRef(null);
    const lastHandle = useRef(null);
    const isOpen = Boolean(open);

    useEffect(() => {
        if (!isOpen) return undefined;
        lastHandle.current = opener || document.activeElement;
        panelRef.current?.focus({ preventScroll: true });
        function onKey(e) {
            if (e.key === 'Escape') {
                e.preventDefault();
                onChange(null);
            }
        }
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('keydown', onKey);
            const el = lastHandle.current;
            if (el && typeof el.focus === 'function') el.focus({ preventScroll: true });
        };
    }, [isOpen, onChange, opener]);

    const active = tabs.find((t) => t.id === open) || null;

    return (
        <>
            <div className={styles.scrim} data-open={isOpen} onClick={() => onChange(null)} aria-hidden="true" />
            <aside
                id="bench-drawer"
                ref={panelRef}
                className={styles.drawer}
                data-open={isOpen}
                role="dialog"
                aria-modal="false"
                aria-label={active ? active.label : 'Bench drawer'}
                inert={!isOpen}
                tabIndex={-1}
            >
                <div className={styles.drawerHead} role="tablist">
                    {tabs.map((t) => (
                        <button
                            key={t.id}
                            type="button"
                            role="tab"
                            className={styles.tab}
                            aria-selected={open === t.id}
                            onClick={() => onChange(t.id)}
                            tabIndex={isOpen ? 0 : -1}
                        >
                            {t.label}
                        </button>
                    ))}
                    <button type="button" className={styles.close} aria-label="Close drawer" onClick={() => onChange(null)} tabIndex={isOpen ? 0 : -1}>
                        ×
                    </button>
                </div>
                <div className={styles.drawerBody} role="tabpanel">
                    {active ? active.render() : null}
                </div>
            </aside>
        </>
    );
}
