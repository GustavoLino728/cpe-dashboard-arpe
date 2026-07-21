"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { ActivityTable } from "@/components/ActivityTable";
import { fetchAtividades, Atividade } from "@/lib/api";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function AtividadesPage() {
  const [search, setSearch] = useState("");

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
        err instanceof Error ? err.message : "Erro ao carregar atividades";
      setError(msg);
      setAtividades([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return atividades;
    return atividades.filter(
      (d) =>
        d.atividade.toLowerCase().includes(term) ||
        d.coordenadoria.toLowerCase().includes(term) ||
        d.responsavel.toLowerCase().includes(term)
    );
  }, [search, atividades]);

  // ---- Estado de erro ----
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
    <div className="flex flex-col gap-5">
      <div className="view-row flex items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar atividade, setor ou coordenadoria..."
          className="flex-1 font-sans text-[13.5px] py-2 px-3.5 rounded-lg border border-line bg-panel text-ink outline-none focus:border-teal transition-colors"
        />
      </div>

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
