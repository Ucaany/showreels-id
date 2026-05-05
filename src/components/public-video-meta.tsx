"use client";

import { useMemo } from "react";
import { CalendarDays, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function PublicVideoMeta({
  sourceBadgeClassName,
  sourceLabel,
  createdAt,
}: {
  sourceBadgeClassName: string;
  sourceLabel: string;
  createdAt: string;
}) {
  const formatted = useMemo(() => {
    const parsed = new Date(createdAt);
    return {
      date: new Intl.DateTimeFormat(undefined, {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(parsed),
      time: new Intl.DateTimeFormat(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      }).format(parsed),
    };
  }, [createdAt]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge className={`${sourceBadgeClassName} shadow-none`}>{sourceLabel}</Badge>
      <Badge className="bg-[#1d3e73] text-white shadow-none">
        <CalendarDays className="mr-1 h-3.5 w-3.5" />
        {formatted.date}
      </Badge>
      <Badge className="bg-[#2a518d] text-white shadow-none">
        <Clock3 className="mr-1 h-3.5 w-3.5" />
        {formatted.time}
      </Badge>
    </div>
  );
}
