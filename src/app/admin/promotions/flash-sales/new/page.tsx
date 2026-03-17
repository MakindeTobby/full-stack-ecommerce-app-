import { redirect } from "next/navigation";
import { createFlashSaleTransaction } from "@/lib/db/transactions/flashSales";
import { isDatabaseUnavailableError } from "@/lib/db/queries/product.shared";
import { flashSaleSchema } from "@/lib/validation/flash";
import FlashSaleForm from "../../components/FlashSaleForm";
import AdminDbUnavailableNotice from "@/components/admin/AdminDbUnavailableNotice";

type Props = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function NewFlashSalePage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const errorRaw = Array.isArray(sp.error) ? sp.error[0] : sp.error;
  const error = (errorRaw ?? "").trim();

  async function createAction(formData: FormData) {
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

    flashSaleSchema.parse({
      title: payload.title,
      description: payload.description,
      discount_type: payload.discount_type,
      discount_value: payload.discount_value,
      starts_at: payload.starts_at,
      ends_at: payload.ends_at,
      priority: payload.priority,
    });

    try {
      const res = await createFlashSaleTransaction(payload);
      redirect(`/admin/promotions/flash-sales/${res.id}`);
    } catch (e: unknown) {
      if (!isDatabaseUnavailableError(e)) throw e;
      redirect("/admin/promotions/flash-sales/new?error=database_unavailable");
    }
  }

  return (
    <div className="space-y-4">
      {error ? (
        <AdminDbUnavailableNotice message={"Could not create flash sale because database is temporarily unavailable."} retryHref="/admin/promotions/flash-sales/new" />
      ) : null}

      <div className="admin-panel">
        <h1 className="text-xl font-semibold">Create flash sale</h1>
        <p className="text-sm text-slate-600">
          Configure campaign-level discount and attach products.
        </p>
      </div>

      <div className="admin-panel">
        <FlashSaleForm onSubmitAction={createAction} />
      </div>
    </div>
  );
}

