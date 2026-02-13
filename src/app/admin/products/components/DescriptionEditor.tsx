"use client";

import { useMemo, useState } from "react";
import ProductDescription from "@/components/ProductDescription";

export default function DescriptionEditor({
  name = "description",
  defaultValue = "",
  label = "Description",
  rows = 8,
}: {
  name?: string;
  defaultValue?: string;
  label?: string;
  rows?: number;
}) {
  const [value, setValue] = useState(defaultValue);
  const previewValue = useMemo(() => value, [value]);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <textarea
        name={name}
        rows={rows}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="mt-1 w-full rounded-md border border-slate-300 p-2"
        placeholder="Write product story, specs, and usage notes..."
      />
      <div className="rounded-md border border-slate-200 bg-slate-50 p-2 text-xs text-slate-600">
        <div className="font-medium text-slate-700">Formatting tips</div>
        <div className="mt-1">
          Use `# Heading`, `## Subheading`, `- bullet`, `1. numbered`,
          `**bold**`.
        </div>
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-3">
        <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
          Live preview
        </div>
        <ProductDescription text={previewValue} />
      </div>
    </div>
  );
}
