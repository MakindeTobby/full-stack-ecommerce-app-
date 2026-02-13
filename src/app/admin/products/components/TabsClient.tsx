// app/admin/products/components/TabsClient.tsx
"use client";
import React from "react";

export default function TabsClient({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-2 border-b border-gray-200 mb-4">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`px-3 py-2 -mb-px rounded-t-md ${
            active === t.id
              ? "bg-white border border-b-0 border-gray-200 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
