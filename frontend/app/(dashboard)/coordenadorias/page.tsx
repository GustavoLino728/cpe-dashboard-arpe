"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  fetchAtividades,
  extractCoordenadorias,
  Atividade,
} from "@/lib/api";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function CoordenadoriasPage() {
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
        err instanceof Error ? err.message : "Erro ao carregar coordenadorias";
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

  const coordenadorias = useMemo(
    () => extractCoordenadorias(atividades),
    [atividades]
  );

  const coordData = useMemo(() => {
    return coordenadorias.map((c) => {
      const itens = atividades.filter((d) => d.coordenadoria === c);
      const total = itens.length;
      const done = itens.filter((d) => d.status === "ok").length;
      const progress = itens.filter((d) => d.status === "warn").length;
      const late = itens.filter((d) => d.status === "late").length;
      const percent = total ? Math.round((done / total) * 100) : 0;

      return {
        coordenadoria: c,
        total,
        done,
        progress,
        late,
        percent,
      };
    });
  }, [coordenadorias, atividades]);

  // ---- Estado de erro ----
  if (error && !loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <AlertTriangle className="w-10 h-10 text-rose-500" />
        <p className="text-[14px] text-ink-soft text-center max-w-md">
          Não foi possível carregar as coordenadorias.
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

  // ---- Loading skeleton ----
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-[14px] max-xl:grid-cols-2 max-sm:grid-cols-1">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="bg-panel border border-line/30 rounded-custom p-6 animate-pulse"
          >
            <div className="h-4 w-32 bg-line/30 rounded mb-4" />
            <div className="flex flex-col gap-3">
              <div className="h-3 w-full bg-line/20 rounded" />
              <div className="h-3 w-full bg-line/20 rounded" />
              <div className="h-3 w-full bg-line/20 rounded" />
              <div className="h-3 w-full bg-line/20 rounded" />
              <div className="h-3 w-24 bg-line/20 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ---- Estado vazio ----
  if (coordData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <p className="text-[14px] text-ink-soft text-center">
          Nenhuma coordenadoria encontrada.
        </p>
        <p className="text-[12px] text-ink-soft/70 text-center">
          Importe uma planilha para começar a ver os dados.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-5 max-xl:grid-cols-2 max-sm:grid-cols-1">
      {coordData.map((data, idx) => (
        <div
          key={idx}
          className="bg-panel border border-line/30 rounded-custom p-6 transition-all duration-200 flex flex-col justify-between"
        >
          <h3 className="font-display font-semibold text-[14px] text-ink mb-3 select-none">
            {data.coordenadoria}
          </h3>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-[12.5px] text-ink-soft">
              <span>Total de atividades</span>
              <b className="font-mono-kpi text-ink font-semibold">{data.total}</b>
            </div>
            <div className="flex justify-between items-center text-[12.5px] text-ink-soft">
              <span>Concluídas</span>
              <b className="font-mono-kpi text-ink font-semibold text-emerald-600 dark:text-emerald-400">
                {data.done}
              </b>
            </div>
            <div className="flex justify-between items-center text-[12.5px] text-ink-soft">
              <span>Em andamento</span>
              <b className="font-mono-kpi text-ink font-semibold text-amber-600 dark:text-amber-400">
                {data.progress}
              </b>
            </div>
            <div className="flex justify-between items-center text-[12.5px] text-ink-soft">
              <span>Atrasadas</span>
              <b className="font-mono-kpi text-ink font-semibold text-rose-600 dark:text-rose-400">
                {data.late}
              </b>
            </div>
            <div className="flex justify-between items-center text-[12.5px] text-ink-soft border-t border-line/50 pt-2 mt-1">
              <span>% concluído</span>
              <b className="font-mono-kpi text-ink font-semibold text-teal">
                {data.percent}%
              </b>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
