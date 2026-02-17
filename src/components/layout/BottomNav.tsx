"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, ShoppingBag, ShoppingCart, User } from "lucide-react";

const items = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/products", label: "Shop", Icon: ShoppingBag },
  { href: "/search", label: "Search", Icon: Search },
  { href: "/cart", label: "Cart", Icon: ShoppingCart },
  { href: "/orders", label: "Orders", Icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="qb-bottom-nav" aria-label="Primary">
      {items.map(({ href, label, Icon }) => {
        const active =
          pathname === href || (href !== "/" && pathname?.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={`qb-bottom-link ${active ? "qb-bottom-link-active" : ""}`}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
