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
          <div className="overflow-hidden bg-slate-900 py-1.5" id="annBar">
            <div className="ticker flex gap-14 whitespace-nowrap">
              {[
                "Free delivery on orders above ₦15,000",
                "New arrivals every Friday",
                "Flash sales — limited stock",
                "Authentic products only",
                "Pay on delivery available",
                "Free delivery on orders above ₦15,000",
                "New arrivals every Friday",
                "Flash sales — limited stock",
                "Authentic products only",
                "Pay on delivery available",
              ].map((t, idx) => (
                <span key={idx} className="text-[11px] text-slate-400">
                  <span className="mr-2 text-violet-400">✦</span>
                  {t}
                </span>
              ))}
            </div>
          </div>
          <Toaster position="top-center" reverseOrder={false} />
          <PromoOrchestrator />
          <PwaRegister />
          {children}
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}
