import { useState, useEffect, useMemo, useCallback } from "react";
import { useDashboard } from "@/components/DashboardProvider";
import {
  fetchAtividades,
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

  const filteredData = useMemo(() => {
    if (scope === "pessoal") {
      return atividades;
    }
    if (selectedCoord === "todas") {
      return atividades;
    }
    return atividades.filter((d) => d.coordenadoria === selectedCoord);
  }, [scope, selectedCoord, atividades]);

  const total = filteredData.length;
  const done = filteredData.filter((d) => d.status === "ok").length;
  const progress = filteredData.filter((d) => d.status === "warn").length;
  const late = filteredData.filter((d) => d.status === "late").length;
  const donePercent = total > 0 ? Math.round((done / total) * 100) : 0;

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

  return {
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
    metrics: {
      total,
      done,
      progress,
      late,
      donePercent,
      activeCoordinations,
      activeResponsibles,
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
