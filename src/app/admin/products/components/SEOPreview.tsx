// app/admin/products/components/SEOPreview.tsx
"use client";
import React from "react";

export default function SEOPreview({
  title,
  description,
  slug,
}: {
  title?: string | null;
  description?: string | null;
  slug?: string | null;
}) {
  const displayTitle = title || "Untitled product - Queen Beulah Collections";
  const displayDesc = description || "Product description preview...";
  const url = `${
    typeof window !== "undefined" ? window.location.origin : ""
  }/p/${slug ?? "product-slug"}`;

  return (
    <div className="bg-white border rounded p-3 shadow-sm">
      <p className="text-sm text-gray-500 mb-2">Search result preview</p>
      <div className="space-y-1">
        <div className="text-blue-600 font-medium">{displayTitle}</div>
        <div className="text-sm text-green-600">{url}</div>
        <div className="text-sm text-gray-700 mt-1">{displayDesc}</div>
      </div>
    </div>
  );
}
