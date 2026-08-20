'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { getAllTopicDefs } from '@/lib/topics';
import { resourceExists } from '@/lib/resources';
import { editorial } from '@/lib/theme';
import {
    MEMBER_SLUGS,
    RAIL_DISMISSED_KEY,
    STUDIO_URL,
    topicIdFromPath,
    useStudioArrival,
} from '@/lib/studio-return';

// The member thread (Mike, 2026-08-06/07). Members arriving from the
// grades dashboard carry ?from=studio on the URL; this small rail is their
// thread back — without it, this site's own Home crumb and tab bar strand
// them in the public product two taps after leaving their studio.
//
// Evolved from a single "back" chip into a three-stop thread: Today (the
// studio landing), Map (the topic wall), and — when this page belongs to a
// topic that exists in the member course — that topic's own studio page.
//
// The arrival marker is captured and stripped in lib/studio-return.js.
// Dismissing hides the rail for the tab and nothing more: it must not also
// forget that this tab belongs to a member, or the next bench they open
// would offer them the public front door instead of their own topic page.
//
// The rail stands down on resource pages (2026-08-20). Those now carry
// their own return button in the header, and two ways home a thumb apart
// is one more than a bench needs.
//
// Fixed positioning on purpose: the explorers are built to a strict
// no-scroll viewport, so the rail must never take part in page layout.
// z-index sits below the cookie banner (1000) — consent keeps priority.
function isResourcePage(pathname) {
    const parts = (pathname || '').replace(/\.html$/, '').split('/').filter(Boolean);
    return parts.length === 1 && resourceExists(parts[0]);
}

export default function ReturnRail() {
    // Dismissal from an earlier page this visit comes back with the arrival
    // (one read, after mount — a static export has no sessionStorage at build
    // time); `justDismissed` covers the click on this page.
    const [justDismissed, setJustDismissed] = useState(false);
    const pathname = usePathname();
    const { fromStudio, railDismissed } = useStudioArrival();

    if (!fromStudio || railDismissed || justDismissed || isResourcePage(pathname)) return null;

    // The rail only renders on this site's own topic / learn / revise routes,
    // where the path names the topic outright — so the registry lookup is
    // exact here, and the member link's ?back= slug (which names where they
    // came FROM, not what this page is about) is deliberately not used.
    const topicId = topicIdFromPath(pathname);
    const memberSlug = topicId ? MEMBER_SLUGS[topicId] : null;
    const topicName = memberSlug
        ? (getAllTopicDefs().find((t) => t.id === topicId)?.name ?? null)
        : null;

    const dismiss = () => {
        try {
            sessionStorage.setItem(RAIL_DISMISSED_KEY, '1');
        } catch {}
        setJustDismissed(true);
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
