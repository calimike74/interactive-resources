'use client';

import { useState, useEffect, useCallback } from 'react';
import { Lock } from 'lucide-react';
import { theme, typography, spacing, borderRadius, transitions, editorial as ED } from '@/lib/theme';
import {
    isGateActive,
    isResourceExempt,
    isTokenValid,
    checkPasscode,
    deriveToken,
    GATE_COOKIE_NAME,
    GATE_STORAGE_KEY,
    GATE_COOKIE_MAX_AGE_SECONDS,
} from '@/lib/gate';

/**
 * Wraps a single resource's interactive region, or a Learn lesson's body.
 * Everything around it — the page title, the topic, why it matters in the
 * exam, the past-paper links — stays outside this component and therefore
 * stays public. See lib/gate.js for why this check is a classroom courtesy
 * lock and not authentication.
 *
 * Exemption is `free` if the caller already knows it (Learn callers pass
 * `free={isTopicFree(topicId)}` — there is no per-resource id on a lesson
 * page), otherwise it falls back to `isResourceExempt(resourceId)` for the
 * resource-page caller. Passing `free` explicitly always wins.
 */
export default function GateKeeper({ resourceId, title, children, free }) {
    const exempt = free !== undefined ? free : isResourceExempt(resourceId);

    // Both isGateActive() and the exemption check only read build-time data
    // (env vars baked in, and the static free list) — safe to call during
    // the prerendered pass, so 'open' resolves with no flash for the common
    // case (gate off, or a free resource/topic) instead of waiting on an
    // effect.
    const [status, setStatus] = useState(() => (
        !isGateActive() || exempt ? 'open' : 'checking'
    ));

    useEffect(() => {
        if (status !== 'checking') return undefined;
        const subtle = typeof window !== 'undefined' && window.crypto ? window.crypto.subtle : null;
        if (!subtle) {
            // No WebCrypto available — fail closed to the panel rather than
            // silently opening the interactive.
            setStatus('locked');
            return undefined;
        }
        let cancelled = false;
        (async () => {
            let stored = null;
            try {
                stored = window.localStorage.getItem(GATE_STORAGE_KEY);
            } catch {
                stored = null;
            }
            const valid = await isTokenValid(stored, subtle);
            if (!cancelled) setStatus(valid ? 'open' : 'locked');
        })();
        return () => { cancelled = true; };
    }, [status, resourceId, exempt]);

    if (status === 'open') return children;

    if (status === 'checking') {
        return (
            <div
                aria-hidden="true"
                style={{ minHeight: '40vh' }}
            />
        );
    }

    return <PasscodePanel title={title} onUnlocked={() => setStatus('open')} />;
}

function persistUnlock(token) {
    try {
        window.localStorage.setItem(GATE_STORAGE_KEY, token);
    } catch {
        // Private-browsing / storage-disabled — the cookie below still lets
        // the unlock survive a reload within the same tab session.
    }
    document.cookie = `${GATE_COOKIE_NAME}=1; path=/; max-age=${GATE_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax; Secure`;
}

function PasscodePanel({ title, onUnlocked }) {
    const t = theme.light;
    const [passcode, setPasscode] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [unsupported, setUnsupported] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
            setUnsupported(true);
        }
    }, []);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (submitting || unsupported) return;
        const subtle = window.crypto.subtle;

        setSubmitting(true);
        setError('');

        const ok = await checkPasscode(passcode.trim(), subtle);
        if (ok) {
            const token = await deriveToken(subtle);
            persistUnlock(token);
            onUnlocked();
        } else {
            setError("That passcode isn't right. Ask your teacher for this term's code.");
        }
        setSubmitting(false);
    }, [passcode, submitting, unsupported, onUnlocked]);

    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'center',
                padding: `${spacing[16]} ${spacing[4]}`,
            }}
        >
            <div
                style={{
                    maxWidth: '420px',
                    width: '100%',
                    background: t.bg.primary,
                    borderRadius: borderRadius.xl,
                    border: `1px solid ${t.border.subtle}`,
                    boxShadow: t.shadow.md,
                    padding: spacing[8],
                    fontFamily: typography.fontFamily,
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: spacing[6] }}>
                    <div
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '48px',
                            height: '48px',
                            borderRadius: borderRadius.full,
                            background: ED.accentTint,
                            marginBottom: spacing[3],
                        }}
                    >
                        <Lock size={20} strokeWidth={1.5} color={ED.accent} aria-hidden="true" />
                    </div>
                    <h2
                        id="gate-passcode-label"
                        style={{
                            fontSize: typography.size.xl,
                            fontWeight: typography.weight.bold,
                            color: t.text.primary,
                            marginBottom: spacing[2],
                        }}
                    >
                        Part of the course
                    </h2>
                    <p
                        style={{
                            fontSize: typography.size.sm,
                            color: t.text.tertiary,
                            lineHeight: typography.lineHeight.relaxed,
                        }}
                    >
                        {title ? `"${title}" is` : 'This interactive is'} part of the full course at{' '}
                        <a
                            href="https://musictechstudio.co.uk"
                            style={{ color: ED.accent }}
                        >
                            musictechstudio.co.uk
                        </a>
                        . Use this site in class? Ask your teacher for this term&rsquo;s passcode
                        below. The rest of this page, including what the topic covers and why it
                        matters in the exam, stays visible either way.
                    </p>
                </div>

                {unsupported ? (
                    <p
                        style={{
                            fontSize: typography.size.sm,
                            color: t.accent.error,
                            textAlign: 'center',
                        }}
                    >
                        This browser can&apos;t check the passcode. Try a recent version of Chrome,
                        Safari, Firefox or Edge.
                    </p>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <input
                            id="gate-passcode"
                            type="text"
                            value={passcode}
                            onChange={(e) => setPasscode(e.target.value)}
                            placeholder="Enter the passcode"
                            aria-labelledby="gate-passcode-label"
                            autoComplete="off"
                            autoFocus
                            style={{
                                width: '100%',
                                padding: `${spacing[3]} ${spacing[4]}`,
                                fontSize: typography.size.base,
                                border: `1.5px solid ${error ? t.accent.error : t.border.input}`,
                                borderRadius: borderRadius.lg,
                                background: t.bg.primary,
                                color: t.text.primary,
                                fontFamily: typography.fontFamilyMono,
                                outline: 'none',
                                boxSizing: 'border-box',
                                transition: `border-color ${transitions.fast}`,
                            }}
                        />

                        {error && (
                            <p
                                role="alert"
                                style={{
                                    marginTop: spacing[2],
                                    fontSize: typography.size.sm,
                                    color: t.accent.error,
                                }}
                            >
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={!passcode.trim() || submitting}
                            style={{
                                marginTop: spacing[4],
                                width: '100%',
                                padding: `${spacing[3]} ${spacing[5]}`,
                                background: passcode.trim() && !submitting ? ED.accent : t.bg.tertiary,
                                color: passcode.trim() && !submitting ? t.text.inverse : t.text.tertiary,
                                border: 'none',
                                borderRadius: borderRadius.lg,
                                fontSize: typography.size.base,
                                fontWeight: typography.weight.semibold,
                                cursor: passcode.trim() && !submitting ? 'pointer' : 'default',
                                fontFamily: 'inherit',
                                transition: `all ${transitions.fast}`,
                            }}
                        >
                            {submitting ? 'Checking…' : 'Unlock'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
