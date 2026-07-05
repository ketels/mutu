import {
  ArrowLeftRight,
  LayoutGrid,
  Search,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Matcha även undersidor (t.ex. /skjul/abc) */
  prefix?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Utforska", icon: Search },
  { href: "/saker", label: "Mina saker", icon: LayoutGrid, prefix: true },
  { href: "/skjul", label: "Skjul", icon: Warehouse, prefix: true },
  { href: "/lan", label: "Lån", icon: ArrowLeftRight, prefix: true },
];

export function isActive(item: NavItem, pathname: string) {
  return item.prefix ? pathname.startsWith(item.href) : pathname === item.href;
}
