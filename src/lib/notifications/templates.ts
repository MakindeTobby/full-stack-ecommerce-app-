type BrandEmailInput = {
  title: string;
  intro?: string;
  sections?: Array<{ label: string; value: string }>;
  cta?: { label: string; href: string };
  outro?: string;
};

export function buildBrandEmailHtml(input: BrandEmailInput) {
  const sectionsHtml = (input.sections ?? [])
    .map(
      (s) =>
        `<tr><td style="padding:6px 0;color:#64748b;font-size:13px;">${escapeHtml(
          s.label,
        )}</td><td style="padding:6px 0;color:#0f172a;font-size:13px;font-weight:600;text-align:right;">${escapeHtml(
          s.value,
        )}</td></tr>`,
    )
    .join("");

  const ctaHtml = input.cta
    ? `<a href="${escapeHtmlAttr(
        input.cta.href,
      )}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:10px 14px;border-radius:8px;font-weight:600;font-size:14px;">${escapeHtml(
        input.cta.label,
      )}</a>`
    : "";

  return [
    '<div style="background:#f8fafc;padding:24px 12px;font-family:Arial,sans-serif;">',
    '<div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">',
    '<div style="padding:16px 18px;background:#0f172a;color:#ffffff;font-weight:700;font-size:16px;">Queen Beulah</div>',
    '<div style="padding:18px;">',
    `<h1 style="margin:0 0 10px;color:#0f172a;font-size:20px;line-height:1.3;">${escapeHtml(
      input.title,
    )}</h1>`,
    input.intro
      ? `<p style="margin:0 0 14px;color:#475569;font-size:14px;line-height:1.6;">${escapeHtml(
          input.intro,
        )}</p>`
      : "",
    sectionsHtml
      ? `<table width="100%" cellspacing="0" cellpadding="0" style="margin:8px 0 14px;">${sectionsHtml}</table>`
      : "",
    ctaHtml ? `<div style="margin:8px 0 14px;">${ctaHtml}</div>` : "",
    input.outro
      ? `<p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">${escapeHtml(
          input.outro,
        )}</p>`
      : "",
    "</div>",
    "</div>",
    "</div>",
  ].join("");
}

export function buildBrandEmailText(input: BrandEmailInput) {
  const sectionLines = (input.sections ?? [])
    .map((s) => `${s.label}: ${s.value}`)
    .join("\n");
  const ctaLine = input.cta ? `${input.cta.label}: ${input.cta.href}` : "";

  return [
    `Queen Beulah`,
    "",
    input.title,
    input.intro ?? "",
    sectionLines,
    ctaLine,
    input.outro ?? "",
  ]
    .filter(Boolean)
    .join("\n");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeHtmlAttr(value: string) {
  return escapeHtml(value);
}
