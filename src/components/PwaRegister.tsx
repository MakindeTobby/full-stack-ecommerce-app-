"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    window.addEventListener("load", () => {
      void navigator.serviceWorker.register("/sw.js").catch(() => null);
    });
  }, []);

  return null;
}
