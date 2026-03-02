import "dotenv/config";
import { and, desc, eq, inArray, like } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { categories, flash_sale_products, flash_sales, products } from "../src/db/schema";
import { db } from "../src/db/server";

const CORPORATE_CATEGORY_SLUGS = [
  "oxford-shoes",
  "derby-shoes",
  "loafers",
  "monk-strap-shoes",
  "brogues",
  "chelsea-boots",
  "corporate-shoes",
  "men-corporate-shoes",
];

async function getCorporateProductIds(limit = 24) {
  const categoryRows = await db
    .select({ id: categories.id, slug: categories.slug })
    .from(categories)
    .where(inArray(categories.slug, CORPORATE_CATEGORY_SLUGS));

  const categoryIds = categoryRows.map((c) => String(c.id));
  if (categoryIds.length === 0) {
    const fallback = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.published, true))
      .orderBy(desc(products.created_at))
      .limit(limit);
    return fallback.map((p) => String(p.id));
  }

  const rows = await db
    .select({ id: products.id })
    .from(products)
    .where(
      and(eq(products.published, true), inArray(products.category_id, categoryIds)),
    )
    .orderBy(desc(products.created_at))
    .limit(limit);

  return rows.map((r) => String(r.id));
}

async function deleteExistingSeededFlashSales() {
  const seeded = await db
    .select({ id: flash_sales.id, title: flash_sales.title })
    .from(flash_sales)
    .where(like(flash_sales.title, "Seeded Corporate Flash Sale%"));

  if (seeded.length === 0) return 0;

  const ids = seeded.map((s) => String(s.id));
  await db.transaction(async (tx) => {
    await tx
      .delete(flash_sale_products)
      .where(inArray(flash_sale_products.flash_sale_id, ids));
    await tx.delete(flash_sales).where(inArray(flash_sales.id, ids));
  });

  return seeded.length;
}

async function createFlashSale(params: {
  title: string;
  description: string;
  discountType: "percent" | "amount";
  discountValue: string;
  startsAt: Date;
  endsAt: Date;
  priority: number;
  productIds: string[];
}) {
  const saleId = uuidv4();
  await db.insert(flash_sales).values({
    id: saleId,
    title: params.title,
    description: params.description,
    discount_type: params.discountType,
    discount_value: params.discountValue,
    starts_at: params.startsAt,
    ends_at: params.endsAt,
    priority: params.priority,
  });

  if (params.productIds.length === 0) {
    return { saleId, attached: 0, overrides: 0 };
  }

  const attachments = params.productIds.map((productId, index) => {
    const useOverride = index % 4 === 0;
    return {
      id: uuidv4(),
      flash_sale_id: saleId,
      product_id: productId,
      override_discount_type: useOverride ? "amount" : null,
      override_discount_value: useOverride ? "2500.00" : null,
    };
  });

  await db.insert(flash_sale_products).values(attachments);
  return {
    saleId,
    attached: attachments.length,
    overrides: attachments.filter((a) => a.override_discount_type).length,
  };
}

async function main() {
  const removed = await deleteExistingSeededFlashSales();
  const productIds = await getCorporateProductIds(24);
  if (productIds.length === 0) {
    throw new Error("No published products found for flash sale seeding.");
  }

  const now = new Date();
  const liveStart = new Date(now.getTime() - 10 * 60 * 1000);
  const liveEnd = new Date(now.getTime() + 72 * 60 * 60 * 1000);
  const wave2Start = new Date(now.getTime() + 60 * 60 * 1000);
  const wave2End = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const splitIndex = Math.ceil(productIds.length * 0.6);
  const liveProductIds = productIds.slice(0, splitIndex);
  const wave2ProductIds = productIds.slice(splitIndex);

  const live = await createFlashSale({
    title: "Seeded Corporate Flash Sale - Live",
    description: "Auto-seeded flash sale for corporate shoe testing.",
    discountType: "percent",
    discountValue: "15.00",
    startsAt: liveStart,
    endsAt: liveEnd,
    priority: 1,
    productIds: liveProductIds,
  });

  const wave2 = await createFlashSale({
    title: "Seeded Corporate Flash Sale - Wave 2",
    description: "Second seeded promotion wave with mixed overrides.",
    discountType: "percent",
    discountValue: "10.00",
    startsAt: wave2Start,
    endsAt: wave2End,
    priority: 2,
    productIds: wave2ProductIds,
  });

  const totalAttached = live.attached + wave2.attached;
  const totalOverrides = live.overrides + wave2.overrides;

  console.log("Flash sale seeding complete");
  console.log(`Removed previous seeded sales: ${removed}`);
  console.log(`Products targeted: ${productIds.length}`);
  console.log(`Live sale: ${live.saleId} (attached ${live.attached})`);
  console.log(`Wave 2 sale: ${wave2.saleId} (attached ${wave2.attached})`);
  console.log(`Per-product overrides applied: ${totalOverrides}`);
  console.log(
    `Active window now: ${liveStart.toISOString()} -> ${liveEnd.toISOString()}`,
  );
}

main().catch((err) => {
  console.error("Flash sale seeding failed:", err);
  process.exit(1);
});
