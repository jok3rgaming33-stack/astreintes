import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Carte interactive des équipes",
  description: "Visualisation géographique des membres de l'équipe sur OpenStreetMap France",
  icons: {
    icon: "/icon.jpg",
    shortcut: "/icon.jpg",
    apple: "/icon.jpg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="bg-[var(--color-background)]">
      <body className={`${inter.className} h-screen overflow-hidden`}>{children}</body>
    </html>
  );
}
