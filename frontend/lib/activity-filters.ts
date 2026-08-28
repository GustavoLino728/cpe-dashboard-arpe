export interface ActivityFilterContext {
  selectedCoord?: string;
  selectedProject?: string;
  includeCoordFilter?: boolean;
}

export type ActivityFilters = Record<string, string | null | undefined>;

export function buildActivitiesHref(
  filters: ActivityFilters = {},
  context: ActivityFilterContext = {}
): string {
  const {
    selectedCoord = "todas",
    selectedProject = "todos",
    includeCoordFilter = false,
  } = context;

  const params = new URLSearchParams();

  if (includeCoordFilter && selectedCoord !== "todas") {
    params.set("coordenadoria", selectedCoord);
  }

  if (selectedProject !== "todos") {
    params.set("project", selectedProject);
  }

  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== "todos" && value !== "todas") {
      params.set(key, value);
    }
  });

  const query = params.toString();
  return query ? `/atividades?${query}` : "/atividades";
}

export const ACTIVITY_STATUS_FILTER_BY_LABEL: Record<string, string> = {
  "Concluído": "ok",
  "ConcluÃ­do": "ok",
  "Em andamento": "warn",
  "Não Iniciado": "pending",
  "NÃ£o Iniciado": "pending",
  Atrasado: "late",
};
