"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function LoginClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDemoEntry() {
    setLoading(true);
    try {
      const res = await fetch("/api/demo/load", { method: "POST" });
      if (!res.ok) throw new Error("Failed to load demo");
      router.push("/chat");
    } catch {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white">
      <div className="w-full max-w-md mx-auto px-6 text-center">
        {/* Logo / Brand */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center">
            <Home size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-ink">ApartmentAgent</h1>
        </div>

        {/* Value proposition */}
        <p className="text-md text-ink-mid mb-10 leading-relaxed">
          Your AI agent calls apartment listings, asks your specific questions,
          and only books viewings worth your time.
        </p>

        {/* CTAs */}
        <div className="flex flex-col gap-3">
          <Button onClick={handleDemoEntry} disabled={loading}>
            {loading ? "Loading..." : "Enter Demo"}
          </Button>

          <div className="relative group">
            <Button variant="secondary" disabled className="w-full">
              Continue with Auth0
            </Button>
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-ink-muted">
              Coming soon
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
