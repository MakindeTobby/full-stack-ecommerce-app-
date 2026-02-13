import { getServerSession, Session } from "next-auth";
import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import { authOptions } from "../api/auth/[...nextauth]/route";

export const metadata = {
  title: "Admin | Queen Beulah",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session: Session | null = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin") {
    redirect("/not-authorized");
  }

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Queen Beulah
            </div>
            <h1 className="text-lg font-semibold tracking-tight">Admin Console</h1>
          </div>
          <div className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">
            {session.user?.email ?? "-"}
          </div>
        </div>
      </header>

      <div className="admin-layout">
        <aside className="admin-sidebar">
          <AdminNav />
        </aside>

        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
