import { ReactNode } from "react";

export default function ProductsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <section className="admin-panel">
        <h1 className="admin-title">Products</h1>
        <p className="admin-subtitle">Create and manage store products.</p>
      </section>
      <div>{children}</div>
    </div>
  );
}
