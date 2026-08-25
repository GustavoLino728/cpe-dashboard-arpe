"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ExternalLink, Link as LinkIcon, RefreshCw, Save } from "lucide-react";
import { ContractLink, fetchContractLinks, saveContractLink } from "@/lib/api";

export default function ContratosPage() {
  const [contracts, setContracts] = useState<ContractLink[]>([]);
  const [draftUrls, setDraftUrls] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadContracts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchContractLinks();
      setContracts(data);
      setDraftUrls(
        Object.fromEntries(
          data.map((item) => [buildContractKey(item.project_id, item.contract), item.url ?? ""])
        )
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao carregar contratos";
      setError(msg);
      setContracts([]);
      setDraftUrls({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  const linkedCount = useMemo(
    () => contracts.filter((item) => item.url && item.url.trim()).length,
    [contracts]
  );

  const handleSave = async (item: ContractLink) => {
    const key = buildContractKey(item.project_id, item.contract);
    const url = (draftUrls[key] ?? "").trim();

    if (!url) {
      alert("Informe o link do Google Drive antes de salvar.");
      return;
    }

    setSavingKey(key);
    try {
      await saveContractLink({
        project_id: item.project_id,
        contract: item.contract,
        url,
      });
      await loadContracts();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar link";
      alert(msg);
    } finally {
      setSavingKey(null);
    }
  };

  if (error && !loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <AlertTriangle className="w-10 h-10 text-rose-500" />
        <p className="text-[14px] text-ink-soft text-center max-w-md">
          Não foi possível carregar os contratos.
          <br />
          <span className="text-[12px] text-ink-soft/70">{error}</span>
        </p>
        <button
          onClick={loadContracts}
          className="flex items-center gap-2 font-sans text-[13px] font-semibold text-white bg-teal rounded-lg py-2 px-4 cursor-pointer hover:bg-teal/90 active:scale-[0.98] transition-all duration-150 shadow-sm"
        >
          <RefreshCw className="w-4 h-4" /> Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <LinkIcon className="w-5 h-5 text-ink-soft" />
          <div>
            <h2 className="font-display font-bold text-[18px] text-ink">
              Contratos
            </h2>
            <p className="text-[12.5px] text-ink-soft">
              {linkedCount} de {contracts.length} contratos com link cadastrado
            </p>
          </div>
        </div>
        <button
          onClick={loadContracts}
          className="flex items-center gap-2 font-sans text-[13px] font-semibold text-teal hover:text-teal/80 border border-teal/20 hover:border-teal/40 rounded-lg py-2 px-4 cursor-pointer hover:bg-teal/5 transition-all duration-150 shadow-sm"
        >
          <RefreshCw className="w-4 h-4" /> Atualizar
        </button>
      </div>

      <div className="bg-panel border border-line/30 rounded-custom p-6 transition-all duration-200 overflow-x-auto w-full">
        {loading ? (
          <div className="h-[280px] animate-pulse flex items-center justify-center text-[11px] text-ink-soft">
            Carregando contratos...
          </div>
        ) : (
          <table className="w-full border-collapse text-[12.5px] text-left text-ink min-w-[860px]">
            <thead>
              <tr className="border-b border-line select-none">
                <th className="text-[10.5px] uppercase tracking-wider text-ink-soft pb-[10px] font-semibold">
                  Projeto
                </th>
                <th className="text-[10.5px] uppercase tracking-wider text-ink-soft pb-[10px] font-semibold">
                  Contrato
                </th>
                <th className="text-[10.5px] uppercase tracking-wider text-ink-soft pb-[10px] font-semibold">
                  Atividades
                </th>
                <th className="text-[10.5px] uppercase tracking-wider text-ink-soft pb-[10px] font-semibold">
                  Link do Google Drive
                </th>
                <th className="text-[10.5px] uppercase tracking-wider text-ink-soft pb-[10px] font-semibold text-right">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((item) => {
                const key = buildContractKey(item.project_id, item.contract);
                const draftUrl = draftUrls[key] ?? "";
                const isSaving = savingKey === key;

                return (
                  <tr
                    key={key}
                    className="border-b border-line last:border-0 hover:bg-bg/40 transition-colors"
                  >
                    <td className="py-3 pr-3 font-medium">{item.project_name}</td>
                    <td className="py-3 pr-3 font-mono-kpi text-ink-soft">{item.contract}</td>
                    <td className="py-3 pr-3 font-mono-kpi">{item.activities_count}</td>
                    <td className="py-3 pr-3">
                      <input
                        type="url"
                        value={draftUrl}
                        onChange={(e) =>
                          setDraftUrls((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        placeholder="https://drive.google.com/..."
                        className="w-full font-sans text-[13px] py-2 px-3 rounded-lg border border-line bg-panel text-ink outline-none focus:border-teal transition-colors"
                      />
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-2">
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-[34px] w-[34px] flex items-center justify-center rounded-lg border border-line text-ink-soft hover:text-teal hover:border-teal/40 transition-colors"
                            title="Abrir contrato"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => handleSave(item)}
                          disabled={isSaving}
                          className="h-[34px] px-3 flex items-center gap-2 font-sans text-[12.5px] font-semibold text-white bg-teal rounded-lg cursor-pointer hover:bg-teal/90 disabled:opacity-60 disabled:cursor-wait transition-all"
                        >
                          <Save className="w-4 h-4" />
                          {isSaving ? "Salvando" : "Salvar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {contracts.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-ink-soft py-6 font-medium">
                    Nenhum contrato encontrado nas atividades importadas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function buildContractKey(projectId: string, contract: string) {
  return `${projectId}::${contract}`;
}
