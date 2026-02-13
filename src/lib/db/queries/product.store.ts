import { and, eq, ilike, or, sql } from "drizzle-orm";
import { categories, products } from "@/db/schema";
import { db } from "@/db/server";
import {
  buildPaginationMeta,
  normalizePaginationInput,
} from "@/lib/pagination";
import {
  isMissingCategorySchema,
  type ProductsPageOpts,
} from "./product.shared";

export async function getStoreProductsPage(opts?: ProductsPageOpts) {
  const categorySlug = opts?.categorySlug?.trim();
  const q = opts?.q?.trim();
  const minPrice =
    typeof opts?.minPrice === "number" && Number.isFinite(opts.minPrice)
      ? opts.minPrice
      : undefined;
  const maxPrice =
    typeof opts?.maxPrice === "number" && Number.isFinite(opts.maxPrice)
      ? opts.maxPrice
      : undefined;
  const { page, pageSize, offset } = normalizePaginationInput(
    opts?.page,
    opts?.pageSize,
    {
      defaultPage: 1,
      defaultPageSize: 24,
      maxPageSize: 100,
    },
  );

  try {
    const selectedCategory = categorySlug
      ? ((
          await db
            .select({
              id: categories.id,
              name: categories.name,
              slug: categories.slug,
            })
            .from(categories)
            .where(eq(categories.slug, categorySlug))
            .limit(1)
        ).at(0) ?? null)
      : null;

    if (categorySlug && !selectedCategory) {
      return {
        rows: [],
        pagination: buildPaginationMeta(0, page, pageSize),
        selectedCategory: null,
      };
    }

    const whereParts = [
      eq(products.published, true),
      ...(selectedCategory
        ? [eq(products.category_id, selectedCategory.id)]
        : []),
      ...(q
        ? [or(ilike(products.name_en, `%${q}%`), ilike(products.sku, `%${q}%`))]
        : []),
      ...(typeof minPrice === "number"
        ? [sql`${products.base_price} >= ${String(minPrice)}`]
        : []),
      ...(typeof maxPrice === "number"
        ? [sql`${products.base_price} <= ${String(maxPrice)}`]
        : []),
    ];
    const storeWhere = and(...whereParts);

    const totalRow = (
      await db
        .select({ cnt: sql`COUNT(*)::int` })
        .from(products)
        .leftJoin(categories, eq(products.category_id, categories.id))
        .where(storeWhere)
    ).at(0);
    const total = Number(totalRow?.cnt ?? 0);

    const rows = await db
      .select({
        id: products.id,
        slug: products.slug,
        name_en: products.name_en,
        base_price: products.base_price,
        category_slug: categories.slug,
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
      .where(storeWhere)
      .orderBy(products.created_at)
      .limit(pageSize)
      .offset(offset);

    return {
      rows,
      pagination: buildPaginationMeta(total, page, pageSize),
      selectedCategory,
    };
  } catch (error: unknown) {
    if (!isMissingCategorySchema(error)) throw error;
    if (categorySlug) {
      return {
        rows: [],
        pagination: buildPaginationMeta(0, page, pageSize),
        selectedCategory: null,
      };
    }

    const totalRow = (
      await db
        .select({ cnt: sql`COUNT(*)::int` })
        .from(products)
        .where(
          and(
            eq(products.published, true),
            ...(q
              ? [
                  or(
                    ilike(products.name_en, `%${q}%`),
                    ilike(products.sku, `%${q}%`),
                  ),
                ]
              : []),
            ...(typeof minPrice === "number"
              ? [sql`${products.base_price} >= ${String(minPrice)}`]
              : []),
            ...(typeof maxPrice === "number"
              ? [sql`${products.base_price} <= ${String(maxPrice)}`]
              : []),
          ),
        )
    ).at(0);
    const total = Number(totalRow?.cnt ?? 0);

    const rows = await db
      .select({
        id: products.id,
        slug: products.slug,
        name_en: products.name_en,
        base_price: products.base_price,
        category_slug: sql<string | null>`NULL`,
        category_name: sql<string | null>`NULL`,
        image_url: sql`(
          SELECT url FROM product_media
          WHERE product_media.product_id = products.id
          ORDER BY product_media.position NULLS LAST, product_media.id
          LIMIT 1
        )`,
      })
      .from(products)
      .where(
        and(
          eq(products.published, true),
          ...(q
            ? [
                or(
                  ilike(products.name_en, `%${q}%`),
                  ilike(products.sku, `%${q}%`),
                ),
              ]
            : []),
          ...(typeof minPrice === "number"
            ? [sql`${products.base_price} >= ${String(minPrice)}`]
            : []),
          ...(typeof maxPrice === "number"
            ? [sql`${products.base_price} <= ${String(maxPrice)}`]
            : []),
        ),
      )
      .orderBy(products.created_at)
      .limit(pageSize)
      .offset(offset);

    return {
      rows,
      pagination: buildPaginationMeta(total, page, pageSize),
      selectedCategory: null,
    };
  }
}

export async function getStoreCategoriesWithCounts() {
  try {
    return await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        product_count: sql<number>`COUNT(products.id)::int`,
      })
      .from(categories)
      .leftJoin(
        products,
        sql`${products.category_id} = ${categories.id} AND ${products.published} = true`,
      )
      .groupBy(categories.id)
      .orderBy(categories.name);
  } catch (error: unknown) {
    if (!isMissingCategorySchema(error)) throw error;
    return [];
  }
}
