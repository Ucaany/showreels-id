import { cn } from "@/lib/cn";
import { getBackgroundImageCropStyle, type ImageCropValues } from "@/lib/image-crop";

type AvatarSize = "sm" | "md" | "lg";

const sizeClasses: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-16 w-16 text-base",
};

export function AvatarBadge({
  name,
  avatarUrl,
  crop,
  size = "md",
}: {
  name: string;
  avatarUrl?: string;
  crop?: ImageCropValues;
  size?: AvatarSize;
}) {
  const initials = name
    .split(" ")
    .map((item) => item[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        "inline-flex aspect-square shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 font-semibold text-brand-700 ring-1 ring-brand-200",
        sizeClasses[size]
      )}
      style={
        avatarUrl
          ? {
              ...getBackgroundImageCropStyle(avatarUrl, crop),
              color: "transparent",
            }
          : undefined
      }
      aria-label={name}
      title={name}
    >
      {initials}
    </div>
  );
}

