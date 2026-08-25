import { useState, useEffect, useMemo, useCallback } from "react";
import { useDashboard } from "@/components/DashboardProvider";
import {
  fetchAtividades,
  fetchProjectsSimple,
  extractCoordenadorias,
  buildCoordColors,
  statusMap,
  Atividade,
} from "@/lib/api";

export function useDashboardData() {
  const { scope, selectedCoord, setSelectedCoord } = useDashboard();
  const [mounted, setMounted] = useState(false);
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedProject, setSelectedProject] = useState<string>("todos");

  const [allProjects, setAllProjects] = useState<{ id: string; name: string }[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [activitiesData, projectsData] = await Promise.all([
        fetchAtividades(),
        fetchProjectsSimple(),
      ]);
      setAtividades(activitiesData);
      setAllProjects(projectsData);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao carregar dados";
      setError(msg);
      setAtividades([]);
      setAllProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    loadData();
  }, [loadData]);

  const coordenadorias = useMemo(
    () => extractCoordenadorias(atividades),
    [atividades]
  );
  const coordColors = useMemo(
    () => buildCoordColors(coordenadorias),
    [coordenadorias]
  );

  const projetos = useMemo(() => {
    return allProjects.map((p) => p.name).sort();
  }, [allProjects]);



  const filteredData = useMemo(() => {
    let data = atividades;

    if (scope !== "pessoal" && selectedCoord !== "todas") {
      data = data.filter((d) => d.coordenadoria === selectedCoord);
    }

    if (selectedProject !== "todos") {
      data = data.filter((d) => d.projeto === selectedProject);
    }

    return data;
  }, [scope, selectedCoord, selectedProject, atividades]);

  const resetFilters = useCallback(() => {
    setSelectedCoord("todas");
    setSelectedProject("todos");
  }, [setSelectedCoord]);

  const total = filteredData.length;
  const done = filteredData.filter((d) => d.status === "ok").length;
  const progress = filteredData.filter((d) => d.status === "warn").length;
  const late = filteredData.filter((d) => d.status === "late").length;
  const notStarted = filteredData.filter((d) => d.status === "pending").length;
  const donePercent = total > 0 ? Math.round((done / total) * 100) : 0;

  // Prazos críticos: contagem de atividades não concluídas com prazo nos próximos N dias
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlines7 = filteredData.filter((d) => {
    if (d.status === "ok" || !d.data_fim) return false;
    const dl = new Date(d.data_fim);
    dl.setHours(0, 0, 0, 0);
    const diff = Math.ceil((dl.getTime() - today.getTime()) / 86400000);
    return diff >= 0 && diff <= 7;
  }).length;
  const deadlines15 = filteredData.filter((d) => {
    if (d.status === "ok" || !d.data_fim) return false;
    const dl = new Date(d.data_fim);
    dl.setHours(0, 0, 0, 0);
    const diff = Math.ceil((dl.getTime() - today.getTime()) / 86400000);
    return diff >= 0 && diff <= 15;
  }).length;
  const deadlines30 = filteredData.filter((d) => {
    if (d.status === "ok" || !d.data_fim) return false;
    const dl = new Date(d.data_fim);
    dl.setHours(0, 0, 0, 0);
    const diff = Math.ceil((dl.getTime() - today.getTime()) / 86400000);
    return diff >= 0 && diff <= 30;
  }).length;

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
        (selectedCoord === "todas" ? "todos os responsáveis" : selectedCoord) +
        " · ";
    }
    return nota + "dados carregados da API";
  }, [scope, selectedCoord]);

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
      { name: "Não Iniciado", value: notStarted, color: statusMap.pending.corHex },
      { name: "Atrasado", value: late, color: statusMap.late.corHex },
    ].filter((item) => item.value > 0);
  }, [done, progress, notStarted, late]);

  const donutRespData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach((d) => {
      counts[d.responsavel] = (counts[d.responsavel] || 0) + 1;
    });

    const topColors = ["#3B82F6", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316"];
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value], idx) => ({
        name,
        value,
        color: topColors[idx % topColors.length],
      }));
  }, [filteredData]);

  const barChartData = useMemo(() => {
    const MONTHS_PT: Record<number, string> = {
      1: "Jan", 2: "Fev", 3: "Mar", 4: "Abr", 5: "Mai", 6: "Jun",
      7: "Jul", 8: "Ago", 9: "Set", 10: "Out", 11: "Nov", 12: "Dez",
    };

    // Agrupar atividades por mes/ano do prazo final real
    const buckets: Record<string, { sortKey: string; "Concluído": number; "Em andamento": number; "Não Iniciado": number; "Atrasado": number }> = {};

    filteredData.forEach((d) => {
      if (!d.data_fim) return;
      const dt = new Date(d.data_fim + "T00:00:00");
      if (isNaN(dt.getTime())) return;
      const m = dt.getMonth() + 1;
      const y = dt.getFullYear();
      const label = `${MONTHS_PT[m]}/${String(y).slice(-2)}`;
      const sortKey = `${y}-${String(m).padStart(2, "0")}`;
      if (!buckets[label]) {
        buckets[label] = { sortKey, "Concluído": 0, "Em andamento": 0, "Não Iniciado": 0, "Atrasado": 0 };
      }
      if (d.status === "ok") buckets[label]["Concluído"]++;
      else if (d.status === "warn") buckets[label]["Em andamento"]++;
      else if (d.status === "pending") buckets[label]["Não Iniciado"]++;
      else if (d.status === "late") buckets[label]["Atrasado"]++;
    });

    return Object.entries(buckets)
      .sort(([, a], [, b]) => a.sortKey.localeCompare(b.sortKey))
      .map(([name, vals]) => ({
        name,
        "Concluído": vals["Concluído"],
        "Em andamento": vals["Em andamento"],
        "Não Iniciado": vals["Não Iniciado"],
        "Atrasado": vals["Atrasado"],
      }));
  }, [filteredData]);

  return {
    scope,
    selectedCoord,
    setSelectedCoord,
    selectedProject,
    setSelectedProject,
    projetos,
    resetFilters,
    mounted,
    loading,
    error,
    atividades,
    coordenadorias,
    filteredData,
    loadData,
    metrics: {
      total,
      done,
      progress,
      late,
      notStarted,
      donePercent,
      activeCoordinations,
      activeResponsibles,
      deadlines7,
      deadlines15,
      deadlines30,
      viewNote,
    },
    charts: {
      donutCoordData,
      donutStatusData,
      donutRespData,
      barChartData,
    },
  };
}
