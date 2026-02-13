export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type PaginationQuery = {
  page: number;
  pageSize: number;
  offset: number;
};

export function normalizePaginationInput(
  pageInput: number | undefined,
  pageSizeInput: number | undefined,
  opts?: {
    defaultPage?: number;
    defaultPageSize?: number;
    maxPageSize?: number;
  },
): PaginationQuery {
  const defaultPage = opts?.defaultPage ?? 1;
  const defaultPageSize = opts?.defaultPageSize ?? 10;
  const maxPageSize = opts?.maxPageSize ?? 100;

  const page =
    Number.isFinite(pageInput) && (pageInput as number) > 0
      ? Math.floor(pageInput as number)
      : defaultPage;
  const pageSize =
    Number.isFinite(pageSizeInput) && (pageSizeInput as number) > 0
      ? Math.min(maxPageSize, Math.floor(pageSizeInput as number))
      : defaultPageSize;
  const offset = (page - 1) * pageSize;

  return { page, pageSize, offset };
}

export function parsePaginationParams(
  searchParams: URLSearchParams,
  opts?: {
    defaultPage?: number;
    defaultPageSize?: number;
    maxPageSize?: number;
  },
): PaginationQuery {
  const rawPage = Number(searchParams.get("page") ?? "");
  const rawPageSize = Number(searchParams.get("pageSize") ?? "");
  return normalizePaginationInput(rawPage, rawPageSize, opts);
}

export function buildPaginationMeta(
  total: number,
  page: number,
  pageSize: number,
): PaginationMeta {
  const safeTotal = Number.isFinite(total) && total > 0 ? Math.floor(total) : 0;
  const totalPages = safeTotal === 0 ? 0 : Math.ceil(safeTotal / pageSize);

  return {
    page,
    pageSize,
    total: safeTotal,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
