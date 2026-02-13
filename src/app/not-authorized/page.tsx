// app/not-authorized/page.tsx
import Link from "next/link";

export default function NotAuthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="p-8 bg-white rounded shadow text-center">
        <h1 className="text-2xl font-semibold mb-2">Not authorized</h1>
        <p className="mb-4">You don’t have permission to view this page.</p>
        <Link href="/" className="text-indigo-600 underline">
          Return to store
        </Link>
      </div>
    </div>
  );
}
