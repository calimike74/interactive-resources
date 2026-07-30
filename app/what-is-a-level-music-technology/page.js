/**
 * Retired 2026-07-30. This page moved to the hub.
 *
 * It was built here first, which Mike pushed back on: if musictechstudio is the
 * one address he sends parents, students, teachers and schools to, then the page
 * explaining what the subject IS cannot live on the subdomain full of tools. It
 * now sits at the top of the hub, on its own tab —
 * grades-dashboard/app/what-is-a-level-music-technology.
 *
 * A stub rather than a deletion. The page was live for a matter of hours, so a
 * 404 would probably cost nothing — but "probably" is doing real work in that
 * sentence, and a canonical plus a redirect costs one static file. Removed from
 * app/sitemap.js at the same time: a page that points elsewhere has no business
 * being advertised in a sitemap.
 *
 * This site is a static export, so no server redirect is available. The canonical
 * tag is what a search engine acts on; the meta refresh is what a person holding
 * the old link needs.
 */

const HOME = 'https://musictechstudio.co.uk/what-is-a-level-music-technology';

export const metadata = {
    title: 'Moved — What is A-level Music Technology?',
    robots: { index: false, follow: true },
    alternates: { canonical: HOME },
    other: { refresh: `0; url=${HOME}` },
};

export default function MovedPage() {
    return (
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
            <p style={{ margin: 0, fontSize: '1.05rem' }}>This page has moved.</p>
            <p style={{ margin: 0 }}>
                <a href={HOME} style={{ color: '#2d5d4f' }}>
                    What is A-level Music Technology?
                </a>
            </p>
        </main>
    );
}
