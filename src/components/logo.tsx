import type React from "react";

/**
 * showreels.id logo icon — orange "S" badge.
 * Replaces Efferd logo.
 */
export const LogoIcon = (props: React.ComponentProps<"svg">) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect width="24" height="24" rx="6" fill="#f97316" />
    <text
      x="12"
      y="17"
      textAnchor="middle"
      fontFamily="system-ui, sans-serif"
      fontWeight="700"
      fontSize="14"
      fill="white"
    >
      S
    </text>
  </svg>
);

export const Logo = (props: React.ComponentProps<"svg">) => (
  <svg viewBox="0 0 120 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect width="24" height="24" rx="6" fill="#f97316" />
    <text
      x="12"
      y="17"
      textAnchor="middle"
      fontFamily="system-ui, sans-serif"
      fontWeight="700"
      fontSize="14"
      fill="white"
    >
      S
    </text>
    <text
      x="32"
      y="17"
      fontFamily="system-ui, sans-serif"
      fontWeight="600"
      fontSize="13"
      fill="currentColor"
    >
      showreels.id
    </text>
  </svg>
);
