"use client";

import { useMemo, useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type TrafficPoint = {
  day: string;
  views: number;
  uniqueVisitors: number;
};

function formatDayLabel(day: string) {
  const date = new Date(`${day}T00:00:00+07:00`);
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

export function TrafficLineChart({
  points,
  className,
}: {
  points: TrafficPoint[];
  className?: string;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const hasData = points.some((point) => point.views > 0 || point.uniqueVisitors > 0);

  const chartData = useMemo(() => {
    if (points.length === 0) {
      return {
        line: "",
        visitorLine: "",
        area: "",
        values: [] as Array<{
          x: number;
          y: number;
          visitorY: number;
          value: number;
          day: string;
          uniqueVisitors: number;
        }>,
      };
    }

    const maxValue = Math.max(...points.map((point) => Math.max(point.views, point.uniqueVisitors)), 1);
    const width = 100;
    const height = 100;
    const xStep = points.length > 1 ? width / (points.length - 1) : width;

    const values = points.map((point, index) => {
      const x = points.length > 1 ? index * xStep : width / 2;
      const y = height - (point.views / maxValue) * height;
      const visitorY = height - (point.uniqueVisitors / maxValue) * height;
      return {
        x,
        y,
        visitorY,
        value: point.views,
        day: point.day,
        uniqueVisitors: point.uniqueVisitors,
      };
    });

    const line = values.map((item) => `${item.x},${item.y}`).join(" ");
    const visitorLine = values.map((item) => `${item.x},${item.visitorY}`).join(" ");
    const area = `0,100 ${line} 100,100`;

    return {
      line,
      visitorLine,
      area,
      values,
    };
  }, [points]);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="relative h-72 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3 md:h-80 md:p-4">
        <div className="pointer-events-none absolute inset-x-4 top-1/4 border-t border-slate-200/80" />
        <div className="pointer-events-none absolute inset-x-4 top-1/2 border-t border-slate-200/80" />
        <div className="pointer-events-none absolute inset-x-4 top-3/4 border-t border-slate-200/80" />

        {!hasData ? (
          <div className="relative z-10 flex h-full flex-col items-center justify-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm ring-1 ring-slate-200">
              <Share2 className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-slate-900">Belum ada data traffic</h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
              Bagikan public link untuk mulai melihat performa profil dan video publik di sini.
            </p>
            <Button size="sm" variant="secondary" className="mt-4">
              Bagikan Link
            </Button>
          </div>
        ) : (
          <>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="relative z-10 h-full w-full">
              <defs>
                <linearGradient id="trafficAreaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#18181b" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#18181b" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <polygon points={chartData.area} fill="url(#trafficAreaFill)" />
              <polyline
                points={chartData.visitorLine}
                fill="none"
                stroke="#94a3b8"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="3 3"
                opacity="0.9"
              />
              <polyline
                points={chartData.line}
                fill="none"
                stroke="#18181b"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {chartData.values.map((item, index) => (
                <circle
                  key={`${item.day}-${index}`}
                  cx={item.x}
                  cy={item.y}
                  r={hoveredIndex === index ? 2.6 : 1.7}
                  fill="#18181b"
                  stroke="#ffffff"
                  strokeWidth="0.9"
                  opacity={hoveredIndex === null || hoveredIndex === index ? 1 : 0.55}
                />
              ))}
            </svg>

            <div className="pointer-events-none absolute inset-3 z-20 flex md:inset-4">
              {chartData.values.map((item, index) => (
                <button
                  key={`${item.day}-hit-${index}`}
                  type="button"
                  className="pointer-events-auto h-full flex-1"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onFocus={() => setHoveredIndex(index)}
                  onBlur={() => setHoveredIndex(null)}
                  aria-label={`${formatDayLabel(item.day)} views ${item.value}`}
                />
              ))}
            </div>

            {hoveredIndex !== null ? (
              <div className="absolute right-4 top-4 z-30 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-sm">
                <p className="font-semibold text-slate-900">{formatDayLabel(chartData.values[hoveredIndex].day)}</p>
                <p>{chartData.values[hoveredIndex].value} views</p>
                <p>{chartData.values[hoveredIndex].uniqueVisitors} pengunjung unik</p>
              </div>
            ) : null}
          </>
        )}
      </div>

      {hasData ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {points.slice(Math.max(0, points.length - 4)).map((point) => (
            <div key={point.day} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-sm">
              <p className="font-semibold text-slate-900">{formatDayLabel(point.day)}</p>
              <p>{point.views} views</p>
              <p>{point.uniqueVisitors} visitors</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
