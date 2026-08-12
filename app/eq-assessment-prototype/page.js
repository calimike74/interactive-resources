/**
 * Retired 2026-08-12 (WO-08). Scored 2/5 in the pre-launch audit — superseded
 * by eq8-assessment and autofilter-assessment, and the word "prototype" had
 * no business sitting in a paid product's resource title. Removed from the
 * registry and from lib/topics.js's 1.11 EQ band; removed from app/sitemap.js
 * automatically (it derives resource URLs from the registry).
 *
 * A stub rather than a deletion, matching the pattern set for the orientation
 * page (see app/what-is-a-level-music-technology/page.js): the URL was live
 * and indexable, so a bare 404 could cost a search listing or an old link.
 * The canonical tag is what a search engine acts on; the meta refresh is
 * what a person holding the old link needs. Sent to the 1.11 EQ topic band,
 * where the resource used to live.
 *
 * This site is a static export, so no server redirect is available.
 */

const TARGET = 'https://resources.musictechstudio.co.uk/topic/eq';

export const metadata = {
    title: 'Retired — EQ Assessment (Prototype)',
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
                    Go to the 1.11 EQ topic page
                </a>
            </p>
        </main>
        </>
    );
}
