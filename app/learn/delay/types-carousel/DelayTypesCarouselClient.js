'use client';

import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import DelayTypesCarousel from '@/components/learn/DelayTypesCarousel';

const C = {
  paper:   '#F8F2E8',
  ink:     '#1F2A1C',
  inkSoft: '#5A5750',
  line:    '#D4C9B4',
  field500:'#3A4A35',
  field700:'#1F2A1C',
};

const sans  = 'var(--font-manrope), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const serif = 'var(--font-fraunces), Georgia, serif';
const mono  = 'var(--font-jbmono), ui-monospace, "SF Mono", Menlo, monospace';

const NEXT_STEPS = [
  {
    title: 'Delay Interface',
    desc: 'Click through a real Ableton delay plug-in to learn each control hands-on.',
    href: '/delay-image-explorer',
  },
  {
    title: 'Delay Flashcards',
    desc: 'Spaced-repetition recall covering parameters, types, and creative use.',
    href: '/delay-flashcards',
  },
  {
    title: 'Learn: Delay',
    desc: 'Back to the topic hub for delay lessons, assessments and study tools.',
    href: '/learn/delay',
  },
];

export default function DelayTypesCarouselClient() {
  return (
    <main style={{
      minHeight: '100vh',
      background: C.paper,
      color: C.ink,
      fontFamily: sans,
      padding: '24px 24px 96px',
      overflow: 'hidden',
    }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>

        <Breadcrumbs />

        <header style={{ marginTop: 16, marginBottom: 32, maxWidth: 720 }}>
          <p style={{
            fontFamily: mono, fontSize: 11, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: C.field500, margin: '0 0 12px',
          }}>1.12 Delay · Orientation</p>
          <h1 style={{
            fontFamily: serif, fontSize: 48, lineHeight: 1.05,
            margin: '0 0 16px', letterSpacing: '-0.01em', fontWeight: 500,
          }}>Six delay types, one carousel.</h1>
          <p style={{
            fontSize: 17, lineHeight: 1.55, color: C.inkSoft, margin: 0,
            maxWidth: '54ch',
          }}>
            A visual orientation to the six delay forms in the 1.12 specification.
            Each card carries the technical takeaway (the parameter values, the shape
            of the echo, the era). Browse with ←/→ before drilling into any one type.
          </p>
        </header>

        <DelayTypesCarousel initialIndex={2} />

        <section style={{
          marginTop: 64,
          maxWidth: 960,
          marginLeft: 'auto', marginRight: 'auto',
        }}>
          <p style={{
            fontFamily: mono, fontSize: 11, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: C.field500, margin: '0 0 16px',
          }}>What's next</p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 16,
          }}>
            {NEXT_STEPS.map(step => (
              <Link key={step.href} href={step.href} style={{
                display: 'block',
                padding: '20px 22px',
                background: '#FFFFFF',
                border: `1px solid ${C.line}`,
                borderRadius: 12,
                textDecoration: 'none',
                color: C.ink,
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}>
                <h3 style={{
                  fontFamily: serif, fontSize: 20, margin: '0 0 6px',
                  fontWeight: 500, letterSpacing: '-0.01em',
                }}>{step.title} →</h3>
                <p style={{
                  fontSize: 14, lineHeight: 1.5, color: C.inkSoft, margin: 0,
                }}>{step.desc}</p>
              </Link>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
