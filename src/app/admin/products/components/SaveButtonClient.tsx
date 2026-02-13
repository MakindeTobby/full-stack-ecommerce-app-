// app/admin/products/SaveButtonClient.tsx
"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export default function SaveButtonClient({
  productId,
  formId,
}: {
  productId: string;
  formId: string;
}) {
  const [loading, setLoading] = useState(false);

  async function onSave() {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) {
      toast.error("Form not found");
      return;
    }

    // collect fields
    const fd = new FormData(form);
    const slug = String(fd.get("slug") ?? "");
    const category_id = String(fd.get("category_id") ?? "") || null;
    const name_en = String(fd.get("name_en") ?? "");
    const description = String(fd.get("description") ?? "").trim() || null;
    const base_price = String(fd.get("base_price") ?? "0.00");
    const sku = String(fd.get("sku") ?? "") || null;
    const published = fd.get("published") === "on";
    const variants_dirty = String(fd.get("variants_dirty") ?? "0") === "1";
    const variants_json = String(fd.get("variants_json") ?? "");
    const variants = variants_json ? JSON.parse(variants_json) : undefined;

    const payload: Record<string, unknown> = {
      productId,
      slug,
      category_id,
      name_en,
      description,
      base_price,
      sku,
      published,
    };

    if (variants_dirty && variants) payload.variants = variants;

    console.log(payload);
    setLoading(true);
    toast.loading("Saving product...", { id: "save-prod" });
    try {
      const res = await fetch("/api/admin/products/update", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json?.error ?? "Save failed", { id: "save-prod" });
      } else {
        toast.success("Product saved", { id: "save-prod" });
        // optional: refresh current page (hard reload)
        setTimeout(() => location.reload(), 700);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed", {
        id: "save-prod",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onSave}
      disabled={loading}
      className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
    >
      {loading ? "Saving..." : "Save"}
    </button>
  );
}
