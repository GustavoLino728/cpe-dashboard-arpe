import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Atividade, formatDateShort } from "@/lib/api";
import { StatusBadge } from "./StatusBadge";
import { EmptyCell, EmptyFieldToast } from "./atividades/EmptyValueNotice";
import { ArrowDown, ArrowUp, ArrowUpDown, X } from "lucide-react";

interface ActivityTableProps {
  activities: Atividade[];
}

type SortField =
  | "mrae"
  | "instrument"
  | "atividade"
  | "responsavel"
  | "data_inicio"
  | "data_fim"
  | "status";
type SortDirection = "asc" | "desc";

export function ActivityTable({ activities }: ActivityTableProps) {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedActivity, setSelectedActivity] = useState<Atividade | null>(null);
  const [emptyToastMessage, setEmptyToastMessage] = useState<string | null>(null);

  const notifyEmptyField = useCallback((fieldLabel?: string) => {
    const prefix = fieldLabel ? `${fieldLabel}: ` : "";
    setEmptyToastMessage(
      `${prefix}campo sem preenchimento na planilha de origem (Google Sheets).`
    );
  }, []);

  useEffect(() => {
    if (!emptyToastMessage) return;
    const timer = setTimeout(() => {
      setEmptyToastMessage(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [emptyToastMessage]);

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
          ? valA.localeCompare(valB, "pt-BR", { sensitivity: "base" })
          : valB.localeCompare(valA, "pt-BR", { sensitivity: "base" });
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
      <div className="bg-panel border border-line/35 rounded-custom p-5 transition-all duration-200 overflow-x-auto w-full">
        <table className="w-full border-collapse text-[12.5px] text-left text-ink min-w-[780px]">
          <thead>
            <tr className="border-b border-line select-none">
              <th onClick={() => handleSort("mrae")} className={headerClass}>
                MRAE {renderSortIcon("mrae")}
              </th>
              <th onClick={() => handleSort("instrument")} className={headerClass}>
                Instrumento {renderSortIcon("instrument")}
              </th>
              <th onClick={() => handleSort("atividade")} className={headerClass}>
                Ação {renderSortIcon("atividade")}
              </th>
              <th onClick={() => handleSort("responsavel")} className={headerClass}>
                Executor ARPE {renderSortIcon("responsavel")}
              </th>
              <th onClick={() => handleSort("data_inicio")} className={headerClass}>
                Prazo Inicial {renderSortIcon("data_inicio")}
              </th>
              <th onClick={() => handleSort("data_fim")} className={headerClass}>
                Prazo Final {renderSortIcon("data_fim")}
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
                className="border-b border-line/60 last:border-0 hover:bg-bg/45 transition-colors cursor-pointer"
              >
                <td className="py-3 pr-3 font-mono-kpi text-[12px] text-ink-soft whitespace-nowrap">
                  {activity.mrae ? (
                    activity.mrae
                  ) : (
                    <EmptyCell fieldLabel="MRAE" onNotifyEmpty={notifyEmptyField} />
                  )}
                </td>
                <td className="py-3 pr-3 max-w-[190px]">
                  {renderInstrumentOrContract(activity, notifyEmptyField)}
                </td>
                <td className="py-3 pr-3 font-medium leading-snug max-w-[360px]">
                  {activity.atividade}
                </td>
                <td className="py-3 pr-3">
                  {activity.responsavel ? (
                    activity.responsavel
                  ) : (
                    <EmptyCell
                      fieldLabel="Executor ARPE"
                      onNotifyEmpty={notifyEmptyField}
                    />
                  )}
                </td>
                <td className="py-3 pr-3 font-mono-kpi whitespace-nowrap">
                  {renderHybridDateValue(
                    activity.data_inicio,
                    activity.initial_deadline_text,
                    "Prazo Inicial",
                    notifyEmptyField
                  )}
                </td>
                <td className="py-3 pr-3 font-mono-kpi whitespace-nowrap">
                  {renderHybridDateValue(
                    activity.data_fim,
                    activity.final_deadline_text,
                    "Prazo Final",
                    notifyEmptyField
                  )}
                </td>
                <td className="py-3">
                  <StatusBadge status={activity.status} />
                </td>
              </tr>
            ))}
            {sortedActivities.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-ink-soft py-10 font-medium">
                  Nenhuma atividade encontrada para os filtros aplicados.
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
          onNotifyEmpty={notifyEmptyField}
        />
      )}

      <EmptyFieldToast
        message={emptyToastMessage}
        onClose={() => setEmptyToastMessage(null)}
      />
    </>
  );
}

const headerClass =
  "text-[10.5px] uppercase tracking-wider text-ink-soft pb-[10px] pr-3 font-semibold cursor-pointer hover:text-ink transition-colors whitespace-nowrap";

function renderHybridDateValue(
  isoDate?: string | null,
  fallbackText?: string | null,
  label?: string,
  onNotifyEmpty?: (fieldLabel?: string) => void
) {
  if (isoDate) {
    return formatDateShort(isoDate);
  }
  if (fallbackText) {
    return (
      <span className="font-sans text-[12px] text-ink-soft">{fallbackText}</span>
    );
  }
  return <EmptyCell fieldLabel={label} onNotifyEmpty={onNotifyEmpty} />;
}

