'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { theme } from '@/lib/theme';
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

    const t = theme.light;

    const choose = (value) => () => {
        setConsent(value);
        setShow(false);
    };

    const buttonStyle = {
        flex: 1,
        padding: '10px 14px',
        fontSize: 13,
        fontWeight: 500,
        borderRadius: 8,
        border: `1px solid ${t.border.strong}`,
        background: t.bg.tertiary,
        color: t.text.primary,
        cursor: 'pointer',
    };

    return (
        <div
            role="dialog"
            aria-label="Cookie preferences"
            style={{
                position: 'fixed',
                bottom: 16,
                right: 16,
                left: 16,
                maxWidth: 380,
                marginLeft: 'auto',
                zIndex: 1000,
                background: t.bg.elevated,
                border: `1px solid ${t.border.medium}`,
                borderRadius: 12,
                padding: 20,
                boxShadow: t.shadow.lg,
                fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)',
                color: t.text.primary,
            }}
        >
            <p style={{ margin: 0, marginBottom: 8, fontWeight: 600, fontSize: 15 }}>
                Cookies on this site
            </p>
            <p style={{ margin: 0, marginBottom: 16, fontSize: 13, color: t.text.secondary, lineHeight: 1.5 }}>
                One analytics cookie. No third parties. No personal info captured: the only thing we track is which tools get used.{' '}
                <Link href="/privacy" style={{ color: t.text.link, textDecoration: 'underline' }}>
                    Read more
                </Link>.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={choose('all')} style={buttonStyle}>Accept all</button>
                <button type="button" onClick={choose('essential')} style={buttonStyle}>Essential only</button>
            </div>
        </div>
    );
}
