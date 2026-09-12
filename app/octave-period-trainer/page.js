/**
 * Retired 2026-09-12 (evening): the Octave Period Trainer is replaced by Squared
 * Paper (/squared-paper), the exam page for 2.5 Numeracy. Mike: "it should be
 * retired, as long as ... what we just replaced it with does the same thing".
 * The trainer explained period, frequency and octave, then showed an octave
 * shift on a slider; Squared Paper asks for the octave drawn and marks it. The
 * explanation lives in Learn (Numeracy ch3). Removed from the registry, from
 * lib/topics.js, the free manifest and the glossary; the Learn outro for ch3
 * points at Squared Paper. Same stub pattern as waveform-explorer.
 */

const TARGET = 'https://resources.musictechstudio.co.uk/squared-paper';

export const metadata = {
    title: 'Retired: Octave Period Trainer',
    robots: { index: false, follow: true },
    alternates: { canonical: TARGET },
};

export default function RetiredPage() {
    return (
        <>
        {/* metadata.other renders name="refresh", which browsers ignore,
            only http-equiv="refresh" fires. App Router hoists this into <head>. */}
        <meta httpEquiv="refresh" content={`0; url=${TARGET}`} />
        <main
            style={{
                minHeight: '60vh',
                display: 'grid',
                placeContent: 'center',
                gap: '0.75rem',
                padding: '4rem 1.5rem',
                textAlign: 'center',
                background: '#f5f4f2',
                color: '#181410',
            }}
        >
            <p style={{ margin: 0, fontSize: '1.05rem' }}>This resource has been retired.</p>
            <p style={{ margin: 0 }}>
                <a href={TARGET} style={{ color: '#2d5d4f' }}>
                    Go to Squared Paper
                </a>
            </p>
        </main>
        </>
    );
}
