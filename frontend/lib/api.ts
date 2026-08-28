import {
  ApiProject,
  ApiProjectSimple,
  ApiProjectSummary,
  ApiPhaseStatus,
  ApiSectorLoad,
  ApiSectorStatus,
  ApiCriticalActivity,
  ApiTimelineEvent,
  Atividade,
  ApiUser,
  ApiUserCreate,
  ApiUserUpdate,
  ApiCoordenadoria,
  ApiCoordenadoriaCreate,
  ApiCoordenadoriaUpdate,
  ApiActivity,
  ApiNotification,
  ApiUnreadCount,
  ContractLink,
  ContractLinkUpsert,
} from "./api-types";
import { mapApiToAtividade } from "./api-utils";

export * from "./api-types";
export * from "./api-utils";

import { getAccessToken, refreshAccessToken } from "@/lib/auth";

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

  // Montar headers com token de autenticação (se disponível)
  const token = getAccessToken();
  const authHeaders: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        ...authHeaders,
        ...(init?.headers ?? {}),
      },
    });

    if (!res.ok) {
      let detail = res.statusText;
      try {
        const body = await res.json();
        detail = body.detail ?? detail;
      } catch {}

      // Verificar se já tentamos reenviar essa requisição para evitar loops
      let isRetry = false;
      if (init?.headers) {
        if (init.headers instanceof Headers) {
          isRetry = init.headers.has("X-Retry-Auth");
        } else if (Array.isArray(init.headers)) {
          isRetry = init.headers.some(([key]) => key.toLowerCase() === "x-retry-auth");
        } else {
          isRetry = !!(init.headers as Record<string, string>)["X-Retry-Auth"];
        }
      }

      if (res.status === 401 && !isRetry) {
        try {
          console.log(`[apiFetch] Token expirado ao acessar ${path}. Tentando renovar...`);
          const newToken = await refreshAccessToken();
          if (newToken) {
            // Clona e atualiza os headers com o novo token
            let headersObj: Record<string, string> = {};
            if (init?.headers) {
              if (init.headers instanceof Headers) {
                init.headers.forEach((value, key) => {
                  headersObj[key] = value;
                });
              } else if (Array.isArray(init.headers)) {
                init.headers.forEach(([key, value]) => {
                  headersObj[key] = value;
                });
              } else {
                headersObj = { ...init.headers } as Record<string, string>;
              }
            }
            
            headersObj["Authorization"] = `Bearer ${newToken}`;
            headersObj["X-Retry-Auth"] = "true";

            return await apiFetch<T>(path, {
              ...init,
              headers: headersObj,
            });
          }
        } catch (refreshErr) {
          console.error("[apiFetch] Erro ao tentar renovar o token:", refreshErr);
        }

        // Se falhou ao renovar
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("api-unauthorized"));
        }
      } else if (res.status === 401) {
        // Se já era um retry e deu 401 de novo
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("api-unauthorized"));
        }
      }

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
    proj.activities.map((act) => ({
      ...mapApiToAtividade(act),
      projeto: proj.name,
    }))
  );
}

export interface PaginatedAtividades {
  total: number;
  page: number;
  limit: number;
  activities: Atividade[];
  coordenadorias: string[];
  projetos: string[];
}

export async function fetchPaginatedAtividades(
  page = 1,
  limit = 15,
  search = "",
  coordenadoria = "",
  project = "",
  status = "",
  prazo = "",
  activityId = "",
  responsavel = ""
): Promise<PaginatedAtividades> {
  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("limit", limit.toString());
  if (activityId) params.append("activity_id", activityId);
  if (search) params.append("search", search);
  if (coordenadoria && coordenadoria !== "todas") params.append("coordenadoria", coordenadoria);
  if (responsavel) params.append("responsavel", responsavel);
  if (project && project !== "todos") params.append("project", project);
  if (status && status !== "todos") params.append("status_filter", status);
  if (prazo && prazo !== "todos") params.append("prazo", prazo);

  const res = await apiFetch<{
    total: number;
    page: number;
    limit: number;
    activities: ApiActivity[];
    coordenadorias: string[];
    projetos: string[];
  }>(`/api/v1/projects/activities/paginated?${params.toString()}`);

  return {
    total: res.total,
    page: res.page,
    limit: res.limit,
    activities: res.activities.map((act) => ({
      ...mapApiToAtividade(act),
      projeto: act.project_name ?? "—",
    })),
    coordenadorias: res.coordenadorias,
    projetos: res.projetos,
  };
}

export async function fetchProjects(): Promise<ApiProject[]> {
  return apiFetch<ApiProject[]>("/api/v1/projects");
}

export async function fetchProjectsSimple(): Promise<ApiProjectSimple[]> {
  return apiFetch<ApiProjectSimple[]>("/api/v1/projects/list");
}

export async function uploadPlanilha(file: File): Promise<ApiProject[]> {
  const formData = new FormData();
  formData.append("file", file);

  return apiFetch<ApiProject[]>("/api/v1/projects/upload", {
    method: "POST",
    body: formData,
  });
}

export async function syncGoogleSheets(): Promise<ApiProject[]> {
  return apiFetch<ApiProject[]>("/api/v1/projects/sync", {
    method: "POST",
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

export async function fetchUsers(): Promise<ApiUser[]> {
  return apiFetch<ApiUser[]>("/api/v1/users");
}

export async function createUser(data: ApiUserCreate): Promise<ApiUser> {
  return apiFetch<ApiUser>("/api/v1/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateUser(
  userId: string,
  data: ApiUserUpdate
): Promise<ApiUser> {
  return apiFetch<ApiUser>(`/api/v1/users/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteUser(userId: string): Promise<void> {
  await apiFetch<void>(`/api/v1/users/${userId}`, {
    method: "DELETE",
  });
}

export async function fetchCoordenadorias(): Promise<ApiCoordenadoria[]> {
  return apiFetch<ApiCoordenadoria[]>("/api/v1/coordenadorias");
}

export async function createCoordenadoria(
  data: ApiCoordenadoriaCreate
): Promise<ApiCoordenadoria> {
  return apiFetch<ApiCoordenadoria>("/api/v1/coordenadorias", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateCoordenadoria(
  id: string,
  data: ApiCoordenadoriaUpdate
): Promise<ApiCoordenadoria> {
  return apiFetch<ApiCoordenadoria>(`/api/v1/coordenadorias/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteCoordenadoria(id: string): Promise<void> {
  await apiFetch<void>(`/api/v1/coordenadorias/${id}`, {
    method: "DELETE",
  });
}

export async function fetchNotifications(
  onlyUnread = false
): Promise<ApiNotification[]> {
  return apiFetch<ApiNotification[]>(
    `/api/v1/notifications?only_unread=${onlyUnread}`
  );
}

export async function fetchUnreadCount(): Promise<ApiUnreadCount> {
  return apiFetch<ApiUnreadCount>("/api/v1/notifications/unread-count");
}

export async function fetchContractLinks(): Promise<ContractLink[]> {
  return apiFetch<ContractLink[]>("/api/v1/contract-links");
}

export async function saveContractLink(data: ContractLinkUpsert): Promise<ContractLink> {
  return apiFetch<ContractLink>("/api/v1/contract-links", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function markNotificationAsRead(
  notificationId: string
): Promise<ApiNotification> {
  return apiFetch<ApiNotification>(
    `/api/v1/notifications/${notificationId}/read`,
    {
      method: "PATCH",
    }
  );
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await apiFetch<void>("/api/v1/notifications/read-all", {
    method: "PATCH",
  });
}
