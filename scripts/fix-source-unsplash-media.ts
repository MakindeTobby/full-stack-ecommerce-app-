import "dotenv/config";
import { ilike, sql } from "drizzle-orm";
import { db } from "../src/db/server";
import { product_media } from "../src/db/schema";

const DIRECT_UNSPLASH = [
  "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1614253429340-98120bd6d5e2?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=1400&q=80",
] as const;

async function main() {
  const rows = await db
    .select({ id: product_media.id, url: product_media.url })
    .from(product_media)
    .where(ilike(product_media.url, "%source.unsplash.com%"));

  if (rows.length === 0) {
    console.log("No source.unsplash.com media URLs found.");
    return;
  }

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const nextUrl = DIRECT_UNSPLASH[i % DIRECT_UNSPLASH.length];
    await db
      .update(product_media)
      .set({ url: nextUrl })
      .where(sql`${product_media.id} = ${row.id}`);
  }

  console.log(`Updated ${rows.length} product_media rows from source.unsplash.com to direct images.unsplash.com URLs.`);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
