import { BadgeCheck } from "lucide-react";

export type VerifiedBadgeProps = {
  className?: string;
  active?: boolean;
  tooltip?: string;
  size?: "sm" | "md" | "lg";
};

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export function VerifiedBadge({
  className = "",
  active = true,
  tooltip,
  size = "md",
}: VerifiedBadgeProps) {
  if (!active) return null;

  const sizeClass = sizeMap[size] || sizeMap.md;

  return (
    <span
      className={`inline-flex items-center ${className}`}
      title={tooltip || "Aktif selama plan Creator atau Business berjalan."}
    >
      <BadgeCheck
        className={`${sizeClass} text-blue-500`}
        aria-label="Creator terverifikasi melalui plan aktif"
      />
    </span>
  );
}
