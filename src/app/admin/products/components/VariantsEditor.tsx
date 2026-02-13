"use client";
import React, { useMemo, useState } from "react";

type AttrValue = { id: string; value: string };
type AttrGroup = { id: string; name: string; values: AttrValue[] };

function uid(prefix = "") {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return prefix + crypto.randomUUID();
  }
  return prefix + String(Math.random()).slice(2);
}

function makeSkuBase(name: string) {
  if (!name) return "ITEM";
  const tokens = name
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => t.slice(0, 3).toUpperCase());
  return tokens.slice(0, 3).join("-");
}

export default function VariantsEditor({
  productName,
  productPrice,
  defaultValue,
}: {
  productName?: string;
  productPrice?: string;
  defaultValue?: any[];
}) {
  const inferredGroups = useMemo((): AttrGroup[] => {
    if (!Array.isArray(defaultValue) || defaultValue.length === 0) return [];
    const map = new Map<string, Set<string>>();
    for (const v of defaultValue) {
      const attrs = v.attributes ?? {};
      for (const key of Object.keys(attrs)) {
        if (!map.has(key)) map.set(key, new Set());
        map.get(key)?.add(String(attrs[key]));
      }
    }
    return Array.from(map.entries()).map(([name, set]) => ({
      id: uid("g-"),
      name,
      values: Array.from(set).map((value) => ({ id: uid("v-"), value })),
    }));
  }, [defaultValue]);

  const [groups, setGroups] = useState<AttrGroup[]>(
    inferredGroups.length
      ? inferredGroups
      : [
          {
            id: uid("g-"),
            name: "Color",
            values: [{ id: uid("v-"), value: "Red" }],
          },
        ]
  );
  const [dirty, setDirty] = useState(false);

  const [overrides, setOverrides] = useState<
    Record<
      string,
      {
        sku?: string | null;
        barcode?: string | null;
        price?: string;
        stock?: number;
        manualSku?: boolean;
      }
    >
  >(() => {
    const out: Record<string, any> = {};
    if (!Array.isArray(defaultValue)) return out;
    for (const v of defaultValue) {
      const attrs = v.attributes ?? {};
      const key = JSON.stringify(
        Object.fromEntries(Object.entries(attrs).sort((a, b) => a[0].localeCompare(b[0])))
      );
      out[key] = {
        sku: v.sku ?? null,
        barcode: v.barcode ?? null,
        price: v.price != null ? String(v.price) : productPrice ?? "0.00",
        stock: typeof v.stock === "number" ? v.stock : 5,
        manualSku: Boolean(v.sku),
      };
    }
    return out;
  });

  function addGroup() {
    setDirty(true);
    setGroups((s) => [
      ...s,
      {
        id: uid("g-"),
        name: "",
        values: [{ id: uid("v-"), value: "" }],
      },
    ]);
  }

  function removeGroup(groupId: string) {
    setDirty(true);
    setGroups((s) => s.filter((g) => g.id !== groupId));
  }

  function updateGroupName(groupId: string, name: string) {
    setDirty(true);
    setGroups((s) => s.map((g) => (g.id === groupId ? { ...g, name } : g)));
  }

  function addValue(groupId: string) {
    setDirty(true);
    setGroups((s) =>
      s.map((g) =>
        g.id === groupId
          ? { ...g, values: [...g.values, { id: uid("v-"), value: "" }] }
          : g
      )
    );
  }

  function updateValue(groupId: string, valueId: string, value: string) {
    setDirty(true);
    setGroups((s) =>
      s.map((g) =>
        g.id === groupId
          ? {
              ...g,
              values: g.values.map((v) => (v.id === valueId ? { ...v, value } : v)),
            }
          : g
      )
    );
  }

  function removeValue(groupId: string, valueId: string) {
    setDirty(true);
    setGroups((s) =>
      s.map((g) =>
        g.id === groupId
          ? { ...g, values: g.values.filter((v) => v.id !== valueId) }
          : g
      )
    );
  }

  const combinations = useMemo(() => {
    if (!groups.length) return [];
    if (groups.some((g) => !g.name.trim() || g.values.length === 0)) return [];

    const sets = groups.map((g) =>
      g.values
        .map((v) => v.value.trim())
        .filter(Boolean)
        .map((val) => ({ key: g.name.trim(), value: val }))
    );
    if (sets.some((s) => s.length === 0)) return [];

    function cartesian(arrs: Array<Array<{ key: string; value: string }>>) {
      return arrs.reduce(
        (acc, cur) => {
          const out: any[] = [];
          for (const a of acc) {
            for (const c of cur) out.push([...a, c]);
          }
          return out;
        },
        [[]] as any[]
      );
    }

    return cartesian(sets).map((combo) => {
      const attributes: Record<string, string> = {};
      for (const item of combo) attributes[item.key] = item.value;
      const key = JSON.stringify(
        Object.fromEntries(
          Object.entries(attributes).sort((a, b) => a[0].localeCompare(b[0]))
        )
      );
      return { key, attributes };
    });
  }, [groups]);

  const skuBase = useMemo(() => makeSkuBase(productName ?? ""), [productName]);

  function computeAutoSku(attributes: Record<string, string>) {
    const parts = [skuBase];
    const sortedEntries = Object.entries(attributes).sort((a, b) =>
      a[0].localeCompare(b[0])
    );
    for (const [, value] of sortedEntries) {
      const clean = String(value)
        .replace(/[^a-zA-Z0-9]+/g, "_")
        .toUpperCase();
      parts.push(clean);
    }
    return parts.filter(Boolean).join("-");
  }

  function setOverride(
    key: string,
    patch: Partial<{
      sku?: string | null;
      barcode?: string | null;
      price?: string;
      stock?: number;
      manualSku?: boolean;
    }>
  ) {
    setDirty(true);
    setOverrides((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? {}), ...patch },
    }));
  }

  const variantRows = useMemo(() => {
    return combinations.map((c) => {
      const o = overrides[c.key] ?? {};
      const autoSku = computeAutoSku(c.attributes);
      return {
        key: c.key,
        attributes: c.attributes,
        autoSku,
        sku: o.manualSku ? o.sku ?? "" : o.sku ?? autoSku,
        barcode: o.barcode ?? "",
        price: o.price ?? productPrice ?? "0.00",
        stock: typeof o.stock === "number" ? o.stock : 5,
      };
    });
  }, [combinations, overrides, productPrice]);

  const exportVariants = useMemo(() => {
    return combinations.map((c) => {
      const o = overrides[c.key] ?? {};
      const autoSku = computeAutoSku(c.attributes);
      return {
        sku: o.manualSku ? o.sku ?? null : o.sku ?? autoSku,
        barcode: o.barcode ?? null,
        price: o.price ?? productPrice ?? "0.00",
        stock: typeof o.stock === "number" ? o.stock : 5,
        attributes: c.attributes,
      };
    });
  }, [combinations, overrides, productPrice]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Variant attributes</h2>
          <p className="text-sm text-slate-600">
            1) Define attributes and values. 2) Review generated combinations. 3)
            Edit SKU/price/stock where needed.
          </p>
        </div>
        <button
          type="button"
          onClick={addGroup}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          + Add attribute group
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="space-y-3 rounded-md border border-slate-200 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Attribute builder
          </h3>

          {groups.map((g) => (
            <div key={g.id} className="space-y-2 rounded-md border border-slate-200 p-3">
              <div className="flex items-center gap-2">
                <input
                  className="flex-1 rounded-md border border-slate-300 p-2 text-sm"
                  placeholder="Attribute name (e.g. Color, Size)"
                  value={g.name}
                  onChange={(e) => updateGroupName(g.id, e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeGroup(g.id)}
                  className="rounded-md bg-red-600 px-2 py-2 text-xs font-medium text-white hover:bg-red-700"
                >
                  Remove
                </button>
              </div>

              <div className="space-y-2">
                {g.values.map((v) => (
                  <div key={v.id} className="flex items-center gap-2">
                    <input
                      className="flex-1 rounded-md border border-slate-300 p-2 text-sm"
                      placeholder="Value (e.g. Red, XL)"
                      value={v.value}
                      onChange={(e) => updateValue(g.id, v.id, e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeValue(g.id, v.id)}
                      className="rounded-md border border-slate-300 px-2 py-2 text-xs text-slate-700 hover:bg-slate-50"
                    >
                      X
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => addValue(g.id)}
                className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
              >
                + Add value
              </button>
            </div>
          ))}
        </section>

        <section className="space-y-3 rounded-md border border-slate-200 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Generated combinations ({variantRows.length})
          </h3>

          {variantRows.length === 0 ? (
            <div className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500">
              Add at least one valid attribute group and value to generate variants.
            </div>
          ) : (
            <div className="space-y-2">
              {variantRows.map((r) => (
                <div key={r.key} className="space-y-2 rounded-md border border-slate-200 p-3">
                  <div className="text-xs text-slate-600">
                    {Object.entries(r.attributes).map(([k, v]) => (
                      <span
                        key={k}
                        className="mr-2 inline-flex rounded bg-slate-100 px-2 py-1"
                      >
                        {k}: {v}
                      </span>
                    ))}
                  </div>

                  <div className="grid gap-2 md:grid-cols-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600">SKU</label>
                      <input
                        className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm"
                        value={r.sku ?? ""}
                        placeholder={r.autoSku}
                        onChange={(e) =>
                          setOverride(r.key, {
                            sku: e.target.value,
                            manualSku: true,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600">
                        Barcode (optional)
                      </label>
                      <input
                        className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm"
                        value={r.barcode ?? ""}
                        onChange={(e) =>
                          setOverride(r.key, { barcode: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600">Price</label>
                      <input
                        className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm"
                        value={r.price ?? "0.00"}
                        onChange={(e) => setOverride(r.key, { price: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600">Stock</label>
                      <input
                        className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm"
                        type="number"
                        min={0}
                        value={r.stock ?? 0}
                        onChange={(e) =>
                          setOverride(r.key, { stock: Number(e.target.value) || 0 })
                        }
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Auto SKU suggestion: {r.autoSku}</span>
                    <button
                      type="button"
                      className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                      onClick={() => {
                        setDirty(true);
                        setOverrides((prev) => {
                          const copy = { ...prev };
                          delete copy[r.key];
                          return copy;
                        });
                      }}
                    >
                      Reset row
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <textarea
        name="variants_json"
        hidden
        readOnly
        value={JSON.stringify(exportVariants)}
      />
      <input type="hidden" name="variants_dirty" value={dirty ? "1" : "0"} />
    </div>
  );
}
