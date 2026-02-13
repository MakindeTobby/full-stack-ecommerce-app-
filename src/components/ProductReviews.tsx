"use client";

import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) =>
  fetch(url, { cache: "no-store" }).then((r) => r.json());

type ReviewBundle = {
  ok: boolean;
  summary?: {
    total: number;
    average: number;
    breakdown: Record<1 | 2 | 3 | 4 | 5, number>;
  };
  reviews?: Array<{
    id: string;
    rating: number;
    title: string | null;
    body: string | null;
    is_verified_purchase: boolean;
    created_at: string | null;
    user_name: string | null;
  }>;
  mine?: {
    id: string;
    rating: number;
    title: string | null;
    body: string | null;
    status: string;
  } | null;
  canReview?: boolean;
  error?: string;
};

export default function ProductReviews({
  productId,
  userId,
}: {
  productId: string;
  userId: string | null;
}) {
  const { data, mutate, isLoading } = useSWR<ReviewBundle>(
    `/api/products/${productId}/reviews`,
    fetcher,
  );
  const mine = data?.mine ?? null;
  const canReview = Boolean(data?.canReview);
  const reviews = data?.reviews ?? [];
  const summary = data?.summary ?? {
    total: 0,
    average: 0,
    breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<
      1 | 2 | 3 | 4 | 5,
      number
    >,
  };

  const [rating, setRating] = useState<number>(mine?.rating ?? 5);
  const [title, setTitle] = useState<string>(mine?.title ?? "");
  const [body, setBody] = useState<string>(mine?.body ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string>("");

  async function submitReview() {
    if (!userId) {
      setMsg("Sign in to submit a review.");
      return;
    }
    if (rating < 1 || rating > 5) {
      setMsg("Rating must be 1 to 5.");
      return;
    }
    setSubmitting(true);
    setMsg("");
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, title, body }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setMsg(json.error ?? "Failed to submit review.");
        return;
      }
      setMsg("Review submitted. It will appear after moderation.");
      await mutate();
    } catch {
      setMsg("Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-8 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900">
          Ratings & reviews
        </h3>
        <div className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">
            {summary.average.toFixed(1)}
          </span>{" "}
          / 5 ({summary.total} reviews)
        </div>
      </div>

      <div className="mt-3 grid gap-1 text-xs text-slate-600 sm:max-w-xs">
        {[5, 4, 3, 2, 1].map((n) => {
          const count = summary.breakdown[n as 1 | 2 | 3 | 4 | 5] ?? 0;
          const pct = summary.total > 0 ? (count / summary.total) * 100 : 0;
          return (
            <div
              key={n}
              className="grid grid-cols-[32px_1fr_40px] items-center gap-2"
            >
              <span>{n} star</span>
              <div className="h-1.5 rounded bg-slate-100">
                <div
                  className="h-1.5 rounded bg-slate-800"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-right">{count}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-5 rounded-lg border border-slate-200 p-4">
        <h4 className="text-sm font-semibold text-slate-900">
          {mine ? "Update your review" : "Write a review"}
        </h4>
        {!userId && (
          <p className="mt-1 text-xs text-slate-500">Sign in to review.</p>
        )}
        {userId && !canReview && !mine && (
          <p className="mt-1 text-xs text-slate-500">
            You can review this product after it is delivered in one of your
            orders.
          </p>
        )}
        {mine && (
          <p className="mt-1 text-xs text-slate-500">
            Current status: <span className="font-medium">{mine.status}</span>
          </p>
        )}

        <div className="mt-3 grid gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-700">Rating</span>
            <select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="rounded border border-slate-300 px-2 py-1 text-sm"
              disabled={submitting || (!canReview && !mine)}
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Review title"
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            disabled={submitting || (!canReview && !mine)}
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share your experience"
            className="min-h-24 rounded border border-slate-300 px-3 py-2 text-sm"
            disabled={submitting || (!canReview && !mine)}
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={submitReview}
              disabled={submitting || (!canReview && !mine)}
              className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {submitting
                ? "Submitting..."
                : mine
                  ? "Update review"
                  : "Submit review"}
            </button>
            {msg && <span className="text-xs text-slate-600">{msg}</span>}
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {isLoading && (
          <div className="text-sm text-slate-500">Loading reviews...</div>
        )}
        {!isLoading && reviews.length === 0 && (
          <div className="text-sm text-slate-500">No approved reviews yet.</div>
        )}
        {reviews.map((r) => (
          <article
            key={r.id}
            className="rounded-lg border border-slate-200 p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-medium text-slate-900">
                {r.user_name ?? "Customer"}
              </div>
              <div className="text-xs text-slate-600">
                {r.created_at
                  ? new Date(r.created_at).toLocaleDateString()
                  : ""}
              </div>
            </div>
            <div className="mt-1 text-xs text-amber-600">{`Rating: ${r.rating}/5`}</div>
            {r.title && (
              <div className="mt-1 text-sm font-medium text-slate-800">
                {r.title}
              </div>
            )}
            {r.body && <p className="mt-1 text-sm text-slate-700">{r.body}</p>}
            {r.is_verified_purchase && (
              <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                Verified purchase
              </span>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
