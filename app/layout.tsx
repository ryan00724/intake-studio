import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Intake Studio",
    template: "%s | Intake Studio",
  },
  description:
    "Build beautiful, guided client intake forms. Drag-and-drop editor, branded themes, AI generation, and instant publishing.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://intakestudio.app"
  ),
  openGraph: {
    siteName: "Intake Studio",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

import { ThemeProvider } from "@/src/components/theme/ThemeProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300 ease-in-out`}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
