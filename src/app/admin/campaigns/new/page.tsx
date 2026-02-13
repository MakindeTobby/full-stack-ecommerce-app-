import { redirect } from "next/navigation";
import { createCampaign } from "@/lib/db/queries/campaigns";
import { campaignInputSchema } from "@/lib/validation/campaign";

export default function NewCampaignPage() {
  async function createAction(formData: FormData) {
    "use server";
    const raw = {
      name: String(formData.get("name") ?? ""),
      type: String(formData.get("type") ?? "popup"),
      title: String(formData.get("title") ?? ""),
      body: String(formData.get("body") ?? ""),
      media_url: String(formData.get("media_url") ?? ""),
      cta_label: String(formData.get("cta_label") ?? ""),
      cta_url: String(formData.get("cta_url") ?? ""),
      audience: String(formData.get("audience") ?? "all"),
      is_active: formData.get("is_active") === "on",
      start_at: String(formData.get("start_at") ?? ""),
      end_at: String(formData.get("end_at") ?? ""),
      priority: String(formData.get("priority") ?? "1"),
      trigger_delay_seconds: String(
        formData.get("trigger_delay_seconds") ?? "0",
      ),
      frequency_mode: String(
        formData.get("frequency_mode") ?? "once_per_session",
      ),
      frequency_max_total: String(formData.get("frequency_max_total") ?? ""),
    };

    const parsed = campaignInputSchema.parse(raw);
    const id = await createCampaign(parsed);
    redirect(id ? `/admin/campaigns/${id}` : "/admin/campaigns");
  }

  return (
    <div className="space-y-4">
      <div className="admin-panel">
        <h1 className="text-xl font-semibold">New campaign</h1>
        <p className="text-sm text-slate-600">
          Create a popup, banner, or flash strip with targeting and schedule.
        </p>
      </div>

      <form action={createAction} className="admin-panel space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Internal name">
            <input
              name="name"
              required
              className="mt-1 w-full rounded-md border border-slate-300 p-2"
            />
          </Field>
          <Field label="Type">
            <select
              name="type"
              defaultValue="popup"
              className="mt-1 w-full rounded-md border border-slate-300 p-2"
            >
              <option value="popup">Popup</option>
              <option value="banner">Banner</option>
              <option value="flash_strip">Flash strip</option>
            </select>
          </Field>
        </div>

        <Field label="Title">
          <input
            name="title"
            required
            className="mt-1 w-full rounded-md border border-slate-300 p-2"
          />
        </Field>
        <Field label="Body">
          <textarea
            name="body"
            rows={3}
            className="mt-1 w-full rounded-md border border-slate-300 p-2"
          />
        </Field>

        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Media URL">
            <input
              name="media_url"
              placeholder="https://..."
              className="mt-1 w-full rounded-md border border-slate-300 p-2"
            />
          </Field>
          <Field label="CTA label">
            <input
              name="cta_label"
              className="mt-1 w-full rounded-md border border-slate-300 p-2"
            />
          </Field>
          <Field label="CTA URL">
            <input
              name="cta_url"
              placeholder="/products"
              className="mt-1 w-full rounded-md border border-slate-300 p-2"
            />
          </Field>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <Field label="Audience">
            <select
              name="audience"
              defaultValue="all"
              className="mt-1 w-full rounded-md border border-slate-300 p-2"
            >
              <option value="all">All</option>
              <option value="guest">Guest only</option>
              <option value="new_user">New user</option>
              <option value="returning">Returning user</option>
            </select>
          </Field>
          <Field label="Priority">
            <input
              name="priority"
              defaultValue="1"
              className="mt-1 w-full rounded-md border border-slate-300 p-2"
            />
          </Field>
          <Field label="Show delay (seconds)">
            <input
              name="trigger_delay_seconds"
              defaultValue="4"
              className="mt-1 w-full rounded-md border border-slate-300 p-2"
            />
          </Field>
          <Field label="Frequency mode">
            <select
              name="frequency_mode"
              defaultValue="once_per_session"
              className="mt-1 w-full rounded-md border border-slate-300 p-2"
            >
              <option value="once_per_session">Once per session</option>
              <option value="once_per_day">Once per day</option>
              <option value="max_total">Max total</option>
            </select>
          </Field>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Max total (only max_total)">
            <input
              name="frequency_max_total"
              className="mt-1 w-full rounded-md border border-slate-300 p-2"
            />
          </Field>
          <Field label="Start at">
            <input
              type="datetime-local"
              name="start_at"
              className="mt-1 w-full rounded-md border border-slate-300 p-2"
            />
          </Field>
          <Field label="End at">
            <input
              type="datetime-local"
              name="end_at"
              className="mt-1 w-full rounded-md border border-slate-300 p-2"
            />
          </Field>
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="is_active" /> Activate now
        </label>

        <div>
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Create campaign
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="block text-sm font-medium text-slate-700">
      <div>{label}</div>
      {children}
    </div>
  );
}
