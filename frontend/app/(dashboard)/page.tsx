"use client";

import React from "react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { DashboardKPIs } from "@/components/dashboard/DashboardKPIs";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { DashboardSummaryChips } from "@/components/dashboard/DashboardSummaryChips";
import { ActivityTable } from "@/components/ActivityTable";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function DashboardHome() {
  const {
    scope,
    selectedCoord,
    setSelectedCoord,
    selectedProject,
    setSelectedProject,
    selectedMacro,
    setSelectedMacro,
    projetos,
    macroprocessos,
    resetFilters,
    mounted,
    loading,
    error,
    atividades,
    coordenadorias,
    filteredData,
    loadData,
    metrics,
    charts,
  } = useDashboardData();

  if (error && !loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <AlertTriangle className="w-10 h-10 text-rose-500" />
        <p className="text-[14px] text-ink-soft text-center max-w-md">
          Não foi possível carregar os dados do dashboard.
          <br />
          <span className="text-[12px] text-ink-soft/70">{error}</span>
        </p>
        <button
          onClick={loadData}
          className="flex items-center gap-2 font-sans text-[13px] font-semibold text-white bg-teal rounded-lg py-2 px-4 cursor-pointer hover:bg-teal/90 active:scale-[0.98] transition-all duration-150 shadow-sm"
        >
          <RefreshCw className="w-4 h-4" /> Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Filtros */}
      <div className="flex items-end gap-4 flex-wrap">
        {scope === "coordenadoria" && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="coordSelect" className="font-display font-semibold text-[12px] text-ink-soft px-1">
              Coordenadoria
            </label>
            <select
              id="coordSelect"
              value={selectedCoord}
              onChange={(e) => setSelectedCoord(e.target.value)}
              className="font-sans text-[13.5px] font-semibold py-2 px-3.5 rounded-lg border border-line bg-panel text-ink outline-none cursor-pointer focus:border-teal transition-colors"
            >
              <option value="todas">Todos</option>
              {coordenadorias.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Filtro por Projeto */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="projectSelect" className="font-display font-semibold text-[12px] text-ink-soft px-1">
            Projeto
          </label>
          <select
            id="projectSelect"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="font-sans text-[13.5px] font-semibold py-2 px-3.5 rounded-lg border border-line bg-panel text-ink outline-none cursor-pointer focus:border-teal transition-colors"
          >
            <option value="todos">Todos</option>
            {projetos.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por Macroprocessos (não implementado) */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="macroSelect" className="font-display font-semibold text-[12px] text-ink-soft px-1">
            Macroprocesso
          </label>
          <select
            id="macroSelect"
            value={selectedMacro}
            onChange={(e) => setSelectedMacro(e.target.value)}
            className="font-sans text-[13.5px] font-semibold py-2 px-3.5 rounded-lg border border-line bg-panel text-ink outline-none cursor-pointer focus:border-teal transition-colors"
          >
            <option value="todos">Todos</option>
            {macroprocessos.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Botão Redefinir Filtros */}
        <button
          onClick={resetFilters}
          className="font-sans text-[13px] font-semibold text-teal hover:text-teal/80 border border-teal/20 hover:border-teal/40 rounded-lg py-2 px-4 cursor-pointer hover:bg-teal/5 transition-all duration-150 shadow-sm h-[38px] flex items-center justify-center"
        >
          Redefinir Filtros
        </button>

        {loading && (
          <span className="text-[12px] text-ink-soft ml-auto" id="loadingNote">
            Carregando dados...
          </span>
        )}
      </div>

      {/* Grid de Cards de KPI */}
      <DashboardKPIs
        loading={loading}
        total={metrics.total}
        progress={metrics.progress}
        late={metrics.late}
        donePercent={metrics.donePercent}
        activeCoordinations={metrics.activeCoordinations}
        activeResponsibles={metrics.activeResponsibles}
        projectsCount={coordenadorias.length}
      />

      {/* Donuts e Bar Chart em Grid */}
      <DashboardCharts
        mounted={mounted}
        loading={loading}
        hasActivities={atividades.length > 0}
        donutCoordData={charts.donutCoordData}
        donutStatusData={charts.donutStatusData}
        donutRespData={charts.donutRespData}
        barChartData={charts.barChartData}
      />

      {/* Faixa de Chips — estilo executivo */}
      <DashboardSummaryChips
        loading={loading}
        done={metrics.done}
        late={metrics.late}
        progress={metrics.progress}
        total={metrics.total}
      />

      {/* Tabela de Detalhamento Reutilizável */}
      <div className="flex flex-col gap-3">
        <h2 className="font-display font-semibold text-[13.5px] text-ink px-1 select-none">
          Detalhamento das atividades
        </h2>
        {loading ? (
          <div className="bg-panel border border-line/30 rounded-custom p-6 h-[200px] animate-pulse" />
        ) : (
          <ActivityTable activities={filteredData} />
        )}
      </div>
    </div>
  );
}
