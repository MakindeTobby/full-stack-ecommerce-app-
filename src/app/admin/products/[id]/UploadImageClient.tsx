"use client";
import React, { useMemo, useState } from "react";

export default function UploadImageClient({
  productId,
}: {
  productId: string;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [messages, setMessages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const totalSizeMb = useMemo(
    () =>
      (
        files.reduce((sum, f) => sum + Number(f.size || 0), 0) /
        1024 /
        1024
      ).toFixed(2),
    [files]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!files.length) {
      setMessages(["Select one or more files first."]);
      return;
    }

    setLoading(true);
    setMessages([]);

    const out: string[] = [];
    for (const f of files) {
      const fd = new FormData();
      fd.append("file", f);
      try {
        const res = await fetch(`/api/admin/upload-image?productId=${productId}`, {
          method: "POST",
          body: fd,
        });
        const json = await res.json();
        if (res.ok) out.push(`Uploaded: ${f.name}`);
        else out.push(`Failed: ${f.name} (${json?.error ?? "unknown"})`);
      } catch (err: any) {
        out.push(`Error: ${f.name} (${err?.message ?? String(err)})`);
      }
    }

    setMessages(out);
    setLoading(false);

    setTimeout(() => window.location.reload(), 600);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-md border border-slate-200 p-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Upload images or videos
        </label>
        <p className="mt-1 text-xs text-slate-500">
          Accepted: image/* and video/*. Recommended image width: 1200px+.
        </p>
      </div>

      <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-3">
        <input
          multiple
          accept="image/*,video/*"
          type="file"
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          className="w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <div>
          Selected files: <strong>{files.length}</strong>
        </div>
        <div>
          Total size: <strong>{totalSizeMb} MB</strong>
        </div>
        <div>Max recommended assets per product: 9</div>
      </div>

      {files.length > 0 && (
        <div className="max-h-32 overflow-y-auto rounded-md border border-slate-200 bg-white p-2 text-xs text-slate-600">
          {files.map((f) => (
            <div key={`${f.name}-${f.size}`} className="flex justify-between py-0.5">
              <span className="truncate">{f.name}</span>
              <span>{(f.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
          ))}
        </div>
      )}

      <button
        disabled={loading}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {loading ? "Uploading..." : "Upload files"}
      </button>

      {messages.length > 0 && (
        <div className="space-y-1 rounded-md border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700">
          {messages.map((m, i) => (
            <div key={`${m}-${i}`}>{m}</div>
          ))}
        </div>
      )}
    </form>
  );
}
