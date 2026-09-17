// The provided design mockups use Google's Material Symbols font (loaded in
// app/layout.tsx) rather than lucide-react, so nav items reference icon
// names as strings instead of icon components.
export type NavLink = {
  href: string;
  label: string;
  icon: string;
};

export const NAV_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/patients", label: "Patients", icon: "group" },
  { href: "/agenda", label: "Agenda", icon: "calendar_month" },
  { href: "/insoles", label: "Insoles", icon: "precision_manufacturing" },
  { href: "/inventory", label: "Stock", icon: "inventory_2" },
  { href: "/settings", label: "Settings", icon: "settings" },
];
