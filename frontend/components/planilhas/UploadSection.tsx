import React from "react";
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  HelpCircle,
  Clock,
} from "lucide-react";
import { ApiSyncStatus } from "@/lib/api";

interface UploadSectionProps {
  uploading: boolean;
  uploadError: string | null;
  uploadSuccess: string | null;
  syncStatus: ApiSyncStatus | null;
  cooldownRemaining: number;
  setUploadError: (err: string | null) => void;
  setUploadSuccess: (msg: string | null) => void;
  handleSync: () => void;
}

function formatSyncTimestamp(iso?: string | null): string {
  if (!iso) return "Nenhuma sincronização registrada";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function UploadSection({
  uploading,
  uploadError,
  uploadSuccess,
  syncStatus,
  cooldownRemaining,
  setUploadError,
  setUploadSuccess,
  handleSync,
}: UploadSectionProps) {
  const isBlockedByCooldown = cooldownRemaining > 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Topo com título e Botão de Sincronização */}
      <div className="flex justify-between items-center gap-4 bg-panel border border-line/30 rounded-custom p-6 transition-all duration-200 shadow-sm flex-wrap">
        <div className="flex flex-col gap-1.5 min-w-[280px]">
          <h2 className="font-display font-bold text-[18px] text-ink select-none flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal animate-pulse" />
            Sincronização com Google Sheets
          </h2>
          <p className="text-[12.5px] text-ink-soft select-none">
            Importe e atualize a aba oficial Concessão a partir da planilha configurada no servidor.
          </p>
          {syncStatus && (
            <p className="text-[11.5px] text-ink-soft/85 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-teal" />
              <span>
                Última carga:{" "}
                <strong className="font-medium text-ink">
                  {formatSyncTimestamp(syncStatus.last_sync_at)}
                </strong>
                {syncStatus.last_sync_items != null && (
                  <> ({syncStatus.last_sync_items} ações)</>
                )}
              </span>
            </p>
          )}
        </div>

        <button
          onClick={handleSync}
          disabled={uploading || isBlockedByCooldown}
          title={
            isBlockedByCooldown
              ? `Cooldown manual de ${syncStatus?.cooldown_seconds ?? 60}s ativo. Aguarde ${cooldownRemaining}s.`
              : "Sincronizar planilha agora"
          }
          className="flex items-center justify-center gap-2 font-sans text-[13.5px] font-semibold text-white bg-teal rounded-lg py-2.5 px-6 cursor-pointer hover:bg-teal/90 active:scale-[0.98] transition-all duration-150 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {uploading
            ? "Sincronizando..."
            : isBlockedByCooldown
              ? `Aguarde ${cooldownRemaining}s`
              : "Sincronizar Planilha"}
        </button>
      </div>

      {/* Feedback de upload/sincronização */}
      {uploadSuccess && (
        <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30 rounded-lg p-3 text-[13px] text-emerald-700 dark:text-emerald-400 shadow-sm animate-in fade-in slide-in-from-top-1 duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span className="flex-1 font-medium">{uploadSuccess}</span>
          <button
            onClick={() => setUploadSuccess(null)}
            className="text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 text-[18px] leading-none cursor-pointer p-1 rounded-md hover:bg-emerald-100/50 dark:hover:bg-emerald-950/50 transition-colors"
          >
            ×
          </button>
        </div>
      )}

      {uploadError && (
        <div className="flex items-start gap-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/30 rounded-lg p-3 text-[13px] text-rose-700 dark:text-rose-400 shadow-sm animate-in fade-in slide-in-from-top-1 duration-200">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
          <span className="flex-1 font-medium">{uploadError}</span>
          <button
            onClick={() => setUploadError(null)}
            className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-300 text-[18px] leading-none cursor-pointer p-1 rounded-md hover:bg-rose-100/50 dark:hover:bg-rose-950/50 transition-colors"
          >
            ×
          </button>
        </div>
      )}

      {/* Grid de Informação de Configuração do Google Sheets */}
      <section className="bg-panel border border-line/30 rounded-custom p-6 shadow-sm transition-all duration-200">
        <div className="flex items-start gap-4">
          <div className="w-[42px] h-[42px] rounded-[10px] bg-emerald-100/60 dark:bg-emerald-950/30 text-[#3E8E6D] flex items-center justify-center shrink-0 shadow-inner">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div className="flex flex-col gap-2">
            <h4 className="font-display font-semibold text-[14px] text-ink flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-ink-soft/60" /> Como funciona a sincronização?
            </h4>
            <div className="text-[12.5px] text-ink-soft leading-relaxed max-w-[750px] flex flex-col gap-1.5">
              <p>
                O link da planilha oficial do Google Sheets é gerenciado diretamente no servidor através de variáveis de ambiente seguras.
              </p>
              <ul className="list-disc list-inside pl-1 flex flex-col gap-1 text-[12px] text-ink-soft/95">
                <li>A conexão utiliza Conta de Serviço ou chave API configurada no backend.</li>
                <li>O sistema processa a aba <b>Concessão</b> preservando o histórico de notificações (Upsert idempotente).</li>
                <li>Para proteger a cota da API do Google, cliques manuais respeitam um intervalo mínimo de <b>60 segundos</b>.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
