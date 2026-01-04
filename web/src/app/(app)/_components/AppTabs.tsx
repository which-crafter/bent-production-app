/**
 * AppTabs component for navigation.
 * 
 * This is a client component because it uses:
 * - usePathname() hook to read current route (client-side only)
 * - Interactive tab state for active highlighting
 * 
 * Active state is determined by comparing the current pathname from usePathname()
 * with each tab's href. Exact matches mark a tab as active.
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppTabs() {
  const pathname = usePathname();

  const tabs = [
    { label: "Home", href: "/" },
    { label: "Leads", href: "/leads" },
  ];

  return (
    <nav className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`
              px-4 py-2 text-sm font-medium transition-colors
              ${
                isActive
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
              }
            `}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

