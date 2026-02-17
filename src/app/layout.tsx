import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import NextAuthSessionProvider from "@/components/NextAuthSessionProvider";
import PromoOrchestrator from "@/components/PromoOrchestrator";
import PwaRegister from "@/components/PwaRegister";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Queen Beulah",
  description: "Premium catalog and shopping experience.",
  applicationName: "Queen Beulah",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#111111",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextAuthSessionProvider>
          <Toaster position="top-center" reverseOrder={false} />
          <PromoOrchestrator />
          <PwaRegister />
          {children}
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}
