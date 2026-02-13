import { redirect } from "next/navigation";
import {
  deleteCouponById,
  getCouponById,
  setCouponActive,
  updateCouponById,
} from "@/lib/db/queries/coupons";
import { createCouponSchema } from "@/lib/validation/coupon";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function CouponDetail({ params }: Props) {
  const { id } = await params;
  const data = await getCouponById(id);
  if (!data) return <div className="admin-panel">Coupon not found</div>;

  const { coupon, totalRedemptions, redemptions } = data;

  async function updateAction(formData: FormData) {
    "use server";
    const payload = {
      code: String(formData.get("code") ?? "").trim(),
      description: String(formData.get("description") ?? "") || null,
      discount_type: String(formData.get("discount_type") ?? "amount") as
        | "amount"
        | "percent",
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
    await updateCouponById(id, parsed as any);
    redirect(`/admin/coupons/${id}`);
  }

  async function deleteAction() {
    "use server";
    await deleteCouponById(id);
    redirect("/admin/coupons");
  }

  async function toggleAction(formData: FormData) {
    "use server";
    const active = formData.get("active") === "on";
    await setCouponActive(id, active);
    redirect(`/admin/coupons/${id}`);
  }

  return (
    <div className="space-y-4">
      <div className="admin-panel flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Coupon: {coupon.code}</h1>
          <p className="text-sm text-slate-600">
            Update coupon rules and review redemption history.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <form action={updateAction} className="admin-panel space-y-4 lg:col-span-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">Code</label>
            <input
              name="code"
              defaultValue={coupon.code}
              className="mt-1 w-full rounded-md border border-slate-300 p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Description</label>
            <input
              name="description"
              defaultValue={coupon.description ?? ""}
              className="mt-1 w-full rounded-md border border-slate-300 p-2"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Type</label>
              <select
                name="discount_type"
                defaultValue={coupon.discount_type}
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
                defaultValue={String(coupon.discount_value)}
                className="mt-1 w-full rounded-md border border-slate-300 p-2"
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">Min order</label>
              <input
                name="min_order_amount"
                defaultValue={coupon.min_order_amount ?? ""}
                className="mt-1 w-full rounded-md border border-slate-300 p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Max redemptions</label>
              <input
                name="max_redemptions"
                defaultValue={coupon.max_redemptions ?? ""}
                className="mt-1 w-full rounded-md border border-slate-300 p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Per customer</label>
              <input
                name="per_customer_limit"
                defaultValue={String(coupon.per_customer_limit ?? 1)}
                className="mt-1 w-full rounded-md border border-slate-300 p-2"
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Starts at</label>
              <input
                type="datetime-local"
                name="starts_at"
                defaultValue={
                  coupon.starts_at
                    ? new Date(coupon.starts_at).toISOString().slice(0, 16)
                    : ""
                }
                className="mt-1 w-full rounded-md border border-slate-300 p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Expires at</label>
              <input
                type="datetime-local"
                name="expires_at"
                defaultValue={
                  coupon.expires_at
                    ? new Date(coupon.expires_at).toISOString().slice(0, 16)
                    : ""
                }
                className="mt-1 w-full rounded-md border border-slate-300 p-2"
              />
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" name="active" defaultChecked={!!coupon.active} /> Active
          </label>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Save changes
            </button>
            <button
              formAction={deleteAction}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Delete coupon
            </button>
          </div>
        </form>

        <div className="admin-panel space-y-4">
          <div>
            <h3 className="font-semibold">Usage</h3>
            <div className="mt-2 text-sm text-slate-600">
              Total redemptions: {totalRedemptions}
            </div>
          </div>

          <div>
            <h3 className="font-semibold">Recent redemptions</h3>
            <div className="mt-2 space-y-2">
              {redemptions.length === 0 ? (
                <div className="text-sm text-slate-500">No redemptions yet.</div>
              ) : (
                redemptions.map((r: any) => (
                  <div key={r.id} className="rounded-md border border-slate-200 p-3 text-sm">
                    <div>
                      <strong>User:</strong> {r.user_email ?? "Guest"}
                    </div>
                    <div>
                      <strong>Order:</strong> {r.order_id ?? "-"}{" "}
                      <span className="text-slate-500">
                        ({r.order_total ? `$${String(r.order_total)}` : ""})
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      At: {new Date(r.created_at).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <form action={toggleAction} className="border-t border-slate-200 pt-3">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="active" defaultChecked={!!coupon.active} />
              Toggle active
            </label>
            <div className="mt-2">
              <button
                type="submit"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
              >
                Save status
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
