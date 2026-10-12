import { Pwa } from "@/components/pwa";
import { Toaster } from "@/components/ui/sonner";
import type { Metadata, Viewport } from "next";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";

import { uploadRouter } from "@/app/api/uploadthing/core";

import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";

export const viewport: Viewport = {
  themeColor: "#f7f8fa",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "UAWAY - Premium Ride Sharing",
  description: "Share rides, save costs, and travel across Kenya with ease.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "UAWAY",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <NextSSRPlugin routerConfig={extractRouterConfig(uploadRouter)} />
          <Pwa />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
