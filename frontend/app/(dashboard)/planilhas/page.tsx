"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  RefreshCw,
  Loader2,
} from "lucide-react";
import {
  fetchProjects,
  uploadPlanilha,
  deleteProject,
  ApiProject,
} from "@/lib/api";

export default function PlanilhasPage() {
  // ---- Estado de dados da API ----
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---- Estado de upload ----
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProjects();
      setProjects(data);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao carregar projetos";
      setError(msg);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  // ---- Upload handler ----
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const result = await uploadPlanilha(file);
      setUploadSuccess(
        `Planilha "${file.name}" importada com sucesso! ${result.length} projeto(s) processado(s).`
      );
      // Recarrega a lista de projetos
      await loadData();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao importar planilha";
      setUploadError(msg);
    } finally {
      setUploading(false);
      // Limpar o input para permitir reenvio do mesmo arquivo
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // ---- Delete handler ----
  const handleDelete = async (projectId: string, projectName: string) => {
    if (
      !confirm(
        `Tem certeza que deseja remover o projeto "${projectName}" e todas as suas atividades?`
      )
    ) {
      return;
    }

    try {
      await deleteProject(projectId);
      await loadData();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao remover projeto";
      alert(msg);
    }
  };

  // ---- Formatação de data ----
  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Topo com botão */}
      <div className="flex justify-between items-center gap-3 flex-wrap">
        <h2 className="font-display font-bold text-[18px] text-ink select-none">
          Importação de Planilhas
        </h2>
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={handleUploadClick}
            disabled={uploading}
            className="flex items-center gap-2 font-sans text-[13px] font-semibold text-white bg-teal rounded-lg py-2 px-4 cursor-pointer hover:bg-teal/90 active:scale-[0.98] transition-all duration-150 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {uploading ? "Importando..." : "Importar nova planilha"}
          </button>
        </div>
      </div>

      {/* Feedback de upload */}
      {uploadSuccess && (
        <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/30 rounded-lg p-3 text-[13px] text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {uploadSuccess}
          <button
            onClick={() => setUploadSuccess(null)}
            className="ml-auto text-emerald-600 dark:text-emerald-500 hover:text-emerald-800 dark:hover:text-emerald-300 text-[18px] leading-none cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {uploadError && (
        <div className="flex items-center gap-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/30 rounded-lg p-3 text-[13px] text-rose-700 dark:text-rose-400">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {uploadError}
          <button
            onClick={() => setUploadError(null)}
            className="ml-auto text-rose-600 dark:text-rose-500 hover:text-rose-800 dark:hover:text-rose-300 text-[18px] leading-none cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Grid de Informação de Upload */}
      <section className="bg-panel border border-line/30 rounded-custom p-6 transition-all duration-200">
        <div className="flex items-start gap-4">
          <div className="w-[42px] h-[42px] rounded-[10px] bg-emerald-100 dark:bg-emerald-950/30 text-[#3E8E6D] flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-display font-semibold text-[13.5px] text-ink mb-1">
              Instruções de Importação
            </h4>
            <p className="text-[12.5px] text-ink-soft leading-relaxed max-w-[700px]">
              O sistema lê arquivos Excel (.xlsx ou .xls). Cada <b>aba</b> da
              planilha será interpretada como um <b>projeto</b>, e cada linha de
              dados como uma <b>atividade</b>. O cabeçalho deve conter colunas
              como &quot;Descrição Resumida&quot;, &quot;SEI&quot;, &quot;Setor
              Responsável&quot;, &quot;Data Início&quot;, &quot;Prazo
              Final&quot;, &quot;Status&quot; e &quot;Observações&quot;.
            </p>
          </div>
        </div>
      </section>

      {/* Erro de carregamento geral */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center gap-4 py-10">
          <AlertTriangle className="w-10 h-10 text-rose-500" />
          <p className="text-[14px] text-ink-soft text-center max-w-md">
            Não foi possível carregar os projetos importados.
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
      )}

      {/* Tabela de projetos importados */}
      <section className="bg-panel border border-line/30 rounded-custom p-6 transition-all duration-200 overflow-x-auto">
        <h3 className="font-display font-semibold text-[13.5px] text-ink mb-4 select-none">
          Projetos Importados
        </h3>

        {loading ? (
          <div className="h-[180px] animate-pulse flex items-center justify-center text-[11px] text-ink-soft">
            Carregando projetos...
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center text-ink-soft py-8 text-[13px]">
            Nenhum projeto importado ainda. Use o botão acima para importar uma
            planilha.
          </div>
        ) : (
          <table className="w-full border-collapse text-[12.5px] text-left text-ink min-w-[650px]">
            <thead>
              <tr className="border-b border-line">
                <th className="text-[10.5px] uppercase tracking-wider text-ink-soft pb-[10px] font-semibold">
                  Projeto (Aba)
                </th>
                <th className="text-[10.5px] uppercase tracking-wider text-ink-soft pb-[10px] font-semibold">
                  Atividades
                </th>
                <th className="text-[10.5px] uppercase tracking-wider text-ink-soft pb-[10px] font-semibold">
                  Última Atualização
                </th>
                <th className="text-[10.5px] uppercase tracking-wider text-ink-soft pb-[10px] font-semibold">
                  Status
                </th>
                <th className="text-[10.5px] uppercase tracking-wider text-ink-soft pb-[10px] font-semibold text-right">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {projects.map((proj) => (
                <tr
                  key={proj.id}
                  className="border-b border-line last:border-0 hover:bg-bg/40 transition-colors"
                >
                  <td className="py-3 pr-2 font-medium font-mono-kpi text-ink">
                    {proj.name}
                  </td>
                  <td className="py-3 pr-2 font-mono-kpi">
                    {proj.activities.length}
                  </td>
                  <td className="py-3 pr-2 font-mono-kpi text-ink-soft">
                    {formatDate(proj.updated_at)}
                  </td>
                  <td className="py-3 pr-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 select-none">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Processado
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => handleDelete(proj.id, proj.name)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/30 transition-all cursor-pointer"
                      title={`Remover projeto ${proj.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
