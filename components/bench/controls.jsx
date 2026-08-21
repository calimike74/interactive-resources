'use client';

import { useId } from 'react';
import styles from './bench.module.css';

// Console primitives. Every control shows the exam's word for the parameter,
// its unit, and its live value in mono (Bench Standard §2 "Console").

export function Knob({ label, value, min, max, step = 1, unit = '', format, onChange, disabled = false, title }) {
    const id = useId();
    const pct = ((value - min) / (max - min)) * 100;
    const shown = format ? format(value) : value;
    return (
        <div className={styles.row} title={title}>
            <label className={styles.label} htmlFor={id}>{label}</label>
            <input
                id={id}
                className={styles.range}
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                disabled={disabled}
                style={{ '--fill': `${pct}%` }}
                onChange={(e) => onChange(Number(e.target.value))}
                aria-valuetext={`${shown}${unit ? ` ${unit}` : ''}`}
            />
            <div className={styles.value}>
                {shown}
                {unit ? <small>{unit}</small> : null}
            </div>
        </div>
    );
}

export function Segmented({ label, options, value, onChange, disabled = false, ariaLabel }) {
    return (
        <div className={`${styles.row} ${styles.rowSeg}`}>
            {label ? <span className={styles.label}>{label}</span> : null}
            <div className={styles.seg} role="group" aria-label={ariaLabel || label} style={label ? undefined : { gridColumn: '1 / -1' }}>
                {options.map((o) => (
                    <button
                        key={o.id}
                        type="button"
                        className={styles.segBtn}
                        aria-pressed={o.id === value}
                        disabled={disabled || o.disabled}
                        onClick={() => onChange(o.id)}
                        title={o.title}
                    >
                        {o.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

// Adds controls; never takes them away. Once opened it stays open for the
// session (the 14 Aug law: controls never re-hide).
export function GoFurther({ open, onOpen, children }) {
    return (
        <details
            className={styles.further}
            open={open}
            onToggle={(e) => { if (e.currentTarget.open) onOpen?.(); }}
        >
            <summary onClick={(e) => { if (open) e.preventDefault(); }}>
                {open ? 'Further controls' : 'Go further'}
            </summary>
            <div className={styles.group}>{children}</div>
        </details>
    );
}
