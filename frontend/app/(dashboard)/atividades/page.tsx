"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { ActivityTable } from "@/components/ActivityTable";
import {
  fetchPaginatedAtividades,
  Atividade,
} from "@/lib/api";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function AtividadesPage() {
  const searchParams = useSearchParams();
  const coordParam = searchParams.get("coordenadoria");
  const projectParam = searchParams.get("project");
  const statusParam = searchParams.get("status");
  const prazoParam = searchParams.get("prazo");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCoord, setSelectedCoord] = useState<string>(coordParam || "todas");
  const [selectedProject, setSelectedProject] = useState<string>(projectParam || "todos");
  const [selectedStatus, setSelectedStatus] = useState<string>(statusParam || "todos");
  const [selectedPrazo, setSelectedPrazo] = useState<string>(prazoParam || "todos");
  
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [coordenadorias, setCoordenadorias] = useState<string[]>([]);
  const [projetos, setProjetos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const latestRequestId = useRef(0);
  
  const limit = 15;

  // Sync state with search parameter when it is present
  useEffect(() => {
    setSelectedCoord(coordParam || "todas");
    setSelectedProject(projectParam || "todos");
    setSelectedStatus(statusParam || "todos");
    setSelectedPrazo(prazoParam || "todos");
    setPage(1);
  }, [coordParam, projectParam, statusParam, prazoParam]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const loadData = useCallback(async () => {
    const requestId = latestRequestId.current + 1;
    latestRequestId.current = requestId;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPaginatedAtividades(
        page,
        limit,
        debouncedSearch,
        selectedCoord,
        selectedProject,
        selectedStatus,
        selectedPrazo
      );
      if (requestId !== latestRequestId.current) return;
      setAtividades(data.activities);
      setTotal(data.total);
      setCoordenadorias(data.coordenadorias);
      setProjetos(data.projetos);
    } catch (err) {
      if (requestId !== latestRequestId.current) return;
      const msg =
        err instanceof Error ? err.message : "Erro ao carregar atividades";
      setError(msg);
      setAtividades([]);
    } finally {
      if (requestId !== latestRequestId.current) return;
      setLoading(false);
    }
  }, [page, debouncedSearch, selectedCoord, selectedProject, selectedStatus, selectedPrazo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCoordChange = (val: string) => {
    setSelectedCoord(val);
    setPage(1);
  };

  const handleProjectChange = (val: string) => {
    setSelectedProject(val);
    setPage(1);
  };

  const handleStatusChange = (val: string) => {
    setSelectedStatus(val);
    setPage(1);
  };

  const handlePrazoChange = (val: string) => {
    setSelectedPrazo(val);
    setPage(1);
  };

  const resetFilters = () => {
    setSearch("");
    setSelectedCoord("todas");
    setSelectedProject("todos");
    setSelectedStatus("todos");
    setSelectedPrazo("todos");
    setPage(1);
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
            onChange={(e) => handleCoordChange(e.target.value)}
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
            onChange={(e) => handleProjectChange(e.target.value)}
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

        {/* Status */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="statusSelect" className="font-display font-semibold text-[12px] text-ink-soft px-1">
            Status
          </label>
          <select
            id="statusSelect"
            value={selectedStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="font-sans text-[13.5px] font-semibold py-2 px-3.5 rounded-lg border border-line bg-panel text-ink outline-none cursor-pointer focus:border-teal transition-colors"
          >
            <option value="todos">Todos</option>
            <option value="pending">Não iniciadas</option>
            <option value="warn">Em andamento</option>
            <option value="ok">Concluídas</option>
            <option value="late">Atrasadas</option>
          </select>
        </div>

        {/* Prazo */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="prazoSelect" className="font-display font-semibold text-[12px] text-ink-soft px-1">
            Prazo
          </label>
          <select
            id="prazoSelect"
            value={selectedPrazo}
            onChange={(e) => handlePrazoChange(e.target.value)}
            className="font-sans text-[13.5px] font-semibold py-2 px-3.5 rounded-lg border border-line bg-panel text-ink outline-none cursor-pointer focus:border-teal transition-colors"
          >
            <option value="todos">Todos</option>
            <option value="7">Próximos 7 dias</option>
            <option value="15">Próximos 15 dias</option>
            <option value="30">Próximos 30 dias</option>
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
          <ActivityTable activities={atividades} />
        )}
      </div>

      {/* Paginação */}
      {total > limit && (
        <div className="flex items-center justify-between border-t border-line/30 pt-4 px-1 select-none">
          <span className="text-[12px] text-ink-soft">
            Mostrando <span className="font-semibold text-ink">{(page - 1) * limit + 1}</span> a{" "}
            <span className="font-semibold text-ink">{Math.min(page * limit, total)}</span> de{" "}
            <span className="font-semibold text-ink">{total}</span> atividades
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className={`font-sans text-[12.5px] font-semibold py-1.5 px-3 rounded-lg border border-line bg-panel text-ink transition-all ${
                page === 1
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-line/10 hover:text-teal active:scale-[0.98] cursor-pointer"
              }`}
            >
              Anterior
            </button>
            <button
              disabled={page * limit >= total}
              onClick={() => setPage((p) => p + 1)}
              className={`font-sans text-[12.5px] font-semibold py-1.5 px-3 rounded-lg border border-line bg-panel text-ink transition-all ${
                page * limit >= total
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-line/10 hover:text-teal active:scale-[0.98] cursor-pointer"
              }`}
            >
              Próximo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
