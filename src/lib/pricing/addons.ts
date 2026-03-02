export type AddonDefinition = {
  code: string;
  label: string;
  price: number;
};

export const ADDON_DEFINITIONS: AddonDefinition[] = [
  { code: "shoe-polish", label: "Premium Shoe Polish", price: 2500 },
  { code: "shoe-tree", label: "Shoe Tree Pair", price: 6000 },
  { code: "dust-bag", label: "Protective Dust Bag", price: 1500 },
];

const addonMap = new Map(ADDON_DEFINITIONS.map((a) => [a.code, a]));

export function normalizeAddonCodes(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input) {
    if (typeof raw !== "string") continue;
    const code = raw.trim();
    if (!code || seen.has(code) || !addonMap.has(code)) continue;
    seen.add(code);
    out.push(code);
  }
  return out.sort();
}

export function buildAddonPricing(addonCodes: string[]) {
  const normalized = normalizeAddonCodes(addonCodes);
  let total = 0;
  const addons = normalized
    .map((code) => addonMap.get(code))
    .filter((a): a is AddonDefinition => Boolean(a));
  for (const addon of addons) {
    total += addon.price;
  }
  return {
    addonCodes: normalized,
    addonSignature: normalized.join("|"),
    addonTotal: total,
    addons,
  };
}

