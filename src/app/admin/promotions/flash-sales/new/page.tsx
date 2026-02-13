// app/admin/promotions/flash-sales/new/page.tsx
import { createFlashSaleTransaction } from "@/lib/db/transactions/flashSales";
import { flashSaleSchema } from "@/lib/validation/flash";
import { redirect } from "next/navigation";
import FlashSaleForm from "../../components/FlashSaleForm";

export default function NewFlashSalePage() {
  async function createAction(formData: FormData) {
    "use server";
    // parse fields
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

    // validation server-side
    flashSaleSchema.parse({
      title: payload.title,
      description: payload.description,
      discount_type: payload.discount_type,
      discount_value: payload.discount_value,
      starts_at: payload.starts_at,
      ends_at: payload.ends_at,
      priority: payload.priority,
    });

    const res = await createFlashSaleTransaction(payload);
    redirect(`/admin/promotions/flash-sales/${res.id}`);
  }

  return (
    <div className="space-y-4">
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
