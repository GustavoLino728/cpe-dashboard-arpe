import React from "react";

interface DashboardSummaryChipsProps {
  loading: boolean;
  done: number;
  late: number;
  progress: number;
  total: number;
}

export function DashboardSummaryChips({
  loading,
  done,
  late,
  progress,
  total,
}: DashboardSummaryChipsProps) {
  const chips = [
    { value: done, label: "Concluídas no mês", color: "#3E8E6D", icon: "✓" },
    { value: late, label: "Atrasadas críticas", color: "#C4432D", icon: "!" },
    { value: progress, label: "Em andamento", color: "#D99A4E", icon: "◷" },
    { value: total, label: "Total no filtro", color: "#5B95C4", icon: "▤" },
  ];

  return (
    <section className="grid grid-cols-4 gap-5 max-xl:grid-cols-2 max-sm:grid-cols-1">
      {chips.map((chip, idx) => (
        <div
          key={idx}
          className="bg-panel border border-line/30 rounded-custom p-5 flex items-center gap-3 transition-all duration-200"
        >
          <div
            className="shrink-0 w-8 h-8 rounded-[8px] flex items-center justify-center text-[15px] leading-none select-none"
            style={{ color: chip.color, backgroundColor: `${chip.color}14` }}
          >
            {chip.icon}
          </div>
          <div>
            <div className="font-mono-kpi text-[17px] font-semibold text-ink">
              {loading ? "—" : chip.value}
            </div>
            <div className="text-[11px] text-ink-soft">{chip.label}</div>
          </div>
        </div>
      ))}
    </section>
  );
}
