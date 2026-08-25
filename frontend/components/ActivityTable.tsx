import React, { useMemo, useState } from "react";
import { Atividade, formatDateShort } from "@/lib/api";
import { StatusBadge } from "./StatusBadge";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

interface ActivityTableProps {
  activities: Atividade[];
}

type SortField =
  | "atividade"
  | "projeto"
  | "contrato"
  | "responsavel"
  | "data_inicio"
  | "data_fim"
  | "status";
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

  const sortedActivities = useMemo(() => {
    if (!sortField) return activities;

    const sorted = [...activities];
    sorted.sort((a, b) => {
      const valA: any = a[sortField as keyof Atividade] ?? "";
      const valB: any = b[sortField as keyof Atividade] ?? "";

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
            <th onClick={() => handleSort("atividade")} className={headerClass}>
              Atividade {renderSortIcon("atividade")}
            </th>
            <th onClick={() => handleSort("projeto")} className={headerClass}>
              Projeto {renderSortIcon("projeto")}
            </th>
            <th onClick={() => handleSort("contrato")} className={headerClass}>
              Contrato {renderSortIcon("contrato")}
            </th>
            <th onClick={() => handleSort("responsavel")} className={headerClass}>
              Responsável {renderSortIcon("responsavel")}
            </th>
            <th onClick={() => handleSort("data_inicio")} className={headerClass}>
              Data de início {renderSortIcon("data_inicio")}
            </th>
            <th onClick={() => handleSort("data_fim")} className={headerClass}>
              Data final {renderSortIcon("data_fim")}
            </th>
            <th onClick={() => handleSort("status")} className={headerClass}>
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
              <td className="py-3 pr-2">{renderContractLinks(d)}</td>
              <td className="py-3 pr-2">{d.responsavel}</td>
              <td className="py-3 pr-2 font-mono-kpi">{formatDateShort(d.data_inicio ?? null)}</td>
              <td className="py-3 pr-2 font-mono-kpi">{formatDateShort(d.data_fim ?? null)}</td>
              <td className="py-3">
                <StatusBadge status={d.status} />
              </td>
            </tr>
          ))}
          {sortedActivities.length === 0 && (
            <tr>
              <td colSpan={7} className="text-center text-ink-soft py-6 font-medium">
                Nenhuma atividade encontrada.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const headerClass =
  "text-[10.5px] uppercase tracking-wider text-ink-soft pb-[10px] font-semibold cursor-pointer hover:text-ink transition-colors";

function renderContractLinks(activity: Atividade) {
  const links = activity.contrato_links ?? [];
  if (links.length === 0) {
    return activity.contrato || "—";
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-x-1 gap-y-1">
      {links.map((item, index) => (
        <React.Fragment key={`${item.contract}-${index}`}>
          {index > 0 && <span className="text-ink-soft">/</span>}
          {item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-teal hover:text-teal/80 underline-offset-2 hover:underline"
            >
              {item.contract}
            </a>
          ) : (
            <span>{item.contract}</span>
          )}
        </React.Fragment>
      ))}
    </span>
  );
}
