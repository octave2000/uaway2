import type { Metadata } from "next";
import "./globals.css";
import { Open_Sans } from "next/font/google";

const fontSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});


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
      <body className={`${fontSans.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}


