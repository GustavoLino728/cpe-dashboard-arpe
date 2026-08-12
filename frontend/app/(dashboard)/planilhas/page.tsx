"use client";

import React from "react";
import { usePlanilhasData } from "@/hooks/usePlanilhasData";
import { UploadSection } from "@/components/planilhas/UploadSection";
import { ProjectsTable } from "@/components/planilhas/ProjectsTable";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function PlanilhasPage() {
  const {
    projects,
    loading,
    error,
    uploading,
    uploadError,
    uploadSuccess,
    setUploadError,
    setUploadSuccess,
    loadData,
    handleSync,
    handleDelete,
  } = usePlanilhasData();

  return (
    <div className="flex flex-col gap-5">
      {/* Upload and feedback section */}
      <UploadSection
        uploading={uploading}
        uploadError={uploadError}
        uploadSuccess={uploadSuccess}
        setUploadError={setUploadError}
        setUploadSuccess={setUploadSuccess}
        handleSync={handleSync}
      />

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
      <ProjectsTable
        loading={loading}
        projects={projects}
        handleDelete={handleDelete}
      />
    </div>
  );
}
