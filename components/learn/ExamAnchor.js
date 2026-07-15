'use client';

import { editorial as ED } from '@/lib/theme';

export default function ExamAnchor({ anchor }) {
    if (!anchor) return null;
    return (
        <div style={{ maxWidth: '760px', margin: '0 auto 4rem', padding: '0 1.5rem', position: 'relative', zIndex: 3 }}>
            <div style={{ background: 'white', border: `1px solid ${ED.accentFaint}`, borderRadius: '0.75rem', padding: '1.75rem 2rem' }}>
                <div style={{
                    fontFamily: ED.mono, fontSize: '11px', fontWeight: 500,
                    letterSpacing: '0.18em', textTransform: 'uppercase', color: ED.accent, marginBottom: '0.75rem',
                }}>
                    In the exam
                </div>
                <p style={{ fontSize: '1rem', fontWeight: 600, color: '#1A1A2E', lineHeight: 1.45, marginBottom: '1rem' }}>
                    {anchor.question}
                </p>
                <div style={{
                    fontFamily: ED.mono, fontSize: '10px', fontWeight: 500,
                    letterSpacing: '0.18em', textTransform: 'uppercase', color: ED.inkFade, marginBottom: '0.5rem',
                }}>
                    A strong answer includes
                </div>
                <ul style={{ margin: '0 0 1rem', paddingLeft: '1.25rem' }}>
                    {anchor.modelPoints.map((point, i) => (
                        <li key={i} style={{ fontSize: '0.9375rem', color: '#374151', lineHeight: 1.55, marginBottom: '0.35rem' }}>
                            {point}
                        </li>
                    ))}
                </ul>
                {anchor.examTip && (
                    <p style={{ fontSize: '0.875rem', color: '#6B7280', lineHeight: 1.55, borderTop: `1px solid ${ED.rule}`, paddingTop: '0.9rem', margin: 0 }}>
                        <strong style={{ color: '#374151' }}>Examiner tip:</strong> {anchor.examTip}
                    </p>
                )}
            </div>
        </div>
    );
}
