'use client';

import Link from 'next/link';
import { editorial as ED } from '@/lib/theme';

function OutroCard({ href, eyebrow, title }) {
    return (
        <Link href={href} style={{ textDecoration: 'none', flex: '1 1 240px', maxWidth: '360px' }}>
            <div
                style={{
                    background: 'white',
                    border: `1px solid ${ED.accentFaint}`,
                    borderRadius: '0.75rem',
                    padding: '1.25rem 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    transition: 'border-color 150ms ease, transform 150ms ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = ED.accent; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = ED.accentFaint; e.currentTarget.style.transform = 'none'; }}
            >
                <div style={{ textAlign: 'left' }}>
                    <div style={{
                        fontFamily: ED.mono, fontSize: '10px', fontWeight: 500,
                        letterSpacing: '0.18em', textTransform: 'uppercase', color: ED.inkFade,
                        marginBottom: '0.35rem',
                    }}>
                        {eyebrow}
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1A1A2E', lineHeight: 1.3 }}>
                        {title}
                    </div>
                </div>
                <span aria-hidden="true" style={{ color: ED.accent, fontSize: '1.1rem', fontWeight: 600 }}>&rarr;</span>
            </div>
        </Link>
    );
}

export default function ChapterOutro({ outro }) {
    if (!outro) return null;
    return (
        <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '1rem',
            justifyContent: 'center', padding: '0 1.5rem 4rem',
        }}>
            {outro.nextHref ? (
                <OutroCard href={outro.nextHref} eyebrow="Next" title={outro.nextLabel} />
            ) : (
                <>
                    <OutroCard href={outro.exploreHref} eyebrow="Now go play" title={outro.exploreLabel} />
                    <OutroCard href={outro.reviseHref} eyebrow="Prove it" title="Revise this topic" />
                </>
            )}
        </div>
    );
}
