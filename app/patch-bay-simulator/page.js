/**
 * Retired 2026-08-12 (WO-08). Scored 2/5, not stranger-ready, and had been
 * historically mislabelled "2.5 Recording" (2.5 is Numeracy — see the note in
 * lib/access.js). Retains internal-classroom value and can return rebuilt
 * post-launch; removed from the registry and from lib/topics.js's 2.3 Signals
 * band; removed from app/sitemap.js automatically (it derives resource URLs
 * from the registry). The Learn chapter that used to send its outro here
 * (lib/learn/topics/leads-and-signals.js) now points at signal-chain-eurorack.
 *
 * A stub rather than a deletion, matching the pattern set for the orientation
 * page (see app/what-is-a-level-music-technology/page.js): the URL was live
 * and indexable, so a bare 404 could cost a search listing or an old link.
 * The canonical tag is what a search engine acts on; the meta refresh is
 * what a person holding the old link needs. Sent to the 2.3 Signals topic
 * band, where the resource used to live.
 *
 * This site is a static export, so no server redirect is available.
 */

const TARGET = 'https://resources.musictechstudio.co.uk/topic/leads-and-signals';

export const metadata = {
    title: 'Retired: Patch Bay Simulator',
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
                    Go to the 2.3 Signals topic page
                </a>
            </p>
        </main>
        </>
    );
}
