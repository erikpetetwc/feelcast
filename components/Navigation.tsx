"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";

const links = [
  { href: "/dashboard", label: "Dashboard", shortLabel: "Home", icon: "🌤️" },
  { href: "/log", label: "Log Symptoms", shortLabel: "Log", icon: "📝" },
  { href: "/history", label: "History", shortLabel: "History", icon: "📊" },
  { href: "/settings", label: "Settings", shortLabel: "Settings", icon: "⚙️" },
];

export function Navigation() {
  const pathname = usePathname();
  return (
    <nav className="border-b bg-white sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4">
        {/* Top row: logo + sign out */}
        <div className="flex items-center justify-between h-14">
          <Link href="/dashboard" className="font-bold text-base tracking-tight">
            FeelCast
          </Link>
          {/* Desktop nav links */}
          <div className="hidden sm:flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm transition-colors",
                  pathname === l.href
                    ? "bg-gray-100 font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-gray-50"
                )}
              >
                <span className="mr-1">{l.icon}</span>
                {l.label}
              </Link>
            ))}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-gray-50 ml-2"
            >
              Sign out
            </button>
          </div>
          {/* Mobile sign out */}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="sm:hidden text-sm text-muted-foreground px-2 py-1"
          >
            Sign out
          </button>
        </div>

        {/* Mobile tab row */}
        <div className="sm:hidden grid grid-cols-4 border-t">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-medium transition-colors",
                  active ? "text-blue-600" : "text-muted-foreground"
                )}
              >
                <span className={cn("text-xl leading-none", active ? "scale-110" : "")}>{l.icon}</span>
                <span>{l.shortLabel}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
