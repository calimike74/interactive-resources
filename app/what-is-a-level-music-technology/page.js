import Link from 'next/link';

export const metadata = {
    title: 'What is A-level Music Technology?',
    description:
        'A plain guide to A-level Music Technology for anyone thinking about taking it: what the subject actually involves, what the four components are, and how hard it is.',
    alternates: { canonical: '/what-is-a-level-music-technology' },
    openGraph: {
        title: 'What is A-level Music Technology?',
        description:
            'What the subject actually involves, what the four components are, and how hard it is.',
        url: '/what-is-a-level-music-technology',
        type: 'article',
    },
};

// Editorial palette — matches the hub. Warm paper, warm ink; never flat black.
const ED = {
    page: '#f5f4f2',
    ink: '#181410',
    inkSoft: '#4d463c',
    inkFade: '#8a8175',
    rule: '#d9d1be',
    accent: '#2d5d4f',
    serif: 'var(--font-fraunces), Georgia, serif',
    sans: 'var(--font-manrope), -apple-system, sans-serif',
    mono: 'var(--font-jbmono), ui-monospace, monospace',
};

const COMPONENTS = [
    {
        n: '1',
        name: 'Recording',
        kind: 'Coursework',
        body: 'You record real musicians and mix the result. Microphone choice, placement, gain, and a mix that survives being listened to closely.',
    },
    {
        n: '2',
        name: 'Technology-based composition',
        kind: 'Coursework',
        body: 'You compose using the studio itself — synthesis, sampling, processing and arrangement are the compositional material, not decoration.',
    },
    {
        n: '3',
        name: 'Listening and Analysing',
        kind: 'Written exam',
        body: 'You hear unfamiliar recordings and write about how they were made: the era, the equipment, the production decisions and their effect.',
    },
    {
        n: '4',
        name: 'Producing and Analysing',
        kind: 'Written exam',
        body: 'You are given audio and MIDI to correct, sequence, synthesise and mix, and questions on the technology behind it.',
    },
];

const START = [
    { href: '/topic/numeracy', name: 'Numeracy', line: 'Sample rates, bit depth, period and frequency — the topic that costs candidates the most marks, every year.' },
    { href: '/topic/midi', name: 'MIDI and sequencing', line: 'What MIDI actually sends, why it is not audio, and how controller and pitch-bend data work.' },
    { href: '/topic/synthesis', name: 'Synthesis', line: 'Building a sound from an oscillator up. The most satisfying place to start if you are new to this.' },
];

