"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface DonutData {
  name: string;
  value: number;
  color: string;
  href?: string;
}

interface DonutChartProps {
  data: DonutData[];
  title: string;
}

export function DonutChart({ data, title }: DonutChartProps) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-panel border border-line/30 rounded-custom p-6 flex flex-col items-center transition-all duration-200">
      <h3 className="font-display font-semibold text-[13.5px] text-ink self-start mb-4">
        {title}
      </h3>

      <div className="relative w-full h-[180px] flex items-center justify-center">
        {mounted ? (
          total > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={2}
                  dataKey="value"
                  animationDuration={500}
                  isAnimationActive={true}
                  onClick={(_, index) => {
                    const href = data[index]?.href;
                    if (href) {
                      router.push(href);
                    }
                  }}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      className={entry.href ? "cursor-pointer outline-none" : undefined}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--panel)",
                    borderColor: "var(--line)",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "var(--ink)",
                  }}
                  itemStyle={{ color: "var(--ink)" }}
                  labelStyle={{ color: "var(--ink-soft)" }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-[12px] text-ink-soft">Sem dados para exibir</div>
          )
        ) : (
          <div className="w-full h-full bg-line/10 rounded-full animate-pulse flex items-center justify-center text-[10px] text-ink-soft">
            Carregando...
          </div>
        )}

        {mounted && total > 0 && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
            style={{ transform: "translateY(-4px)" }}
          >
            <span className="font-mono-kpi font-semibold text-[20px] text-ink select-none leading-none">
              {total}
            </span>
            <span className="font-sans text-[10.5px] text-ink-soft select-none mt-1">
              total
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-3 text-[11.5px] text-ink-soft w-full max-h-[60px] overflow-y-auto">
        {data.map((item, idx) => (
          <LegendItem key={idx} item={item} />
        ))}
      </div>
    </div>
  );
}

function LegendItem({ item }: { item: DonutData }) {
  const content = (
    <>
      <span
        className="w-[8px] h-[8px] rounded-full shrink-0"
        style={{ backgroundColor: item.color }}
      />
      <span className="truncate max-w-[120px]" title={item.name}>
        {item.name}
      </span>
      <span className="font-mono-kpi font-medium text-ink">({item.value})</span>
    </>
  );

  if (item.href) {
    return (
      <Link
        href={item.href}
        className="flex items-center gap-1.5 whitespace-nowrap rounded-sm outline-none hover:text-teal focus-visible:ring-2 focus-visible:ring-teal/40"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-1.5 whitespace-nowrap">
      {content}
    </div>
  );
}
