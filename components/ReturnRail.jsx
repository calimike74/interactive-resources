'use client';
import { useEffect, useState } from 'react';
import { editorial } from '@/lib/theme';

// The member return rail (Mike, 2026-08-06). Members arriving from the
// grades dashboard carry ?from=studio on the URL; this chip is their thread
// back — without it, this site's own Home crumb and tab bar strand them in
// the public product two taps after leaving their studio.
//
// The marker is captured into sessionStorage (per-tab: it follows the
// member around the site for this visit, and a fresh public visit never
// sees it) and then stripped from the address bar so a copied or shared
// link doesn't spread it. Dismissing clears the flag for the tab.
//
// Fixed positioning on purpose: the explorers are built to a strict
// no-scroll viewport, so the rail must never take part in page layout.
// z-index sits below the cookie banner (1000) — consent keeps priority.
const STUDIO_URL = 'https://grades.musictechstudio.co.uk/member/today';
const KEY = 'mts-from-studio';

export default function ReturnRail() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        try {
            const url = new URL(window.location.href);
            if (url.searchParams.get('from') === 'studio') {
                sessionStorage.setItem(KEY, '1');
                url.searchParams.delete('from');
                window.history.replaceState(null, '', url.pathname + url.search + url.hash);
            }
            setShow(sessionStorage.getItem(KEY) === '1');
        } catch {
            /* storage unavailable — no rail */
        }
    }, []);

    if (!show) return null;

    const dismiss = () => {
        try {
            sessionStorage.removeItem(KEY);
        } catch {}
        setShow(false);
    };

    return (
        <div className="mts-return-rail" role="complementary" aria-label="Back to your studio">
            <a
                href={STUDIO_URL}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    textDecoration: 'none',
                    color: editorial.ink,
                    fontFamily: editorial.sans,
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: '0.01em',
                }}
            >
                <span aria-hidden="true" style={{ color: editorial.accent, fontSize: 15, lineHeight: 1 }}>
                    ←
                </span>
                Back to your studio
            </a>
            <button
                type="button"
                onClick={dismiss}
                aria-label="Dismiss"
                style={{
                    border: 'none',
                    background: 'none',
                    padding: '2px 2px 2px 6px',
                    marginLeft: 2,
                    cursor: 'pointer',
                    color: editorial.inkFade,
                    fontSize: 14,
                    lineHeight: 1,
                }}
            >
                ×
            </button>
            <style>{`
                .mts-return-rail {
                    position: fixed;
                    left: 16px;
                    bottom: 16px;
                    z-index: 900;
                    display: flex;
                    align-items: center;
                    padding: 10px 12px 10px 14px;
                    background: #ffffff;
                    border: 1px solid ${editorial.rule};
                    border-radius: 999px;
                    box-shadow: 0 4px 14px rgba(24, 20, 16, 0.10);
                }
                .mts-return-rail a:hover span { transform: translateX(-2px); }
                .mts-return-rail a span { transition: transform 150ms ease; }
                /* The home page's bottom tab bar owns the low centre on
                   phones — sit above it there. */
                @media (max-width: 640px) {
                    .mts-return-rail { bottom: calc(96px + env(safe-area-inset-bottom, 0px)); }
                }
                @media (prefers-reduced-motion: reduce) {
                    .mts-return-rail a span { transition: none; }
                }
            `}</style>
        </div>
    );
}
