import { Hanken_Grotesk } from 'next/font/google';

// The member topic room's sentence face (grades-dashboard
// app/member/(loop)/topics/_shared/fonts.js). A bench is opened from that
// room and should read as part of it, so the bench frame carries the face
// itself rather than borrowing this site's Manrope. Labels stay in the
// site-wide JetBrains Mono (--font-jbmono, app/layout.js).
export const benchSans = Hanken_Grotesk({
    subsets: ['latin'],
    weight: ['400', '500', '600'],
    variable: '--bench-sans',
    display: 'swap',
});
