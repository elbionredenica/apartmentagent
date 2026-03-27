"use client";

import type { DraftProfile } from "@/types";
import { PreferenceCard } from "./PreferenceCard";
import {
  DollarSign,
  MapPin,
  Bed,
  PawPrint,
  ShieldAlert,
  Star,
  Sparkles,
  Calendar,
  HelpCircle,
  FileText,
} from "lucide-react";
import type { ChatPhase } from "@/types";

interface PreferenceBuilderProps {
  profile: Partial<DraftProfile>;
  phase?: ChatPhase;
  confirmed?: boolean;
}

export function PreferenceBuilder({
  profile,
  phase = "collecting",
  confirmed = false,
}: PreferenceBuilderProps) {
  const cards: { icon: typeof DollarSign; category: string; value: string }[] =
    [];

  if (profile.maxBudget) {
    cards.push({
      icon: DollarSign,
      category: "Budget",
      value: `Max $${profile.maxBudget.toLocaleString()}/mo`,
    });
  }

  const locationParts = [profile.state, ...(profile.cities ?? profile.locations ?? [])]
    .filter(Boolean)
    .join(" • ");

  if (locationParts) {
    cards.push({
      icon: MapPin,
      category: "Location",
      value: locationParts,
    });
  }

  if (profile.minBedrooms != null || profile.maxBedrooms != null) {
    const min = profile.minBedrooms;
    const max = profile.maxBedrooms;
    const value =
      min != null && max != null && min !== max
        ? `${min}-${max} bedrooms`
        : `${min ?? max} bedrooms`;
    cards.push({ icon: Bed, category: "Bedrooms", value });
  }

  if (profile.hasPet) {
    const parts = [profile.petType ?? "Pet"];
    if (profile.petWeightLbs) parts.push(`${profile.petWeightLbs} lbs`);
    cards.push({
      icon: PawPrint,
      category: "Pets",
      value: parts.join(", "),
    });
  }

  if (profile.dealbreakers && profile.dealbreakers.length > 0) {
    cards.push({
      icon: ShieldAlert,
      category: "Dealbreakers",
      value: profile.dealbreakers
        .map((d) => d.replace(/_/g, " "))
        .join(", "),
    });
  }

  if (profile.mustHaves && profile.mustHaves.length > 0) {
    cards.push({
      icon: Star,
      category: "Must-Haves",
      value: profile.mustHaves.join(", "),
    });
  }

  if (profile.niceToHaves && profile.niceToHaves.length > 0) {
    cards.push({
      icon: Sparkles,
      category: "Nice-to-Haves",
      value: profile.niceToHaves.join(", "),
    });
  }

  if (profile.moveInTimeline) {
    cards.push({
      icon: Calendar,
      category: "Move-in Timeline",
      value: profile.moveInTimeline.replace(/_/g, " "),
    });
  }

  if (profile.customQuestions && profile.customQuestions.length > 0) {
    cards.push({
      icon: HelpCircle,
      category: "Custom Questions",
      value: profile.customQuestions.join("; "),
    });
  }

  if (profile.notes) {
    cards.push({
      icon: FileText,
      category: "Notes",
      value: profile.notes,
    });
  }

  if (cards.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-ink-muted">
          Your preferences will appear here as we chat.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="text-sm font-semibold text-ink-mid uppercase tracking-wide">
          {phase === "review" ? "Review Before Calls" : "Your Preferences"}
        </h3>
        {phase === "review" && (
          <p className="text-xs text-ink-muted mt-1">
            Double-checking the brief before the calling flow starts.
          </p>
        )}
      </div>
      {cards.map((card) => (
        <PreferenceCard
          key={card.category}
          icon={card.icon}
          category={card.category}
          value={card.value}
          confirmed={confirmed}
        />
      ))}
    </div>
  );
}
