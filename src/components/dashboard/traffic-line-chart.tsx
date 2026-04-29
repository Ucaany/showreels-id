"use client";

import { useMemo, useState } from "react";
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

  const chartData = useMemo(() => {
    if (points.length === 0) {
      return {
        line: "",
        area: "",
        values: [] as Array<{
          x: number;
          y: number;
          value: number;
          day: string;
          uniqueVisitors: number;
        }>,
      };
    }

    const maxValue = Math.max(...points.map((point) => point.views), 1);
    const width = 100;
    const height = 100;
    const xStep = points.length > 1 ? width / (points.length - 1) : width;

    const values = points.map((point, index) => {
      const x = points.length > 1 ? index * xStep : width / 2;
      const y = height - (point.views / maxValue) * height;
      return {
        x,
        y,
        value: point.views,
        day: point.day,
        uniqueVisitors: point.uniqueVisitors,
      };
    });

    const line = values.map((item) => `${item.x},${item.y}`).join(" ");
    const area = `0,100 ${line} 100,100`;

    return {
      line,
      area,
      values,
    };
  }, [points]);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="relative h-52 rounded-2xl border border-[#e4dad4] bg-[#fffaf7] p-3">
        {points.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-[#6f625a]">
            Belum ada data trafik.
          </div>
        ) : (
          <>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
              <defs>
                <linearGradient id="trafficAreaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#27272a" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#27272a" stopOpacity="0.03" />
                </linearGradient>
              </defs>
              <polygon points={chartData.area} fill="url(#trafficAreaFill)" />
              <polyline
                points={chartData.line}
                fill="none"
                stroke="#27272a"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {chartData.values.map((item, index) => (
                <circle
                  key={`${item.day}-${index}`}
                  cx={item.x}
                  cy={item.y}
                  r={hoveredIndex === index ? 2.6 : 1.8}
                  fill={hoveredIndex === index ? "#e24f3b" : "#27272a"}
                  opacity={hoveredIndex === null || hoveredIndex === index ? 1 : 0.55}
                />
              ))}
            </svg>

            <div className="pointer-events-none absolute inset-3 flex">
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
              <div className="absolute right-3 top-3 rounded-xl border border-[#e0d4ce] bg-white px-3 py-2 text-xs text-[#5f524b] shadow-sm">
                <p className="font-semibold text-[#201b18]">
                  {formatDayLabel(chartData.values[hoveredIndex].day)}
                </p>
                <p>{chartData.values[hoveredIndex].value} views</p>
                <p>{chartData.values[hoveredIndex].uniqueVisitors} pengunjung unik</p>
              </div>
            ) : null}
          </>
        )}
      </div>

      {points.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {points.slice(Math.max(0, points.length - 4)).map((point) => (
            <div
              key={point.day}
              className="rounded-xl border border-[#e5dbd6] bg-white px-3 py-2 text-xs text-[#62554d]"
            >
              <p className="font-semibold text-[#201b18]">{formatDayLabel(point.day)}</p>
              <p>{point.views} views</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

