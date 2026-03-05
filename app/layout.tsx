import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "CivicSense AI",
  description: "AI-powered public issue reporting and resolution tracker"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-slate-200 bg-white">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <h1 className="text-xl font-semibold text-slate-900">CivicSense AI</h1>
            <div className="flex gap-3 text-sm font-medium">
              <Link className="rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-100" href="/">
                Report Issue
              </Link>
              <Link className="rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-100" href="/admin">
                Admin Dashboard
              </Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
