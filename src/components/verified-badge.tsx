import { BadgeCheck } from "lucide-react";

export function VerifiedBadge({ className = "" }: { className?: string }) {
  return (
    <BadgeCheck
      className={`inline-block h-5 w-5 text-blue-500 ${className}`}
      aria-label="Verified Creator"
    />
  );
}