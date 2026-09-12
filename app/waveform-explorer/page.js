/**
 * Retired 2026-09-12: the Waveform Drawing Explorer is replaced by Squared
 * Paper (/squared-paper), built to the Bench Standard as the tenth bench and
 * the second for 2.5 Numeracy. The old page was silent, scrolled, and had no
 * grid of its own. Removed from the registry, from lib/topics.js's 2.5
 * Numeracy band and from the free manifest; the sitemap derives from the
 * registry. Same stub pattern as subtractive-synth-explorer: a canonical for
 * search engines, a refresh for a person holding the old link. The Week 01
 * Class Tasks page links this id, so the link keeps working.
 */

const TARGET = 'https://resources.musictechstudio.co.uk/squared-paper';

export const metadata = {
    title: 'Retired: Waveform Drawing Explorer',
    robots: { index: false, follow: true },
    alternates: { canonical: TARGET },
};

export default function RetiredPage() {
    return (
        <>
        {/* metadata.other renders name="refresh", which browsers ignore —
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
