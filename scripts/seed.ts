// scripts/seed.ts
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import {
  users,
  products,
  product_variants,
  product_media,
  addresses,
  tags,
  product_tags,
  coupons,
} from "../src/db/schema"; // adjust path if needed

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Seed users
  const [admin] = await db
    .insert(users)
    .values({
      email: "admin@example.com",
      name: "Admin User",
      role: "admin",
    })
    .returning();

  const [customer] = await db
    .insert(users)
    .values({
      email: "customer@example.com",
      name: "John Doe",
      role: "customer",
    })
    .returning();

  console.log("Users seeded:", { adminId: admin.id, customerId: customer.id });

  // 2. Seed tags
  const insertedTags = await db
    .insert(tags)
    .values([
      { name: "Featured" },
      { name: "New Arrival" },
      { name: "Best Seller" },
    ])
    .returning();

  // quick tag lookup
  const tagByName = Object.fromEntries(insertedTags.map((t) => [t.name, t]));

  // 3. Seed products
  const [product1] = await db
    .insert(products)
    .values({
      slug: "blue-cotton-shirt",
      name_en: "Blue Cotton Shirt",
      name_cn: "蓝色棉衬衫",
      description:
        "A comfortable blue cotton shirt, perfect for everyday wear.",
      base_price: "49.99",
      published: true,
    })
    .returning();

  const [product2] = await db
    .insert(products)
    .values({
      slug: "black-jeans",
      name_en: "Black Jeans",
      description: "Slim fit black jeans.",
      base_price: "69.99",
      published: true,
    })
    .returning();

  // 4. Seed product variants
  const variants = await db
    .insert(product_variants)
    .values([
      {
        product_id: product1.id,
        sku: "SHIRT-BLUE-M",
        attributes: JSON.stringify({ color: "blue", size: "M" }),
        price: "49.99",
        stock: 50,
      },
      {
        product_id: product1.id,
        sku: "SHIRT-BLUE-L",
        attributes: JSON.stringify({ color: "blue", size: "L" }),
        price: "49.99",
        stock: 30,
      },
      {
        product_id: product2.id,
        sku: "JEANS-BLACK-32",
        attributes: JSON.stringify({ color: "black", waist: 32 }),
        price: "69.99",
        stock: 40,
      },
    ])
    .returning();

  // 5. Seed product media
  await db.insert(product_media).values([
    {
      product_id: product1.id,
      url: "https://example.com/images/blue-shirt-1.jpg",
      type: "image",
      position: 0,
      alt_text: "Blue cotton shirt front",
    },
    {
      product_id: product1.id,
      url: "https://example.com/images/blue-shirt-2.jpg",
      type: "image",
      position: 1,
      alt_text: "Blue cotton shirt back",
    },
    {
      product_id: product2.id,
      url: "https://example.com/images/black-jeans-1.jpg",
      type: "image",
      position: 0,
      alt_text: "Black jeans front",
    },
  ]);

  // 6. Product tags (many-to-many)
  await db.insert(product_tags).values([
    {
      product_id: product1.id,
      tag_id: tagByName["Featured"].id,
    },
    {
      product_id: product1.id,
      tag_id: tagByName["New Arrival"].id,
    },
    {
      product_id: product2.id,
      tag_id: tagByName["Best Seller"].id,
    },
  ]);

  // 7. Addresses for customer
  const [address] = await db
    .insert(addresses)
    .values({
      user_id: customer.id,
      label: "Home",
      full_name: "John Doe",
      phone: "+1 555-1234",
      street: "123 Main Street",
      city: "Lagos",
      state: "Lagos",
      postal_code: "100001",
      country: "Nigeria",
    })
    .returning();

  // 8. Example coupon
  await db.insert(coupons).values({
    code: "WELCOME10",
    description: "10% off for your first order",
    discount_type: "percent",
    discount_value: "10.00",
    active: true,
  });

  console.log("✅ Seeding completed");
}

main()
  .catch((err) => {
    console.error("❌ Seeding failed");
    console.error(err);
  })
  .finally(async () => {
    await pool.end();
    process.exit(0);
  });
