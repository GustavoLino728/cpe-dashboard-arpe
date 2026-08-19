"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { ActivityTable } from "@/components/ActivityTable";
import {
  fetchAtividades,
  fetchProjectsSimple,
  extractCoordenadorias,
  Atividade,
} from "@/lib/api";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function AtividadesPage() {
  const [search, setSearch] = useState("");

  const [selectedCoord, setSelectedCoord] = useState<string>("todas");
  const [selectedProject, setSelectedProject] = useState<string>("todos");

  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [allProjects, setAllProjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        err instanceof Error ? err.message : "Erro ao carregar atividades";
      setError(msg);
      setAtividades([]);
      setAllProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const coordenadorias = useMemo(
    () => extractCoordenadorias(atividades),
    [atividades]
  );

  const projetos = useMemo(
    () => allProjects.map((p) => p.name).sort(),
    [allProjects]
  );



  const filtered = useMemo(() => {
    let data = atividades;

    const term = search.toLowerCase().trim();
    if (term) {
      data = data.filter(
        (d) =>
          d.atividade.toLowerCase().includes(term) ||
          d.coordenadoria.toLowerCase().includes(term) ||
          d.responsavel.toLowerCase().includes(term) ||
          (d.projeto && d.projeto.toLowerCase().includes(term))
      );
    }

    if (selectedCoord !== "todas") {
      data = data.filter((d) => d.coordenadoria === selectedCoord);
    }

    if (selectedProject !== "todos") {
      data = data.filter((d) => d.projeto === selectedProject);
    }

    return data;
  }, [search, atividades, selectedCoord, selectedProject]);

  const resetFilters = () => {
    setSearch("");
    setSelectedCoord("todas");
    setSelectedProject("todos");
  };

  if (error && !loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <AlertTriangle className="w-10 h-10 text-rose-500" />
        <p className="text-[14px] text-ink-soft text-center max-w-md">
          Não foi possível carregar as atividades.
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
      {/* Barra de Busca por Texto */}
      <div className="view-row flex items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar atividade, setor, projeto ou coordenadoria..."
          className="flex-1 font-sans text-[13.5px] py-2 px-3.5 rounded-lg border border-line bg-panel text-ink outline-none focus:border-teal transition-colors"
        />
      </div>

      {/* Filtros Dropdowns */}
      <div className="flex items-end gap-4 flex-wrap">
        {/* Coordenadoria */}
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

        {/* Projeto */}
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



        {/* Redefinir Filtros */}
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

      {/* Tabela de Atividades */}
      <div className="flex flex-col gap-3">
        <h2 className="font-display font-semibold text-[13.5px] text-ink px-1 select-none">
          Todas as atividades
        </h2>
        {loading ? (
          <div className="bg-panel border border-line/30 rounded-custom p-6 h-[300px] animate-pulse flex items-center justify-center text-[11px] text-ink-soft">
            Carregando atividades...
          </div>
        ) : (
          <ActivityTable activities={filtered} />
        )}
      </div>
    </div>
  );
}
