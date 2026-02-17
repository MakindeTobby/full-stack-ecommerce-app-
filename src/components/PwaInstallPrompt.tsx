"use client";

import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const STORAGE_KEY = "qb.pwa.install.dismissed";

export default function PwaInstallPrompt() {
  const [event, setEvent] = useState<InstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY) === "1";
    if (dismissed) return;

    function onPrompt(e: Event) {
      e.preventDefault();
      setEvent(e as InstallPromptEvent);
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
    };
  }, []);

  if (!visible || !event) return null;

  return (
    <div className="qb-install-banner">
      <div>
        <div className="text-sm font-semibold text-gray-900">Install app</div>
        <div className="text-xs text-gray-600">
          Get the premium shop experience on your home screen.
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="qb-install-btn"
          onClick={async () => {
            await event.prompt();
            const choice = await event.userChoice;
            setVisible(false);
            if (choice.outcome === "dismissed") {
              localStorage.setItem(STORAGE_KEY, "1");
            }
          }}
        >
          Install
        </button>
        <button
          type="button"
          className="qb-install-dismiss"
          onClick={() => {
            localStorage.setItem(STORAGE_KEY, "1");
            setVisible(false);
          }}
        >
          Not now
        </button>
      </div>
    </div>
  );
}
