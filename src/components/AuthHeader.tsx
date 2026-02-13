"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

function initialsFromEmail(name?: string | null, email?: string | null) {
  if (name) {
    return name
      .split(" ")
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }
  if (email) return email.charAt(0).toUpperCase();
  return "U";
}

export default function AuthHeader() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    }

    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  const onSignOut = async () => {
    setOpen(false);
    await signOut({ callbackUrl: "/" });
  };

  if (status === "loading") {
    return (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
        <div className="hidden h-3 w-20 animate-pulse rounded bg-gray-200 sm:block" />
      </div>
    );
  }

  if (!session) {
    return (
      <Link
        href="/signin"
        className="inline-flex h-9 items-center rounded-md border border-black/15 bg-white px-3 text-sm font-medium text-black transition hover:bg-gray-50"
      >
        Sign in
      </Link>
    );
  }

  const user = session.user;
  const role = (user as { role?: string } | undefined)?.role ?? "customer";
  const avatar = (user as { image?: string | null } | undefined)?.image ?? null;
  const displayName = user?.name ?? user?.email ?? "Account";

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md border border-black/10 bg-white px-2 py-1 transition hover:bg-gray-50"
      >
        {avatar ? (
          <img
            src={avatar}
            alt="avatar"
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/90 text-xs font-semibold text-white">
            {initialsFromEmail(user?.name ?? null, user?.email ?? null)}
          </div>
        )}

        <div className="hidden text-left sm:flex sm:flex-col">
          <span className="max-w-[140px] truncate text-xs font-medium text-gray-900">
            {displayName}
          </span>
          <span className="text-[11px] text-gray-500">
            {role === "admin" ? "Admin" : "Customer"}
          </span>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{
              type: "spring",
              stiffness: 600,
              damping: 32,
              duration: 0.12,
            }}
            className="absolute right-0 z-50 mt-2 w-60 rounded-lg border border-black/10 bg-white shadow-lg"
          >
            <div className="border-b border-black/10 px-3 py-2">
              <div className="truncate text-sm font-semibold text-gray-900">
                {displayName}
              </div>
              <div className="truncate text-xs text-gray-500">{user?.email}</div>
            </div>

            <div className="py-1">
              <Link
                href="/orders"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Orders
              </Link>

              <Link
                href="/account/setup"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Profile setup
              </Link>

              {role === "admin" && (
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
                >
                  Admin dashboard
                </Link>
              )}
            </div>

            <div className="border-t border-black/10 p-2">
              <button
                type="button"
                onClick={onSignOut}
                className="w-full rounded-md px-2 py-2 text-left text-sm text-red-700 transition hover:bg-red-50"
              >
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
