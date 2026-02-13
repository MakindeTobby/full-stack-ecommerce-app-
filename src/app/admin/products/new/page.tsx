import { redirect } from "next/navigation";
import { db } from "@/db/server";
import { products } from "@/db/schema";
import { createProductSchema } from "@/lib/validation/product";
import { generateUniqueSlug, getAllCategories } from "@/lib/db/queries/product";
import { slugify } from "@/lib/slugify";
import DescriptionEditor from "../components/DescriptionEditor";

export default async function NewProductPage() {
  const categories = await getAllCategories();

  async function createAction(formData: FormData) {
    "use server";

    const name_en = String(formData.get("name_en") ?? "");
    const description =
      String(formData.get("description") ?? "").trim() || null;
    const category_id = String(formData.get("category_id") ?? "") || null;
    const base_price = String(formData.get("base_price") ?? "0.00");
    const sku = String(formData.get("sku") ?? "") || null;
    const published = formData.get("published") === "on";

    const baseSlug = slugify(name_en);
    const uniqueSlug = await generateUniqueSlug(baseSlug);

    const parsed = createProductSchema.parse({
      slug: uniqueSlug,
      category_id,
      name_en,
      description,
      base_price,
      sku,
      published,
      images: [],
      variants: [],
      bulk_pricing: [],
      tags: [],
    });

    const inserted = await db
      .insert(products)
      .values({
        slug: parsed.slug,
        category_id: parsed.category_id ?? null,
        name_en: parsed.name_en,
        description: parsed.description ?? null,
        base_price: parsed.base_price,
        sku: parsed.sku ?? null,
        published: parsed.published ?? false,
      })
      .returning({ id: products.id });

    const productId = inserted.at(0)?.id;
    if (!productId) throw new Error("Product create failed");
    redirect(`/admin/products/${productId}`);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="admin-panel">
          <h2 className="text-xl font-semibold">New product</h2>
          <p className="text-sm text-slate-600">
            Start with core details. Variants and media can be added after
            create.
          </p>
        </div>

        <form action={createAction} className="admin-panel space-y-4">
          <div>
            <label
              htmlFor="name_en"
              className="block text-sm font-medium text-slate-700"
            >
              Name (EN)
            </label>
            <input
              id="name_en"
              name="name_en"
              required
              className="mt-1 w-full rounded-md border border-slate-300 p-2"
            />
          </div>

          <DescriptionEditor rows={6} />

          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label
                htmlFor="category_id"
                className="block text-sm font-medium text-slate-700"
              >
                Category
              </label>
              <select
                id="category_id"
                name="category_id"
                className="mt-1 w-full rounded-md border border-slate-300 p-2"
                defaultValue=""
              >
                <option value="">Uncategorized</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="base_price"
                className="block text-sm font-medium text-slate-700"
              >
                Price
              </label>
              <input
                id="base_price"
                name="base_price"
                defaultValue="0.00"
                className="mt-1 w-full rounded-md border border-slate-300 p-2"
              />
            </div>
            <div>
              <label
                htmlFor="sku"
                className="block text-sm font-medium text-slate-700"
              >
                SKU
              </label>
              <input
                id="sku"
                name="sku"
                className="mt-1 w-full rounded-md border border-slate-300 p-2"
              />
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                <input type="checkbox" name="published" /> Published
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Create and continue
            </button>
            <a
              href="/admin/products"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </a>
          </div>
        </form>
      </div>

      <aside className="space-y-4">
        <div className="admin-panel">
          <h4 className="text-sm font-semibold">Quick tips</h4>
          <p className="mt-2 text-xs text-slate-600">
            Upload images and configure variants after creating the base
            product.
          </p>
        </div>
        <div className="admin-panel">
          <h4 className="text-sm font-semibold">SEO</h4>
          <p className="mt-2 text-xs text-slate-600">
            Slug is generated from product name and can be updated later.
          </p>
        </div>
      </aside>
    </div>
  );
}
