'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { theme, typography, borderRadius, spacing } from '@/lib/theme';

export default function NotesPanel({ storageKey }) {
    const t = theme.light;
    const [notes, setNotes] = useState('');
    const [saved, setSaved] = useState(false);
    const saveTimer = useRef(undefined);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(storageKey);
            if (stored) setNotes(stored);
        } catch {}
    }, [storageKey]);

    const handleChange = useCallback((value) => {
        setNotes(value);
        setSaved(false);
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
            try {
                localStorage.setItem(storageKey, value);
                setSaved(true);
                setTimeout(() => setSaved(false), 1500);
            } catch {}
        }, 800);
    }, [storageKey]);

    return (
        <div style={{
            border: `1px solid ${t.border.subtle}`,
            borderRadius: borderRadius.xl,
            overflow: 'hidden',
            background: 'white',
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: `${spacing[3]} ${spacing[4]}`,
                borderBottom: `1px solid ${t.border.subtle}`,
                background: t.bg.secondary,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.text.tertiary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                    <span style={{
                        fontSize: typography.size.sm,
                        fontWeight: typography.weight.semibold,
                        color: t.text.secondary,
                    }}>
                        My Notes
                    </span>
                </div>
                {saved && (
                    <span style={{
                        fontSize: typography.size.xs,
                        color: t.accent.success,
                        fontWeight: typography.weight.medium,
                    }}>
                        Saved
                    </span>
                )}
            </div>
            <textarea aria-label="My notes for this lesson"
                value={notes}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="Write your notes and key ideas as you work through the lesson…"
                style={{
                    width: '100%',
                    background: 'transparent',
                    color: t.text.primary,
                    fontSize: typography.size.sm,
                    padding: spacing[4],
                    border: 'none',
                    outline: 'none',
                    resize: 'vertical',
                    minHeight: 140,
                    fontFamily: 'inherit',
                    lineHeight: 1.6,
                }}
                rows={6}
            />
        </div>
    );
}
