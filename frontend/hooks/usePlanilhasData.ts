import { useState, useEffect, useRef, useCallback } from "react";
import {
  fetchProjects,
  uploadPlanilha,
  deleteProject as deleteProjectApi,
  ApiProject,
} from "@/lib/api";

export function usePlanilhasData() {
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    loadData();
  }, [loadData]);

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
      await loadData();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao importar planilha";
      setUploadError(msg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
    fileInputRef,
    setUploadError,
    setUploadSuccess,
    loadData,
    handleUploadClick,
    handleFileChange,
    handleDelete,
  };
}
