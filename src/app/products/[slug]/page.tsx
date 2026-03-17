// app/products/[slug]/page.tsx
import { and, eq, ne, sql } from "drizzle-orm";
import {
  getServerSession,
  type NextAuthOptions,
  type Session,
} from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import AppShell from "@/components/layout/AppShell";
import ProductDescription from "@/components/ProductDescription";
import ProductDetailClient from "@/components/ProductDetailClient";
import ProductCard from "@/components/shop/ProductCard";
import {
  categories,
  product_media,
  product_variants,
  products,
} from "@/db/schema";
import { db } from "@/db/server";
import {
  resolveFlashPrice,
  resolveFlashPricesForProducts,
} from "@/lib/pricing/resolveFlashPrice";
import ProductCard2 from "@/components/shop/ProductCard2";
import ProductMedia from "@/components/ProductMedia";

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
      category_id: products.category_id,
      category_name: categories.name,
      category_slug: categories.slug,
    })
    .from(products)
    .leftJoin(categories, eq(products.category_id, categories.id))
    .where(eq(products.slug, slug))
    .limit(1)
    .then((r) => r[0]);

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

  const session: Session | null = await getServerSession(
    authOptions as NextAuthOptions,
  );

  const userId = session?.user?.id || null;
  const basePrice = Number(product.base_price ?? 0);
  const { price: displayPrice, activeFlash } = await resolveFlashPrice(
    String(product.id),
    basePrice,
  );

  const suggestedRows = await db
    .select({
      id: products.id,
      slug: products.slug,
      name_en: products.name_en,
      base_price: products.base_price,
      category_name: categories.name,
      image_url: sql`(
        SELECT url FROM product_media
        WHERE product_media.product_id = products.id
        ORDER BY product_media.position NULLS LAST, product_media.id
        LIMIT 1
      )`,
    })
    .from(products)
    .leftJoin(categories, eq(products.category_id, categories.id))
    .where(
      and(
        eq(products.published, true),
        ne(products.id, product.id),
        product.category_id ? eq(products.category_id, product.category_id) : undefined,
      ),
    )
    .orderBy(products.created_at)
    .limit(4);

  const suggestedProductIds = suggestedRows.map((r) => String(r.id));
  const suggestedBaseMap: Record<string, number> = {};
  for (const r of suggestedRows) {
    suggestedBaseMap[String(r.id)] = Number(r.base_price ?? 0);
  }

  const suggestedFlashMap = await resolveFlashPricesForProducts(
    suggestedProductIds,
    suggestedBaseMap,
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
            <ProductMedia

              productName={product.name_en}
              medias={medias}
            />
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
              medias={medias}
            />
          </div>
        </div>

        {suggestedRows.length > 0 ? (
          <section className="mt-10">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-xl font-semibold text-slate-900">You may also like</h2>
              <a href="/products" className="text-sm font-medium text-violet-600 hover:text-violet-700">
                View more
              </a>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {suggestedRows.map((r) => {
                const pid = String(r.id);
                const fm = suggestedFlashMap[pid] ?? {
                  price: Number(r.base_price ?? 0),
                  activeFlash: null,
                };
                return (
                  <ProductCard2
                    key={pid}
                    id={pid}
                    slug={r.slug}
                    name={r.name_en}
                    categoryName={r.category_name}
                    imageUrl={r.image_url ? String(r.image_url) : null}
                    price={Number(fm.price ?? r.base_price ?? 0)}
                    compareAtPrice={fm.activeFlash ? Number(r.base_price ?? 0) : null}
                    flashEndsAt={fm.activeFlash?.ends_at ?? null}
                    isFlash={Boolean(fm.activeFlash)}
                  />
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}
