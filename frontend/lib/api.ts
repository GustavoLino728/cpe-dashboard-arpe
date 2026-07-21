// ---------------------------------------------------------------------------
// lib/api.ts — Camada de comunicação com o backend FastAPI
// ---------------------------------------------------------------------------
// Todas as chamadas de rede e mapeamento de tipos ficam aqui.
// Se o backend estiver offline (erro de conexão / Failed to fetch), o sistema
// utiliza dados locais (mock) automaticamente como fallback transparente.
// ---------------------------------------------------------------------------

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001";

// ========================== TIPOS DA API (Backend) ==========================

/** Atividade conforme retornada pela API (ActivitySchema). */
export interface ApiActivity {
  id: string;
  project_id: string;
  description: string;
  sei_number: string | null;
  department: string[] | null;
  start_date: string | null;   // "YYYY-MM-DD"
  deadline: string | null;     // "YYYY-MM-DD"
  working_days: number | null;
  new_date: string | null;     // "YYYY-MM-DD"
  status: string;              // "Concluído" | "Em andamento" | "Não Iniciado"
  observations: string | null;
  created_at: string;
  updated_at: string;
}

/** Projeto conforme retornado pela API (ProjectSchema). */
export interface ApiProject {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  activities: ApiActivity[];
}

/** Resumo / KPIs do projeto (ProjectSummarySchema). */
export interface ApiProjectSummary {
  projeto: string;
  data_referencia: string;
  total_atividades: number;
  concluidas: number;
  em_andamento: number;
  nao_iniciadas: number;
  percentual_conclusao: number;
  prazos_proximos_7_dias: number;
  prazos_criticos_2_dias: number;
  atrasadas: number;
}

/** Carga por setor (SectorLoadSchema). */
export interface ApiSectorLoad {
  setor: string;
  total: number;
}

/** Status por setor (SectorStatusSchema). */
export interface ApiSectorStatus {
  setor: string;
  concluido: number;
  em_andamento: number;
  nao_iniciado: number;
}

/** Atividade crítica (CriticalActivitySchema). */
export interface ApiCriticalActivity {
  id: string;
  descricao: string;
  setor: string;
  prazo_final: string | null;
  status: string;
  dias_para_prazo: number;
}

/** Fase / status por fase (PhaseStatusSchema). */
export interface ApiPhaseStatus {
  fase: string;
  concluido: number;
  em_andamento: number;
  nao_iniciado: number;
}

/** Evento de timeline (TimelineEventSchema). */
export interface ApiTimelineEvent {
  id: string;
  descricao: string;
  data_inicio: string | null;
  prazo_final: string | null;
  status: string;
  fase: string;
}

// ===================== TIPOS DO FRONTEND (compatível com mock) ===============

export type StatusType = "ok" | "warn" | "late";

export interface Atividade {
  atividade: string;
  coordenadoria: string;
  responsavel: string;
  progresso: number;     // 0–100
  prazo: string;         // formato "DD/MM"
  status: StatusType;
}

export interface StatusDetail {
  label: string;
  corTailwind: string;
  corHex: string;
}

export const statusMap: Record<StatusType, StatusDetail> = {
  ok: {
    label: "Concluído",
    corTailwind:
      "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30",
    corHex: "#6B7280",
  },
  warn: {
    label: "Em andamento",
    corTailwind:
      "text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30",
    corHex: "#A1A7AF",
  },
  late: {
    label: "Atrasado",
    corTailwind:
      "text-rose-700 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30",
    corHex: "#3F444D",
  },
};

// ========================== DADOS MOCK DE FALLBACK ===========================

