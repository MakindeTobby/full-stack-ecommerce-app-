// app/admin/promotions/flash-sales/ProductPicker.tsx
"use client";
import { useState } from "react";

type ProductSearchResult = {
  id: string;
  name_en: string;
  sku: string | null;
};

export default function ProductPicker({
  onAdd,
  existing = [],
}: {
  onAdd: (p: { productId: string; title: string }) => void;
  existing?: string[];
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);

  async function doSearch(nextPage = 1) {
    if (!q || q.length < 2) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/products/search?q=${encodeURIComponent(q)}&page=${nextPage}&pageSize=10`,
      );
      const json = await res.json();
      const incoming = json.items ?? json.results ?? [];
      const pagination = json.pagination ?? {};
      setResults((prev) =>
        nextPage === 1 ? incoming : [...prev, ...incoming],
      );
      setHasNext(Boolean(pagination.hasNext));
      setPage(nextPage);
    } catch (e) {
      console.error("product search", e);
      if (nextPage === 1) setResults([]);
      setHasNext(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search products by name or SKU"
          className="flex-1 border rounded p-2"
        />
        <button
          type="button"
          onClick={() => doSearch(1)}
          className="px-3 py-2 bg-indigo-600 text-white rounded"
        >
          Search
        </button>
      </div>

      <div className="space-y-2">
        {results.map((r) => (
          <div
            key={String(r.id)}
            className="flex justify-between items-center p-2 border rounded"
          >
            <div>
              <div className="font-medium">{r.name_en}</div>
              <div className="text-xs text-gray-500">{r.sku}</div>
            </div>
            <div>
              <button
                type="button"
                disabled={existing.includes(String(r.id))}
                onClick={() =>
                  onAdd({ productId: String(r.id), title: r.name_en })
                }
                className="px-3 py-1 bg-green-600 text-white rounded disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        ))}
        {hasNext && (
          <button
            type="button"
            onClick={() => doSearch(page + 1)}
            disabled={loading}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
          >
            {loading ? "Loading..." : "Load more"}
          </button>
        )}
      </div>
    </div>
  );
}
