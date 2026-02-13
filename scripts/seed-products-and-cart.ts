import "dotenv/config";
import { db } from "../src/db/server";
import { product_media, product_variants, products } from "../src/db/schema";
import {
  addItemToCart,
  createOrGetCartForUser,
} from "../src/lib/db/queries/cart";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  const seedKey = Date.now().toString();
  const createdProductIds: string[] = [];
  let firstVariantId: string | null = null;
  let firstProductId: string | null = null;

  for (let i = 1; i <= 20; i += 1) {
    const productName = `Portfolio Product ${i}`;
    const productSlug = `${slugify(productName)}-${seedKey}-${i}`;
    const basePrice = (24 + i * 3).toFixed(2);

    const [product] = await db
      .insert(products)
      .values({
        slug: productSlug,
        name_en: productName,
        description: `Seeded portfolio product ${i} generated for catalog testing.`,
        base_price: basePrice,
        sku: `PORT-${seedKey}-${i}`,
        published: true,
      })
      .returning({ id: products.id });

    createdProductIds.push(product.id);
    if (!firstProductId) firstProductId = product.id;

    const variantRows = await db
      .insert(product_variants)
      .values([
        {
          product_id: product.id,
          sku: `PORT-${seedKey}-${i}-BLK-M`,
          attributes: JSON.stringify({ color: "Black", size: "M" }),
          price: (Number(basePrice) + 0).toFixed(2),
          stock: 15,
        },
        {
          product_id: product.id,
          sku: `PORT-${seedKey}-${i}-BLK-L`,
          attributes: JSON.stringify({ color: "Black", size: "L" }),
          price: (Number(basePrice) + 2).toFixed(2),
          stock: 12,
        },
        {
          product_id: product.id,
          sku: `PORT-${seedKey}-${i}-CRM-XL`,
          attributes: JSON.stringify({ color: "Cream", size: "XL" }),
          price: (Number(basePrice) + 4).toFixed(2),
          stock: 10,
        },
      ])
      .returning({ id: product_variants.id });

    if (!firstVariantId) firstVariantId = variantRows[0]?.id ?? null;

    await db.insert(product_media).values([
      {
        product_id: product.id,
        url: `https://picsum.photos/seed/${seedKey}-${i}-1/800/800`,
        type: "image",
        position: 0,
        alt_text: `${productName} image 1`,
      },
      {
        product_id: product.id,
        url: `https://picsum.photos/seed/${seedKey}-${i}-2/800/800`,
        type: "image",
        position: 1,
        alt_text: `${productName} image 2`,
      },
    ]);
  }

  const sessionToken = `seed-cart-${seedKey}`;
  const cart = await createOrGetCartForUser({
    userId: null,
    sessionToken,
  });

  if (!firstProductId || !firstVariantId) {
    throw new Error("Failed to create product/variant for cart seeding");
  }

  const cartItem = await addItemToCart(String(cart.id), {
    productId: firstProductId,
    variantId: firstVariantId,
    quantity: 1,
  });

  console.log("Seed complete");
  console.log(`Products created: ${createdProductIds.length}`);
  console.log(`First product ID: ${firstProductId}`);
  console.log(`First variant ID: ${firstVariantId}`);
  console.log(`Cart ID: ${String(cart.id)}`);
  console.log(`Session token: ${sessionToken}`);
  console.log(`Cart item ID: ${String((cartItem as any)?.id ?? "unknown")}`);
}

main().catch((err) => {
  console.error("Seed script failed:", err);
  process.exit(1);
});

