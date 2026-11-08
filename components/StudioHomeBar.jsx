'use client';
import { usePathname } from 'next/navigation';

// The site bar (8 Nov 2026). The front door's menu sends "Explore" here, so the hub
// pages carry the same menu as musictechstudio.co.uk: brand, the four ways in (Explore
// is this site, marked current), For teachers, Sign in, Start here. It replaces the
// 7 Nov one-line "← Music Tech Studio" way back.
//
// Sticky (Mike, 8 Nov: the menu should stay at the top when you scroll, on every page).
// Shown only on the hub pages: the home page and /topic/*. The bench pages carry their
// own way home in the header, the Map Room has its own link in its fixed stage, and the
// static books in public/ carry their own bar in their own HTML.
const HOME = 'https://musictechstudio.co.uk';

function isHubPage(pathname) {
    const p = (pathname || '/').replace(/\.html$/, '').replace(/\/$/, '') || '/';
    return p === '/' || p === '/index' || p.startsWith('/topic/');
}

export default function StudioHomeBar() {
    const pathname = usePathname();
    if (!isHubPage(pathname)) return null;

    return (
        <nav aria-label="Main" className="mts-bar">
            <a className="brand" href={HOME + '/'}>Music Tech Studio</a>
            <a className="l" href={HOME + '/topics'}>Learn</a>
            <a className="l" href={HOME + '/lessons'}>Lessons</a>
            <a className="l on" href="/" aria-current="page">Explore</a>
            <a className="l" href={HOME + '/figures'}>Figures</a>
            <a className="l" href={HOME + '/for-teachers'}>For teachers</a>
            <a className="in" href="https://member.musictechstudio.co.uk/">Sign in</a>
            <a className="go" href={HOME + '/#ways'}>Start here</a>
            <style>{`
                .mts-bar { position: sticky; top: 0; z-index: 50; box-shadow: 0 1px 0 rgba(45, 45, 45, .1);
                    display: flex; align-items: center; gap: 28px; background: #FFFBF5; color: #2D2D2D;
                    padding: calc(12px + env(safe-area-inset-top, 0px)) max(28px, env(safe-area-inset-right, 0px)) 12px max(28px, env(safe-area-inset-left, 0px));
                    font: 400 15px/1.4 var(--font-public), system-ui, sans-serif; -webkit-font-smoothing: antialiased }
                .mts-bar a { color: inherit; text-decoration: none }
                .mts-bar a:focus-visible { outline: 2px solid #2F5BB7; outline-offset: 3px; border-radius: 3px }
                .mts-bar .brand { font-size: 17px; font-weight: 500; margin-right: auto }
                .mts-bar .l { color: rgba(45, 45, 45, .72) }
                .mts-bar .l:hover { color: #2D2D2D }
                .mts-bar .l.on { color: #2D2D2D; font-weight: 600; text-decoration: underline; text-decoration-color: #3B8F93; text-decoration-thickness: 2px; text-underline-offset: 6px }
                .mts-bar .in { padding: 8px 15px; border: 1px solid rgba(45, 45, 45, .1); border-radius: 8px }
                .mts-bar .go { padding: 9px 16px; background: #2D2D2D; color: #FFFBF5; border-radius: 8px }
                @media (max-width: 1000px) {
                    .mts-bar { flex-wrap: wrap; gap: 12px 20px }
                    .mts-bar::after { content: ""; order: 2; flex-basis: 100% }
                    .mts-bar .l { order: 3; font-size: 14px; padding: 11px 0; margin: -11px 0 }
                }
                @media (max-width: 560px) {
                    .mts-bar { gap: 8px 14px; padding: calc(10px + env(safe-area-inset-top, 0px)) 16px 4px }
                    .mts-bar .in { display: none }
                }
            `}</style>
        </nav>
    );
}
