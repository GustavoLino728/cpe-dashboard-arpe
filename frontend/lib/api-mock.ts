import { ApiProject } from "./api-types";

export let mockProjectsStore: ApiProject[] = [
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

export function handleOfflineFallback<T>(path: string, init?: RequestInit): T {
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
