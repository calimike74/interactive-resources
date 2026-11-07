'use client';
import { usePathname } from 'next/navigation';

// The way back to the main site (7 Nov 2026). Gemini's review of
// musictechstudio.co.uk found this subdomain a dead end: its home and topic
// pages had no link to the front door. One slim, quiet line above the page,
// in Botanical Press tokens (DESIGN.md: paper, line, muted, field).
//
// Shown only on the hub pages: the home page and /topic/*. The bench pages
// carry their own way home in the header, the Map Room has its own link in
// its fixed stage, and the static books in public/ carry the same bar in
// their own HTML.
const HOME = 'https://musictechstudio.co.uk';

function isHubPage(pathname) {
    const p = (pathname || '/').replace(/\.html$/, '').replace(/\/$/, '') || '/';
    return p === '/' || p === '/index' || p.startsWith('/topic/');
}

export default function StudioHomeBar() {
    const pathname = usePathname();
    if (!isHubPage(pathname)) return null;

    return (
        <nav
            aria-label="Music Tech Studio"
            style={{
                background: '#F8F2E8',
                borderBottom: '1px solid #D4C9B4',
                fontFamily: 'var(--font-geist-sans), -apple-system, sans-serif',
            }}
        >
            <div
                style={{
                    maxWidth: 1200,
                    margin: '0 auto',
                    padding: '0 16px',
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                }}
            >
                <a href={HOME} className="studio-home-link">
                    <span aria-hidden="true">←</span> Music Tech Studio
                </a>
            </div>
            <style>{`
                .studio-home-link {
                    display: inline-flex; align-items: center; gap: 6px;
                    min-height: 36px;
                    font-size: 0.8125rem; font-weight: 500; line-height: 1.4;
                    color: #6B6F5C; text-decoration: none;
                    transition: color 150ms cubic-bezier(0.22, 1, 0.36, 1);
                }
                .studio-home-link:hover { color: #3A4A35; text-decoration: underline; text-underline-offset: 3px; }
                .studio-home-link:focus-visible { outline: 2px solid #3A4A35; outline-offset: 2px; border-radius: 4px; color: #3A4A35; }
            `}</style>
        </nav>
    );
}
