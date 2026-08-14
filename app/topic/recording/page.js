/**
 * Retired 2026-08-12 (WO-02, spec-truth restructure).
 *
 * This band was "1.1 Recording & Production" — an invented name; none of its
 * three resources was genuinely 1.1. The real 1.1 (Software and Hardware) is
 * now its own band, currently in build. The three resources that used to
 * live here were re-filed to their true homes: stereo-recording-essay to
 * 1.2 Microphones, stereo-panning to 1.10 Stereo, mixing-production to
 * 1.13 Balance and Blend. Full detail:
 * Planning-and-Admin/Interactive-Resources-Upgrade/WO-02-spec-truth-refile.md.
 *
 * A stub rather than a deletion, following the precedent at
 * app/what-is-a-level-music-technology/page.js: this URL has been live and
 * indexable, so a bare 404 would cost real, if unmeasured, search equity and
 * strand anyone who bookmarked it. Pointed at 1.2 Microphones — the true
 * home of the resource this URL's own hero video and description were
 * actually about (recording-hero.mp4, mic technique). Removed from
 * app/sitemap.js at the same time: a page that points elsewhere has no
 * business being advertised in a sitemap.
 *
 * This site is a static export, so no server redirect is available. The
 * canonical tag is what a search engine acts on; the meta refresh is what a
 * person holding the old link needs — and it must be a genuine
 * `http-equiv="refresh"` tag to work in a browser. The metadata API's
 * `other` field cannot produce one (it only emits `<meta name="...">`, which
 * no browser acts on) — confirmed against the precedent this page follows,
 * app/what-is-a-level-music-technology/page.js, whose `other: { refresh }`
 * renders as inert `<meta name="refresh">` in the built export, so that
 * page's redirect has never actually fired for a visitor, only its
 * canonical tag was ever doing anything. Flagged to the team rather than
 * silently fixed there too — out of this file's scope. Rendering the tag
 * directly in JSX below works: Next's App Router hoists any <meta>/<link>
 * a page renders into <head>, and httpEquiv on a real <meta> element is
 * honoured by browsers.
 */

const DESTINATION = 'https://resources.musictechstudio.co.uk/topic/microphones';

export const metadata = {
    title: 'Moved: C4 · 1.2 Microphones',
    robots: { index: false, follow: true },
    alternates: { canonical: DESTINATION },
};

export default function MovedTopicPage() {
    return (
        <>
        <meta httpEquiv="refresh" content={`0; url=${DESTINATION}`} />
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
            <p style={{ margin: 0, fontSize: '1.05rem' }}>This topic has moved.</p>
            <p style={{ margin: 0 }}>
                <a href="/topic/microphones" style={{ color: '#2d5d4f' }}>
                    C4 · 1.2 Microphones →
                </a>
            </p>
        </main>
        </>
    );
}
