import { redirect } from "next/navigation";
import { db } from "@/db/server";
import { coupons } from "@/db/schema";
import { createCouponSchema } from "@/lib/validation/coupon";

export default function NewCouponPage() {
  async function createAction(formData: FormData) {
    "use server";
    const payload = {
      code: String(formData.get("code") ?? "").trim(),
      description: String(formData.get("description") ?? "") || null,
      discount_type: String(formData.get("discount_type") ?? "amount"),
      discount_value: String(formData.get("discount_value") ?? "0"),
      min_order_amount: formData.get("min_order_amount")
        ? String(formData.get("min_order_amount"))
        : null,
      max_redemptions: formData.get("max_redemptions")
        ? String(formData.get("max_redemptions"))
        : null,
      per_customer_limit: formData.get("per_customer_limit")
        ? String(formData.get("per_customer_limit"))
        : "1",
      starts_at: formData.get("starts_at")
        ? String(formData.get("starts_at"))
        : null,
      expires_at: formData.get("expires_at")
        ? String(formData.get("expires_at"))
        : null,
      active: formData.get("active") === "on",
    };

    const parsed = createCouponSchema.parse(payload);
    await db.insert(coupons).values([
      {
        code: parsed.code,
        description: parsed.description,
        discount_type: parsed.discount_type,
        discount_value: String(parsed.discount_value),
        min_order_amount:
          parsed.min_order_amount == null ? null : String(parsed.min_order_amount),
        max_redemptions: parsed.max_redemptions ?? null,
        per_customer_limit: parsed.per_customer_limit,
        starts_at: parsed.starts_at ?? null,
        expires_at: parsed.expires_at ?? null,
        active: parsed.active,
      },
    ]);

    redirect("/admin/coupons");
  }

  return (
    <div className="space-y-4">
      <div className="admin-panel">
        <h2 className="text-xl font-semibold">Create coupon</h2>
        <p className="text-sm text-slate-600">
          Set rules for discount type, limits, and active period.
        </p>
      </div>

      <form action={createAction} className="admin-panel space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Code</label>
          <input name="code" required className="mt-1 w-full rounded-md border border-slate-300 p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Description</label>
          <input name="description" className="mt-1 w-full rounded-md border border-slate-300 p-2" />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">Type</label>
            <select
              name="discount_type"
              defaultValue="percent"
              className="mt-1 w-full rounded-md border border-slate-300 p-2"
            >
              <option value="percent">Percent</option>
              <option value="amount">Fixed amount</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Value</label>
            <input
              name="discount_value"
              defaultValue="0"
              className="mt-1 w-full rounded-md border border-slate-300 p-2"
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">Min order</label>
            <input name="min_order_amount" className="mt-1 w-full rounded-md border border-slate-300 p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Max redemptions</label>
            <input name="max_redemptions" className="mt-1 w-full rounded-md border border-slate-300 p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Per customer</label>
            <input
              name="per_customer_limit"
              defaultValue="1"
              className="mt-1 w-full rounded-md border border-slate-300 p-2"
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">Starts at</label>
            <input type="datetime-local" name="starts_at" className="mt-1 w-full rounded-md border border-slate-300 p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Expires at</label>
            <input type="datetime-local" name="expires_at" className="mt-1 w-full rounded-md border border-slate-300 p-2" />
          </div>
        </div>

        <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
          <input type="checkbox" name="active" defaultChecked /> Active
        </label>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Create coupon
          </button>
        </div>
      </form>
    </div>
  );
}
