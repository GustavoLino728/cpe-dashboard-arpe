import React, { useState, useMemo } from "react";
import { Atividade } from "@/lib/api";
import { StatusBadge } from "./StatusBadge";
import { ProgressBar } from "./ProgressBar";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface ActivityTableProps {
  activities: Atividade[];
}

type SortField = "atividade" | "projeto" | "coordenadoria" | "responsavel" | "progresso" | "prazo" | "status";
type SortDirection = "asc" | "desc";

export function ActivityTable({ activities }: ActivityTableProps) {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const parsePrazo = (prazo: string) => {
    const parts = prazo.split("/");
    if (parts.length < 2) return 0;
    return parseInt(parts[1]) * 100 + parseInt(parts[0]);
  };

  const sortedActivities = useMemo(() => {
    if (!sortField) return activities;

    const sorted = [...activities];
    sorted.sort((a, b) => {
      let valA: any = a[sortField as keyof Atividade] ?? "";
      let valB: any = b[sortField as keyof Atividade] ?? "";

      if (sortField === "prazo") {
        valA = parsePrazo(a.prazo);
        valB = parsePrazo(b.prazo);
      }

      if (typeof valA === "string" && typeof valB === "string") {
        return sortDirection === "asc"
          ? valA.localeCompare(valB, "pt-BR")
          : valB.localeCompare(valA, "pt-BR");
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [activities, sortField, sortDirection]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-ink-soft/40 ml-1 inline-block" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 text-teal ml-1 inline-block" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-teal ml-1 inline-block" />
    );
  };

  return (
    <div className="bg-panel border border-line/30 rounded-custom p-6 transition-all duration-200 overflow-x-auto w-full">
      <table className="w-full border-collapse text-[12.5px] text-left text-ink min-w-[700px]">
        <thead>
          <tr className="border-b border-line select-none">
            <th
              onClick={() => handleSort("atividade")}
              className="text-[10.5px] uppercase tracking-wider text-ink-soft pb-[10px] font-semibold cursor-pointer hover:text-ink transition-colors"
            >
              Atividade {renderSortIcon("atividade")}
            </th>
            <th
              onClick={() => handleSort("projeto")}
              className="text-[10.5px] uppercase tracking-wider text-ink-soft pb-[10px] font-semibold cursor-pointer hover:text-ink transition-colors"
            >
              Projeto {renderSortIcon("projeto")}
            </th>
            <th
              onClick={() => handleSort("coordenadoria")}
              className="text-[10.5px] uppercase tracking-wider text-ink-soft pb-[10px] font-semibold cursor-pointer hover:text-ink transition-colors"
            >
              Coordenadoria {renderSortIcon("coordenadoria")}
            </th>
            <th
              onClick={() => handleSort("responsavel")}
              className="text-[10.5px] uppercase tracking-wider text-ink-soft pb-[10px] font-semibold cursor-pointer hover:text-ink transition-colors"
            >
              Responsável {renderSortIcon("responsavel")}
            </th>
            <th
              onClick={() => handleSort("progresso")}
              className="text-[10.5px] uppercase tracking-wider text-ink-soft pb-[10px] font-semibold min-w-[120px] cursor-pointer hover:text-ink transition-colors"
            >
              Progresso {renderSortIcon("progresso")}
            </th>
            <th
              onClick={() => handleSort("prazo")}
              className="text-[10.5px] uppercase tracking-wider text-ink-soft pb-[10px] font-semibold cursor-pointer hover:text-ink transition-colors"
            >
              Prazo {renderSortIcon("prazo")}
            </th>
            <th
              onClick={() => handleSort("status")}
              className="text-[10.5px] uppercase tracking-wider text-ink-soft pb-[10px] font-semibold cursor-pointer hover:text-ink transition-colors"
            >
              Status {renderSortIcon("status")}
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedActivities.map((d, idx) => (
            <tr
              key={idx}
              className="border-b border-line last:border-0 hover:bg-bg/40 transition-colors"
            >
              <td className="py-3 pr-2 font-medium">{d.atividade}</td>
              <td className="py-3 pr-2 font-mono-kpi text-ink-soft">{d.projeto || "—"}</td>
              <td className="py-3 pr-2">{d.coordenadoria}</td>
              <td className="py-3 pr-2">{d.responsavel}</td>
              <td className="py-3 pr-2">
                <ProgressBar progress={d.progresso} />
              </td>
              <td className="py-3 pr-2 font-mono-kpi">{d.prazo}</td>
              <td className="py-3">
                <StatusBadge status={d.status} />
              </td>
            </tr>
          ))}
          {sortedActivities.length === 0 && (
            <tr>
              <td
                colSpan={7}
                className="text-center text-ink-soft py-6 font-medium"
              >
                Nenhuma atividade encontrada.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
