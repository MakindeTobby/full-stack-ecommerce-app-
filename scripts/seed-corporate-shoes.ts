import "dotenv/config";
import { eq, inArray } from "drizzle-orm";
import { categories, product_media, product_variants, products } from "../src/db/schema";
import { db } from "../src/db/server";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function pick<T>(arr: T[], index: number): T {
  return arr[index % arr.length];
}

function unsplashUrl(query: string, sig: number) {
  const q = query
    .split(" ")
    .map((v) => v.trim())
    .filter(Boolean)
    .join(",");
  return `https://source.unsplash.com/1200x1200/?${q}&sig=${sig}`;
}

const CATEGORY_SEEDS = [
  { name: "Oxford Shoes", slug: "oxford-shoes" },
  { name: "Derby Shoes", slug: "derby-shoes" },
  { name: "Loafers", slug: "loafers" },
  { name: "Monk Strap Shoes", slug: "monk-strap-shoes" },
  { name: "Brogues", slug: "brogues" },
  { name: "Chelsea Boots", slug: "chelsea-boots" },
];

const MODEL_PREFIX = [
  "Regent",
  "Kingston",
  "Sovereign",
  "Westfield",
  "Mayfair",
  "Stratford",
  "Belmont",
  "Crownline",
];

const MODEL_SUFFIX = [
  "Executive",
  "Classic",
  "Signature",
  "Heritage",
  "Prime",
  "Urban",
  "Prestige",
  "Refined",
];

const MATERIALS = ["full-grain leather", "calf leather", "polished leather", "suede leather"];
const COLORS = ["Black", "Dark Brown", "Tan", "Burgundy"];
const LINING = ["soft leather lining", "breathable textile lining", "premium comfort lining"];
const SOLE = ["anti-slip rubber sole", "durable leather sole", "hybrid comfort sole"];
const OCCASIONS = [
  "boardroom meetings",
  "wedding ceremonies",
  "office wear",
  "formal events",
  "daily executive style",
];

async function ensureCategories() {
  await db
    .insert(categories)
    .values(CATEGORY_SEEDS)
    .onConflictDoNothing({ target: categories.slug });

  const rows = await db
    .select({ id: categories.id, name: categories.name, slug: categories.slug })
    .from(categories)
    .where(inArray(categories.slug, CATEGORY_SEEDS.map((c) => c.slug)));

  const map = new Map(rows.map((r) => [String(r.slug), r]));
  const missing = CATEGORY_SEEDS.filter((c) => !map.has(c.slug));
  if (missing.length > 0) {
    throw new Error(`Failed to create/find categories: ${missing.map((m) => m.slug).join(", ")}`);
  }
  return map;
}

function buildDescription(categoryName: string, index: number) {
  const material = pick(MATERIALS, index);
  const lining = pick(LINING, index + 1);
  const sole = pick(SOLE, index + 2);
  const useCase = pick(OCCASIONS, index + 3);
  return [
    `${categoryName} built with ${material} for a clean, professional finish.`,
    `Designed with ${lining} and a ${sole} for all-day confidence.`,
    `Ideal for ${useCase}, with balanced structure and comfort.`,
  ].join(" ");
}

async function main() {
  const seedKey = Date.now().toString();
  const categoryMap = await ensureCategories();
  const categoryCycle = CATEGORY_SEEDS.map((c) => {
    const row = categoryMap.get(c.slug);
    if (!row) throw new Error(`Category not found after ensure: ${c.slug}`);
    return row;
  });

  const createdProductIds: string[] = [];

  for (let i = 1; i <= 40; i += 1) {
    const category = pick(categoryCycle, i - 1);
    const color = pick(COLORS, i);
    const model = `${pick(MODEL_PREFIX, i)} ${category.name.replace(" Shoes", "")} ${pick(MODEL_SUFFIX, i + 1)}`;
    const name = `${model} - ${color}`;
    const slug = `${slugify(name)}-${seedKey}-${i}`;
    const basePriceNum = 32000 + (i % 12) * 3500 + (i % 5) * 1200;
    const oldPriceNum = basePriceNum + 6000 + (i % 4) * 1500;

    const [product] = await db
      .insert(products)
      .values({
        slug,
        category_id: category.id,
        name_en: name,
        description: buildDescription(category.name, i),
        meta_title: `${name} | Queen Beulah Corporate Shoes`,
        meta_description: `Buy ${name} with premium finishing and durable build for modern gentlemen.`,
        base_price: basePriceNum.toFixed(2),
        old_price: oldPriceNum.toFixed(2),
        sku: `MCS-${seedKey}-${String(i).padStart(3, "0")}`,
        published: true,
      })
      .returning({ id: products.id, name: products.name_en });

    createdProductIds.push(product.id);

    const sizeBase = 40 + (i % 2);
    const variantSizes = [sizeBase, sizeBase + 1, sizeBase + 2];
    const variantRows = variantSizes.map((size, idx) => ({
      product_id: product.id,
      sku: `MCS-${seedKey}-${String(i).padStart(3, "0")}-${color.replace(/\s+/g, "").toUpperCase()}-${size}`,
      attributes: JSON.stringify({
        color,
        size: String(size),
        finish: i % 2 === 0 ? "Polished" : "Matte",
      }),
      price: (basePriceNum + idx * 1200).toFixed(2),
      stock: 6 + ((i + idx) % 10),
    }));

    await db.insert(product_variants).values(variantRows);

    await db.insert(product_media).values([
      {
        product_id: product.id,
        url: unsplashUrl(`men corporate shoes ${category.slug} ${color}`, i * 11),
        type: "image",
        position: 0,
        alt_text: `${product.name} main view`,
      },
      {
        product_id: product.id,
        url: unsplashUrl(`formal leather shoes ${color} closeup`, i * 17),
        type: "image",
        position: 1,
        alt_text: `${product.name} side profile`,
      },
    ]);
  }

  const categoryCounts = await Promise.all(
    CATEGORY_SEEDS.map(async (cat) => {
      const row = categoryMap.get(cat.slug);
      if (!row) return { slug: cat.slug, count: 0 };
      const countRow = (
        await db
          .select({ cnt: products.id })
          .from(products)
          .where(eq(products.category_id, row.id))
      ).length;
      return { slug: cat.slug, count: countRow };
    }),
  );

  console.log("Seed complete: corporate shoes catalog");
  console.log(`Categories ensured: ${CATEGORY_SEEDS.length}`);
  console.log(`Products created: ${createdProductIds.length}`);
  console.log(`Seed key: ${seedKey}`);
  console.log("Category product counts:", categoryCounts);
}

main().catch((err) => {
  console.error("Corporate shoes seeding failed:", err);
  process.exit(1);
});

