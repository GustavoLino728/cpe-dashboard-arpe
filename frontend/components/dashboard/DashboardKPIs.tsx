import React from "react";
import { KpiCard } from "@/components/KpiCard";
import {
  ClipboardList,
  Clock,
  AlertTriangle,
  CheckCircle,
  Layers,
  Users,
  Hourglass,
  FileSpreadsheet,
} from "lucide-react";

interface DashboardKPIsProps {
  loading: boolean;
  total: number;
  progress: number;
  late: number;
  donePercent: number;
  activeCoordinations: number;
  activeResponsibles: number;
  projectsCount: number;
}

export function DashboardKPIs({
  loading,
  total,
  progress,
  late,
  donePercent,
  activeCoordinations,
  activeResponsibles,
  projectsCount,
}: DashboardKPIsProps) {
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
      value: projectsCount || "—",
      label: "Projetos importados",
      icon: <FileSpreadsheet className="w-5 h-5 shrink-0" />,
      accentColor: "#7C8FA1",
    },
  ];

  const SkeletonCard = () => (
    <div className="bg-panel border border-line/30 rounded-custom p-6 animate-pulse min-h-[120px]">
      <div className="h-4 w-16 bg-line/20 rounded mb-3" />
      <div className="h-7 w-20 bg-line/15 rounded mb-2" />
      <div className="h-3 w-24 bg-line/10 rounded" />
    </div>
  );

  if (loading) {
    return (
      <section className="grid grid-cols-4 gap-5 max-xl:grid-cols-2 max-sm:grid-cols-1">
        {Array.from({ length: 8 }).map((_, idx) => (
          <SkeletonCard key={idx} />
        ))}
      </section>
    );
  }

  return (
    <section className="grid grid-cols-4 gap-5 max-xl:grid-cols-2 max-sm:grid-cols-1">
      {kpis.map((kpi, idx) => (
        <KpiCard
          key={idx}
          value={kpi.value}
          label={kpi.label}
          icon={kpi.icon}
          accentColor={kpi.accentColor}
        />
      ))}
    </section>
  );
}
