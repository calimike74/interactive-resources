/**
 * Retired 2026-08-30: MIDI Pitch Bend & Controller is replaced by the Piano
 * Roll (/piano-roll), the 1.5 bench built to the Bench Standard. Mike's
 * verdict on this page (Explore 1.5 note): three resources in one, the
 * scrolling "infuriating"; the inline think-then-reveal idea it had lives
 * on in the bench's Teacher tab. Removed from the registry, from
 * lib/topics.js's 1.5 band and from the free manifest; the sitemap derives
 * from the registry. Same stub pattern as graphic-parametric-eq: a
 * canonical for search engines, a refresh for a person holding the old
 * link. Sent to the bench that took its place.
 */

const TARGET = 'https://resources.musictechstudio.co.uk/piano-roll';

export const metadata = {
    title: 'Retired: MIDI Pitch Bend & Controller',
    robots: { index: false, follow: true },
    alternates: { canonical: TARGET },
};

export default function RetiredPage() {
    return (
        <>
        {/* metadata.other renders name="refresh", which browsers ignore;
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
                    Go to the Piano Roll
                </a>
            </p>
        </main>
        </>
    );
}
