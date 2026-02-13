"use client";
import React, { useState } from "react";

export default function MediaItem({
  mediaId,
  url,
  type,
}: {
  mediaId: string;
  url: string;
  type: string;
}) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onDelete() {
    if (
      !confirm("Delete this media? This removes it from Cloudinary and product.")
    )
      return;

    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/media/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mediaId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "delete failed");
      window.location.reload();
    } catch (e: any) {
      setErr(e?.message ?? "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
      <div className="relative">
        {type === "image" ? (
          <img src={url} className="h-36 w-full object-cover" alt="Product media" />
        ) : (
          <video src={url} className="h-36 w-full object-cover" controls />
        )}
      </div>

      <div className="space-y-2 p-2">
        <div className="text-xs text-slate-500">
          Type: <span className="font-medium text-slate-700">{type}</span>
        </div>
        <button
          onClick={onDelete}
          disabled={loading}
          className="w-full rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
        >
          {loading ? "Deleting..." : "Delete media"}
        </button>
        {err && <div className="text-xs text-red-600">{err}</div>}
      </div>
    </div>
  );
}
