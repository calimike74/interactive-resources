'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { theme } from '@/lib/theme';
import { openCookiePreferences } from '@/lib/consent';
import { getResource, resourceExists } from '@/lib/resources';

// A bench page (resource kind 'bench', BENCH-STANDARD §3 law 1) is one
// viewport with nothing below it; it carries these two links in its own
// transport strip instead, so the footer steps aside there.
function isBenchPath(pathname) {
    const id = (pathname || '').replace(/^\/+|\/+$/g, '');
    return Boolean(id) && !id.includes('/') && resourceExists(id) && getResource(id).kind === 'bench';
}

export default function SiteFooter() {
    const t = theme.light;
    const pathname = usePathname();
    if (isBenchPath(pathname)) return null;
    return (
        <footer
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
