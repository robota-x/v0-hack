import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/bottom-nav";
import { TopAppBar } from "@/components/top-app-bar";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Creator Companion",
  description:
    "A calm companion that watches your creator sphere and surfaces the trends that matter to you.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#38bdf8",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${plusJakarta.variable} bg-background`}>
      <body className="bg-background font-sans text-foreground antialiased">
        <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
          <TopAppBar />
          <main className="flex-1 px-4 pb-28 pt-24">{children}</main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
