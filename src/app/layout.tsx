import type { Metadata } from "next";
import { Poppins, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Charlie Reviews",
  description: "AI-powered code review",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${poppins.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-lg">
          <div className="mx-auto max-w-7xl px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm tracking-tight">
                  CR
                </div>
                <span className="font-semibold text-base tracking-tight">Charlie Reviews</span>
              </Link>
            </div>
          </div>
        </header>
        <main className="flex-1 mx-auto w-full max-w-7xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
