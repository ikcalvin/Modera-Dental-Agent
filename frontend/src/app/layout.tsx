import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import clsx from "clsx";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Modera Dental | Modern Dental Care & AI Receptionist",
  description:
    "Experience the future of dental care. Book appointments instantly 24/7 with our bilingual AI receptionist. Serving the community with advanced orthodontics and cosmetic dentistry.",
  keywords: [
    "Dentist",
    "AI Receptionist",
    "Dental Clinic",
    "Orthodontics",
    "Cosmetic Dentistry",
    "Emergency Dentist",
  ],
  openGraph: {
    title: "Modera Dental | Future of Dentistry",
    description:
      "Book your appointment instantly with our 24/7 AI receptionist.",
    type: "website",
    locale: "en_US",
    // images: ['/og-image.jpg'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={clsx(outfit.className, "antialiased bg-[#020617]")}>
        {children}
      </body>
    </html>
  );
}
