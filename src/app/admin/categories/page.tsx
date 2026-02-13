import { revalidatePath } from "next/cache";
import {
  createCategory,
  deleteCategory,
  getCategoriesWithCounts,
} from "@/lib/db/queries/categories";

export default async function AdminCategoriesPage() {
  const rows = await getCategoriesWithCounts();

  async function createAction(formData: FormData) {
    "use server";
    const name = String(formData.get("name") ?? "");
    await createCategory(name);
    revalidatePath("/admin/categories");
    revalidatePath("/products");
  }

  async function deleteAction(formData: FormData) {
    "use server";
    const id = String(formData.get("id") ?? "");
    if (!id) return;
    await deleteCategory(id);
    revalidatePath("/admin/categories");
    revalidatePath("/admin/products");
    revalidatePath("/products");
  }

  return (
    <div className="space-y-4">
      <section className="admin-panel">
        <h2 className="text-xl font-semibold">Categories</h2>
        <p className="text-sm text-slate-600">
          Create categories and use them for storefront filtering.
        </p>
      </section>

      <form action={createAction} className="admin-panel flex items-end gap-3">
        <div className="flex-1">
          <label
            htmlFor="category_name"
            className="block text-sm font-medium text-slate-700"
          >
            Category name
          </label>
          <input
            id="category_name"
            name="name"
            required
            placeholder="e.g. Fresh Flowers"
            className="mt-1 w-full rounded-md border border-slate-300 p-2"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Add category
        </button>
      </form>

      <section className="admin-panel overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Products</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-100 text-sm">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {r.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{r.slug}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {Number(r.product_count ?? 0)}
                  </td>
                  <td className="px-4 py-3">
                    <form action={deleteAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <button
                        type="submit"
                        className="rounded border border-red-300 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-sm text-slate-500"
                    colSpan={4}
                  >
                    No categories yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
