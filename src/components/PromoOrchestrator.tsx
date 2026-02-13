"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

type Campaign = {
  id: string;
  name: string;
  type: "popup" | "banner" | "flash_strip";
  title: string;
  body: string | null;
  mediaUrl: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  audience: "all" | "guest" | "new_user" | "returning";
  frequencyMode: "once_per_session" | "once_per_day" | "max_total";
  frequencyMaxTotal: number | null;
  startAt: string | null;
  endAt: string | null;
  priority: number;
  triggerDelaySeconds: number;
};

type ActiveResponse = {
  ok: boolean;
  campaigns?: Campaign[];
};

export default function PromoOrchestrator() {
  const pathname = usePathname();
  const { status } = useSession();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [readyById, setReadyById] = useState<Record<string, boolean>>({});
  const [shownById, setShownById] = useState<Record<string, boolean>>({});
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({});

  const enabled = useMemo(() => {
    if (!pathname) return true;
    if (pathname.startsWith("/admin")) return false;
    if (pathname.startsWith("/api")) return false;
    return true;
  }, [pathname]);

  useEffect(() => {
    if (!enabled) return;
    if (status === "loading") return;
    let cancelled = false;
    const timers: Array<ReturnType<typeof setTimeout>> = [];

    const run = async () => {
      try {
        const res = await fetch("/api/campaigns/active", {
          method: "GET",
          cache: "no-store",
        });
        const data = (await res.json()) as ActiveResponse;
        if (!data.ok || !Array.isArray(data.campaigns)) return;

        const filtered = data.campaigns.filter((c) => {
          if (c.frequencyMode !== "once_per_session") return true;
          const seen = sessionStorage.getItem(sessionKey(c.id));
          return seen !== "1";
        });
        if (cancelled) return;
        setCampaigns(filtered);
        setReadyById({});
        setShownById({});

        for (const c of filtered) {
          const delayMs =
            Math.max(0, Number(c.triggerDelaySeconds ?? 0)) * 1000;
          const t = setTimeout(() => {
            setReadyById((prev) => ({ ...prev, [c.id]: true }));
          }, delayMs);
          timers.push(t);
        }
      } catch {
        // no-op; campaigns should never block page rendering
      }
    };

    void run();
    return () => {
      cancelled = true;
      for (const t of timers) clearTimeout(t);
    };
  }, [enabled, status]);

  useEffect(() => {
    if (campaigns.length === 0) return;
    for (const c of campaigns) {
      if (!readyById[c.id]) continue;
      if (dismissed[c.id]) continue;
      if (shownById[c.id]) continue;
      if (c.frequencyMode === "once_per_session") {
        sessionStorage.setItem(sessionKey(c.id), "1");
      }
      setShownById((prev) => ({ ...prev, [c.id]: true }));
      void trackEvent(c.id, "shown");
    }
  }, [campaigns, readyById, dismissed, shownById]);

  if (!enabled || campaigns.length === 0) return null;

  const banner = campaigns.find(
    (c) =>
      readyById[c.id] &&
      !dismissed[c.id] &&
      (c.type === "banner" || c.type === "flash_strip"),
  );
  const popup = campaigns.find(
    (c) => readyById[c.id] && !dismissed[c.id] && c.type === "popup",
  );

  return (
    <>
      {banner && (
        <BannerCampaign
          campaign={banner}
          onDismiss={() => {
            setDismissed((prev) => ({ ...prev, [banner.id]: true }));
            void trackEvent(banner.id, "dismissed");
          }}
          onClick={() => {
            void trackEvent(banner.id, "clicked");
          }}
        />
      )}
      {popup && (
        <PopupCampaign
          campaign={popup}
          onDismiss={() => {
            setDismissed((prev) => ({ ...prev, [popup.id]: true }));
            void trackEvent(popup.id, "dismissed");
          }}
          onClick={() => {
            void trackEvent(popup.id, "clicked");
          }}
        />
      )}
    </>
  );
}

function BannerCampaign({
  campaign,
  onDismiss,
  onClick,
}: {
  campaign: Campaign;
  onDismiss: () => void;
  onClick: () => void;
}) {
  const countdown =
    campaign.type === "flash_strip" ? formatCountdown(campaign.endAt) : null;
  return (
    <div className="fixed inset-x-0 top-0 z-[70] animate-[slideDown_280ms_ease-out] bg-gradient-to-r from-rose-600 via-orange-500 to-amber-400 text-white shadow-lg">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 text-sm">
        <div className="flex-1">
          <div className="font-semibold tracking-wide">{campaign.title}</div>
          {campaign.body && (
            <div className="text-white/90">{campaign.body}</div>
          )}
        </div>
        {countdown && (
          <span className="rounded-full bg-black/20 px-2.5 py-1 text-xs">
            Ends in {countdown}
          </span>
        )}
        {campaign.ctaUrl && (
          <a
            href={campaign.ctaUrl}
            onClick={onClick}
            className="rounded bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-100"
          >
            {campaign.ctaLabel ?? "Shop now"}
          </a>
        )}
        <button
          type="button"
          onClick={onDismiss}
          className="rounded border border-white/50 px-2 py-1 text-xs hover:bg-white/10"
          aria-label="Dismiss promotion"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function PopupCampaign({
  campaign,
  onDismiss,
  onClick,
}: {
  campaign: Campaign;
  onDismiss: () => void;
  onClick: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/45 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        {campaign.mediaUrl && (
          <Image
            src={campaign.mediaUrl}
            alt={campaign.title}
            width={720}
            height={320}
            className="h-44 w-full object-cover"
          />
        )}
        <div className="space-y-3 p-5">
          <h3 className="text-xl font-semibold text-slate-900">
            {campaign.title}
          </h3>
          {campaign.body && (
            <p className="text-sm text-slate-600">{campaign.body}</p>
          )}
          <div className="flex items-center gap-2">
            {campaign.ctaUrl && (
              <a
                href={campaign.ctaUrl}
                onClick={onClick}
                className="inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                {campaign.ctaLabel ?? "Explore offer"}
              </a>
            )}
            <button
              type="button"
              onClick={onDismiss}
              className="inline-flex rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatCountdown(endAt: string | null) {
  if (!endAt) return null;
  const end = new Date(endAt).getTime();
  if (!Number.isFinite(end)) return null;
  const diffMs = end - Date.now();
  if (diffMs <= 0) return "0h";
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  return `${hours}h ${minutes}m`;
}

function sessionKey(campaignId: string) {
  return `promo_seen_${campaignId}`;
}

async function trackEvent(
  campaignId: string,
  event: "shown" | "clicked" | "dismissed",
) {
  try {
    await fetch(`/api/campaigns/${campaignId}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event }),
      keepalive: true,
    });
  } catch {
    // no-op
  }
}
