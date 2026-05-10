'use client';
import Link from 'next/link';
import { theme } from '@/lib/theme';
import { openCookiePreferences } from '@/lib/consent';

export default function PrivacyPage() {
    const t = theme.light;

    return (
        <main
            style={{
                background: t.bg.primary,
                color: t.text.primary,
                minHeight: '100vh',
                padding: '48px 20px 96px',
                fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)',
            }}
        >
            <article style={{ maxWidth: 720, margin: '0 auto', lineHeight: 1.65 }}>
                <Link
                    href="/"
                    style={{
                        display: 'inline-block',
                        marginBottom: 32,
                        fontSize: 14,
                        color: t.text.tertiary,
                        textDecoration: 'none',
                    }}
                >
                    ← Back to home
                </Link>

                <h1 style={{ fontSize: 32, fontWeight: 700, margin: '0 0 8px' }}>Privacy notice</h1>
                <p style={{ fontSize: 14, color: t.text.tertiary, margin: '0 0 40px' }}>
                    Last updated: 10 May 2026
                </p>

                <Section title="Who we are" t={t}>
                    <p>
                        Music Tech Studio is operated by Mike Lehnert, a Music Technology teacher.
                        For the purposes of UK GDPR and PECR, Music Tech Studio is the <strong>data controller</strong> for personal data collected through this site.
                    </p>
                    <p>Contact: <a href="mailto:calimike@me.com" style={{ color: t.text.link }}>calimike@me.com</a></p>
                </Section>

                <Section title="What we collect" t={t}>
                    <ul>
                        <li>Your student token (pseudonymous identifier, set when you log in via grades.musictechstudio.co.uk)</li>
                        <li>Resource progress — which interactive resources you've used and engagement with them</li>
                        <li>Anonymous analytics events (page views, interaction events) — only with your consent</li>
                    </ul>
                </Section>

                <Section title="Why we collect it (legal basis)" t={t}>
                    <ul>
                        <li><strong>Legitimate interests</strong> — running curriculum-aligned learning resources and tracking your progress.</li>
                        <li><strong>Consent</strong> — for optional analytics cookies.</li>
                    </ul>
                </Section>

                <Section title="Who we share it with (sub-processors)" t={t}>
                    <ul>
                        <li><strong>Vercel</strong> (Frankfurt, EU) — hosting</li>
                        <li><strong>Supabase</strong> (EU region) — data sync via grades-dashboard</li>
                        <li><strong>PostHog</strong> (Frankfurt, EU) — anonymous analytics, only with your consent</li>
                    </ul>
                    <p>We do not sell or rent your personal data, and we do not share it with advertisers.</p>
                </Section>

                <Section title="How long we keep it" t={t}>
                    <ul>
                        <li>Progress data — kept while you have an active student account</li>
                        <li>Anonymous analytics — 12 months</li>
                    </ul>
                </Section>

                <Section title="Your rights" t={t}>
                    <p>Under UK GDPR you have the right to access, correct, delete, restrict, export, or withdraw consent for your personal data.</p>
                    <p>
                        To exercise any of these, email <a href="mailto:calimike@me.com" style={{ color: t.text.link }}>calimike@me.com</a>.
                        You also have the right to complain to the{' '}
                        <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" style={{ color: t.text.link }}>
                            UK Information Commissioner's Office
                        </a>.
                    </p>
                </Section>

                <Section title="Cookies" t={t}>
                    <p><strong>Optional (with consent)</strong> — PostHog analytics cookie.</p>
                    <p>Any consent given on grades.musictechstudio.co.uk applies here too (and vice versa) because the consent cookie is set at the parent domain.</p>
                    <p>
                        <button
                            type="button"
                            onClick={() => openCookiePreferences()}
                            style={{
                                background: 'transparent',
                                color: t.text.link,
                                border: 'none',
                                padding: 0,
                                textDecoration: 'underline',
                                cursor: 'pointer',
                                font: 'inherit',
                            }}
                        >
                            Change cookie preferences
                        </button>
                    </p>
                </Section>

                <Section title="Changes to this notice" t={t}>
                    <p>We update this page when we change how we handle data. The "last updated" date reflects the most recent change.</p>
                </Section>
            </article>
        </main>
    );
}

function Section({ title, children, t }) {
    return (
        <section style={{ margin: '32px 0' }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 12px' }}>{title}</h2>
            <div style={{ color: t.text.secondary, fontSize: 15 }}>{children}</div>
        </section>
    );
}
