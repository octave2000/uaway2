import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Uaway Starter",
  description: "Starter kit with Auth.js, Google OAuth, magic links, and credentials auth on Drizzle + Postgres.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">{children}</body>
    </html>
  );
}
