"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/follow", label: "Follow", icon: Users },
  { href: "/", label: "Today", icon: Home },
  { href: "/profile", label: "You", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  // Hide on onboarding so it feels like a focused flow
  if (pathname?.startsWith("/onboarding")) return null;

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 mx-auto flex w-full max-w-md justify-center px-4 pb-3"
    >
      <ul className="flex w-full items-center justify-around rounded-t-3xl border-t-2 border-[#1e1b4b] bg-white/90 p-2 backdrop-blur-lg shadow-[0_-4px_0px_0px_rgba(0,0,0,0.05)]">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname?.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 text-[10px] font-extrabold uppercase tracking-widest transition-all",
                  active
                    ? "border-2 border-black bg-[#a3e635] text-[#1e1b4b] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    : "text-gray-600 hover:-translate-y-0.5 hover:text-[#f97316]",
                )}
              >
                <Icon
                  size={18}
                  strokeWidth={active ? 2.25 : 2}
                  aria-hidden="true"
                />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
