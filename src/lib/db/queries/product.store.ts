import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { categories, products } from "@/db/schema";
import { db } from "@/db/server";
import {
  buildPaginationMeta,
  normalizePaginationInput,
} from "@/lib/pagination";
import {
  isDatabaseUnavailableError,
  isMissingCategorySchema,
  type ProductsPageOpts,
} from "./product.shared";

type StoreProductsPageResult = {
  rows: Array<{
    id: string;
    slug: string;
    name_en: string;
    base_price: string;
    category_slug: string | null;
    category_name: string | null;
    image_url: unknown;
  }>;
  pagination: ReturnType<typeof buildPaginationMeta>;
  selectedCategory: { id: string; name: string; slug: string } | null;
  dbUnavailable: boolean;
};

function emptyStoreProductsPage(
  page: number,
  pageSize: number,
): StoreProductsPageResult {
  return {
    rows: [],
    pagination: buildPaginationMeta(0, page, pageSize),
    selectedCategory: null,
    dbUnavailable: true,
  };
}

export async function getStoreProductsPage(
  opts?: ProductsPageOpts,
): Promise<StoreProductsPageResult> {
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

  const wherePartsWithoutCategory = [
    eq(products.published, true),
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
        dbUnavailable: false,
      };
    }

    const storeWhere = and(
      ...wherePartsWithoutCategory,
      ...(selectedCategory ? [eq(products.category_id, selectedCategory.id)] : []),
    );

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
      .orderBy(desc(products.created_at))
      .limit(pageSize)
      .offset(offset);

    return {
      rows,
      pagination: buildPaginationMeta(total, page, pageSize),
      selectedCategory,
      dbUnavailable: false,
    };
  } catch (error: unknown) {
    if (isDatabaseUnavailableError(error)) {
      console.error("getStoreProductsPage database unavailable:", error);
      return emptyStoreProductsPage(page, pageSize);
    }

    if (!isMissingCategorySchema(error)) {
      throw error;
    }

    try {
      const fallbackWhere = and(...wherePartsWithoutCategory);

      const totalRow = (
        await db
          .select({ cnt: sql`COUNT(*)::int` })
          .from(products)
          .where(fallbackWhere)
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
        .where(fallbackWhere)
        .orderBy(desc(products.created_at))
        .limit(pageSize)
        .offset(offset);

      return {
        rows,
        pagination: buildPaginationMeta(total, page, pageSize),
        selectedCategory: null,
        dbUnavailable: false,
      };
    } catch (fallbackError: unknown) {
      if (isDatabaseUnavailableError(fallbackError)) {
        console.error("getStoreProductsPage fallback database unavailable:", fallbackError);
        return emptyStoreProductsPage(page, pageSize);
      }
      throw fallbackError;
    }
  }
}

type StoreCategoryRow = {
  id: string;
  name: string;
  slug: string;
  product_count: number;
};

export async function getStoreCategoriesWithCountsResult(): Promise<{
  rows: StoreCategoryRow[];
  dbUnavailable: boolean;
}> {
  try {
    const rows = await db
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

    return { rows, dbUnavailable: false };
  } catch (error: unknown) {
    if (isMissingCategorySchema(error)) {
      return { rows: [], dbUnavailable: false };
    }
    if (isDatabaseUnavailableError(error)) {
      console.error("getStoreCategoriesWithCounts database unavailable:", error);
      return { rows: [], dbUnavailable: true };
    }
    throw error;
  }
}

export async function getStoreCategoriesWithCounts() {
  const { rows } = await getStoreCategoriesWithCountsResult();
  return rows;
}




