import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "../src/db/server";
import { categories, product_media, product_variants, products } from "../src/db/schema";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const UNSPLASH_IMAGES = [
  "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1614253429340-98120bd6d5e2?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=1400&q=80",
] as const;

const COLORS = ["Black", "Dark Brown", "Tan", "Burgundy", "Navy"] as const;

async function main() {
  const stamp = Date.now();

  const categoryRow = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .limit(1)
    .then((r) => r[0] ?? null);

  const insertedIds: string[] = [];

  for (let i = 0; i < 5; i += 1) {
    const color = COLORS[i % COLORS.length];
    const name = `Executive Derby ${color} ${stamp}-${i + 1}`;
    const slug = slugify(name);
    const basePrice = 45000 + i * 2500;

    const [created] = await db
      .insert(products)
      .values({
        slug,
        category_id: categoryRow?.id ?? null,
        name_en: name,
        description:
          "Premium corporate shoe built for comfort and all-day office wear.",
        base_price: basePrice.toFixed(2),
        old_price: (basePrice + 7000).toFixed(2),
        sku: `QB-RUN-${stamp}-${i + 1}`,
        published: true,
      })
      .returning({ id: products.id, name: products.name_en });

    insertedIds.push(created.id);

    await db.insert(product_variants).values([
      {
        product_id: created.id,
        sku: `QB-RUN-${stamp}-${i + 1}-42`,
        attributes: JSON.stringify({ color, size: "42" }),
        price: basePrice.toFixed(2),
        stock: 12,
      },
      {
        product_id: created.id,
        sku: `QB-RUN-${stamp}-${i + 1}-43`,
        attributes: JSON.stringify({ color, size: "43" }),
        price: (basePrice + 1500).toFixed(2),
        stock: 10,
      },
    ]);

    await db.insert(product_media).values([
      {
        product_id: created.id,
        url: UNSPLASH_IMAGES[i],
        type: "image",
        position: 0,
        alt_text: `${created.name} main image`,
      },
    ]);
  }

  const recents = await db
    .select({ id: products.id, name: products.name_en, slug: products.slug, created_at: products.created_at })
    .from(products)
    .orderBy(sql`${products.created_at} DESC`)
    .limit(5);

  console.log("Seeded 5 products with direct Unsplash image URLs.");
  console.log("Inserted product IDs:", insertedIds);
  console.log("Most recent products:", recents);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
