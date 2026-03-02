// app/products/[slug]/page.tsx
import { eq } from "drizzle-orm";
import {
  getServerSession,
  type NextAuthOptions,
  type Session,
} from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // adjust path if different
import AppShell from "@/components/layout/AppShell";
import ProductDescription from "@/components/ProductDescription";
import ProductDetailClient from "@/components/ProductDetailClient";
import { categories, product_media, product_variants, products } from "@/db/schema";
import { db } from "@/db/server";
import { resolveFlashPrice } from "@/lib/pricing/resolveFlashPrice";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function ProductPage({ params }: Props) {
  const slug = (await params).slug;
  const product = await db
    .select({
      id: products.id,
      slug: products.slug,
      name_en: products.name_en,
      description: products.description,
      sku: products.sku,
      base_price: products.base_price,
      published: products.published,
      category_name: categories.name,
      category_slug: categories.slug,
    })
    .from(products)
    .leftJoin(categories, eq(products.category_id, categories.id))
    .where(eq(products.slug, slug))
    .limit(1)
    .then((r) => r[0]);

  //   console.log("Product fetch/ed:", product);

  if (!product || !product.published) {
    return <div className="p-6">Product not found</div>;
  }

  const medias = await db
    .select()
    .from(product_media)
    .where(eq(product_media.product_id, product.id))
    .orderBy(product_media.position);
  const variants = await db
    .select()
    .from(product_variants)
    .where(eq(product_variants.product_id, product.id));

  const variantsForClient = variants.map((v: any) => ({
    id: v.id,
    sku: v.sku,
    barcode: v.barcode,
    price: String(v.price ?? product.base_price),
    stock: v.stock,
    attributes: v.attributes ? JSON.parse(v.attributes) : {},
  }));

  // get session server-side and pass userId to client
  const session: Session | null = await getServerSession(
    authOptions as NextAuthOptions,
  );

  const userId = session?.user?.id || null;
  const basePrice = Number(product.base_price ?? 0);
  const { price: displayPrice, activeFlash } = await resolveFlashPrice(
    String(product.id),
    basePrice,
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-5 pb-24 sm:px-6 sm:py-6">
        <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 sm:mb-6 sm:text-xs">
          <a href="/" className="transition hover:text-violet-600">
            Home
          </a>
          <span>/</span>
          <a href="/products" className="transition hover:text-violet-600">
            Shop
          </a>
          {product.category_name ? (
            <>
              <span>/</span>
              <a
                href={
                  product.category_slug
                    ? `/products?category=${encodeURIComponent(product.category_slug)}`
                    : "/products"
                }
                className="transition hover:text-violet-600"
              >
                {product.category_name}
              </a>
            </>
          ) : null}
          <span>/</span>
          <span className="font-medium text-slate-800">{product.name_en}</span>
        </nav>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:gap-10">
          <div className="flex flex-col gap-3">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
                {activeFlash ? (
                  <span className="inline-flex items-center rounded-md bg-red-500 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm">
                    Flash Sale
                  </span>
                ) : null}
                {product.sku ? (
                  <span className="inline-flex rounded-md bg-violet-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-white">
                    {product.sku}
                  </span>
                ) : null}
              </div>

              <div className="relative aspect-square">
                {medias.length ? (
                  <img
                    id="main-product-image"
                    src={medias[0].url}
                    data-default-src={medias[0].url}
                    alt={product.name_en}
                    className="h-full w-full object-cover transition duration-500 hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-100">
                    No image
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-600">
              {product.category_name ?? "Curated selection"}
            </div>
            <h1 className="font-display mt-2 text-[1.7rem] leading-tight text-slate-900 sm:text-3xl">
              {product.name_en}
            </h1>
            <ProductDescription text={product.description} />

            <ProductDetailClient
              productId={product.id}
              productName={product.name_en}
              basePrice={String(product.base_price)}
              variants={variantsForClient}
              userId={userId}
              displayPrice={displayPrice}
              activeFlash={activeFlash}
              medias={medias} // <-- pass medias into client for thumbnails
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
