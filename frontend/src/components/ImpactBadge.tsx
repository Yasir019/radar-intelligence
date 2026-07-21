export function ImpactBadge({ score }: { score: number | null }) {
  if (score == null) {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
        pending
      </span>
    );
  }
  const styles =
    score >= 7
      ? "bg-red-50 text-red-700 border-red-200"
      : score >= 4
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-gray-50 text-gray-600 border-gray-200";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${styles}`}
    >
      {score}/10
    </span>
  );
}
