'use client';

import { useRef } from 'react';
import styles from './bench.module.css';

// Console primitives. Every control shows the exam's word for the parameter,
// its unit, and its live value in mono (Bench Standard §2 "Console"). The
// dial and the drag-number are real instruments: pointer drag, arrow keys,
// Home / End, Page Up / Down, and a slider role for a screen reader.

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// A rotary dial: 270° of travel, dragged up and down. `pixels` is how far
// a pointer travels for the whole range (Shift slows it four times).
export function Dial({
    label,
    value,
    min,
    max,
    step = 1,
    unit = '',
    format,
    onChange,
    onRelease,
    disabled = false,
    title,
    size,
    pointer,
    hot = false,
    pixels = 180,
}) {
    const drag = useRef(null);
    const pct = (value - min) / (max - min);
    const angle = -135 + pct * 270;
    const shown = format ? format(value) : `${value}${unit ? ` ${unit}` : ''}`;
    const snap = (v) => clamp(Math.round(v / step) * step, min, max);

    function onPointerDown(e) {
        if (disabled) return;
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        e.currentTarget.focus({ preventScroll: true });
        drag.current = { y: e.clientY, start: value };
    }
    function onPointerMove(e) {
        if (!drag.current) return;
        const per = (max - min) / pixels / (e.shiftKey ? 4 : 1);
        onChange(snap(drag.current.start + (drag.current.y - e.clientY) * per));
    }
    function onPointerUp(e) {
        if (!drag.current) return;
        drag.current = null;
        try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* already gone */ }
        onRelease?.();
    }
    function onKeyDown(e) {
        if (disabled) return;
        const big = (max - min) / 10;
        const fine = e.shiftKey ? step * 10 : step;
        let next = null;
        if (e.key === 'ArrowUp' || e.key === 'ArrowRight') next = value + fine;
        else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') next = value - fine;
        else if (e.key === 'PageUp') next = value + big;
        else if (e.key === 'PageDown') next = value - big;
        else if (e.key === 'Home') next = min;
        else if (e.key === 'End') next = max;
        if (next == null) return;
        e.preventDefault();
        onChange(snap(next));
    }

    return (
        <div
            className={styles.dial}
            role="slider"
            tabIndex={disabled ? -1 : 0}
            aria-label={label}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={value}
            aria-valuetext={shown}
            aria-disabled={disabled || undefined}
            data-size={size}
            data-hot={hot || undefined}
            title={title}
            style={{ '--angle': `${angle}deg`, '--sweep': `${pct * 270}deg`, '--pointer': pointer }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onKeyDown={onKeyDown}
        >
            <i aria-hidden="true" />
        </div>
    );
}

// A channel fader: vertical travel, dragged up for louder, in dB. `pixels`
// is how far a pointer travels for the whole range (Shift slows it four
// times). The Balance Desk's instrument (29 Aug 2026); the cap carries the
// part's colour so the strip, the stage and the legend read as one. `slim`
// is the Synth bench's panel slider (2 Sep 2026): the same instrument at
// 26 px, any unit, the cap's stripe the section's colour; `hot` marks the
// one the stage's dot also moves.
export function Fader({
    label,
    value,
    min,
    max,
    step = 0.5,
    format,
    onChange,
    disabled = false,
    title,
    colour,
    pixels = 110,
    scale = [],
    slim = false,
    hot = false,
}) {
    const drag = useRef(null);
    const pct = (value - min) / (max - min);
    const shown = format ? format(value) : `${value}`;
    const snap = (v) => clamp(Math.round(v / step) * step, min, max);

    function onPointerDown(e) {
        if (disabled) return;
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        e.currentTarget.focus({ preventScroll: true });
        drag.current = { y: e.clientY, start: value };
    }
    function onPointerMove(e) {
        if (!drag.current) return;
        const per = (max - min) / pixels / (e.shiftKey ? 4 : 1);
        onChange(snap(drag.current.start + (drag.current.y - e.clientY) * per));
    }
    function onPointerUp(e) {
        if (!drag.current) return;
        drag.current = null;
        try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* already gone */ }
    }
    function onKeyDown(e) {
        if (disabled) return;
        const big = (max - min) / 10;
        const fine = e.shiftKey ? step * 10 : step;
        let next = null;
        if (e.key === 'ArrowUp' || e.key === 'ArrowRight') next = value + fine;
        else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') next = value - fine;
        else if (e.key === 'PageUp') next = value + big;
        else if (e.key === 'PageDown') next = value - big;
        else if (e.key === 'Home') next = min;
        else if (e.key === 'End') next = max;
        if (next == null) return;
        e.preventDefault();
        onChange(snap(next));
    }

    return (
        <div
            className={styles.fader}
            role="slider"
            aria-orientation="vertical"
            tabIndex={disabled ? -1 : 0}
            aria-label={label}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={value}
            aria-valuetext={shown}
            aria-disabled={disabled || undefined}
            data-slim={slim || undefined}
            data-hot={hot || undefined}
            title={title}
            style={{ '--pct': pct, '--stem': colour }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onKeyDown={onKeyDown}
        >
            <span className={styles.faderScale} aria-hidden="true">
                {scale.map((v) => (
                    <b key={v} style={{ top: `${(1 - (v - min) / (max - min)) * 100}%` }} data-unity={v === 0 || undefined}>{v > 0 ? `+${v}` : v}</b>
                ))}
            </span>
            <i aria-hidden="true" />
        </div>
    );
}

