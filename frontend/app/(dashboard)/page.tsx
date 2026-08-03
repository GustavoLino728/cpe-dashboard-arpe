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
      {/* Filtro por Coordenadoria */}
      <div className="flex items-center gap-3 flex-wrap">
        {scope === "coordenadoria" && (
          <select
            id="coordSelect"
            value={selectedCoord}
            onChange={(e) => setSelectedCoord(e.target.value)}
            className="font-sans text-[13.5px] font-semibold py-2 px-3.5 rounded-lg border border-line bg-panel text-ink outline-none cursor-pointer focus:border-teal transition-colors"
          >
            <option value="todas">Central — todas as coordenadorias</option>
            {coordenadorias.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
        <span className="text-[12px] text-ink-soft" id="viewNote">
          {loading ? "Carregando dados..." : metrics.viewNote}
        </span>
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
