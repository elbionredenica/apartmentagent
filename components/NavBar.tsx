"use client";

import { Link } from "next-view-transitions";
import { useUser } from "@auth0/nextjs-auth0/client";
import { usePathname } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { useState } from "react";
import type { Viewer } from "@/lib/session";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/intel", label: "Intel" },
];

interface NavBarProps {
  viewer: Viewer;
}

export function NavBar({ viewer }: NavBarProps) {
  const pathname = usePathname();
  const { user } = useUser();
  const [isExitingDemo, setIsExitingDemo] = useState(false);

  const auth0User = viewer?.mode === "auth0" ? user : undefined;
  const displayName =
    auth0User?.name ??
    viewer?.name ??
    auth0User?.email ??
    viewer?.email ??
    "Account";
  const avatarSrc = auth0User?.picture ?? viewer?.picture;

  async function handleDemoLogout() {
    setIsExitingDemo(true);

    try {
      const response = await fetch("/api/demo/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to end demo session");
      }

      window.location.assign("/");
    } catch {
      setIsExitingDemo(false);
    }
  }

  return (
    <nav data-navbar className="h-20 bg-white border-b border-border px-20 flex items-center justify-between">
      {/* Logo */}
      <Link href="/dashboard" className="text-lg font-bold text-ink">
        ApartmentAgent
      </Link>

      {/* Right section */}
      <div className="flex items-center gap-8">
        {/* Nav links */}
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`text-[15px] transition-colors duration-160 ${
              pathname === link.href
                ? "text-ink font-semibold"
                : "text-ink-mid font-medium hover:text-ink"
            }`}
          >
            {link.label}
          </Link>
        ))}

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end leading-tight">
            <span className="text-sm font-semibold text-ink">{displayName}</span>
            <span className="text-xs text-ink-muted">
              {viewer?.mode === "auth0" ? "Authenticated" : "Demo session"}
            </span>
          </div>

          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={displayName}
              className="w-9 h-9 rounded-full border border-border object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-off-white border border-border flex items-center justify-center">
              <User size={16} className="text-ink-mid" />
            </div>
          )}

          {viewer?.mode === "auth0" ? (
            <a
              href="/auth/logout"
              className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-ink transition-colors duration-160 hover:border-ink-mid"
            >
              <LogOut size={14} />
              Log Out
            </a>
          ) : (
            <button
              type="button"
              onClick={handleDemoLogout}
              disabled={isExitingDemo}
              className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-ink transition-colors duration-160 hover:border-ink-mid disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogOut size={14} />
              {isExitingDemo ? "Exiting..." : "Exit Demo"}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
