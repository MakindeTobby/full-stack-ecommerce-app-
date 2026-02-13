import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db/server";
import { product_media, product_variants, products } from "@/db/schema";
import { deleteProductTransaction } from "@/lib/db/transactions/products";
import { getAllCategories } from "@/lib/db/queries/product";
import UploadImageClient from "./UploadImageClient";
import MediaItem from "../../../../components/MediaItem";
import DescriptionEditor from "../components/DescriptionEditor";
import SaveButtonClient from "../components/SaveButtonClient";
import VariantsEditor from "../components/VariantsEditor";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function EditProductPage({ params }: Props) {
  const id = (await params).id;

  const row = (await db.select().from(products).where(eq(products.id, id))).at(
    0,
  );
  if (!row) return <div className="admin-panel">Product not found.</div>;
  const categories = await getAllCategories();

  const medias = await db
    .select()
    .from(product_media)
    .where(eq(product_media.product_id, id))
    .orderBy(product_media.position);

  const existingVariants = await db
    .select()
    .from(product_variants)
    .where(eq(product_variants.product_id, id));

  async function deleteAction() {
    "use server";
    await deleteProductTransaction(id);
    redirect("/admin/products");
  }

  return (
    <div className="space-y-4">
      <section className="admin-panel flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Edit product</h1>
          <p className="text-sm text-slate-600">
            Update core details, variant attributes, pricing, stock, and media.
          </p>
          <div className="mt-2 text-xs text-slate-500">ID: {row.id}</div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium ${
              row.published
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            {row.published ? "Published" : "Draft"}
          </span>
        </div>
      </section>

      <form id="product-edit-form" className="space-y-4">
        <section className="admin-panel space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Basic information</h2>
            <p className="text-sm text-slate-600">
              These values define how the product appears in catalog and search.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Product name (EN)
            </label>
            <input
              name="name_en"
              defaultValue={row.name_en}
              className="mt-1 w-full rounded-md border border-slate-300 p-2"
              placeholder="e.g. Premium Rose Bouquet"
            />
          </div>

          <DescriptionEditor defaultValue={row.description ?? ""} rows={8} />

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Slug
            </label>
            <input
              name="slug"
              defaultValue={row.slug}
              className="mt-1 w-full rounded-md border border-slate-300 p-2"
              placeholder="premium-rose-bouquet"
            />
            <p className="mt-1 text-xs text-slate-500">
              URL path used on storefront product page.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Category
            </label>
            <select
              name="category_id"
              defaultValue={row.category_id ?? ""}
              className="mt-1 w-full rounded-md border border-slate-300 p-2"
            >
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Used for storefront category filters.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Base price
              </label>
              <input
                name="base_price"
                defaultValue={String(row.base_price)}
                className="mt-1 w-full rounded-md border border-slate-300 p-2"
                placeholder="0.00"
              />
              <p className="mt-1 text-xs text-slate-500">
                Used as fallback when variant-specific price is not set.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Product SKU (optional)
              </label>
              <input
                name="sku"
                defaultValue={row.sku ?? ""}
                className="mt-1 w-full rounded-md border border-slate-300 p-2"
                placeholder="SKU-BASE-001"
              />
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              name="published"
              defaultChecked={!!row.published}
            />
            Published (visible in storefront listings)
          </label>
        </section>

        <section className="admin-panel">
          <VariantsEditor
            productName={row.name_en}
            productPrice={String(row.base_price ?? "0.00")}
            defaultValue={existingVariants.map((v) => ({
              sku: v.sku,
              barcode: v.barcode,
              price: String(v.price ?? "0.00"),
              stock: v.stock,
              attributes: v.attributes ? JSON.parse(v.attributes) : {},
            }))}
          />
        </section>

        <section className="admin-panel flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-slate-600">
            Save applies product fields and variant matrix changes together.
          </div>
          <div className="flex gap-2">
            <SaveButtonClient productId={id} formId="product-edit-form" />
            <button
              formAction={deleteAction}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Delete product
            </button>
          </div>
        </section>
      </form>

      <section className="admin-panel space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Media library</h2>
          <p className="text-sm text-slate-600">
            Add product images/videos. Use clear first image as default
            storefront thumbnail.
          </p>
        </div>

        <UploadImageClient productId={id} />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {medias.map((m) => (
            <MediaItem
              key={m.id}
              mediaId={m.id}
              url={m.url}
              type={m.type as string}
            />
          ))}
          {medias.length === 0 && (
            <div className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500">
              No media yet. Upload files above to populate this gallery.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
