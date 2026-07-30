import { useEffect, useState } from "react";

export function CompanyLogo({
  name,
  logoUrl,
  color = "#7457ea",
  size = 40,
  className = "",
}: {
  name: string | null | undefined;
  logoUrl?: string | null;
  color?: string | null;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [logoUrl]);

  const initials = (name || "?").slice(0, 2).toUpperCase();
  const showImage = Boolean(logoUrl) && !failed;

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-black/[0.06] font-bold shadow-sm ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: showImage ? "#ffffff" : color || "#7457ea",
        color: "#ffffff",
        fontSize: Math.max(10, Math.round(size * 0.3)),
      }}
      aria-label={`${name || "Competitor"} logo`}
    >
      {showImage ? (
        <img
          src={logoUrl!}
          alt=""
          className="h-[72%] w-[72%] object-contain"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        initials
      )}
    </span>
  );
}
