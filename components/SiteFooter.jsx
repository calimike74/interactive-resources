'use client';
import Link from 'next/link';
import { theme } from '@/lib/theme';
import { openCookiePreferences } from '@/lib/consent';

export default function SiteFooter() {
    const t = theme.light;
    return (
        <footer
            className="site-footer"
            style={{
                padding: '24px 20px',
                textAlign: 'center',
                fontSize: 12,
                color: t.text.tertiary,
                borderTop: `1px solid ${t.border.subtle}`,
                background: t.bg.primary,
            }}
        >
            <Link href="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>
                Privacy
            </Link>
            <span style={{ margin: '0 8px', opacity: 0.5 }}>·</span>
            <button
                type="button"
                onClick={openCookiePreferences}
                style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                    font: 'inherit',
                    padding: 0,
                }}
            >
                Cookie preferences
            </button>
        </footer>
    );
}
