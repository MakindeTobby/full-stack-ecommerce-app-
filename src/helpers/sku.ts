export function makeBaseSku(name_en: string) {
  return name_en
    .split(/\s+/)
    .map((w) => w[0].toUpperCase())
    .join("")
    .slice(0, 5); // ESD or ESDR
}