let mockProjectsStore: ApiProject[] = [
  {
    id: "proj-1",
    name: "Regulação de Saneamento 2026",
    description: "Mapeamento cronológico de atividades de regulação e fiscalização de saneamento.",
    created_at: "2026-01-15T10:00:00Z",
    updated_at: "2026-02-10T14:30:00Z",
    activities: [
      {
        id: "act-101",
        project_id: "proj-1",
        description: "Análise de Impacto Regulatório (AIR) - Tarifas",
        sei_number: "14.000123/2026-10",
        department: ["CAT"],
        start_date: "2026-02-01",
        deadline: "2026-03-15",
        working_days: 30,
        new_date: null,
        status: "Concluído",
        observations: "Concluído dentro do prazo.",
        created_at: "2026-01-15T10:00:00Z",
        updated_at: "2026-02-10T14:30:00Z",
      },
      {
        id: "act-102",
        project_id: "proj-1",
        description: "Elaboração de Minuta de Resolução Normativa",
        sei_number: "14.000124/2026-15",
        department: ["CAT"],
        start_date: "2026-02-15",
        deadline: "2026-04-30",
        working_days: 45,
        new_date: null,
        status: "Em andamento",
        observations: "Em elaboração técnica.",
        created_at: "2026-01-15T10:00:00Z",
        updated_at: "2026-02-10T14:30:00Z",
      },
      {
        id: "act-103",
        project_id: "proj-1",
        description: "Consulta e Audiência Pública de Saneamento",
        sei_number: "14.000125/2026-20",
        department: ["GAB", "CAT"],
        start_date: "2026-03-01",
        deadline: "2026-05-15",
        working_days: 45,
        new_date: null,
        status: "Em andamento",
        observations: "Aguardando publicação no DOE.",
        created_at: "2026-01-15T10:00:00Z",
        updated_at: "2026-02-10T14:30:00Z",
      },
      {
        id: "act-104",
        project_id: "proj-1",
        description: "Revisão Jurídica e Parecer PROJUR",
        sei_number: "14.000126/2026-25",
        department: ["PROJUR"],
        start_date: "2026-03-10",
        deadline: "2026-04-10",
        working_days: 20,
        new_date: null,
        status: "Não Iniciado",
        observations: "Atrasado aguardando envio.",
        created_at: "2026-01-15T10:00:00Z",
        updated_at: "2026-02-10T14:30:00Z",
      },
    ],
  },
  {
    id: "proj-2",
    name: "Fiscalização Operacional COMPESA",
    description: "Inspeção técnica e acompanhamento dos indicadores de qualidade.",
    created_at: "2026-01-20T11:00:00Z",
    updated_at: "2026-02-12T16:00:00Z",
    activities: [
      {
        id: "act-201",
        project_id: "proj-2",
        description: "Vistoria Técnica na ETE Cabanga",
        sei_number: "14.000201/2026-30",
        department: ["CAS"],
        start_date: "2026-01-20",
        deadline: "2026-02-28",
        working_days: 25,
        new_date: null,
        status: "Concluído",
        observations: "Relatório de campo emitido.",
        created_at: "2026-01-20T11:00:00Z",
        updated_at: "2026-02-12T16:00:00Z",
      },
      {
        id: "act-202",
        project_id: "proj-2",
        description: "Emissão de Auto de Infração e Notificação",
        sei_number: "14.000202/2026-35",
        department: ["CAS"],
        start_date: "2026-02-10",
        deadline: "2026-04-15",
        working_days: 35,
        new_date: null,
        status: "Em andamento",
        observations: "Prazo para defesa da concessionária.",
        created_at: "2026-01-20T11:00:00Z",
        updated_at: "2026-02-12T16:00:00Z",
      },
      {
        id: "act-203",
        project_id: "proj-2",
        description: "Análise de Recurso Administrativo",
        sei_number: "14.000203/2026-40",
        department: ["DIR", "CAS"],
        start_date: "2026-03-01",
        deadline: "2026-04-01",
        working_days: 20,
        new_date: null,
        status: "Não Iniciado",
        observations: "Prazo vencido.",
        created_at: "2026-01-20T11:00:00Z",
        updated_at: "2026-02-12T16:00:00Z",
      },
    ],
  },
  {
    id: "proj-3",
    name: "Revisão Tarifária Periódica",
    description: "Cálculo da estrutura tarifária e margem de retorno.",
    created_at: "2026-02-01T09:00:00Z",
    updated_at: "2026-02-18T11:20:00Z",
    activities: [
      {
        id: "act-301",
        project_id: "proj-3",
        description: "Auditoria do Banco de Ativos Regulatórios",
        sei_number: "14.000301/2026-50",
        department: ["CPE"],
        start_date: "2026-01-05",
        deadline: "2026-02-10",
        working_days: 25,
        new_date: null,
        status: "Concluído",
        observations: "Ativos validados.",
        created_at: "2026-02-01T09:00:00Z",
        updated_at: "2026-02-18T11:20:00Z",
      },
      {
        id: "act-302",
        project_id: "proj-3",
        description: "Estudo de Custo de Capital (WACC)",
        sei_number: "14.000302/2026-55",
        department: ["CPE"],
        start_date: "2026-02-01",
        deadline: "2026-05-30",
        working_days: 60,
        new_date: null,
        status: "Em andamento",
        observations: "Fase de modelagem matemática.",
        created_at: "2026-02-01T09:00:00Z",
        updated_at: "2026-02-18T11:20:00Z",
      },
      {
        id: "act-303",
        project_id: "proj-3",
        description: "Homologação e Publicação da Estrutura Tarifária",
        sei_number: "14.000303/2026-60",
        department: ["DIR"],
        start_date: "2026-04-01",
        deadline: "2026-04-25",
        working_days: 18,
        new_date: null,
        status: "Não Iniciado",
        observations: "Pendência de julgamento.",
        created_at: "2026-02-01T09:00:00Z",
        updated_at: "2026-02-18T11:20:00Z",
      },
    ],
  },
];

