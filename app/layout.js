import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CursorGlow from "@/components/CursorGlow";
import ContactButton from "@/components/ContactButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Interactive Resources | A-Level Music Technology",
  description: "Interactive learning tools for Pearson Edexcel A-Level Music Technology. Practice EQ, synthesis, dynamics, and more.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <CursorGlow />
        <ContactButton />
        {children}
      </body>
    </html>
  );
}
