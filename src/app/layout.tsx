import type { Metadata } from "next";
import localFont from "next/font/local";
import { prisma } from "@/lib/prisma";
import "./globals.css";

// Inter, self-hosted. Google ships it as a single variable file covering the
// whole 100–900 range, so one 48KB asset gives us real 400/500/600/700 rather
// than browser-synthesised weights.
const inter = localFont({
  variable: "--font-inter",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "sans-serif"],
  src: [{ path: "../fonts/inter-variable.woff2", weight: "100 900", style: "normal" }],
});

export const metadata: Metadata = {
  title: "Nashi Katsu — Pesan Makanan Online",
  description: "Pilih menu, chat dengan kasir, bayar QRIS, dan pantau antrian pesananmu secara langsung.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const setting = await prisma.siteSetting.findUnique({ where: { id: "singleton" } });
  const theme = setting?.themeName && setting.themeName !== "default" ? setting.themeName : undefined;

  return (
    <html lang="id" data-theme={theme} className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