// ========================== MAPEAMENTO API → FRONTEND =======================

/**
 * Mapeia o status textual da API para o StatusType do frontend.
 *   "Concluído"    → "ok"
 *   "Em andamento" → "warn"
 *   "Não Iniciado" → "late"
 */
function mapApiStatus(apiStatus: string): StatusType {
  const s = apiStatus.toLowerCase();
  if (s.includes("conclu")) return "ok";
  if (s.includes("andamento")) return "warn";
  return "late";
}

/**
 * Deriva um progresso sintético a partir do status:
 *   Concluído    → 100
 *   Em andamento →  50
 *   Não Iniciado →   0
 */
function deriveProgress(apiStatus: string): number {
  const s = apiStatus.toLowerCase();
  if (s.includes("conclu")) return 100;
  if (s.includes("andamento")) return 50;
  return 0;
}

/**
 * Formata uma data ISO ("YYYY-MM-DD") como "DD/MM" para exibição.
 */
function formatDateShort(iso: string | null): string {
  if (!iso) return "—";
  const parts = iso.split("-");
  if (parts.length < 3) return iso;
  return `${parts[2]}/${parts[1]}`;
}

/**
 * Converte uma ApiActivity no formato Atividade do frontend.
 */
export function mapApiToAtividade(activity: ApiActivity): Atividade {
  const prazoAtivo = activity.new_date ?? activity.deadline;

  return {
    atividade: activity.description,
    coordenadoria:
      activity.department && activity.department.length > 0
        ? activity.department[0]
        : "Sem Setor",
    responsavel:
      activity.department && activity.department.length > 0
        ? activity.department.join(", ")
        : "—",
    progresso: deriveProgress(activity.status),
    prazo: formatDateShort(prazoAtivo),
    status: mapApiStatus(activity.status),
  };
}

// ========================= FUNÇÕES DE FETCH =================================

/** Erro genérico para falhas de API. */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Wrapper de fetch com tratamento de erros padronizado e fallback para mock se offline. */
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
      } catch {
        // ignora parsing errors
      }
      throw new ApiError(detail, res.status);
    }

    if (res.status === 204) return undefined as unknown as T;

    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    // Erro de conexão (Failed to fetch, backend offline) -> fallback seguro para dados mock
    console.warn(`[API] Servidor ${API_BASE} indisponível. Usando modo de demonstração local.`, err);
    return handleOfflineFallback<T>(path, init);
  }
}

