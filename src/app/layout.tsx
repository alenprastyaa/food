import type { Metadata } from "next";
import localFont from "next/font/local";
import { prisma } from "@/lib/prisma";
import "./globals.css";

const shippori = localFont({
  variable: "--font-shippori",
  display: "swap",
  fallback: ["Hiragino Mincho ProN", "Yu Mincho", "serif"],
  src: [
    { path: "../fonts/shippori-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/shippori-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/shippori-800.woff2", weight: "800", style: "normal" },
  ],
});

const zen = localFont({
  variable: "--font-zen",
  display: "swap",
  fallback: ["Hiragino Maru Gothic ProN", "system-ui", "sans-serif"],
  src: [
    { path: "../fonts/zen-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/zen-900.woff2", weight: "900", style: "normal" },
  ],
});

const jakarta = localFont({
  variable: "--font-jakarta",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
  src: [
    { path: "../fonts/jakarta-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/jakarta-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/jakarta-700.woff2", weight: "700", style: "normal" },
  ],
});

export const metadata: Metadata = {
  title: "Nashi Katsu — サクサク・カツ！",
  description: "Sistem pemesanan makanan berbasis chat ala Jepang. Nashi Katsu — サクサク・ジューシー・やみつき.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const setting = await prisma.siteSetting.findUnique({ where: { id: "singleton" } });
  const theme = setting?.themeName && setting.themeName !== "default" ? setting.themeName : undefined;

  return (
    <html lang="id" data-theme={theme} className={`${shippori.variable} ${zen.variable} ${jakarta.variable}`}>
      <body>{children}</body>
    </html>
  );
}
