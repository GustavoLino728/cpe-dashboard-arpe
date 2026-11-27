"use client";

import React from "react";
import { Filter, RotateCcw, Search, X } from "lucide-react";

export interface ActivitySidebarFiltersState {
  search: string;
  mrae: string;
  instrumento: string;
  mesInicial: string;
  mesFinal: string;
  executor: string;
  status: string;
  prazo: string;
  project: string;
  responsavel: string;
}

interface ActivityFiltersSidebarProps {
  filters: ActivitySidebarFiltersState;
  mraes: string[];
  instrumentos: string[];
  executores: string[];
  hasActiveFilters: boolean;
  onSearchChange: (val: string) => void;
  onMraeChange: (val: string) => void;
  onInstrumentoChange: (val: string) => void;
  onMesInicialChange: (val: string) => void;
  onMesFinalChange: (val: string) => void;
  onExecutorChange: (val: string) => void;
  onStatusChange: (val: string) => void;
  onClearAll: () => void;
}

function ClearFieldButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Remover filtro ${label}`}
      title={`Limpar ${label}`}
      className="inline-flex items-center justify-center w-5 h-5 rounded text-ink-soft hover:text-ink hover:bg-line/20 transition-colors cursor-pointer"
    >
      <X className="w-3.5 h-3.5" />
    </button>
  );
}

const selectClassName =
  "w-full font-sans text-[13px] font-medium py-2 px-3 rounded-lg border border-line bg-bg/35 text-ink outline-none cursor-pointer focus:border-teal transition-colors";

const monthInputClassName =
  "w-full font-sans text-[13px] py-1.5 px-2.5 rounded-lg border border-line bg-bg/35 text-ink outline-none focus:border-teal transition-colors";

export function ActivityFiltersSidebar({
  filters,
  mraes,
  instrumentos,
  executores,
  hasActiveFilters,
  onSearchChange,
  onMraeChange,
  onInstrumentoChange,
  onMesInicialChange,
  onMesFinalChange,
  onExecutorChange,
  onStatusChange,
  onClearAll,
}: ActivityFiltersSidebarProps) {
  return (
    <aside
      aria-label="Filtros de atividades"
      className="w-full lg:w-[275px] xl:w-[295px] shrink-0 bg-panel border border-line/35 rounded-custom p-5 flex flex-col gap-4 self-start"
    >
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-line/40">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-teal" />
          <h2 className="font-display font-bold text-[15px] text-ink">Filtros</h2>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-[11.5px] font-semibold text-teal hover:text-teal/80 cursor-pointer flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" /> Limpar tudo
          </button>
        )}
      </div>

      {/* Pesquisar (Full-Row) */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="fullRowSearchInput"
            className="font-display font-semibold text-[12px] text-ink-soft"
          >
            Pesquisar
          </label>
          {filters.search && (
            <ClearFieldButton
              label="Pesquisar"
              onClick={() => onSearchChange("")}
            />
          )}
        </div>
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-ink-soft absolute left-3 pointer-events-none" />
          <input
            id="fullRowSearchInput"
            type="text"
            value={filters.search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar em toda a linha..."
            className="w-full font-sans text-[13px] py-2 pl-9 pr-8 rounded-lg border border-line bg-bg/35 text-ink outline-none focus:border-teal transition-colors"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Limpar busca textual"
              className="absolute right-2 p-1 rounded text-ink-soft hover:text-ink cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* MRAE */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="mraeSelect"
            className="font-display font-semibold text-[12px] text-ink-soft"
          >
            MRAE
          </label>
          {filters.mrae !== "todos" && (
            <ClearFieldButton label="MRAE" onClick={() => onMraeChange("todos")} />
          )}
        </div>
        <select
          id="mraeSelect"
          value={filters.mrae}
          onChange={(e) => onMraeChange(e.target.value)}
          className={selectClassName}
        >
          <option value="todos">Todos</option>
          {mraes.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {/* Instrumento (Dinâmico) */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="instrumentoSelect"
            className="font-display font-semibold text-[12px] text-ink-soft"
          >
            Instrumento
          </label>
          {filters.instrumento !== "todos" && (
            <ClearFieldButton
              label="Instrumento"
              onClick={() => onInstrumentoChange("todos")}
            />
          )}
        </div>
        <select
          id="instrumentoSelect"
          value={filters.instrumento}
          onChange={(e) => onInstrumentoChange(e.target.value)}
          className={selectClassName}
        >
          <option value="todos">Todos</option>
          {instrumentos.map((inst) => (
            <option key={inst} value={inst}>
              {inst}
            </option>
          ))}
        </select>
      </div>

      {/* Período (Mês inicial / Mês final) */}
      <div className="flex flex-col gap-2 pt-1 border-t border-line/30">
        <div className="flex items-center justify-between">
          <span className="font-display font-semibold text-[12px] text-ink-soft">
            Período
          </span>
          {(filters.mesInicial || filters.mesFinal) && (
            <ClearFieldButton
              label="Período"
              onClick={() => {
                onMesInicialChange("");
                onMesFinalChange("");
              }}
            />
          )}
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label htmlFor="mesInicialInput" className="text-[11.5px] text-ink-soft">
                Mês inicial
              </label>
              {filters.mesInicial && (
                <ClearFieldButton
                  label="Mês inicial"
                  onClick={() => onMesInicialChange("")}
                />
              )}
            </div>
            <input
              id="mesInicialInput"
              type="month"
              value={filters.mesInicial}
              max={filters.mesFinal || undefined}
              onChange={(e) => onMesInicialChange(e.target.value)}
              className={monthInputClassName}
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label htmlFor="mesFinalInput" className="text-[11.5px] text-ink-soft">
                Mês final
              </label>
              {filters.mesFinal && (
                <ClearFieldButton
                  label="Mês final"
                  onClick={() => onMesFinalChange("")}
                />
              )}
            </div>
            <input
              id="mesFinalInput"
              type="month"
              value={filters.mesFinal}
              min={filters.mesInicial || undefined}
              onChange={(e) => onMesFinalChange(e.target.value)}
              className={monthInputClassName}
            />
          </div>
        </div>
        <p className="text-[11px] leading-snug text-ink-soft/80">
          Itens contínuos sem prazo final permanecem visíveis a partir da data inicial.
        </p>
      </div>

      {/* Executor (Áreas da ARPE) */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="executorSelect"
            className="font-display font-semibold text-[12px] text-ink-soft"
          >
            Executor (Áreas da ARPE)
          </label>
          {filters.executor !== "todos" && (
            <ClearFieldButton
              label="Executor"
              onClick={() => onExecutorChange("todos")}
            />
          )}
        </div>
        <select
          id="executorSelect"
          value={filters.executor}
          onChange={(e) => onExecutorChange(e.target.value)}
          className={selectClassName}
        >
          <option value="todos">Todos</option>
          {executores.map((exec) => (
            <option key={exec} value={exec}>
              {exec}
            </option>
          ))}
        </select>
      </div>

      {/* Status da ação */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="statusSelect"
            className="font-display font-semibold text-[12px] text-ink-soft"
          >
            Status da ação
          </label>
          {filters.status !== "todos" && (
            <ClearFieldButton
              label="Status da ação"
              onClick={() => onStatusChange("todos")}
            />
          )}
        </div>
        <select
          id="statusSelect"
          value={filters.status}
          onChange={(e) => onStatusChange(e.target.value)}
          className={selectClassName}
        >
          <option value="todos">Todos</option>
          <option value="pending">A Iniciar</option>
          <option value="warn">Em andamento</option>
          <option value="ok">Concluído</option>
          <option value="late">Atrasado</option>
        </select>
      </div>

      {/* Remoção geral */}
      <button
        type="button"
        onClick={onClearAll}
        disabled={!hasActiveFilters}
        className={`mt-1 w-full font-sans text-[13px] font-semibold rounded-lg py-2 px-4 border transition-all duration-150 flex items-center justify-center gap-2 ${
          hasActiveFilters
            ? "text-teal border-teal/30 hover:border-teal/50 hover:bg-teal/5 cursor-pointer"
            : "text-ink-soft/50 border-line/40 cursor-not-allowed"
        }`}
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Limpar filtros
      </button>
    </aside>
  );
}

export interface ActiveFilterChipItem {
  key: string;
  label: string;
  onRemove: () => void;
}

export function ActiveFilterChips({
  chips,
  onClearAll,
}: {
  chips: ActiveFilterChipItem[];
  onClearAll: () => void;
}) {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 bg-panel/70 border border-line/30 rounded-lg px-3.5 py-2.5">
      <span className="text-[11.5px] font-semibold text-ink-soft mr-1">
        Filtros ativos:
      </span>
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1.5 rounded-full border border-teal/30 bg-teal/10 px-2.5 py-0.5 text-[11.5px] font-medium text-ink"
        >
          <span>{chip.label}</span>
          <button
            type="button"
            onClick={chip.onRemove}
            aria-label={`Remover ${chip.label}`}
            className="rounded-full p-0.5 text-ink-soft hover:text-ink hover:bg-teal/15 cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="ml-auto text-[11.5px] font-semibold text-teal hover:text-teal/80 cursor-pointer"
      >
        Limpar tudo
      </button>
    </div>
  );
}
