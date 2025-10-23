"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export interface BarChartDatum {
  label: string;
  value: number;
  color?: string;
  suffix?: string;
}

interface BarChartProps {
  data: BarChartDatum[];
  maxValue?: number;
  className?: string;
  valueFormatter?: (value: number) => string;
  emptyLabel?: React.ReactNode;
}

export function BarChart({
  data,
  maxValue,
  className,
  valueFormatter = (value) => value.toLocaleString(),
  emptyLabel = "データがありません。",
}: BarChartProps) {
  const safeData = React.useMemo(
    () => data.filter((item) => Number.isFinite(item.value) && item.value > 0),
    [data]
  );

  const denominator =
    maxValue ??
    safeData.reduce((currentMax, item) => Math.max(currentMax, item.value), 0);

  if (safeData.length === 0 || denominator === 0) {
    return (
      <div
        className={cn(
          "rounded-md border border-dashed border-border/50 bg-muted/20 p-6 text-sm text-muted-foreground",
          className
        )}
      >
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {safeData.map((item) => {
        const width = Math.min(
          100,
          Math.max(4, (item.value / denominator) * 100)
        );

        return (
          <div key={`${item.label}-${item.value}`} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{item.label}</span>
              <span>
                {valueFormatter(item.value)}
                {item.suffix ? ` ${item.suffix}` : ""}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${width}%`,
                  backgroundColor: item.color ?? "hsl(var(--foreground)/0.7)",
                }}
                aria-hidden="true"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
