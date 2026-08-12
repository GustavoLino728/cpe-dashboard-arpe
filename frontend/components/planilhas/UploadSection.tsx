import React from "react";
import { FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2, RefreshCw, HelpCircle } from "lucide-react";

interface UploadSectionProps {
  uploading: boolean;
  uploadError: string | null;
  uploadSuccess: string | null;
  setUploadError: (err: string | null) => void;
  setUploadSuccess: (msg: string | null) => void;
  handleSync: () => void;
}

export function UploadSection({
  uploading,
  uploadError,
  uploadSuccess,
  setUploadError,
  setUploadSuccess,
  handleSync,
}: UploadSectionProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* Topo com título e Botão de Sincronização */}
      <div className="flex justify-between items-center gap-4 bg-panel border border-line/30 rounded-custom p-6 transition-all duration-200 shadow-sm flex-wrap">
        <div className="flex flex-col gap-1 min-w-[280px]">
          <h2 className="font-display font-bold text-[18px] text-ink select-none flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal animate-pulse" />
            Sincronização com Google Sheets
          </h2>
          <p className="text-[12.5px] text-ink-soft select-none">
            Importe projetos e atividades em tempo real a partir da planilha configurada no servidor.
          </p>
        </div>

        <button
          onClick={handleSync}
          disabled={uploading}
          className="flex items-center justify-center gap-2 font-sans text-[13.5px] font-semibold text-white bg-teal rounded-lg py-2.5 px-6 cursor-pointer hover:bg-teal/90 active:scale-[0.98] transition-all duration-150 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {uploading ? "Sincronizando..." : "Sincronizar Planilha"}
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
        <div className="flex items-start gap-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/30 rounded-lg p-3 text-[13px] text-rose-700 dark:text-rose-450 shadow-sm animate-in fade-in slide-in-from-top-1 duration-200">
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
                O link da planilha oficial do Google Sheets é gerenciado e configurado diretamente no servidor através de variáveis de ambiente de forma segura.
              </p>
              <ul className="list-disc list-inside pl-1 flex flex-col gap-1 text-[12px] text-ink-soft/95">
                <li>O servidor conecta-se à planilha por meio de uma credencial de robô (Conta de Serviço).</li>
                <li>Qualquer alteração na planilha oficial pode ser importada clicando no botão <b>Sincronizar Planilha</b> acima.</li>
                <li>O sistema processa cada <b>aba</b> da planilha como um <b>projeto</b> e cada linha de dados como uma <b>atividade</b>.</li>
              </ul>
              <p className="mt-1 text-[11.5px] italic text-ink-soft/80">
                Nota: As colunas necessárias e o mapeamento dos campos (ex: &quot;Descrição Resumida&quot;, &quot;SEI&quot;, &quot;Setor Responsável&quot;, &quot;Status&quot;) permanecem idênticos aos anteriores.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
