"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User } from "lucide-react";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/intel", label: "Intel" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="h-20 bg-white border-b border-border px-20 flex items-center justify-between">
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

        {/* Avatar placeholder */}
        <button className="w-8 h-8 rounded-full bg-off-white border border-border flex items-center justify-center cursor-pointer hover:border-ink-mid transition-colors duration-160">
          <User size={16} className="text-ink-mid" />
        </button>
      </div>
    </nav>
  );
}
