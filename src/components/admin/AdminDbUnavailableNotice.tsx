import Link from "next/link";

type Props = {
  message: string;
  retryHref: string;
  className?: string;
};

export default function AdminDbUnavailableNotice({
  message,
  retryHref,
  className,
}: Props) {
  return (
    <section
      className={`admin-panel border border-amber-200 bg-amber-50 text-sm text-amber-900 ${className ?? ""}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p>{message}</p>
        <Link
          href={retryHref}
          className="rounded border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-amber-100"
        >
          Retry
        </Link>
      </div>
    </section>
  );
}
