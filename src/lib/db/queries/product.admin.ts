import { and, eq, sql } from "drizzle-orm";
import { categories, products } from "@/db/schema";
import { db } from "@/db/server";
import {
  buildPaginationMeta,
  normalizePaginationInput,
} from "@/lib/pagination";
import {
  type AdminProductsPageOpts,
  isMissingCategorySchema,
} from "./product.shared";

export async function getAdminProductsPage(opts?: AdminProductsPageOpts) {
  const q = opts?.q?.trim() ?? "";
  const categorySlug = opts?.categorySlug?.trim() ?? "";
  const status = opts?.status ?? "all";
  const likeQ = q ? `%${q}%` : null;

  const { page, pageSize, offset } = normalizePaginationInput(
    opts?.page,
    opts?.pageSize,
    {
      defaultPage: 1,
      defaultPageSize: 20,
      maxPageSize: 100,
    },
  );

  let selectedCategoryId: string | undefined;
  if (categorySlug) {
    try {
      const categoryRow = (
        await db
          .select({ id: categories.id })
          .from(categories)
          .where(eq(categories.slug, categorySlug))
          .limit(1)
      ).at(0);
      if (!categoryRow) {
        return {
          rows: [],
          pagination: buildPaginationMeta(0, page, pageSize),
        };
      }
      selectedCategoryId = categoryRow.id;
    } catch (error: unknown) {
      if (!isMissingCategorySchema(error)) throw error;
      return {
        rows: [],
        pagination: buildPaginationMeta(0, page, pageSize),
      };
    }
  }

  const whereParts = [
    ...(likeQ
      ? [
          sql`${products.name_en} ILIKE ${likeQ} OR ${products.slug} ILIKE ${likeQ}`,
        ]
      : []),
    ...(status === "published"
      ? [eq(products.published, true)]
      : status === "draft"
        ? [eq(products.published, false)]
        : []),
    ...(selectedCategoryId
      ? [eq(products.category_id, selectedCategoryId)]
      : []),
  ];
  const whereClause = whereParts.length > 0 ? and(...whereParts) : undefined;

  const totalRow = (
    await db
      .select({ cnt: sql`COUNT(*)::int` })
      .from(products)
      .where(whereClause)
  ).at(0);
  const total = Number(totalRow?.cnt ?? 0);

  let rows: Array<{
    id: string;
    name_en: string;
    slug: string;
    base_price: string;
    category_name: string | null;
    category_slug: string | null;
    published: boolean | null;
    created_at: Date | null;
  }> = [];

  try {
    rows = await db
      .select({
        id: products.id,
        name_en: products.name_en,
        slug: products.slug,
        base_price: products.base_price,
        category_name: categories.name,
        category_slug: categories.slug,
        published: products.published,
        created_at: products.created_at,
      })
      .from(products)
      .leftJoin(categories, eq(products.category_id, categories.id))
      .where(whereClause)
      .orderBy(products.created_at)
      .limit(pageSize)
      .offset(offset);
  } catch (error: unknown) {
    if (!isMissingCategorySchema(error)) throw error;
    rows = await db
      .select({
        id: products.id,
        name_en: products.name_en,
        slug: products.slug,
        base_price: products.base_price,
        category_name: sql<string | null>`NULL`,
        category_slug: sql<string | null>`NULL`,
        published: products.published,
        created_at: products.created_at,
      })
      .from(products)
      .where(whereClause)
      .orderBy(products.created_at)
      .limit(pageSize)
      .offset(offset);
  }

  return {
    rows,
    pagination: buildPaginationMeta(total, page, pageSize),
  };
}

export async function getAllCategories() {
  try {
    return await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      })
      .from(categories)
      .orderBy(categories.name);
  } catch (error: unknown) {
    if (!isMissingCategorySchema(error)) throw error;
    return [];
  }
}
