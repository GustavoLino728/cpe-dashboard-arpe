import {
  ApiProject,
  ApiProjectSummary,
  ApiPhaseStatus,
  ApiSectorLoad,
  ApiSectorStatus,
  ApiCriticalActivity,
  ApiTimelineEvent,
  Atividade,
} from "./api-types";
import { mapApiToAtividade } from "./api-utils";

export * from "./api-types";
export * from "./api-utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001";

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
      },
    });

    if (!res.ok) {
      let detail = res.statusText;
      try {
        const body = await res.json();
        detail = body.detail ?? detail;
      } catch {}
      throw new ApiError(detail, res.status);
    }

    if (res.status === 204) return undefined as unknown as T;

    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError("Não foi possível conectar ao servidor de API.", 503);
  }
}

export async function fetchAtividades(): Promise<Atividade[]> {
  const projects = await apiFetch<ApiProject[]>("/api/v1/projects");
  return projects.flatMap((proj) =>
    proj.activities.map((act) => mapApiToAtividade(act))
  );
}

export async function fetchProjects(): Promise<ApiProject[]> {
  return apiFetch<ApiProject[]>("/api/v1/projects");
}

export async function uploadPlanilha(file: File): Promise<ApiProject[]> {
  const formData = new FormData();
  formData.append("file", file);

  return apiFetch<ApiProject[]>("/api/v1/projects/upload", {
    method: "POST",
    body: formData,
  });
}

export async function deleteProject(projectId: string): Promise<void> {
  await apiFetch<void>(`/api/v1/projects/${projectId}`, {
    method: "DELETE",
  });
}

export async function fetchDashboardSummary(
  project: string
): Promise<ApiProjectSummary> {
  return apiFetch<ApiProjectSummary>(
    `/api/dashboard/projetos/${encodeURIComponent(project)}/resumo`
  );
}

export async function fetchDashboardPhases(
  project: string
): Promise<ApiPhaseStatus[]> {
  return apiFetch<ApiPhaseStatus[]>(
    `/api/dashboard/projetos/${encodeURIComponent(project)}/fases`
  );
}

export async function fetchDashboardSectors(
  project: string
): Promise<ApiSectorLoad[]> {
  return apiFetch<ApiSectorLoad[]>(
    `/api/dashboard/projetos/${encodeURIComponent(project)}/setores`
  );
}

export async function fetchDashboardSectorsStatus(
  project: string
): Promise<ApiSectorStatus[]> {
  return apiFetch<ApiSectorStatus[]>(
    `/api/dashboard/projetos/${encodeURIComponent(project)}/setores-status`
  );
}

export async function fetchDashboardCritical(
  project: string,
  dias = 7
): Promise<ApiCriticalActivity[]> {
  return apiFetch<ApiCriticalActivity[]>(
    `/api/dashboard/projetos/${encodeURIComponent(project)}/atividades-criticas?dias=${dias}`
  );
}

export async function fetchDashboardTimeline(
  project: string
): Promise<ApiTimelineEvent[]> {
  return apiFetch<ApiTimelineEvent[]>(
    `/api/dashboard/projetos/${encodeURIComponent(project)}/timeline`
  );
}
