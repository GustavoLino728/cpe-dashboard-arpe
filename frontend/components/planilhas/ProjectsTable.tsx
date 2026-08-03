import React from "react";
import { CheckCircle2, Trash2 } from "lucide-react";
import { ApiProject } from "@/lib/api";

interface ProjectsTableProps {
  loading: boolean;
  projects: ApiProject[];
  handleDelete: (projectId: string, projectName: string) => Promise<void>;
}

export function ProjectsTable({
  loading,
  projects,
  handleDelete,
}: ProjectsTableProps) {
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
  );
}
