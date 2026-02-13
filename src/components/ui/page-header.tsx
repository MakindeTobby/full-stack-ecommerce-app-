import * as React from "react";

export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div>
      <h1 className="qb-title">{title}</h1>
      {subtitle ? <p className="qb-subtitle mt-1">{subtitle}</p> : null}
    </div>
  );
}
