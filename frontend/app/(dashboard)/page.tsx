"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useDashboard } from "@/components/DashboardProvider";
import { DonutChart } from "@/components/DonutChart";
import { KpiCard } from "@/components/KpiCard";
import { ActivityTable } from "@/components/ActivityTable";
import {
  fetchAtividades,
  extractCoordenadorias,
  buildCoordColors,
  statusMap,
  Atividade,
} from "@/lib/api";
import {
  ClipboardList,
  Clock,
  AlertTriangle,
  CheckCircle,
  Layers,
  Users,
  Hourglass,
  FileSpreadsheet,
  RefreshCw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
  ResponsiveContainer,
} from "recharts";

export default function DashboardHome() {
  const { scope, selectedCoord, setSelectedCoord } = useDashboard();
  const [mounted, setMounted] = useState(false);

  // ---- Estado de dados da API ----
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAtividades();
      setAtividades(data);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao carregar dados";
      setError(msg);
      setAtividades([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    loadData();
  }, [loadData]);

  // ---- Coordenadorias dinâmicas ----
  const coordenadorias = useMemo(
    () => extractCoordenadorias(atividades),
    [atividades]
  );
  const coordColors = useMemo(
    () => buildCoordColors(coordenadorias),
    [coordenadorias]
  );

  // 1. Filtragem dos dados conforme escopo e coordenadoria
  const filteredData = useMemo(() => {
    if (scope === "pessoal") {
      // Sem campo "responsavel" real, filtra pela 1ª coordenadoria
      // (comportamento provisório — ver plano de integração)
      return atividades;
    }
    // scope === 'coordenadoria'
    if (selectedCoord === "todas") {
      return atividades;
    }
    return atividades.filter((d) => d.coordenadoria === selectedCoord);
  }, [scope, selectedCoord, atividades]);

  // 2. Cálculos dos KPIs
  const total = filteredData.length;
  const done = filteredData.filter((d) => d.status === "ok").length;
  const progress = filteredData.filter((d) => d.status === "warn").length;
  const late = filteredData.filter((d) => d.status === "late").length;
  const donePercent = total > 0 ? Math.round((done / total) * 100) : 0;

  // Estatísticas adicionais (dinâmicas conforme filtro)
  const activeCoordinations = useMemo(() => {
    return new Set(filteredData.map((d) => d.coordenadoria)).size;
  }, [filteredData]);

  const activeResponsibles = useMemo(() => {
    return new Set(filteredData.map((d) => d.responsavel)).size;
  }, [filteredData]);

  const viewNote = useMemo(() => {
    let nota = "";
    if (scope === "pessoal") {
      nota = "visão pessoal · ";
    } else {
      nota =
        (selectedCoord === "todas" ? "todas as coordenadorias" : selectedCoord) +
        " · ";
    }
    return nota + "dados carregados da API";
  }, [scope, selectedCoord]);

  // 3. Preparação dos dados para os Donut Charts
  const donutCoordData = useMemo(() => {
    return coordenadorias.map((c) => {
      const value = atividades.filter((d) => d.coordenadoria === c).length;
      return { name: c, value, color: coordColors[c] };
    });
  }, [coordenadorias, coordColors, atividades]);

  const donutStatusData = useMemo(() => {
    return [
      { name: "Concluído", value: done, color: statusMap.ok.corHex },
      { name: "Em andamento", value: progress, color: statusMap.warn.corHex },
      { name: "Atrasado", value: late, color: statusMap.late.corHex },
    ].filter((item) => item.value > 0);
  }, [done, progress, late]);

  const donutRespData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach((d) => {
      counts[d.responsavel] = (counts[d.responsavel] || 0) + 1;
    });

    const topColors = ["#4B5563", "#6B7280", "#9CA3AF", "#D1D5DB", "#374151"];
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value], idx) => ({
        name,
        value,
        color: topColors[idx % topColors.length],
      }));
  }, [filteredData]);

  // 4. Preparação do Gráfico de Barras Empilhado
  const barChartData = useMemo(() => {
    const meses = ["Fev", "Mar", "Abr", "Mai", "Jun", "Jul"];
    return meses.map((mes, i) => {
      const fatia = filteredData.filter((_, idx) => idx % meses.length === i);
      return {
        name: mes,
        "Concluído": fatia.filter((d) => d.status === "ok").length,
        "Em andamento": fatia.filter((d) => d.status === "warn").length,
        "Atrasado": fatia.filter((d) => d.status === "late").length,
      };
    });
  }, [filteredData]);

  // 5. Configuração dos KPI cards
  const kpis = [
    {
      value: total,
      label: "Atividades",
      icon: <ClipboardList className="w-5 h-5 shrink-0" />,
      accentColor: "#3E8E6D",
    },
    {
      value: progress,
      label: "Em andamento",
      icon: <Clock className="w-5 h-5 shrink-0" />,
      accentColor: "#5B95C4",
    },
    {
      value: late,
      label: "Atrasadas",
      icon: <AlertTriangle className="w-5 h-5 shrink-0" />,
      accentColor: "#C4432D",
    },
    {
      value: `${donePercent}%`,
      label: "Concluídas",
      icon: <CheckCircle className="w-5 h-5 shrink-0" />,
      accentColor: "#1B7F79",
    },
    {
      value: activeCoordinations,
      label: "Coordenadorias ativas",
      icon: <Layers className="w-5 h-5 shrink-0" />,
      accentColor: "#5B95C4",
    },
    {
      value: activeResponsibles,
      label: "Setores envolvidos",
      icon: <Users className="w-5 h-5 shrink-0" />,
      accentColor: "#7B69B8",
    },
    {
      value: "—",
      label: "Prazo médio restante",
      icon: <Hourglass className="w-5 h-5 shrink-0" />,
      accentColor: "#D99A4E",
    },
    {
      value: coordenadorias.length || "—",
      label: "Projetos importados",
      icon: <FileSpreadsheet className="w-5 h-5 shrink-0" />,
      accentColor: "#7C8FA1",
    },
  ];

  // 6. Configuração dos Chips
  const chips = [
    { value: done, label: "Concluídas no mês", color: "#3E8E6D", icon: "✓" },
    { value: late, label: "Atrasadas críticas", color: "#C4432D", icon: "!" },
    { value: progress, label: "Em andamento", color: "#D99A4E", icon: "◷" },
    { value: total, label: "Total no filtro", color: "#5B95C4", icon: "▤" },
  ];

  // ---- Skeleton placeholder para estado de loading ----
  const SkeletonCard = () => (
    <div className="bg-panel border border-line/30 rounded-custom p-6 animate-pulse min-h-[120px]">
      <div className="h-4 w-16 bg-line/20 rounded mb-3" />
      <div className="h-7 w-20 bg-line/15 rounded mb-2" />
      <div className="h-3 w-24 bg-line/10 rounded" />
    </div>
  );

  // ---- Estado de erro ----
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
      {/* 2. Filtro por Coordenadoria */}
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
          {loading ? "Carregando dados..." : viewNote}
        </span>
      </div>

      {/* 3. Grid de Cards de KPI */}
      <section className="grid grid-cols-4 gap-5 max-xl:grid-cols-2 max-sm:grid-cols-1">
        {loading
          ? Array.from({ length: 8 }).map((_, idx) => <SkeletonCard key={idx} />)
          : kpis.map((kpi, idx) => (
              <KpiCard
                key={idx}
                value={kpi.value}
                label={kpi.label}
                icon={kpi.icon}
                accentColor={kpi.accentColor}
              />
            ))}
      </section>

      {/* 4. Donuts em Grid */}
      <section className="grid grid-cols-3 gap-5 max-xl:grid-cols-1">
        {loading ? (
          <>
            <div className="bg-panel border border-line/30 rounded-custom p-6 h-[260px] animate-pulse" />
            <div className="bg-panel border border-line/30 rounded-custom p-6 h-[260px] animate-pulse" />
            <div className="bg-panel border border-line/30 rounded-custom p-6 h-[260px] animate-pulse" />
          </>
        ) : atividades.length > 0 ? (
          <>
            <DonutChart
              data={donutCoordData}
              title="Atividades por coordenadoria"
            />
            <DonutChart
              data={donutStatusData}
              title="Distribuição por status"
            />
            <DonutChart
              data={donutRespData}
              title="Atividades por setor (top 5)"
            />
          </>
        ) : null}
      </section>

      {/* 5. Gráfico de Barras Empilhado */}
      <section className="bg-panel border border-line/30 rounded-custom p-6 transition-all duration-200">
        <h2 className="font-display font-semibold text-[13.5px] text-ink mb-4">
          Atividades por mês e status
        </h2>
        <div className="w-full min-h-[230px] flex items-center justify-center">
          {mounted && !loading ? (
            <ResponsiveContainer width="100%" height={230}>
              <BarChart
                data={barChartData}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                barSize={34}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--line)"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--ink-soft)", fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--ink-soft)", fontSize: 11 }}
                  allowDecimals={false}
                />
                <ChartTooltip
                  contentStyle={{
                    backgroundColor: "var(--panel)",
                    borderColor: "var(--line)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "var(--ink)", fontWeight: 600 }}
                  itemStyle={{ color: "var(--ink)" }}
                />
                <ChartLegend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, color: "var(--ink-soft)" }}
                />
                <Bar
                  dataKey="Concluído"
                  stackId="statusStack"
                  fill="#6B7280"
                  radius={[0, 0, 4, 4]}
                />
                <Bar
                  dataKey="Em andamento"
                  stackId="statusStack"
                  fill="#A1A7AF"
                />
                <Bar
                  dataKey="Atrasado"
                  stackId="statusStack"
                  fill="#3F444D"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-[230px] bg-line/10 rounded-lg animate-pulse flex items-center justify-center text-[11px] text-ink-soft">
              Carregando gráfico...
            </div>
          )}
        </div>
      </section>

      {/* 6. Faixa de Chips — estilo executivo */}
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

      {/* 7. Tabela de Detalhamento Reutilizável */}
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