function renderInstrumentOrContract(
  activity: Atividade,
  onNotifyEmpty?: (fieldLabel?: string) => void
) {
  const links = activity.contrato_links ?? [];
  if (links.length === 0) {
    const label = activity.instrument || activity.contrato;
    if (!label || label === "—") {
      return <EmptyCell fieldLabel="Instrumento" onNotifyEmpty={onNotifyEmpty} />;
    }
    return <span>{label}</span>;
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
  onNotifyEmpty,
}: {
  activity: Atividade;
  onClose: () => void;
  onNotifyEmpty: (fieldLabel?: string) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="activity-details-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[88vh] overflow-y-auto rounded-lg border border-line bg-panel shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-panel px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
              Detalhes da atividade {activity.mrae ? `· ${activity.mrae}` : ""}
            </p>
            <h3
              id="activity-details-title"
              className="mt-1 font-display text-[18px] font-bold leading-snug text-ink"
            >
              {activity.atividade}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar detalhes da atividade"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-line bg-transparent text-ink-soft transition-colors hover:bg-line/10 hover:text-ink cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <dl className="grid gap-4 px-5 py-5 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem label="Projeto / Aba" value={activity.projeto} onNotifyEmpty={onNotifyEmpty} />
          <DetailItem label="MRAE" value={activity.mrae} onNotifyEmpty={onNotifyEmpty} />
          <DetailItem
            label="Instrumento"
            value={renderInstrumentOrContract(activity, onNotifyEmpty)}
            onNotifyEmpty={onNotifyEmpty}
          />
          <DetailItem label="Cláusula" value={activity.clause} onNotifyEmpty={onNotifyEmpty} />
          <DetailItem label="Fase" value={activity.phase} onNotifyEmpty={onNotifyEmpty} />
          <DetailItem label="Grupos temáticos" value={activity.thematic_group} onNotifyEmpty={onNotifyEmpty} />
          <DetailItem label="Natureza" value={activity.nature} onNotifyEmpty={onNotifyEmpty} />
          <DetailItem label="Responsável principal" value={activity.primary_responsible} onNotifyEmpty={onNotifyEmpty} />
          <DetailItem label="Executor (Áreas ARPE)" value={activity.responsavel} onNotifyEmpty={onNotifyEmpty} />
          <DetailItem label="Status da ação (planilha)" value={activity.raw_status} onNotifyEmpty={onNotifyEmpty} />
          <DetailItem label="Status calculado" value={<StatusBadge status={activity.status} />} onNotifyEmpty={onNotifyEmpty} />
          <DetailItem label="Status ARPE" value={activity.arpe_status} onNotifyEmpty={onNotifyEmpty} />
          <DetailItem label="Periodicidade" value={activity.periodicity} onNotifyEmpty={onNotifyEmpty} />
          <DetailItem label="Prazo contratual ARPE" value={activity.contractual_deadline_text} onNotifyEmpty={onNotifyEmpty} />
          <DetailItem label="Etapa prévia" value={activity.prior_step} onNotifyEmpty={onNotifyEmpty} />
          <DetailItem
            label="Prazo etapa prévia"
            value={
              activity.prior_step_deadline
                ? formatDateFull(activity.prior_step_deadline)
                : activity.prior_step_deadline_text
            }
            onNotifyEmpty={onNotifyEmpty}
          />
          <DetailItem
            label="Prazo inicial"
            value={
              activity.data_inicio
                ? formatDateFull(activity.data_inicio)
                : activity.initial_deadline_text
            }
            onNotifyEmpty={onNotifyEmpty}
          />
          <DetailItem
            label="Prazo final"
            value={
              activity.deadline
                ? formatDateFull(activity.deadline)
                : activity.final_deadline_text
            }
            onNotifyEmpty={onNotifyEmpty}
          />
          <DetailItem label="Nova data" value={formatDateFull(activity.new_date)} onNotifyEmpty={onNotifyEmpty} />
          <DetailItem label="Prazo inicial realizado" value={formatDateFull(activity.actual_start_date)} onNotifyEmpty={onNotifyEmpty} />
          <DetailItem label="Prazo final realizado" value={formatDateFull(activity.actual_end_date)} onNotifyEmpty={onNotifyEmpty} />
          <DetailItem label="Data de entrada ARPE" value={formatDateFull(activity.arpe_entry_date)} onNotifyEmpty={onNotifyEmpty} />
          <DetailItem label="Data final ARPE" value={formatDateFull(activity.arpe_final_date)} onNotifyEmpty={onNotifyEmpty} />
          <DetailItem label="SEI" value={activity.sei_number} onNotifyEmpty={onNotifyEmpty} />
          <DetailItem label="SEI 2" value={activity.sei_2} onNotifyEmpty={onNotifyEmpty} />
          <DetailItem label="Atualizada em" value={formatDateTime(activity.updated_at)} onNotifyEmpty={onNotifyEmpty} />
          <DetailItem wide label="Resumo do objeto" value={activity.object_summary} onNotifyEmpty={onNotifyEmpty} />
          <DetailItem wide label="Observações" value={activity.observations} onNotifyEmpty={onNotifyEmpty} />
          <DetailItem wide label="Resumo" value={activity.summary} onNotifyEmpty={onNotifyEmpty} />
        </dl>
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
  wide = false,
  onNotifyEmpty,
}: {
  label: string;
  value?: React.ReactNode;
  wide?: boolean;
  onNotifyEmpty?: (fieldLabel?: string) => void;
}) {
  const isEmpty = value === null || value === undefined || value === "";

  return (
    <div className={wide ? "sm:col-span-2 lg:col-span-3" : ""}>
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
        {label}
      </dt>
      <dd className="mt-1 text-[13px] leading-relaxed text-ink break-words">
        {isEmpty ? (
          <EmptyCell fieldLabel={label} onNotifyEmpty={onNotifyEmpty} />
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

function formatDateFull(iso?: string | null): string | null {
  if (!iso) return null;
  const parts = iso.split("T")[0].split("-");
  if (parts.length < 3) return iso;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatDateTime(iso?: string | null): string | null {
  if (!iso) return null;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
