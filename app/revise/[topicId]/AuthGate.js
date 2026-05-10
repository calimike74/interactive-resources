'use client';

import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { theme, typography, borderRadius, spacing, transitions, editorial as ED } from '@/lib/theme';
import { supabase } from '@/lib/supabase';

export default function AuthGate({ onAuthenticated }) {
    const t = theme.light;
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e) {
        e.preventDefault();
        if (!token.trim() || loading) return;

        setLoading(true);
        setError('');

        try {
            const { data: studentRows, error: rpcError } = await supabase
                .rpc('get_student_by_token', { p_token: token.trim() });

            if (rpcError || !studentRows || studentRows.length === 0) {
                setError('Invalid token. Check your student link and try again.');
                setLoading(false);
                return;
            }

            const student = studentRows[0];

            // Persist to localStorage
            localStorage.setItem('revision_token', token.trim());
            localStorage.setItem('revision_student_id', student.id);
            localStorage.setItem('revision_student_name', student.name);

            onAuthenticated({
                token: token.trim(),
                studentId: student.id,
                studentName: student.name,
            });
        } catch (err) {
            console.error('Auth error:', err);
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{
            maxWidth: '420px',
            margin: '0 auto',
            background: t.bg.primary,
            borderRadius: borderRadius.xl,
            border: `1px solid ${t.border.subtle}`,
            boxShadow: t.shadow.md,
            padding: spacing[8],
        }}>
            <div style={{ textAlign: 'center', marginBottom: spacing[6] }}>
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '48px',
                    height: '48px',
                    borderRadius: borderRadius.full,
                    background: ED.accentTint,
                    marginBottom: spacing[3],
                }}>
                    <KeyRound size={22} strokeWidth={1.5} color={ED.accent} aria-hidden="true" />
                </div>
                <h2 style={{
                    fontSize: typography.size.xl,
                    fontWeight: typography.weight.bold,
                    color: t.text.primary,
                    marginBottom: spacing[2],
                }}>
                    Enter your student token
                </h2>
                <p style={{
                    fontSize: typography.size.sm,
                    color: t.text.tertiary,
                    lineHeight: typography.lineHeight.relaxed,
                }}>
                    Use the same token from your grades dashboard link.
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={token}
                    onChange={e => setToken(e.target.value)}
                    placeholder="Paste your token here"
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
                    onFocus={e => {
                        if (!error) e.currentTarget.style.borderColor = ED.accent;
                    }}
                    onBlur={e => {
                        if (!error) e.currentTarget.style.borderColor = t.border.input;
                    }}
                />

                {error && (
                    <p style={{
                        marginTop: spacing[2],
                        fontSize: typography.size.sm,
                        color: t.accent.error,
                    }}>
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={!token.trim() || loading}
                    style={{
                        marginTop: spacing[4],
                        width: '100%',
                        padding: `${spacing[3]} ${spacing[5]}`,
                        background: token.trim() && !loading ? ED.accent : t.bg.tertiary,
                        color: token.trim() && !loading ? t.text.inverse : t.text.tertiary,
                        border: 'none',
                        borderRadius: borderRadius.lg,
                        fontSize: typography.size.base,
                        fontWeight: typography.weight.semibold,
                        cursor: token.trim() && !loading ? 'pointer' : 'default',
                        fontFamily: 'inherit',
                        transition: `all ${transitions.fast}`,
                    }}
                >
                    {loading ? 'Verifying...' : 'Start Quiz'}
                </button>
            </form>
        </div>
    );
}
