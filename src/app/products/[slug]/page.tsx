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
import { product_media, product_variants, products } from "@/db/schema";
import { db } from "@/db/server";
import { resolveFlashPrice } from "@/lib/pricing/resolveFlashPrice";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function ProductPage({ params }: Props) {
  const slug = (await params).slug;
  const product = await db
    .select()
    .from(products)
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
      <div className="qb-page">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <div className="qb-detail-card">
              <div className="qb-detail-image-frame">
                <div className="qb-detail-seal">Seal</div>
                {medias.length ? (
                  <img
                    id="main-product-image"
                    src={medias[0].url}
                    data-default-src={medias[0].url}
                    alt={product.name_en}
                    className="qb-detail-image"
                  />
                ) : (
                  <div className="flex h-[420px] w-full items-center justify-center bg-gray-100">
                    No image
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="qb-detail-card">
            <div className="qb-detail-kicker">
              {product.sku ? `SKU ${product.sku}` : "Curated selection"}
            </div>
            <h1 className="qb-detail-title">{product.name_en}</h1>
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
