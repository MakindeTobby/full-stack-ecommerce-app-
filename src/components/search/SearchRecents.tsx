"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "qb.search.recent";

type Props = {
  query: string;
};

export default function SearchRecents({ query }: Props) {
  const router = useRouter();
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return;
      setRecent(parsed.filter((x) => typeof x === "string").slice(0, 6));
    } catch {
      // ignore storage issues
    }
  }, []);

  if (query.trim().length > 0 || recent.length === 0) return null;

  return (
    <div className="qb-card">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        Recent searches
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {recent.map((term) => (
          <button
            key={term}
            type="button"
            onClick={() =>
              router.push(
                `/search?${new URLSearchParams({ q: term }).toString()}`,
              )
            }
            className="rounded-full border border-black/10 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  );
}
