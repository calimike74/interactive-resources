import { Geist, Geist_Mono } from "next/font/google";
import { Instrument_Serif, Fraunces, Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ContextMenuProvider } from "@/components/ContextMenu";
import { PHProvider } from "./posthog-provider";
import CookieBanner from "@/components/CookieBanner";
import SiteFooter from "@/components/SiteFooter";
import ReturnRail from "@/components/ReturnRail";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jbmono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  metadataBase: new URL('https://resources.musictechstudio.co.uk'),
  title: {
    default: 'Interactive Resources | A-Level Music Technology',
    template: '%s | Interactive Resources',
  },
  description: "Interactive learning tools for Pearson Edexcel A-Level Music Technology. Practice EQ, synthesis, dynamics, and more.",
  openGraph: {
    title: 'Interactive Resources | A-Level Music Technology',
    description: 'Interactive learning tools for Pearson Edexcel A-Level Music Technology. Practice EQ, synthesis, dynamics, and more.',
    url: 'https://resources.musictechstudio.co.uk',
    siteName: 'Interactive Resources | A-Level Music Technology',
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Interactive Resources | A-Level Music Technology',
    description: 'Interactive learning tools for Pearson Edexcel A-Level Music Technology. Practice EQ, synthesis, dynamics, and more.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} ${fraunces.variable} ${manrope.variable} ${jetBrainsMono.variable} antialiased`}
      >
        <PHProvider>
          <ContextMenuProvider>
            {children}
            <SiteFooter />
          </ContextMenuProvider>
        </PHProvider>
        <CookieBanner />
        <ReturnRail />
      </body>
    </html>
  );
}
