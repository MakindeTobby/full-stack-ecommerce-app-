import { eq, sql } from "drizzle-orm";
import { categories, products } from "@/db/schema";
import { db } from "@/db/server";
import { slugify } from "@/lib/slugify";

export async function getCategoriesWithCounts() {
  return db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      product_count: sql<number>`COUNT(products.id)::int`,
    })
    .from(categories)
    .leftJoin(products, eq(products.category_id, categories.id))
    .groupBy(categories.id)
    .orderBy(categories.name);
}

export async function createCategory(name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Category name is required");

  const baseSlug = slugify(trimmed);
  if (!baseSlug) throw new Error("Invalid category name");

  let slug = baseSlug;
  let i = 2;
  while (true) {
    const existing = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);
    if (existing.length === 0) break;
    slug = `${baseSlug}-${i++}`;
  }

  await db.insert(categories).values({
    name: trimmed,
    slug,
  });
}

export async function deleteCategory(categoryId: string) {
  await db.transaction(async (tx) => {
    await tx
      .update(products)
      .set({ category_id: null })
      .where(eq(products.category_id, categoryId));
    await tx.delete(categories).where(eq(categories.id, categoryId));
  });
}
