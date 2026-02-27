export const fmtNGN = (n: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n);



export const badgeColor: Record<string, string> = {
    Sale: "bg-red-500",
    New: "bg-violet-600",
    Hot: "bg-amber-500",
};

export function classNames(...xs: Array<string | false | null | undefined>) {
    return xs.filter(Boolean).join(" ");
}

//navbar
//hero
//book now
