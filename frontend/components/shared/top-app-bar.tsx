"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/lib/api/auth";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "./nav-links";
import { MaterialIcon } from "./material-icon";

export function TopAppBar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-50 w-full px-container-padding py-base flex items-center justify-between bg-white/70 backdrop-blur-xl border-b border-white/40 shadow-[0_4px_30px_rgba(0,0,0,0.1)] dark:bg-inverse-surface/70">
      <div className="flex items-center gap-gutter">
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary bg-surface-container-high" />
        <Link href="/dashboard" className="font-headline-md text-headline-md font-bold text-primary">
          PodiaStream
        </Link>
      </div>

      <nav className="hidden md:flex gap-gutter items-center">
        {NAV_LINKS.map(({ href, label, icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                isActive
                  ? "text-primary font-bold hover:bg-white/20"
                  : "text-on-surface-variant hover:bg-white/20"
              )}
            >
              <MaterialIcon name={icon} filled={isActive} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-1">
        <button
          type="button"
          className="text-primary hover:bg-white/20 transition-colors p-2 rounded-full flex items-center justify-center"
          aria-label="Rechercher"
        >
          <MaterialIcon name="search" />
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="text-on-surface-variant hover:text-primary hover:bg-white/20 transition-colors p-2 rounded-full flex items-center justify-center"
          aria-label="Se déconnecter"
        >
          <MaterialIcon name="logout" />
        </button>
      </div>
    </header>
  );
}
