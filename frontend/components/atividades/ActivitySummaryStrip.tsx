"use client";

import React from "react";
import { ActivityKpis } from "@/lib/api";
import {
  CheckCircle2,
  ClipboardList,
  Clock,
  PauseCircle,
  TriangleAlert,
} from "lucide-react";

interface ActivitySummaryStripProps {
  kpis: ActivityKpis;
  loading: boolean;
  activeStatus: string;
  onSelectStatus: (statusKey: string) => void;
}

export function ActivitySummaryStrip({
  kpis,
  loading,
  activeStatus,
  onSelectStatus,
}: ActivitySummaryStripProps) {
  const items = [
    {
      key: "todos",
      label: "QTD Ações",
      value: kpis.total,
      accent: "#3E8E6D",
      icon: <ClipboardList className="w-4 h-4" />,
    },
    {
      key: "ok",
      label: "QTD Concluídas",
      value: kpis.concluidas,
      accent: "#10B981",
      icon: <CheckCircle2 className="w-4 h-4" />,
    },
    {
      key: "late",
      label: "QTD Atrasadas",
      value: kpis.atrasadas,
      accent: "#EF4444",
      icon: <TriangleAlert className="w-4 h-4" />,
    },
    {
      key: "warn",
      label: "QTD Em andamento",
      value: kpis.em_andamento,
      accent: "#F59E0B",
      icon: <Clock className="w-4 h-4" />,
    },
    {
      key: "pending",
      label: "QTD A Iniciar",
      value: kpis.a_iniciar,
      accent: "#6B7280",
      icon: <PauseCircle className="w-4 h-4" />,
    },
  ];

  return (
    <section
      aria-label="Resumo quantitativo do recorte filtrado"
      className="grid grid-cols-5 gap-3 max-xl:grid-cols-3 max-sm:grid-cols-2"
    >
      {items.map((item) => {
        const isActive =
          item.key === "todos"
            ? activeStatus === "todos"
            : activeStatus === item.key;

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => {
              if (item.key === "todos") {
                onSelectStatus("todos");
              } else {
                onSelectStatus(activeStatus === item.key ? "todos" : item.key);
              }
            }}
            className={`text-left bg-panel rounded-custom px-3.5 py-3 flex items-center gap-3 border transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-teal/40 ${
              isActive && item.key !== "todos"
                ? "border-teal ring-2 ring-teal/20 bg-teal/5"
                : "border-line/35 hover:border-teal/40"
            }`}
          >
            <div
              className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0"
              style={{
                backgroundColor: `${item.accent}18`,
                color: item.accent,
              }}
            >
              {item.icon}
            </div>
            <div className="min-w-0">
              <div className="font-mono-kpi text-[20px] font-semibold leading-none text-ink">
                {loading ? "—" : item.value}
              </div>
              <div className="text-[11px] text-ink-soft mt-1 truncate">
                {item.label}
              </div>
            </div>
          </button>
        );
      })}
    </section>
  );
}
