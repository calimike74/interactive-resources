'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { openCookiePreferences } from '@/lib/consent';
import styles from './bench.module.css';

// Small shared pieces: the Student / Teacher toggle, the Core / A-level /
// Extension depth switch, the play column, the preset row, and the
// think-then-reveal exam callout. Nothing here records anything beyond
// the two toggles' last position in this browser.

const MODE_KEY = 'mts-bench-mode';
const DEPTH_KEY = 'mts-bench-depth';

// Teacher means the bench acts as the student's teacher (Mike, 21 Aug:
// notes *for* a teacher "undermines what this whole education thing is
// about"). A first visit starts in Teacher so the bench speaks until the
// student turns it off.
export function useBenchMode() {
    const [mode, setMode] = useState('teacher');
    useEffect(() => {
        try {
            const saved = window.localStorage.getItem(MODE_KEY);
            if (saved === 'teacher' || saved === 'student') setMode(saved);
        } catch { /* private mode, no memory, fine */ }
    }, []);
    function choose(next) {
        setMode(next);
        try { window.localStorage.setItem(MODE_KEY, next); } catch { /* same */ }
    }
    return [mode, choose];
}

export const DEPTHS = [
    { id: 'core', label: 'Core', dot: 'var(--teal)' },
    { id: 'alevel', label: 'A-level', dot: 'var(--gold)' },
    { id: 'extension', label: 'Extension', dot: 'var(--purple)' },
];

export function useBenchDepth() {
    const [depth, setDepth] = useState('alevel');
    useEffect(() => {
        try {
            const saved = window.localStorage.getItem(DEPTH_KEY);
            if (DEPTHS.some((d) => d.id === saved)) setDepth(saved);
        } catch { /* fine */ }
    }, []);
    function choose(next) {
        setDepth(next);
        try { window.localStorage.setItem(DEPTH_KEY, next); } catch { /* fine */ }
    }
    return [depth, choose];
}

export function ModeToggle({ mode, onChange }) {
    return (
        <div className={styles.mode} role="group" aria-label="Student or Teacher">
            {['student', 'teacher'].map((m) => (
                <button key={m} type="button" className={styles.modeBtn} aria-pressed={mode === m} onClick={() => onChange(m)}>
                    {m === 'student' ? 'Student' : 'Teacher'}
                </button>
            ))}
        </div>
    );
}

export function DepthToggle({ depth, onChange }) {
    return (
        <div className={styles.depth} role="group" aria-label="How deep the numbers go">
            {DEPTHS.map((d) => (
                <button key={d.id} type="button" className={styles.depthBtn} aria-pressed={depth === d.id} style={{ '--dot': d.dot }} onClick={() => onChange(d.id)}>
                    {d.label}
                </button>
            ))}
        </div>
    );
}

// The play column at the left of the console band: Play / Stop, hold for
// dry, the output level.
export function PlayColumn({ playing, onTogglePlay, onHoldDry, level, onLevel, teach }) {
    const [held, setHeld] = useState(false);
    function down(e) {
        e.preventDefault();
        setHeld(true);
        onHoldDry(true);
    }
    function up() {
        if (!held) return;
        setHeld(false);
        onHoldDry(false);
    }
    return (
        <div className={`${styles.sec} ${styles.secPlay}`} data-teach={teach || undefined}>
            <button
                type="button"
                className={styles.play}
                aria-pressed={playing}
                aria-label={playing ? 'Stop' : 'Play'}
                title="Space bar plays and stops"
                onClick={onTogglePlay}
            >
                {playing ? (
                    <svg width="14" height="14" viewBox="0 0 12 12" aria-hidden="true"><rect width="12" height="12" rx="1.5" fill="currentColor" /></svg>
                ) : (
                    <svg width="16" height="16" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1.2v9.6L11 6z" fill="currentColor" /></svg>
                )}
            </button>
            <button
                type="button"
                className={styles.hold}
                data-hold
                data-held={held}
                onPointerDown={down}
                onPointerUp={up}
                onPointerLeave={up}
                onPointerCancel={up}
                onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!held) down(e); } }}
                onKeyUp={(e) => { if (e.key === ' ' || e.key === 'Enter') up(); }}
                title="Hold to hear the source with no delay"
            >
                hold: dry
            </button>
            <div className={styles.levelWrap}>
                <span className={styles.eyebrow}>Level</span>
                <input
                    className={styles.range}
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(level * 100)}
                    style={{ '--fill': `${level * 100}%` }}
                    onChange={(e) => onLevel(Number(e.target.value) / 100)}
                    aria-label="Output level"
                />
            </div>
            <div className={styles.why}>
                <b>Play</b> runs the pattern round two bars. <b>Hold: dry</b> mutes the repeats while you hold it, so you can hear what the delay is adding. The space bar plays and stops.
            </div>
        </div>
    );
}

// The site footer's two legal links, carried on the bench because a bench
// page has no footer below the fold.
export function Legal() {
    return (
        <div className={styles.legal}>
            <Link href="/privacy">Privacy</Link>
            <button type="button" onClick={openCookiePreferences}>Cookies</button>
        </div>
    );
}

export function Presets({ presets, presetId, onPreset }) {
    return (
        <div className={styles.presets} role="group" aria-label="Presets">
            <span className={styles.presetLabel}>Presets</span>
            {presets.map((p) => (
                <button key={p.id} type="button" className={styles.preset} aria-pressed={presetId === p.id} onClick={() => onPreset(p.id)} title={p.blurb}>
                    {p.name}
                </button>
            ))}
        </div>
    );
}

export function ExamCallout({ prompt, answer }) {
    return (
        <details className={styles.callout}>
            <summary>{prompt}</summary>
            <p>{answer}</p>
        </details>
    );
}
