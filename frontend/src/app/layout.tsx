import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import clsx from "clsx";
import { Analytics } from "@vercel/analytics/react";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Modera Dental | Modern Dental Care & AI Receptionist",
  description:
    "Experience the future of dental care with Modera Dental. 24/7 AI receptionist, instant booking, and comprehensive oral health services.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${outfit.className}`}>
      <body className="antialiased bg-[#020617] text-slate-200">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