export default function WhatIsMusicTech() {
    return (
        <main style={{ background: ED.page, color: ED.ink, minHeight: '100vh', fontFamily: ED.sans }}>
            <div style={{ maxWidth: '46rem', margin: '0 auto', padding: '4rem 1.5rem 6rem' }}>

                <p style={{ fontFamily: ED.mono, fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: ED.inkFade, margin: 0 }}>
                    Pearson Edexcel · 9MT0
                </p>

                <h1 style={{ fontFamily: ED.serif, fontSize: 'clamp(2.1rem, 5.5vw, 3.4rem)', lineHeight: 1.08, letterSpacing: '-0.02em', margin: '0.75rem 0 0', fontWeight: 400 }}>
                    What is A-level Music&nbsp;Technology?
                </h1>

                <p style={{ fontSize: '1.15rem', lineHeight: 1.65, color: ED.inkSoft, margin: '1.5rem 0 0' }}>
                    It is the study of how recorded music is actually made — and then the
                    practice of making it. Half the qualification is work you produce in a
                    studio. The other half is two written papers that ask you to listen to a
                    record and explain how it was built.
                </p>

                <p style={{ fontSize: '1.15rem', lineHeight: 1.65, color: ED.inkSoft, margin: '1rem 0 0' }}>
                    It is not a performance A-level, and you are not required to be a
                    virtuoso on an instrument. You do need to be genuinely curious about
                    sound, and willing to be precise about it.
                </p>

                <hr style={{ border: 0, borderTop: `1px solid ${ED.rule}`, margin: '3rem 0' }} />

                <h2 style={{ fontFamily: ED.serif, fontSize: '1.75rem', fontWeight: 400, letterSpacing: '-0.01em', margin: 0 }}>
                    The four components
                </h2>
                <p style={{ color: ED.inkFade, fontSize: '0.95rem', margin: '0.5rem 0 2rem' }}>
                    Two you make over time. Two you sit in an exam hall.
                </p>

                <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '1.75rem' }}>
                    {COMPONENTS.map((c) => (
                        <li key={c.n} style={{ display: 'grid', gridTemplateColumns: '2.5rem 1fr', gap: '1rem', alignItems: 'start' }}>
                            <span style={{ fontFamily: ED.serif, fontSize: '2rem', lineHeight: 1, color: ED.rule }}>{c.n}</span>
                            <div>
                                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, letterSpacing: '-0.005em' }}>
                                    {c.name}
                                    <span style={{ fontFamily: ED.mono, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: ED.inkFade, marginLeft: '0.6rem', whiteSpace: 'nowrap' }}>
                                        {c.kind}
                                    </span>
                                </h3>
                                <p style={{ color: ED.inkSoft, lineHeight: 1.6, margin: '0.35rem 0 0' }}>{c.body}</p>
                            </div>
                        </li>
                    ))}
                </ol>

                <hr style={{ border: 0, borderTop: `1px solid ${ED.rule}`, margin: '3rem 0' }} />

                {/* The scope statement. Honest about what this site is not, so it cannot
                    be read as a claim to cover the whole A-level. */}
                <h2 style={{ fontFamily: ED.serif, fontSize: '1.75rem', fontWeight: 400, letterSpacing: '-0.01em', margin: 0 }}>
                    What this site covers
                </h2>
                <div style={{ borderLeft: `2px solid ${ED.accent}`, paddingLeft: '1.25rem', margin: '1.25rem 0 0' }}>
                    <p style={{ lineHeight: 1.65, color: ED.inkSoft, margin: 0 }}>
                        This site is built for <strong style={{ color: ED.ink, fontWeight: 600 }}>Components 3 and 4</strong> — the two
                        written papers. That is where the marks are most often lost, and it is
                        the part of the course with the least good material available.
                    </p>
                    <p style={{ lineHeight: 1.65, color: ED.inkSoft, margin: '0.85rem 0 0' }}>
                        It does <strong style={{ color: ED.ink, fontWeight: 600 }}>not</strong> help you with Components 1 and 2. Your
                        recording and your composition are coursework: they are made in your
                        own studio time, marked in your school and moderated externally. No
                        website can do that part for you.
                    </p>
                </div>

                <hr style={{ border: 0, borderTop: `1px solid ${ED.rule}`, margin: '3rem 0' }} />

                <h2 style={{ fontFamily: ED.serif, fontSize: '1.75rem', fontWeight: 400, letterSpacing: '-0.01em', margin: 0 }}>
                    Is it hard?
                </h2>
                <p style={{ lineHeight: 1.65, color: ED.inkSoft, margin: '1rem 0 0' }}>
                    Honestly, yes — the top grades are unusually rare in this subject
                    compared with most A-levels. That is worth knowing before you pick it,
                    and it is also why the written papers reward preparation so heavily.
                    There is a full breakdown of how the grades actually fall:
                </p>
                <p style={{ margin: '1rem 0 0' }}>
                    <a
                        href="https://musictechstudio.co.uk/exam-difficulty"
                        style={{ color: ED.accent, fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: '3px' }}
                    >
                        How hard is an A* in Music Technology?
                    </a>
                </p>

                <hr style={{ border: 0, borderTop: `1px solid ${ED.rule}`, margin: '3rem 0' }} />

                <h2 style={{ fontFamily: ED.serif, fontSize: '1.75rem', fontWeight: 400, letterSpacing: '-0.01em', margin: 0 }}>
                    Where to start
                </h2>
                <p style={{ color: ED.inkFade, fontSize: '0.95rem', margin: '0.5rem 0 1.75rem' }}>
                    Three topics, open to anyone, complete rather than sampled.
                </p>

                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '1rem' }}>
                    {START.map((s) => (
                        <li key={s.href}>
                            <Link
                                href={s.href}
                                style={{ display: 'block', border: `1px solid ${ED.rule}`, borderRadius: '10px', padding: '1.1rem 1.25rem', textDecoration: 'none', color: 'inherit', background: '#fbfaf8' }}
                            >
                                <span style={{ fontWeight: 600, fontSize: '1.02rem' }}>{s.name}</span>
                                <span style={{ display: 'block', color: ED.inkSoft, lineHeight: 1.55, marginTop: '0.3rem', fontSize: '0.95rem' }}>{s.line}</span>
                            </Link>
                        </li>
                    ))}
                </ul>

                <p style={{ color: ED.inkFade, fontSize: '0.9rem', lineHeight: 1.6, margin: '2.5rem 0 0' }}>
                    Everything on those three topics is free to use, with nothing held back.
                    What a subscription adds is that your work is remembered — what you have
                    covered, what you got right, and what to come back to.
                </p>

                <p style={{ margin: '2.5rem 0 0' }}>
                    <Link href="/" style={{ fontFamily: ED.mono, fontSize: '0.8rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: ED.inkFade, textDecoration: 'none' }}>
                        ← All topics and tools
                    </Link>
                </p>
            </div>
        </main>
    );
}
