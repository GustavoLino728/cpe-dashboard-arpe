import React from "react";
import { FileSpreadsheet, Upload, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

interface UploadSectionProps {
  uploading: boolean;
  uploadError: string | null;
  uploadSuccess: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  setUploadError: (err: string | null) => void;
  setUploadSuccess: (msg: string | null) => void;
  handleUploadClick: () => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function UploadSection({
  uploading,
  uploadError,
  uploadSuccess,
  fileInputRef,
  setUploadError,
  setUploadSuccess,
  handleUploadClick,
  handleFileChange,
}: UploadSectionProps) {
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
    </div>
  );
}
