'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { openCookiePreferences } from '@/lib/consent';
import styles from './bench.module.css';

// Small shared pieces: the Student / Teacher toggle, the transport strip,
// and the think-then-reveal exam callout. Nothing here records anything.

const MODE_KEY = 'mts-bench-mode';

export function useBenchMode() {
    const [mode, setMode] = useState('student');
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

export function ModeToggle({ mode, onChange }) {
    return (
        <div className={styles.mode} role="group" aria-label="Who is reading">
            {['student', 'teacher'].map((m) => (
                <button key={m} type="button" className={styles.modeBtn} aria-pressed={mode === m} onClick={() => onChange(m)}>
                    {m === 'student' ? 'Student' : 'Teacher'}
                </button>
            ))}
        </div>
    );
}

export function BenchTransport({ playing, onTogglePlay, onHoldDry, level, onLevel, presets, presetId, onPreset }) {
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
        <div className={styles.transport}>
            <button
                type="button"
                className={styles.play}
                aria-pressed={playing}
                aria-label={playing ? 'Stop' : 'Play'}
                onClick={onTogglePlay}
            >
                {playing ? (
                    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><rect width="12" height="12" rx="1.5" fill="currentColor" /></svg>
                ) : (
                    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1.2v9.6L11 6z" fill="currentColor" /></svg>
                )}
            </button>
            <button
                type="button"
                className={styles.hold}
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
                <span className={styles.label}>Level</span>
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
            <div className={styles.presets} role="group" aria-label="Presets">
                <span className={styles.presetLabel}>Presets</span>
                {presets.map((p) => (
                    <button key={p.id} type="button" className={styles.preset} aria-pressed={presetId === p.id} onClick={() => onPreset(p.id)} title={p.blurb}>
                        {p.name}
                    </button>
                ))}
            </div>
            {/* The site footer's two legal links, carried here because a
                bench page has no footer below the fold. */}
            <div className={styles.legal}>
                <Link href="/privacy">Privacy</Link>
                <button type="button" onClick={openCookiePreferences}>Cookies</button>
            </div>
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
