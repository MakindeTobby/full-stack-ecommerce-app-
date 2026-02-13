import { eq, like } from "drizzle-orm";
import { products } from "@/db/schema";
import { db } from "@/db/server";

export type ProductsPageOpts = {
  page?: number;
  pageSize?: number;
  categorySlug?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
};

export type AdminProductsPageOpts = ProductsPageOpts & {
  q?: string;
  status?: "all" | "published" | "draft";
};

export function isMissingCategorySchema(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const lower = message.toLowerCase();
  return (
    lower.includes('relation "categories" does not exist') ||
    lower.includes('column "products.category_id" does not exist')
  );
}

export async function generateUniqueSlug(baseSlug: string) {
  const existing = await db
    .select()
    .from(products)
    .where(eq(products.slug, baseSlug));
  if (existing.length === 0) return baseSlug;

  const slugRows = await db
    .select({ slug: products.slug })
    .from(products)
    .where(like(products.slug, `${baseSlug}%`));

  const slugList = slugRows.map((r) => r.slug);
  let counter = 2;
  let candidate = `${baseSlug}-${counter}`;
  while (slugList.includes(candidate)) {
    counter++;
    candidate = `${baseSlug}-${counter}`;
  }
  return candidate;
}
