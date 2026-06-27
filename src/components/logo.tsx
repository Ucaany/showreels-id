"use client";

import Image from "next/image";
import { useState } from "react";
import type React from "react";

export const LogoIcon = (props: React.ComponentProps<"span">) => {
  const [imgError, setImgError] = useState(false);
  return (
    <span
      className="relative flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md"
      {...props}
    >
      {!imgError ? (
        <Image
          src="/favicon-96x96.png"
          alt="showreels.id"
          width={24}
          height={24}
          unoptimized
          className="h-full w-full object-contain"
          onError={() => setImgError(true)}
        />
      ) : (
        <Image
          src="/logo.png"
          alt="showreels.id"
          width={24}
          height={24}
          unoptimized
          className="h-full w-full object-contain"
        />
      )}
    </span>
  );
};

export const Logo = (props: React.ComponentProps<"span">) => (
  <span className="inline-flex items-center gap-2" {...props}>
    <LogoIcon />
    <span className="font-semibold tracking-tight text-foreground">showreels.id</span>
  </span>
);
