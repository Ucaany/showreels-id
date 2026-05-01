"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CreatorBackButton() {
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className="!text-white [&_svg]:!text-white bg-[#111111] hover:bg-[#1E1E1E]"
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
          return;
        }
        router.push("/");
      }}
    >
      <ArrowLeft className="h-4 w-4" />
      Kembali
    </Button>
  );
}