// A number you drag (tempo). Same keys as the dial.
export function DragNumber({ label, value, min, max, step = 1, unit = '', onChange, pixels = 4, title }) {
    const drag = useRef(null);
    const snap = (v) => clamp(Math.round(v / step) * step, min, max);
    function onPointerDown(e) {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        e.currentTarget.focus({ preventScroll: true });
        drag.current = { y: e.clientY, start: value };
    }
    function onPointerMove(e) {
        if (!drag.current) return;
        onChange(snap(drag.current.start + (drag.current.y - e.clientY) / pixels * step));
    }
    function onPointerUp(e) {
        if (!drag.current) return;
        drag.current = null;
        try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* already gone */ }
        onRelease?.();
    }
    function onKeyDown(e) {
        const fine = e.shiftKey ? step * 10 : step;
        let next = null;
        if (e.key === 'ArrowUp' || e.key === 'ArrowRight') next = value + fine;
        else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') next = value - fine;
        else if (e.key === 'PageUp') next = value + step * 10;
        else if (e.key === 'PageDown') next = value - step * 10;
        else if (e.key === 'Home') next = min;
        else if (e.key === 'End') next = max;
        if (next == null) return;
        e.preventDefault();
        onChange(snap(next));
    }
    return (
        <span
            className={styles.drag}
            role="spinbutton"
            tabIndex={0}
            aria-label={label}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={value}
            aria-valuetext={`${value} ${unit}`}
            title={title}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onKeyDown={onKeyDown}
        >
            {value}
            {unit ? <small>{unit}</small> : null}
            <small aria-hidden="true">↕</small>
        </span>
    );
}

// A row of chips, one pressed.
export function Chips({ label, options, value, onChange, disabled = false, ariaLabel, children }) {
    return (
        <div className={styles.chips} role="group" aria-label={ariaLabel || label}>
            {options.map((o) => (
                <button
                    key={o.id}
                    type="button"
                    className={styles.chip}
                    aria-pressed={o.id === value}
                    disabled={disabled || o.disabled}
                    onClick={() => onChange(o.id)}
                    title={o.title}
                >
                    {o.label}
                </button>
            ))}
            {children}
        </div>
    );
}

// The bench explaining a control to the student. Rendered inside a console
// section; the section shows it on hover or focus when Teacher is on.
export function Why({ children }) {
    return (
        <div className={styles.why} role="note">
            {children}
        </div>
    );
}

// Adds controls; never takes them away. Once pressed, the row it opens
// stays for the session (the 14 Aug law: controls never re-hide) and the
// button itself goes, since the row is now the affordance.
export function MoreButton({ open, onOpen }) {
    if (open) return null;
    return (
        <button type="button" className={styles.more} data-more onClick={onOpen} aria-expanded="false">
            More
        </button>
    );
}
