import { redirect } from "next/navigation";
import {
  deleteCampaignById,
  getCampaignById,
  updateCampaignById,
} from "@/lib/db/queries/campaigns";
import { campaignInputSchema } from "@/lib/validation/campaign";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CampaignDetailPage({ params }: Props) {
  const { id } = await params;
  const campaign = await getCampaignById(id);
  if (!campaign) return <div className="admin-panel">Campaign not found</div>;

  async function updateAction(formData: FormData) {
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
    await updateCampaignById(id, parsed);
    redirect(`/admin/campaigns/${id}`);
  }

  async function deleteAction() {
    "use server";
    await deleteCampaignById(id);
    redirect("/admin/campaigns");
  }

  return (
    <div className="space-y-4">
      <div className="admin-panel">
        <h1 className="text-xl font-semibold">Campaign: {campaign.title}</h1>
        <p className="text-sm text-slate-600">
          Update targeting, frequency cap, content, and timing.
        </p>
      </div>

      <form action={updateAction} className="admin-panel space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Internal name">
            <input
              name="name"
              defaultValue={campaign.name}
              required
              className="mt-1 w-full rounded-md border border-slate-300 p-2"
            />
          </Field>
          <Field label="Type">
            <select
              name="type"
              defaultValue={campaign.type}
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
            defaultValue={campaign.title}
            required
            className="mt-1 w-full rounded-md border border-slate-300 p-2"
          />
        </Field>
        <Field label="Body">
          <textarea
            name="body"
            rows={3}
            defaultValue={campaign.body ?? ""}
            className="mt-1 w-full rounded-md border border-slate-300 p-2"
          />
        </Field>

        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Media URL">
            <input
              name="media_url"
              defaultValue={campaign.media_url ?? ""}
              className="mt-1 w-full rounded-md border border-slate-300 p-2"
            />
          </Field>
          <Field label="CTA label">
            <input
              name="cta_label"
              defaultValue={campaign.cta_label ?? ""}
              className="mt-1 w-full rounded-md border border-slate-300 p-2"
            />
          </Field>
          <Field label="CTA URL">
            <input
              name="cta_url"
              defaultValue={campaign.cta_url ?? ""}
              className="mt-1 w-full rounded-md border border-slate-300 p-2"
            />
          </Field>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <Field label="Audience">
            <select
              name="audience"
              defaultValue={campaign.audience}
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
              defaultValue={String(campaign.priority ?? 1)}
              className="mt-1 w-full rounded-md border border-slate-300 p-2"
            />
          </Field>
          <Field label="Show delay (seconds)">
            <input
              name="trigger_delay_seconds"
              defaultValue={String(campaign.trigger_delay_seconds ?? 0)}
              className="mt-1 w-full rounded-md border border-slate-300 p-2"
            />
          </Field>
          <Field label="Frequency mode">
            <select
              name="frequency_mode"
              defaultValue={campaign.frequency_mode}
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
              defaultValue={campaign.frequency_max_total ?? ""}
              className="mt-1 w-full rounded-md border border-slate-300 p-2"
            />
          </Field>
          <Field label="Start at">
            <input
              type="datetime-local"
              name="start_at"
              defaultValue={toDateInput(campaign.start_at)}
              className="mt-1 w-full rounded-md border border-slate-300 p-2"
            />
          </Field>
          <Field label="End at">
            <input
              type="datetime-local"
              name="end_at"
              defaultValue={toDateInput(campaign.end_at)}
              className="mt-1 w-full rounded-md border border-slate-300 p-2"
            />
          </Field>
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={Boolean(campaign.is_active)}
          />
          Active
        </label>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Save changes
          </button>
          <button
            type="submit"
            formAction={deleteAction}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Delete campaign
          </button>
        </div>
      </form>
    </div>
  );
}

function toDateInput(value: Date | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 16);
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
