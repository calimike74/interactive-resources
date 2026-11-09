/**
 * Retired 2026-11-09 (Mike: take the old resources off). Signal Chain Builder is
 * replaced by Digital and Analogue. Removed from the registry, lib/topics.js and the
 * free manifest; same stub pattern as midi-pitch-bend-controller.
 */

const TARGET = 'https://resources.musictechstudio.co.uk/topic/digital-analogue';

export const metadata = {
    title: 'Retired: Signal Chain Builder',
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
                    Go to Digital and Analogue
                </a>
            </p>
        </main>
        </>
    );
}
