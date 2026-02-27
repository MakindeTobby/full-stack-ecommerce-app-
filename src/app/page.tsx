import Image from "next/image";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import { getStoreCategoriesWithCounts, getStoreProductsPage } from "@/lib/db/queries/product";
import { resolveFlashPricesForProducts } from "@/lib/pricing/resolveFlashPrice";
import Hero from "@/components/home/Hero";
import Category from "@/components/home/Category";
import FlashSaleBanner from "@/components/home/FlashSaleBanner";
import Trending from "@/components/home/Trending";
import Banner from "@/components/home/Banner";
import Badges from "@/components/home/Badges";
import Reviews from "@/components/home/Reviews";
import Newsletter from "@/components/home/Newsletter";
import Footer from "@/components/home/Footer";
import WhatsappIcon from "@/components/shared/WhatsappIcon";
// import { useEffect, useState } from "react";

export default async function Home() {
  const [{ rows: featured }, categories] = await Promise.all([
    getStoreProductsPage({ page: 1, pageSize: 6 }),
    getStoreCategoriesWithCounts(),
  ]);
  const flashSecs = 4 * 3600 + 23 * 60 + 47
  // ── Flash countdown interval
  // useEffect(() => {
  //   const id = setInterval(() => {
  //     setFlashSecs((s) => (s <= 0 ? 0 : s - 1));
  //   }, 1000);
  //   return () => clearInterval(id);
  // }, []);
  const hrs = Math.floor(flashSecs / 3600);
  const mins = Math.floor((flashSecs % 3600) / 60);
  const secs = flashSecs % 60;
  const productIds = featured.map((r) => String(r.id));
  const basePriceMap: Record<string, number> = {};
  for (const r of featured) {
    basePriceMap[String(r.id)] = Number(r.base_price ?? 0);
  }
  const flashMap = await resolveFlashPricesForProducts(
    productIds,
    basePriceMap,
  );


  return (
    <AppShell>
      <div  >

        {/* HERO */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6" >

          <Hero />
        </div>

        {/* CATEGORIES */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6" >

          <Category categories={categories} />
        </div>

        {/* FLASH SALE BANNER */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6" >

          <FlashSaleBanner />
        </div>

        {/* TRENDING PRODUCTS */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6" >

          <Trending featured={featured} flashMap={flashMap} />
        </div>
        {/* EDITORIAL BANNERS */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6" >

          <Banner />
        </div>
        {/* TRUST BADGES */}
        <Badges />
        {/* REVIEWS */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6" >

          <Reviews />
        </div>
        {/* NEWSLETTER */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6" >

          <Newsletter />
        </div>
        {/* FOOTER */}
      </div>
      <Footer />
      <WhatsappIcon href="https://wa.me/2348033333333" />
    </AppShell>
  );
}
