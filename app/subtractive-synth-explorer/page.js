/**
 * Retired 2026-09-01: the Subtractive Synthesis Explorer is replaced by the
 * Synth bench (/synth-bench), built to the Bench Standard as the 2D
 * treatment of the retired 3D Inside the Synthesiser (31 Aug estate
 * verdict). Removed from the registry, from lib/topics.js's 1.3 Synthesis
 * band and from the free manifest; the sitemap derives from the registry.
 * Same stub pattern as compressor-explorer: a canonical for search engines,
 * a refresh for a person holding the old link. Sent to the bench that took
 * its place.
 */

const TARGET = 'https://resources.musictechstudio.co.uk/synth-bench';

export const metadata = {
    title: 'Retired: Subtractive Synthesis Explorer',
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
                    Go to the Synth bench
                </a>
            </p>
        </main>
        </>
    );
}
