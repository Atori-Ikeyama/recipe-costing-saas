"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export interface DonutChartDatum {
  value: number;
  color: string;
  label?: string;
}

interface DonutChartProps {
  data: DonutChartDatum[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: React.ReactNode;
  className?: string;
}

export function DonutChart({
  data,
  size = 200,
  strokeWidth = 24,
  centerLabel,
  className,
}: DonutChartProps) {
  const safeData = React.useMemo(
    () => data.filter((item) => Number.isFinite(item.value) && item.value > 0),
    [data]
  );

  const total = safeData.reduce((sum, item) => sum + item.value, 0);
  const radius = size / 2 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center",
        className
      )}
      style={{ width: size, height: size }}
    >
      <svg
        role="img"
        aria-hidden={safeData.length === 0}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <g
          transform={`translate(${size / 2} ${size / 2}) rotate(-90)`}
        >
          <circle
            r={radius}
            fill="transparent"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference}
            className="opacity-30"
          />
          {total > 0
            ? safeData.map((slice, index) => {
                const length = (slice.value / total) * circumference;
                const dashArray = `${length} ${circumference - length}`;
                const element = (
                  <circle
                    key={`${slice.label ?? index}-${slice.value}`}
                    r={radius}
                    fill="transparent"
                    stroke={slice.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={dashArray}
                    strokeDashoffset={-cumulativeOffset}
                    strokeLinecap="round"
                  />
                );
                cumulativeOffset += length;
                return element;
              })
            : null}
        </g>
      </svg>
      {centerLabel ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-center">
          <div className="text-xs font-medium leading-tight text-muted-foreground">
            {centerLabel}
          </div>
        </div>
      ) : null}
    </div>
  );
}
