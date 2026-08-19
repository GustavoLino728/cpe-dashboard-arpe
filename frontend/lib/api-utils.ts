import { StatusType, StatusDetail, Atividade, ApiActivity } from "./api-types";

export const statusMap: Record<StatusType, StatusDetail> = {
  ok: {
    label: "Concluído",
    corTailwind:
      "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30",
    corHex: "#10B981",
  },
  warn: {
    label: "Em andamento",
    corTailwind:
      "text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30",
    corHex: "#F59E0B",
  },
  late: {
    label: "Atrasado",
    corTailwind:
      "text-rose-700 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30",
    corHex: "#EF4444",
  },
};

export function mapApiStatus(apiStatus: string): StatusType {
  const s = apiStatus.toLowerCase();
  if (s.includes("conclu")) return "ok";
  if (s.includes("andamento")) return "warn";
  return "late";
}

export function deriveProgress(apiStatus: string): number {
  const s = apiStatus.toLowerCase();
  if (s.includes("conclu")) return 100;
  if (s.includes("andamento")) return 50;
  return 0;
}

export function formatDateShort(iso: string | null): string {
  if (!iso) return "—";
  const parts = iso.split("-");
  if (parts.length < 3) return iso;
  return `${parts[2]}/${parts[1]}`;
}

export function cleanCoordenadoriaName(name: string): string {
  if (!name) return "";
  const trimmed = name.trim();
  const match = trimmed.match(/^ARPE\s*\(([^)]+)\)$/i);
  if (match) {
    return match[1].trim();
  }
  return trimmed;
}

export function isCombinedSector(name: string): boolean {
  if (!name) return false;
  const nameLower = name.toLowerCase();
  return nameLower === "cpe e cojur" || nameLower.includes(" e ");
}

export function mapApiToAtividade(activity: ApiActivity): Atividade {
  const prazoAtivo = activity.new_date ?? activity.deadline;

  const rawDept = activity.department && activity.department.length > 0
    ? activity.department[0]
    : "Sem Setor";
  
  const cleanedDept = cleanCoordenadoriaName(rawDept);

  return {
    atividade: activity.description,
    coordenadoria: cleanedDept,
    responsavel:
      activity.department && activity.department.length > 0
        ? activity.department.join(", ")
        : "—",
    progresso: deriveProgress(activity.status),
    prazo: formatDateShort(prazoAtivo),
    status: mapApiStatus(activity.status),
  };
}

export function extractCoordenadorias(atividades: Atividade[]): string[] {
  const set = new Set<string>();
  for (const a of atividades) {
    if (a.coordenadoria && a.coordenadoria !== "Sem Setor" && !isCombinedSector(a.coordenadoria)) {
      set.add(a.coordenadoria);
    }
  }
  return Array.from(set).sort();
}

const COORD_PALETTE = [
  "#3B82F6",
  "#10B981",
  "#F97316",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#6366F1",
  "#84CC16",
  "#D946EF",
  "#14B8A6",
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
