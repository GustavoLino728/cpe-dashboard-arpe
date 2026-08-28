import React from "react";
import Link from "next/link";
import { KpiCard } from "@/components/KpiCard";
import { buildActivitiesHref } from "@/lib/activity-filters";
import {
  ClipboardList,
  Clock,
  AlertTriangle,
  CheckCircle,
  Timer,
  PauseCircle,
  CalendarClock,
  TriangleAlert,
} from "lucide-react";

interface DashboardKPIsProps {
  loading: boolean;
  total: number;
  notStarted: number;
  progress: number;
  donePercent: number;
  deadlines7: number;
  deadlines15: number;
  deadlines30: number;
  late: number;
  selectedCoord?: string;
  selectedProject?: string;
  includeCoordFilter?: boolean;
}

export function DashboardKPIs({
  loading,
  total,
  notStarted,
  progress,
  donePercent,
  deadlines7,
  deadlines15,
  deadlines30,
  late,
  selectedCoord = "todas",
  selectedProject = "todos",
  includeCoordFilter = false,
}: DashboardKPIsProps) {
  const activityFilterContext = {
    selectedCoord,
    selectedProject,
    includeCoordFilter,
  };

  const kpis = [
    {
      value: total,
      label: "Atividades",
      icon: <ClipboardList className="w-5 h-5 shrink-0" />,
      accentColor: "#3E8E6D",
      href: buildActivitiesHref({}, activityFilterContext),
    },
    {
      value: notStarted,
      label: "Não Iniciadas",
      icon: <PauseCircle className="w-5 h-5 shrink-0" />,
      accentColor: "#6B7280",
      href: buildActivitiesHref({ status: "pending" }, activityFilterContext),
    },
    {
      value: progress,
      label: "Em andamento",
      icon: <Clock className="w-5 h-5 shrink-0" />,
      accentColor: "#5B95C4",
      href: buildActivitiesHref({ status: "warn" }, activityFilterContext),
    },
    {
      value: `${donePercent}%`,
      label: "Concluídas",
      icon: <CheckCircle className="w-5 h-5 shrink-0" />,
      accentColor: "#1B7F79",
      href: buildActivitiesHref({ status: "ok" }, activityFilterContext),
    },
    {
      value: deadlines7,
      label: "Prazos críticos - 7 dias",
      icon: <AlertTriangle className="w-5 h-5 shrink-0" />,
      accentColor: "#C4432D",
      href: buildActivitiesHref({ prazo: "7" }, activityFilterContext),
    },
    {
      value: deadlines15,
      label: "Prazos críticos - 15 dias",
      icon: <Timer className="w-5 h-5 shrink-0" />,
      accentColor: "#D97706",
      href: buildActivitiesHref({ prazo: "15" }, activityFilterContext),
    },
    {
      value: deadlines30,
      label: "Prazos críticos - 30 dias",
      icon: <CalendarClock className="w-5 h-5 shrink-0" />,
      accentColor: "#D99A4E",
      href: buildActivitiesHref({ prazo: "30" }, activityFilterContext),
    },
    {
      value: late,
      label: "Atividades atrasadas",
      icon: <TriangleAlert className="w-5 h-5 shrink-0" />,
      accentColor: "#B91C1C",
      href: buildActivitiesHref({ status: "late" }, activityFilterContext),
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
        <Link
          key={idx}
          href={kpi.href}
          className="block rounded-custom outline-none focus-visible:ring-2 focus-visible:ring-teal/40"
        >
          <KpiCard
            value={kpi.value}
            label={kpi.label}
            icon={kpi.icon}
            accentColor={kpi.accentColor}
          />
        </Link>
      ))}
    </section>
  );
}
