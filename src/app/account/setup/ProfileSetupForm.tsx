// app/account/setup/ProfileSetupForm.tsx (client component that calls server action)
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfileSetupForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/account/update", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId, name }),
    });
    setLoading(false);
    if (res.ok) {
      // Refresh session by signing out & in again (silent)
      // We sign out and sign in programmatically to refresh the JWT
      // Alternative: reload page and ask user to re-login
      window.location.href = "/"; // quick approach: reload homepage -> sign-in state refreshed server-side
    } else {
      alert("Update failed");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm">Full name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full p-2 border rounded"
        />
      </div>
      <div>
        <button
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded"
        >
          {loading ? "Saving..." : "Save profile"}
        </button>
      </div>
    </form>
  );
}
