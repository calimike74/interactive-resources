import Link from 'next/link';
import { theme, typography, spacing, borderRadius, glass } from '@/lib/theme';

/**
 * Without this file, Next.js supplies its own default not-found boundary,
 * whose bare "404: This page could not be found" title and injected
 * noindex meta both LAYER ON TOP of the root layout's resolved metadata
 * (title, robots: index/follow) rather than replacing it — two <title>
 * tags and two conflicting <meta name="robots"> tags in one document.
 * Owning this route with real `metadata` fixes that the same way any
 * other page's metadata does, and gives a stray or dead link somewhere
 * to go instead of a bare, unbranded error.
 */
export const metadata = {
    title: 'Page not found',
    robots: { index: false, follow: false },
};

export default function NotFound() {
    const t = theme.light;
    return (
        <div
            style={{
                minHeight: '100vh',
                background: t.bg.secondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: spacing[8],
                fontFamily: typography.fontFamily,
            }}
        >
            <div
                style={{
                    background: glass.bg,
                    backdropFilter: 'blur(' + glass.blur + ')',
                    WebkitBackdropFilter: 'blur(' + glass.blur + ')',
                    border: '1px solid ' + glass.border,
                    borderRadius: borderRadius['2xl'],
                    padding: spacing[10],
                    maxWidth: '480px',
                    textAlign: 'center',
                    boxShadow: glass.shadowHover,
                }}
            >
                <h1
                    style={{
                        fontSize: typography.size['2xl'],
                        fontWeight: typography.weight.bold,
                        color: t.text.primary,
                        marginBottom: spacing[2],
                    }}
                >
                    Page not found
                </h1>
                <p
                    style={{
                        color: t.text.secondary,
                        marginBottom: spacing[6],
                    }}
                >
                    That link is broken or has moved. Try the resources index instead.
                </p>
                <Link
                    href="/"
                    style={{
                        display: 'inline-block',
                        padding: `${spacing[3]} ${spacing[6]}`,
                        background: t.accent.primary,
                        color: t.text.inverse,
                        borderRadius: borderRadius.lg,
                        textDecoration: 'none',
                        fontWeight: typography.weight.semibold,
                    }}
                >
                    ← Back to Interactive Resources
                </Link>
            </div>
        </div>
    );
}
