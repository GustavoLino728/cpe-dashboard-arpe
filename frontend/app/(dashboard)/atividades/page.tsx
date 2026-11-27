"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ActivityTable } from "@/components/ActivityTable";
import {
  ActivityFiltersSidebar,
  ActiveFilterChips,
  ActiveFilterChipItem,
} from "@/components/atividades/ActivityFiltersSidebar";
import { ActivitySummaryStrip } from "@/components/atividades/ActivitySummaryStrip";
import {
  fetchPaginatedAtividades,
  ActivityKpis,
  Atividade,
} from "@/lib/api";
import { AlertTriangle, RefreshCw } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  pending: "A Iniciar",
  warn: "Em andamento",
  ok: "Concluído",
  late: "Atrasado",
};

function formatMonthLabel(isoMonth: string): string {
  const [year, month] = isoMonth.split("-");
  if (!year || !month) return isoMonth;
  return `${month}/${year}`;
}

export default function AtividadesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Fonte única de verdade via URL (compartilhável e reativa a cliques vindos da Visão geral)
  const selectedMrae = searchParams.get("mrae") || "todos";
  const selectedInstrumento = searchParams.get("instrumento") || "todos";
  const mesInicial = searchParams.get("mes_inicial") || "";
  const mesFinal = searchParams.get("mes_final") || "";
  const selectedExecutor =
    searchParams.get("executor") || searchParams.get("coordenadoria") || "todos";
  const selectedProject = searchParams.get("project") || "todos";
  const selectedStatus = searchParams.get("status") || "todos";
  const selectedPrazo = searchParams.get("prazo") || "todos";
  const selectedResponsavel = searchParams.get("responsavel") || "";
  const activityIdParam = searchParams.get("activity_id") || "";
  const urlSearch =
    searchParams.get("search") || searchParams.get("activity_search") || "";

  const [searchInput, setSearchInput] = useState(urlSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(urlSearch);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [kpis, setKpis] = useState<ActivityKpis>({
    total: 0,
    concluidas: 0,
    atrasadas: 0,
    em_andamento: 0,
    a_iniciar: 0,
  });
  const [mraes, setMraes] = useState<string[]>([]);
  const [instrumentos, setInstrumentos] = useState<string[]>([]);
  const [executores, setExecutores] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const latestRequestId = useRef(0);

  const limit = 15;

  // Debounce de 300ms apenas para o input textual
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch((prev) => {
        if (prev !== searchInput) {
          setPage(1);
        }
        return searchInput;
      });
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const updateUrlFilters = useCallback(
    (overrides: Partial<Record<string, string>>) => {
      const next = new URLSearchParams();
      const merged = {
        mrae: overrides.mrae ?? selectedMrae,
        instrumento: overrides.instrumento ?? selectedInstrumento,
        mes_inicial: overrides.mes_inicial ?? mesInicial,
        mes_final: overrides.mes_final ?? mesFinal,
        executor: overrides.executor ?? selectedExecutor,
        project: overrides.project ?? selectedProject,
        status: overrides.status ?? selectedStatus,
        prazo: overrides.prazo ?? selectedPrazo,
        responsavel: overrides.responsavel ?? selectedResponsavel,
        search: overrides.search ?? searchInput,
      };

      if (merged.mrae && merged.mrae !== "todos") next.set("mrae", merged.mrae);
      if (merged.instrumento && merged.instrumento !== "todos")
        next.set("instrumento", merged.instrumento);
      if (merged.mes_inicial) next.set("mes_inicial", merged.mes_inicial);
      if (merged.mes_final) next.set("mes_final", merged.mes_final);
      if (merged.executor && merged.executor !== "todos" && merged.executor !== "todas")
        next.set("executor", merged.executor);
      if (merged.project && merged.project !== "todos")
        next.set("project", merged.project);
      if (merged.status && merged.status !== "todos") next.set("status", merged.status);
      if (merged.prazo && merged.prazo !== "todos") next.set("prazo", merged.prazo);
      if (merged.responsavel) next.set("responsavel", merged.responsavel);
      if (merged.search.trim()) next.set("search", merged.search.trim());

      setPage(1);
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [
      pathname,
      router,
      selectedMrae,
      selectedInstrumento,
      mesInicial,
      mesFinal,
      selectedExecutor,
      selectedProject,
      selectedStatus,
      selectedPrazo,
      selectedResponsavel,
      searchInput,
    ]
  );

  useEffect(() => {
    const requestId = latestRequestId.current + 1;
    latestRequestId.current = requestId;

    const queryPromise = (async () => {
      setLoading(true);
      setError(null);
      const data = await fetchPaginatedAtividades({
        page,
        limit,
        activityId: activityIdParam,
        search: activityIdParam ? "" : debouncedSearch,
        mrae: selectedMrae,
        instrumento: selectedInstrumento,
        mes_inicial: mesInicial,
        mes_final: mesFinal,
        executor: selectedExecutor,
        project: selectedProject,
        status: selectedStatus,
        prazo: selectedPrazo,
        responsavel: selectedResponsavel,
      });

      if (activityIdParam && data.total === 0 && urlSearch) {
        return fetchPaginatedAtividades({
          page: 1,
          limit,
          search: urlSearch,
          responsavel: selectedResponsavel,
        });
      }
      return data;
    })();

    queryPromise
      .then((data) => {
        if (requestId !== latestRequestId.current) return;
        setAtividades(data.activities);
        setTotal(data.total);
        setKpis(data.kpis);
        setMraes(data.mraes);
        setInstrumentos(data.instrumentos);
        setExecutores(data.executores);
      })
      .catch((err) => {
        if (requestId !== latestRequestId.current) return;
        const msg =
          err instanceof Error ? err.message : "Erro ao carregar atividades";
        setError(msg);
        setAtividades([]);
      })
      .finally(() => {
        if (requestId !== latestRequestId.current) return;
        setLoading(false);
      });
  }, [
    page,
    debouncedSearch,
    selectedMrae,
    selectedInstrumento,
    mesInicial,
    mesFinal,
    selectedExecutor,
    selectedProject,
    selectedStatus,
    selectedPrazo,
    selectedResponsavel,
    activityIdParam,
    urlSearch,
    reloadNonce,
  ]);

  const resetFilters = useCallback(() => {
    setSearchInput("");
    setDebouncedSearch("");
    setPage(1);
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  const handleSearchChange = useCallback((val: string) => {
    setSearchInput(val);
    setPage(1);
  }, []);

  const activeChips = useMemo<ActiveFilterChipItem[]>(() => {
    const chips: ActiveFilterChipItem[] = [];
    if (selectedMrae !== "todos") {
      chips.push({
        key: "mrae",
        label: `MRAE: ${selectedMrae}`,
        onRemove: () => updateUrlFilters({ mrae: "todos" }),
      });
    }
    if (selectedInstrumento !== "todos") {
      chips.push({
        key: "instrumento",
        label: `Instrumento: ${selectedInstrumento}`,
        onRemove: () => updateUrlFilters({ instrumento: "todos" }),
      });
    }
    if (mesInicial) {
      chips.push({
        key: "mes_inicial",
        label: `Mês inicial: ${formatMonthLabel(mesInicial)}`,
        onRemove: () => updateUrlFilters({ mes_inicial: "" }),
      });
    }
    if (mesFinal) {
      chips.push({
        key: "mes_final",
        label: `Mês final: ${formatMonthLabel(mesFinal)}`,
        onRemove: () => updateUrlFilters({ mes_final: "" }),
      });
    }
    if (selectedExecutor !== "todos" && selectedExecutor !== "todas") {
      chips.push({
        key: "executor",
        label: `Executor: ${selectedExecutor}`,
        onRemove: () => updateUrlFilters({ executor: "todos" }),
      });
    }
    if (selectedStatus !== "todos") {
      chips.push({
        key: "status",
        label: `Status: ${STATUS_LABELS[selectedStatus] ?? selectedStatus}`,
        onRemove: () => updateUrlFilters({ status: "todos" }),
      });
    }
    if (selectedPrazo !== "todos") {
      chips.push({
        key: "prazo",
        label: `Prazo: próximos ${selectedPrazo} dias`,
        onRemove: () => updateUrlFilters({ prazo: "todos" }),
      });
    }
    if (selectedProject !== "todos") {
      chips.push({
        key: "project",
        label: `Aba/Projeto: ${selectedProject}`,
        onRemove: () => updateUrlFilters({ project: "todos" }),
      });
    }
    if (selectedResponsavel) {
      chips.push({
        key: "responsavel",
        label: `Área: ${selectedResponsavel}`,
        onRemove: () => updateUrlFilters({ responsavel: "" }),
      });
    }
    if (searchInput.trim()) {
      chips.push({
        key: "search",
        label: `Busca: "${searchInput.trim()}"`,
        onRemove: () => {
          setSearchInput("");
          setDebouncedSearch("");
          updateUrlFilters({ search: "" });
        },
      });
    }
    return chips;
  }, [
    selectedMrae,
    selectedInstrumento,
    mesInicial,
    mesFinal,
    selectedExecutor,
    selectedStatus,
    selectedPrazo,
    selectedProject,
    selectedResponsavel,
    searchInput,
    updateUrlFilters,
  ]);

  const hasActiveFilters = activeChips.length > 0 || Boolean(activityIdParam);

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
          onClick={() => setReloadNonce((n) => n + 1)}
          className="flex items-center gap-2 font-sans text-[13px] font-semibold text-white bg-teal rounded-lg py-2 px-4 cursor-pointer hover:bg-teal/90 active:scale-[0.98] transition-all duration-150 shadow-sm"
        >
          <RefreshCw className="w-4 h-4" /> Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-5 items-start">
      {/* Barra Lateral de Filtros */}
      <ActivityFiltersSidebar
        filters={{
          search: searchInput,
          mrae: selectedMrae,
          instrumento: selectedInstrumento,
          mesInicial,
          mesFinal,
          executor: selectedExecutor,
          status: selectedStatus,
          prazo: selectedPrazo,
          project: selectedProject,
          responsavel: selectedResponsavel,
        }}
        mraes={mraes}
        instrumentos={instrumentos}
        executores={executores}
        hasActiveFilters={hasActiveFilters}
        onSearchChange={handleSearchChange}
        onMraeChange={(val) => updateUrlFilters({ mrae: val })}
        onInstrumentoChange={(val) => updateUrlFilters({ instrumento: val })}
        onMesInicialChange={(val) => updateUrlFilters({ mes_inicial: val })}
        onMesFinalChange={(val) => updateUrlFilters({ mes_final: val })}
        onExecutorChange={(val) => updateUrlFilters({ executor: val })}
        onStatusChange={(val) => updateUrlFilters({ status: val })}
        onClearAll={resetFilters}
      />

      {/* Área Principal: Faixa Compacta de 5 KPIs + Chips + Tabela */}
      <div className="flex-1 min-w-0 w-full flex flex-col gap-4">
        <ActivitySummaryStrip
          kpis={kpis}
          loading={loading}
          activeStatus={selectedStatus}
          onSelectStatus={(val) => updateUrlFilters({ status: val })}
        />

        <ActiveFilterChips chips={activeChips} onClearAll={resetFilters} />

        <div className="flex items-center justify-between px-1">
          <h2 className="font-display font-semibold text-[13.5px] text-ink select-none">
            {activityIdParam
              ? "Atividade referenciada"
              : "Ações de Monitoramento"}
          </h2>
          {loading && (
            <span className="text-[12px] text-ink-soft" id="loadingNote">
              Atualizando recorte...
            </span>
          )}
        </div>

        {loading ? (
          <div className="bg-panel border border-line/35 rounded-custom p-6 h-[320px] animate-pulse flex items-center justify-center text-[12px] text-ink-soft">
            Carregando atividades...
          </div>
        ) : (
          <ActivityTable activities={atividades} />
        )}

        {/* Paginação */}
        {total > limit && (
          <div className="flex items-center justify-between border-t border-line/30 pt-4 px-1 select-none flex-wrap gap-3">
            <span className="text-[12px] text-ink-soft">
              Mostrando{" "}
              <span className="font-semibold text-ink">
                {(page - 1) * limit + 1}
              </span>{" "}
              a{" "}
              <span className="font-semibold text-ink">
                {Math.min(page * limit, total)}
              </span>{" "}
              de <span className="font-semibold text-ink">{total}</span> ações
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
    </div>
  );
}
