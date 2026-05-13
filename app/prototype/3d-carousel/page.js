'use client';

import Link from 'next/link';
import DelayTypesCarousel from '@/components/learn/DelayTypesCarousel';

const C = {
  paper:   '#F8F2E8',
  ink:     '#1F2A1C',
  inkSoft: '#5A5750',
  field500:'#3A4A35',
  field700:'#1F2A1C',
};

const sans  = 'var(--font-manrope), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const serif = 'var(--font-fraunces), Georgia, serif';
const mono  = 'var(--font-jbmono), ui-monospace, "SF Mono", Menlo, monospace';

export default function CarouselPrototype() {
  return (
    <main style={{
      minHeight: '100vh',
      background: C.paper,
      color: C.ink,
      fontFamily: sans,
      padding: '64px 24px 96px',
      overflow: 'hidden',
    }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>

        <nav style={{ marginBottom: 24 }}>
          <Link href="/prototype" style={{
            fontFamily: mono, fontSize: 12, color: C.inkSoft,
            textDecoration: 'none', letterSpacing: '0.04em',
          }}>← Prototypes</Link>
        </nav>

        <header style={{ marginBottom: 32, maxWidth: 720 }}>
          <p style={{
            fontFamily: mono, fontSize: 11, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: C.field500, margin: '0 0 12px',
          }}>3D Transforms · Demo 2</p>
          <h1 style={{
            fontFamily: serif, fontSize: 48, lineHeight: 1.05,
            margin: '0 0 16px', letterSpacing: '-0.01em', fontWeight: 500,
          }}>Six delay types, one carousel.</h1>
          <p style={{
            fontSize: 17, lineHeight: 1.55, color: C.inkSoft, margin: 0,
            maxWidth: '52ch',
          }}>
            Edexcel 1.12 delay forms arranged in a circle in 3D space — each card carries
            its own colour, its own diagram, and one sentence the student should remember.
            Use the buttons or ←/→ keys to browse.
          </p>
        </header>

        <DelayTypesCarousel initialIndex={2} />

        <aside style={{
          marginTop: 48,
          background: 'rgba(58, 74, 53, 0.06)',
          borderLeft: `3px solid ${C.field500}`,
          padding: '16px 20px',
          borderRadius: 4,
          maxWidth: 780, margin: '48px auto 0',
          fontSize: 14,
          color: C.inkSoft,
        }}>
          <strong style={{ color: C.field700 }}>Notes for shipping.</strong>
          {' '}Each card is a poster for one delay form. The eyebrow tells the student where
          they are in the set, the title and one-liner are the takeaway, and the diagram
          carries the technical detail visually. If the carousel motion competes with audio
          playback (which is the actual content for Delay), drop to a horizontal scroller —
          build it both ways; A/B with students.
        </aside>

      </div>
    </main>
  );
}
