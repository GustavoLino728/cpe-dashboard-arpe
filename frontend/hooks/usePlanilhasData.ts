import { useState, useEffect, useCallback } from "react";
import {
  fetchProjects,
  fetchSyncStatus,
  syncGoogleSheets,
  deleteProject as deleteProjectApi,
  ApiError,
  ApiProject,
  ApiSyncStatus,
} from "@/lib/api";

export function usePlanilhasData() {
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<ApiSyncStatus | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const loadSyncStatus = useCallback(async () => {
    try {
      const status = await fetchSyncStatus();
      setSyncStatus(status);
      setCooldownRemaining(
        status.can_sync_now ? 0 : Math.max(0, status.retry_after_seconds)
      );
    } catch {
      // Usuário sem sessão ativa ou erro transitório não bloqueia a lista de projetos
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data] = await Promise.all([fetchProjects(), loadSyncStatus()]);
      setProjects(data);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao carregar projetos";
      setError(msg);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [loadSyncStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const timer = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  const handleSync = async () => {
    if (cooldownRemaining > 0) {
      setUploadError(
        `Sincronização manual realizada recentemente. Aguarde ${cooldownRemaining}s para sincronizar novamente.`
      );
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const result = await syncGoogleSheets();
      const totalItems = result.reduce(
        (acc, proj) => acc + proj.activities.length,
        0
      );
      setUploadSuccess(
        `Planilha sincronizada com sucesso! ${result.length} aba(s) e ${totalItems} atividade(s) processada(s).`
      );
      await loadData();
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 429) {
        const waitSeconds = err.retryAfterSeconds ?? 60;
        setCooldownRemaining(waitSeconds);
        setUploadError(err.message);
      } else {
        const msg =
          err instanceof Error ? err.message : "Erro ao sincronizar planilha";
        setUploadError(msg);
      }
      await loadSyncStatus();
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
    syncStatus,
    cooldownRemaining,
    setUploadError,
    setUploadSuccess,
    loadData,
    handleSync,
    handleDelete,
  };
}
