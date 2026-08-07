'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getAllTopicDefs } from '@/lib/topics';
import { editorial } from '@/lib/theme';

// The member thread (Mike, 2026-08-06/07). Members arriving from the
// grades dashboard carry ?from=studio on the URL; this small rail is their
// thread back — without it, this site's own Home crumb and tab bar strand
// them in the public product two taps after leaving their studio.
//
// Evolved from a single "back" chip into a three-stop thread: Today (the
// studio landing), Map (the topic wall), and — when this page belongs to a
// topic that exists in the member course — that topic's own studio page.
//
// The marker is captured into sessionStorage (per-tab: it follows the
// member around the site for this visit, and a fresh public visit never
// sees it) and then stripped from the address bar so a copied or shared
// link doesn't spread it. Dismissing clears the flag for the tab.
//
// Fixed positioning on purpose: the explorers are built to a strict
// no-scroll viewport, so the rail must never take part in page layout.
// z-index sits below the cookie banner (1000) — consent keeps priority.
const STUDIO_URL = 'https://grades.musictechstudio.co.uk';
const KEY = 'mts-from-studio';

// This site's topic ids → the member course's topic slugs. Topics with no
// member page (general, recording) are simply absent — the rail shows
// Today · Map alone there.
const MEMBER_SLUGS = {
    delay: 'delay',
    'digital-analogue': 'digital-analogue',
    distortion: 'distortion',
    dynamics: 'dynamic-processing',
    eq: 'eq-filters',
    'leads-and-signals': 'signals',
    midi: 'sequencing',
    numeracy: 'numeracy',
    reverb: 'reverb',
    sampling: 'sampling',
    synthesis: 'synthesis',
};

// Which topic is this page about? Topic routes name it directly; explorer
// pages are looked up through the topic registry's resourceIds.
function topicIdFromPath(pathname) {
    const parts = (pathname || '').replace(/\.html$/, '').split('/').filter(Boolean);
    if (parts.length === 2 && ['topic', 'learn', 'revise'].includes(parts[0])) {
        return parts[1];
    }
    if (parts.length === 1) {
        const hit = getAllTopicDefs().find((t) => t.resourceIds.includes(parts[0]));
        return hit ? hit.id : null;
    }
    return null;
}

export default function ReturnRail() {
    const [show, setShow] = useState(false);
    const pathname = usePathname();

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

    const topicId = topicIdFromPath(pathname);
    const memberSlug = topicId ? MEMBER_SLUGS[topicId] : null;
    const topicName = memberSlug
        ? (getAllTopicDefs().find((t) => t.id === topicId)?.name ?? null)
        : null;

    const dismiss = () => {
        try {
            sessionStorage.removeItem(KEY);
        } catch {}
        setShow(false);
    };

    const linkStyle = {
        textDecoration: 'none',
        color: editorial.ink,
        fontFamily: editorial.sans,
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: '0.01em',
    };

    return (
        <nav className="mts-return-rail" aria-label="Your studio">
            <span aria-hidden="true" style={{ color: editorial.accent, fontSize: 15, lineHeight: 1 }}>
                ←
            </span>
            <span
                style={{
                    color: editorial.inkFade,
                    fontFamily: editorial.sans,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                }}
            >
                Your studio
            </span>
            <a href={`${STUDIO_URL}/member/today`} style={linkStyle}>
                Today
            </a>
            <span aria-hidden="true" className="mts-rr-dot">
                ·
            </span>
            <a href={`${STUDIO_URL}/member/map`} style={linkStyle}>
                Map
            </a>
            {topicName && (
                <>
                    <span aria-hidden="true" className="mts-rr-dot">
                        ·
                    </span>
                    <a href={`${STUDIO_URL}/member/topics/${memberSlug}`} style={linkStyle}>
                        {topicName}
                    </a>
                </>
            )}
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
                    gap: 8px;
                    padding: 10px 12px 10px 14px;
                    background: #ffffff;
                    border: 1px solid ${editorial.rule};
                    border-radius: 999px;
                    box-shadow: 0 4px 14px rgba(24, 20, 16, 0.10);
                    max-width: calc(100vw - 32px);
                }
                .mts-return-rail .mts-rr-dot {
                    color: ${editorial.inkFade};
                    font-size: 13px;
                }
                .mts-return-rail a:hover { color: ${editorial.accent} !important; }
                /* The home page's bottom tab bar owns the low centre on
                   phones — sit above it there. */
                @media (max-width: 640px) {
                    .mts-return-rail { bottom: calc(96px + env(safe-area-inset-bottom, 0px)); }
                }
            `}</style>
        </nav>
    );
}
