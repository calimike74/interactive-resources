'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getConsent, setConsent } from '@/lib/consent';

export default function CookieBanner() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (getConsent() === null) {
            const t = setTimeout(() => setShow(true), 800);
            return () => clearTimeout(t);
        }
    }, []);

    useEffect(() => {
        const open = () => setShow(true);
        window.addEventListener('mts:open-cookie-preferences', open);
        return () => window.removeEventListener('mts:open-cookie-preferences', open);
    }, []);

    if (!show) return null;

    const choose = (value) => () => {
        setConsent(value);
        setShow(false);
    };

    // 8 Nov 2026: a slim strip in the design system's paper and ink, kept to the
    // bottom edge so it no longer covers the topic list on a phone; no "we".
    return (
        <div role="dialog" aria-label="Cookie preferences" className="mts-cookie">
            <p>
                One analytics cookie, no third parties. It counts which tools get used and
                nothing about you. <Link href="/privacy">Read more</Link>.
            </p>
            <div className="mts-cookie-btns">
                <button type="button" onClick={choose('all')}>Accept</button>
                <button type="button" onClick={choose('essential')}>Essential only</button>
            </div>
            <style>{`
                .mts-cookie { position: fixed; z-index: 1000; left: 16px; right: 16px; bottom: calc(16px + env(safe-area-inset-bottom, 0px));
                    max-width: 560px; margin-left: auto; display: flex; align-items: center; gap: 12px 16px;
                    background: #FFFBF5; color: #2D2D2D; border: 1px solid rgba(45, 45, 45, .16); border-radius: 10px;
                    padding: 12px 14px; box-shadow: 0 10px 30px -12px rgba(30, 29, 51, .28);
                    font: 400 14px/1.45 var(--font-public), system-ui, sans-serif }
                .mts-cookie p { margin: 0; flex: 1; min-width: 0 }
                .mts-cookie a { color: inherit; text-decoration: underline; text-underline-offset: 3px }
                .mts-cookie-btns { display: flex; gap: 8px; flex-shrink: 0 }
                .mts-cookie button { font: inherit; font-weight: 500; min-height: 40px; padding: 0 14px; border-radius: 8px; cursor: pointer;
                    border: 1px solid rgba(45, 45, 45, .16); background: transparent; color: #2D2D2D }
                .mts-cookie button:first-child { background: #2D2D2D; color: #FFFBF5; border-color: #2D2D2D }
                .mts-cookie button:focus-visible, .mts-cookie a:focus-visible { outline: 2px solid #2F5BB7; outline-offset: 2px }
                @media (max-width: 560px) {
                    .mts-cookie { left: 8px; right: 8px; bottom: calc(8px + env(safe-area-inset-bottom, 0px)); flex-direction: column; align-items: stretch; font-size: 13.5px; padding: 10px 12px }
                    .mts-cookie button { flex: 1 }
                }
            `}</style>
        </div>
    );
}
