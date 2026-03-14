import { Geist, Geist_Mono } from "next/font/google";
import { Instrument_Serif } from "next/font/google";
import "./globals.css";
import { ContextMenuProvider } from "@/components/ContextMenu";

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
        className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} antialiased`}
      >
        <ContextMenuProvider>
          {children}
        </ContextMenuProvider>
      </body>
    </html>
  );
}
