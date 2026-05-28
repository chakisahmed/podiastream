"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "./nav-links";
import { MaterialIcon } from "./material-icon";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 pb-safe bg-white/70 backdrop-blur-xl border-t border-white/40 shadow-[0_-4px_30px_rgba(0,0,0,0.1)] rounded-t-xl dark:bg-inverse-surface/70">
      {NAV_LINKS.map(({ href, label, icon }) => {
        const isActive = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center justify-center px-4 py-1 transition-colors",
              isActive
                ? "bg-primary-container/30 text-on-primary-container rounded-xl scale-90 duration-200"
                : "text-on-surface-variant hover:text-primary"
            )}
          >
            <MaterialIcon name={icon} filled={isActive} />
            <span className="font-label-sm text-label-sm mt-1">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
