import { useState, useEffect, useCallback } from "react";
import {
  fetchProjects,
  syncGoogleSheets,
  deleteProject as deleteProjectApi,
  ApiProject,
} from "@/lib/api";

export function usePlanilhasData() {
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false); // keeping name 'uploading' to match parent state/UI spinner naming safely
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

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
    loadData();
  }, [loadData]);

  const handleSync = async () => {
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const result = await syncGoogleSheets();
      setUploadSuccess(
        `Planilha sincronizada com sucesso! ${result.length} projeto(s) processado(s).`
      );
      await loadData();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao sincronizar planilha";
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (projectId: string, projectName: string) => {
    if (
      !confirm(
        `Tem certeza que deseja remover o projeto "${projectName}" e todas as suas atividades?`
      )
    ) {
      return;
    }

    try {
      await deleteProjectApi(projectId);
      await loadData();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao remover projeto";
      alert(msg);
    }
  };

  return {
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
  };
}
