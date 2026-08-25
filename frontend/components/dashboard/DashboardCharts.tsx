import React from "react";
import { DonutChart } from "@/components/DonutChart";
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

interface DashboardChartsProps {
  mounted: boolean;
  loading: boolean;
  hasActivities: boolean;
  donutCoordData: Array<{ name: string; value: number; color: string }>;
  donutStatusData: Array<{ name: string; value: number; color: string }>;
  donutRespData: Array<{ name: string; value: number; color: string }>;
  barChartData: Array<{
    name: string;
    "Concluído": number;
    "Em andamento": number;
    "Não Iniciado": number;
    "Atrasado": number;
  }>;
}

export function DashboardCharts({
  mounted,
  loading,
  hasActivities,
  donutCoordData,
  donutStatusData,
  donutRespData,
  barChartData,
}: DashboardChartsProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Donuts em Grid */}
      <section className="grid grid-cols-3 gap-5 max-xl:grid-cols-1">
        {loading ? (
          <>
            <div className="bg-panel border border-line/30 rounded-custom p-6 h-[260px] animate-pulse" />
            <div className="bg-panel border border-line/30 rounded-custom p-6 h-[260px] animate-pulse" />
            <div className="bg-panel border border-line/30 rounded-custom p-6 h-[260px] animate-pulse" />
          </>
        ) : hasActivities ? (
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

      {/* Gráfico de Barras Empilhado */}
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
                  fill="#10B981"
                  radius={[0, 0, 4, 4]}
                />
                <Bar
                  dataKey="Em andamento"
                  stackId="statusStack"
                  fill="#F59E0B"
                />
                <Bar
                  dataKey="Não Iniciado"
                  stackId="statusStack"
                  fill="#6B7280"
                />
                <Bar
                  dataKey="Atrasado"
                  stackId="statusStack"
                  fill="#EF4444"
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
    </div>
  );
}
