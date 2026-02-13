// app/admin/promotions/flash-sales/FlashSaleForm.tsx
"use client";
import React, { useState } from "react";
import ProductPicker from "./ProductPicker";
import toast from "react-hot-toast";

export default function FlashSaleForm({
  initial,
  onSubmitAction, // server action endpoint (FormData) or custom handler
}: {
  initial?: any;
  onSubmitAction: (formData: FormData) => Promise<any>;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [discountType, setDiscountType] = useState<"percent" | "amount">(
    initial?.discount_type ?? "percent"
  );
  const [discountValue, setDiscountValue] = useState(
    initial?.discount_value ?? 10
  );
  const [startsAt, setStartsAt] = useState(
    initial?.starts_at
      ? new Date(initial.starts_at).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  );
  const [endsAt, setEndsAt] = useState(
    initial?.ends_at
      ? new Date(initial.ends_at).toISOString().slice(0, 16)
      : new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString().slice(0, 16)
  );
  const [priority, setPriority] = useState(initial?.priority ?? 1);
  const [products, setProducts] = useState<
    Array<{
      productId: string;
      title: string;
      override_type?: string | null;
      override_value?: number | null;
    }>
  >(initial?.products ?? []);

  function addProduct(p: { productId: string; title: string }) {
    setProducts((s) => [
      ...s,
      {
        productId: p.productId,
        title: p.title,
        override_type: null,
        override_value: null,
      },
    ]);
  }
  function removeProduct(productId: string) {
    setProducts((s) => s.filter((x) => x.productId !== productId));
  }
  function setOverride(
    productId: string,
    key: "override_type" | "override_value",
    value: any
  ) {
    setProducts((s) =>
      s.map((x) => (x.productId === productId ? { ...x, [key]: value } : x))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.append("title", title);
    fd.append("description", description);
    fd.append("discount_type", discountType);
    fd.append("discount_value", String(discountValue));
    fd.append("starts_at", new Date(startsAt).toISOString());
    fd.append("ends_at", new Date(endsAt).toISOString());
    fd.append("priority", String(priority));
    fd.append("products", JSON.stringify(products));
    try {
      await onSubmitAction(fd);
    } catch (err: any) {
      console.error("flash submit", err);
      toast.error(err?.message ?? "Failed");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 p-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 p-2"
        />
      </div>

      <div className="flex gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700">Discount type</label>
          <select
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value as any)}
            className="mt-1 rounded-md border border-slate-300 p-2"
          >
            <option value="percent">Percent (%)</option>
            <option value="amount">Amount (currency)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Value</label>
          <input
            value={discountValue}
            onChange={(e) => setDiscountValue(Number(e.target.value))}
            className="mt-1 w-32 rounded-md border border-slate-300 p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Priority</label>
          <input
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
            className="mt-1 w-24 rounded-md border border-slate-300 p-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700">Starts at</label>
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="mt-1 rounded-md border border-slate-300 p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Ends at</label>
          <input
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className="mt-1 rounded-md border border-slate-300 p-2"
          />
        </div>
      </div>

      <div>
        <h4 className="font-medium">Products ({products.length})</h4>
        <div className="space-y-2 mt-2">
          {products.map((p) => (
            <div
              key={p.productId}
              className="flex items-center gap-3 rounded-md border border-slate-200 p-2"
            >
              <div className="flex-1">
                <div className="font-medium">{p.title}</div>
                <div className="text-xs text-gray-500">{p.productId}</div>
              </div>
              <div className="flex gap-2 items-center">
                <select
                  value={p.override_type ?? ""}
                  onChange={(e) =>
                    setOverride(
                      p.productId,
                      "override_type",
                      e.target.value || null
                    )
                  }
                  className="rounded-md border border-slate-300 p-1"
                >
                  <option value="">Use campaign</option>
                  <option value="percent">Percent</option>
                  <option value="amount">Amount</option>
                </select>
                <input
                  value={p.override_value ?? ""}
                  onChange={(e) =>
                    setOverride(
                      p.productId,
                      "override_value",
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  className="w-20 rounded-md border border-slate-300 p-1"
                  placeholder="override"
                />
                <button
                  type="button"
                  onClick={() => removeProduct(p.productId)}
                  className="rounded-md bg-red-600 px-2 py-1 text-white hover:bg-red-700"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3">
          <ProductPicker
            onAdd={addProduct}
            existing={products.map((p) => p.productId)}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Save
        </button>
      </div>
    </form>
  );
}
