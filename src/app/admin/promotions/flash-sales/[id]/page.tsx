import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db/server";
import { flash_sales, flash_sale_products, products } from "@/db/schema";
import {
  deleteFlashSale,
  updateFlashSaleTransaction,
} from "@/lib/db/transactions/flashSales";
import { isDatabaseUnavailableError } from "@/lib/db/queries/product.shared";
import FlashSaleForm from "../../components/FlashSaleForm";
import AdminDbUnavailableNotice from "@/components/admin/AdminDbUnavailableNotice";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function EditFlashSalePage({ params, searchParams }: Props) {
  const id = (await params).id;
  const sp = (await searchParams) ?? {};
  const errorRaw = Array.isArray(sp.error) ? sp.error[0] : sp.error;
  const error = (errorRaw ?? "").trim();

  let sale: (typeof flash_sales.$inferSelect) | null = null;
  let attached: Array<{
    id: string;
    product_id: string;
    override_discount_type: string | null;
    override_discount_value: string | null;
    product_name: string | null;
    product_sku: string | null;
  }> = [];

  try {
    sale = await db
      .select()
      .from(flash_sales)
      .where(eq(flash_sales.id, id))
      .then((r) => r[0] ?? null);

    if (!sale) return <div>Not found</div>;

    attached = await db
      .select({
        id: flash_sale_products.id,
        product_id: flash_sale_products.product_id,
        override_discount_type: flash_sale_products.override_discount_type,
        override_discount_value: flash_sale_products.override_discount_value,
        product_name: products.name_en,
        product_sku: products.sku,
      })
      .from(flash_sale_products)
      .leftJoin(products, eq(flash_sale_products.product_id, products.id))
      .where(eq(flash_sale_products.flash_sale_id, id));
  } catch (e: unknown) {
    if (!isDatabaseUnavailableError(e)) throw e;
    return (
      <div className="space-y-4">
        <AdminDbUnavailableNotice message={"Flash sale service is temporarily unavailable. Please retry."} retryHref={`/admin/promotions/flash-sales/${id}`} />
      </div>
    );
  }

  async function updateAction(formData: FormData) {
    "use server";
    const payload = {
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? "") || null,
      discount_type: String(formData.get("discount_type") ?? "percent") as
        | "percent"
        | "amount",
      discount_value: Number(formData.get("discount_value") ?? 0),
      starts_at: String(formData.get("starts_at") ?? ""),
      ends_at: String(formData.get("ends_at") ?? ""),
      priority: Number(formData.get("priority") ?? 1),
      products: JSON.parse(String(formData.get("products") ?? "[]")),
    };

    try {
      await updateFlashSaleTransaction(id, payload);
      redirect(`/admin/promotions/flash-sales/${id}`);
    } catch (e: unknown) {
      if (!isDatabaseUnavailableError(e)) throw e;
      redirect(`/admin/promotions/flash-sales/${id}?error=database_unavailable`);
    }
  }

  async function deleteAction() {
    "use server";
    try {
      await deleteFlashSale(id);
      redirect("/admin/promotions/flash-sales");
    } catch (e: unknown) {
      if (!isDatabaseUnavailableError(e)) throw e;
      redirect(`/admin/promotions/flash-sales/${id}?error=database_unavailable`);
    }
  }

  const initial: any = {
    title: sale.title,
    description: sale.description,
    discount_type: sale.discount_type,
    discount_value: Number(sale.discount_value),
    starts_at: sale.starts_at?.toISOString?.() ?? null,
    ends_at: sale.ends_at?.toISOString?.() ?? null,
    priority: sale.priority,
    products: attached.map((a: any) => ({
      productId: String(a.product_id),
      title: a.product_name ?? a.product_sku ?? String(a.product_id),
      override_type: a.override_discount_type ?? null,
      override_value: a.override_discount_value ?? null,
    })),
  };

  return (
    <div className="space-y-4">
      {error ? (
        <AdminDbUnavailableNotice message={"Could not save flash sale due to temporary database issue."} retryHref={`/admin/promotions/flash-sales/${id}`} />
      ) : null}

      <div className="admin-panel flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Edit flash sale</h1>
          <p className="text-sm text-slate-600">
            Update schedule, discount settings, and attached products.
          </p>
        </div>
        <form action={deleteAction}>
          <button className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700">
            Delete
          </button>
        </form>
      </div>
      <div className="admin-panel">
        <FlashSaleForm initial={initial} onSubmitAction={updateAction} />
      </div>
    </div>
  );
}


