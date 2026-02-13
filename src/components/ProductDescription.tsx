import type { ReactNode } from "react";

type Props = {
  text: string | null | undefined;
};

export default function ProductDescription({ text }: Props) {
  const source = String(text ?? "").trim();
  if (!source) {
    return (
      <p className="mt-2 text-sm text-slate-500">No description provided.</p>
    );
  }

  const lines = source
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);

  const nodes: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? "";

    if (/^#{1,4}\s+/.test(line)) {
      const [, hashes = "", content = ""] =
        line.match(/^(#{1,4})\s+(.+)$/) ?? [];
      const level = Math.min(4, Math.max(1, hashes.length));
      const key = `h-${i}`;
      const className =
        level <= 2
          ? "mt-4 text-lg font-semibold text-slate-900"
          : "mt-3 text-base font-semibold text-slate-900";

      if (level === 1) {
        nodes.push(
          <h2 key={key} className={className}>
            {renderInline(content)}
          </h2>,
        );
      } else if (level === 2) {
        nodes.push(
          <h3 key={key} className={className}>
            {renderInline(content)}
          </h3>,
        );
      } else {
        nodes.push(
          <h4 key={key} className={className}>
            {renderInline(content)}
          </h4>,
        );
      }
      i += 1;
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i] ?? "")) {
        items.push((lines[i] ?? "").replace(/^[-*]\s+/, ""));
        i += 1;
      }
      nodes.push(
        <ul
          key={`ul-${i}`}
          className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700"
        >
          {items.map((item, idx) => (
            <li key={`${idx}-${item.slice(0, 20)}`}>{renderInline(item)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i] ?? "")) {
        items.push((lines[i] ?? "").replace(/^\d+\.\s+/, ""));
        i += 1;
      }
      nodes.push(
        <ol
          key={`ol-${i}`}
          className="mt-3 list-decimal space-y-1 pl-5 text-sm leading-6 text-slate-700"
        >
          {items.map((item, idx) => (
            <li key={`${idx}-${item.slice(0, 20)}`}>{renderInline(item)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    nodes.push(
      <p key={`p-${i}`} className="mt-2 text-sm leading-6 text-slate-700">
        {renderInline(line)}
      </p>,
    );
    i += 1;
  }

  return <div className="mt-2">{nodes}</div>;
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong
          key={`${idx}-${part.slice(0, 12)}`}
          className="font-semibold text-slate-900"
        >
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={`${idx}-${part.slice(0, 12)}`}>{part}</span>;
  });
}
