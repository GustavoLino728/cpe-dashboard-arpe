import React, { useMemo, useState } from "react";
import { Atividade, formatDateShort } from "@/lib/api";
import { StatusBadge } from "./StatusBadge";
import { ArrowDown, ArrowUp, ArrowUpDown, X } from "lucide-react";

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
  const [selectedActivity, setSelectedActivity] = useState<Atividade | null>(null);

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
      const valA = a[sortField as keyof Atividade] ?? "";
      const valB = b[sortField as keyof Atividade] ?? "";

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
    <>
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
            {sortedActivities.map((activity) => (
              <tr
                key={activity.id}
                onClick={() => setSelectedActivity(activity)}
                className="border-b border-line last:border-0 hover:bg-bg/40 transition-colors cursor-pointer"
              >
                <td className="py-3 pr-2 font-medium">{activity.atividade}</td>
                <td className="py-3 pr-2 font-mono-kpi text-ink-soft">{activity.projeto || "—"}</td>
                <td className="py-3 pr-2">{renderContractLinks(activity)}</td>
                <td className="py-3 pr-2">{activity.responsavel}</td>
                <td className="py-3 pr-2 font-mono-kpi">{formatDateShort(activity.data_inicio ?? null)}</td>
                <td className="py-3 pr-2 font-mono-kpi">{formatDateShort(activity.data_fim ?? null)}</td>
                <td className="py-3">
                  <StatusBadge status={activity.status} />
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

      {selectedActivity && (
        <ActivityDetailsModal
          activity={selectedActivity}
          onClose={() => setSelectedActivity(null)}
        />
      )}
    </>
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
              onClick={(event) => event.stopPropagation()}
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

function ActivityDetailsModal({
  activity,
  onClose,
}: {
  activity: Atividade;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="activity-details-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[88vh] overflow-y-auto rounded-lg border border-line bg-panel shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-panel px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
              Detalhes da atividade
            </p>
            <h3 id="activity-details-title" className="mt-1 font-display text-[18px] font-bold leading-snug text-ink">
              {activity.atividade}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar detalhes da atividade"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-line bg-transparent text-ink-soft transition-colors hover:bg-line/10 hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <dl className="grid gap-4 px-5 py-5 sm:grid-cols-2">
          <DetailItem label="Projeto" value={activity.projeto} />
          <DetailItem label="Responsável" value={activity.responsavel} />
          <DetailItem label="Status original" value={activity.raw_status} />
          <DetailItem label="Status calculado" value={<StatusBadge status={activity.status} />} />
          <DetailItem label="SEI" value={activity.sei_number} />
          <DetailItem label="Contrato" value={renderContractLinks(activity)} />
          <DetailItem label="Item/etapa" value={activity.step_number} />
          <DetailItem label="Grupo" value={activity.group_item} />
          <DetailItem label="Data de início planejada" value={formatDateFull(activity.data_inicio)} />
          <DetailItem label="Data de início real" value={formatDateFull(activity.actual_start_date)} />
          <DetailItem label="Prazo original" value={formatDateFull(activity.deadline)} />
          <DetailItem label="Nova data" value={formatDateFull(activity.new_date)} />
          <DetailItem label="Dias úteis" value={activity.working_days?.toString()} />
          <DetailItem label="Atualizada em" value={formatDateTime(activity.updated_at)} />
          <DetailItem wide label="Observações" value={activity.observations} />
          <DetailItem wide label="Problema do atraso" value={activity.delay_justification_problem} />
          <DetailItem wide label="Ação corretiva" value={activity.delay_justification_action} />
          <DetailItem wide label="Responsável pela ação" value={activity.delay_justification_responsible} />
        </dl>
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
  wide = false,
}: {
  label: string;
  value?: React.ReactNode;
  wide?: boolean;
}) {
  const isEmpty = value === null || value === undefined || value === "";

  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
        {label}
      </dt>
      <dd className="mt-1 text-[13px] leading-relaxed text-ink">
        {isEmpty ? "—" : value}
      </dd>
    </div>
  );
}

function formatDateFull(iso?: string | null): string {
  if (!iso) return "—";
  const parts = iso.split("-");
  if (parts.length < 3) return iso;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
