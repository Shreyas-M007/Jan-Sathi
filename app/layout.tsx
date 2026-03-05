import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jan Sathi",
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
        <header className="sticky top-0 z-20 border-b border-white/60 bg-white/70 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <h1 className="bg-gradient-to-r from-indigo-700 to-fuchsia-600 bg-clip-text text-xl font-extrabold text-transparent">
              Jan Sathi
            </h1>
            <div className="flex flex-wrap gap-2 text-sm font-medium">
              <Link className="outline-btn" href="/">
                Login / Register
              </Link>
              <Link className="outline-btn" href="/admin">
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
