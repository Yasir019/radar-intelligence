import type { ChangeCategory } from "../api/types";

const LABELS: Record<ChangeCategory, string> = {
  pricing_change: "Pricing",
  new_feature: "New feature",
  messaging_change: "Messaging",
  promotion: "Promotion",
  other: "Other",
};

const STYLES: Record<ChangeCategory, string> = {
  pricing_change: "bg-violet-50 text-violet-700 border-violet-200",
  new_feature: "bg-sky-50 text-sky-700 border-sky-200",
  messaging_change: "bg-emerald-50 text-emerald-700 border-emerald-200",
  promotion: "bg-orange-50 text-orange-700 border-orange-200",
  other: "bg-gray-50 text-gray-600 border-gray-200",
};

export function CategoryPill({ category }: { category: ChangeCategory | null }) {
  if (!category) return null;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STYLES[category]}`}
    >
      {LABELS[category]}
    </span>
  );
}
