import { Manrope, Playfair_Display } from 'next/font/google';

// The bench's faces, from Mike's Fonts-Try note (Professional/Planning-and-
// Admin/Notes/C3+C4 Site/Fonts-Try.md, 21 Aug 2026): Manrope for every
// sentence and button ("really good"), Playfair Display for the bench's
// name and the drawer's headings (the face on the Claude Design mock he
// chose), and the site-wide JetBrains Mono (--font-jbmono, app/layout.js)
// for labels and values. Three faces, three jobs.
export const benchSans = Manrope({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
    variable: '--bench-sans',
    display: 'swap',
});

export const benchSerif = Playfair_Display({
    subsets: ['latin'],
    weight: ['500', '600', '700'],
    variable: '--bench-serif',
    display: 'swap',
});