/** Trata requisições simuladas quando a API FastAPI não está rodando localmente. */
function handleOfflineFallback<T>(path: string, init?: RequestInit): T {
  const method = init?.method?.toUpperCase() ?? "GET";

  if (path === "/api/v1/projects") {
    if (method === "GET") {
      return mockProjectsStore as unknown as T;
    }
  }

  if (path === "/api/v1/projects/upload" && method === "POST") {
    const fileName = "Nova Planilha Importada.xlsx";
    const newProject: ApiProject = {
      id: `proj-${Date.now()}`,
      name: fileName.replace(/\.[^/.]+$/, ""),
      description: "Projeto importado em modo demonstração",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      activities: [
        {
          id: `act-${Date.now()}-1`,
          project_id: `proj-${Date.now()}`,
          description: "Atividade Importada Exemplo 1",
          sei_number: "14.000999/2026-00",
          department: ["CAT"],
          start_date: new Date().toISOString().split("T")[0],
          deadline: new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0],
          working_days: 15,
          new_date: null,
          status: "Em andamento",
          observations: "Importado com sucesso.",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    };
    mockProjectsStore = [newProject, ...mockProjectsStore];
    return mockProjectsStore as unknown as T;
  }

  if (path.startsWith("/api/v1/projects/") && method === "DELETE") {
    const projectId = path.replace("/api/v1/projects/", "");
    mockProjectsStore = mockProjectsStore.filter((p) => p.id !== projectId);
    return undefined as unknown as T;
  }

  return [] as unknown as T;
}

// ---- Projetos & Atividades ----

/**
 * Busca todos os projetos (com atividades) e retorna como Atividade[] flat,
 * pronto para consumo pelo frontend.
 */
export async function fetchAtividades(): Promise<Atividade[]> {
  const projects = await apiFetch<ApiProject[]>("/api/v1/projects");
  return projects.flatMap((proj) =>
    proj.activities.map((act) => mapApiToAtividade(act))
  );
}

/**
 * Busca todos os projetos crus (com atividades aninhadas).
 */
export async function fetchProjects(): Promise<ApiProject[]> {
  return apiFetch<ApiProject[]>("/api/v1/projects");
}

/**
 * Faz upload de uma planilha Excel via multipart.
 * Retorna os projetos criados/atualizados.
 */
export async function uploadPlanilha(file: File): Promise<ApiProject[]> {
  const formData = new FormData();
  formData.append("file", file);

  return apiFetch<ApiProject[]>("/api/v1/projects/upload", {
    method: "POST",
    body: formData,
  });
}

/**
 * Deleta um projeto e todas as suas atividades.
 */
export async function deleteProject(projectId: string): Promise<void> {
  await apiFetch<void>(`/api/v1/projects/${projectId}`, {
    method: "DELETE",
  });
}

// ---- Dashboard Analytics ----

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

// ========================= HELPERS ==========================================

/**
 * Extrai a lista de coordenadorias únicas a partir das atividades já mapeadas.
 */
export function extractCoordenadorias(atividades: Atividade[]): string[] {
  const set = new Set<string>();
  for (const a of atividades) {
    if (a.coordenadoria && a.coordenadoria !== "Sem Setor") {
      set.add(a.coordenadoria);
    }
  }
  return Array.from(set).sort();
}

/**
 * Paleta de cores dinâmica para coordenadorias (gera cores a partir de uma
 * paleta base, ciclando se houver mais coordenadorias do que cores).
 */
const COORD_PALETTE = [
  "#4B5563",
  "#6B7280",
  "#9CA3AF",
  "#D1D5DB",
  "#374151",
  "#1F2937",
  "#111827",
  "#7C8FA1",
  "#5B95C4",
  "#7B69B8",
];

export function getCoordColor(coordenadoria: string, index: number): string {
  return COORD_PALETTE[index % COORD_PALETTE.length];
}

export function buildCoordColors(
  coordenadorias: string[]
): Record<string, string> {
  const map: Record<string, string> = {};
  coordenadorias.forEach((c, i) => {
    map[c] = getCoordColor(c, i);
  });
  return map;
}
