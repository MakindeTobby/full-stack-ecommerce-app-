"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Image from "next/image";
import {
  newsCardClass,
  newsRightClass,
  newsSubClass,
  newsTitleClass,
  nlNoteClass,
} from "@/styles";

const TILES = [
  {
    label: "20% off",
    image:
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=400&q=80",
  },
  {
    label: "Early access",
    image:
      "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=400&q=80",
  },
  {
    label: "Flash alerts",
    image:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=400&q=80",
  },
  {
    label: "New drops",
    image:
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=400&q=80",
  },
];

export default function Newsletter() {
  const [nlLoading, setNlLoading] = useState(false);
  const [nlDone, setNlDone] = useState(false);
  const [nlNote, setNlNote] = useState(
    "No spam. Unsubscribe anytime. We respect your inbox.",
  );
  const [nlEmail, setNlEmail] = useState("");

  const onNewsletterSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (nlLoading || nlDone) return;

    setNlLoading(true);
    setTimeout(() => {
      setNlLoading(false);
      setNlDone(true);
      setNlNote("Welcome! We'll be in touch with exclusive deals.");
    }, 1100);
  };

  return (
    <section className="py-16">
      <div className={newsCardClass} id="newsCard">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="p-8 sm:p-12">
            <div className="sec-label mb-3">Stay in the loop</div>
            <h2 className={newsTitleClass} id="newsTitle">
              Get early access
              <br />
              to flash sales
            </h2>
            <p className={newsSubClass} id="newsSub">
              Subscribe and be the first to know about new drops, exclusive
              promo codes, and members-only flash deals.
            </p>

            <div id="newsFormWrap">
              {!nlDone ? (
                <form
                  onSubmit={onNewsletterSubmit}
                  className="mt-6 flex flex-col gap-3 sm:flex-row"
                >
                  <input
                    id="nlEmail"
                    type="email"
                    placeholder="Your email address"
                    required
                    value={nlEmail}
                    onChange={(e) => setNlEmail(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:bg-white"
                  />
                  <button
                    type="submit"
                    id="nlBtn"
                    disabled={nlLoading}
                    className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 active:scale-[0.98] disabled:opacity-80"
                  >
                    {nlLoading ? (
                      <>
                        <svg className="spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8H4z"
                          />
                        </svg>
                        Subscribing...
                      </>
                    ) : (
                      <>
                        Subscribe
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="mt-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500">
                    <svg
                      className="h-4 w-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-green-800">You're in!</p>
                    <p className="text-xs text-green-700">
                      Check your inbox for a special discount code.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <p className={nlNoteClass} id="nlNote">
              {nlNote}
            </p>
          </div>

          <div className={newsRightClass} id="newsRight">
            <div className="grid w-full max-w-[230px] grid-cols-2 gap-3">
              {TILES.map((t, idx) => (
                <div
                  key={t.label}
                  className={`float-d${idx} flex flex-col items-center gap-1.5 rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm`}
                >
                  <div className="relative h-16 w-full overflow-hidden rounded-xl">
                    <Image
                      src={t.image}
                      alt={t.label}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-violet-600">
                    {t.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
