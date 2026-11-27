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
  pending: {
    label: "A Iniciar",
    corTailwind:
      "text-slate-600 bg-slate-100 dark:bg-slate-800/40 dark:text-slate-400 border border-slate-200 dark:border-slate-700/40",
    corHex: "#6B7280",
  },
};

export function mapApiStatus(apiStatus?: string | null): StatusType {
  const s = (apiStatus ?? "").toLowerCase();
  if (s.includes("conclu")) return "ok";
  if (s.includes("andamento")) return "warn";
  if (s.includes("iniciar") || s.includes("iniciado")) return "pending";
  return "pending";
}

export function deriveProgress(apiStatus?: string | null): number {
  const s = (apiStatus ?? "").toLowerCase();
  if (s.includes("conclu")) return 100;
  if (s.includes("andamento")) return 50;
  return 0;
}

export function parseLocalIsoDate(iso?: string | null): Date | null {
  if (!iso) return null;
  const datePart = iso.split("T")[0];
  const parsed = new Date(`${datePart}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDateShort(iso: string | null): string {
  if (!iso) return "—";
  const parts = iso.split("T")[0].split("-");
  if (parts.length < 3) return iso;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
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

  const executors = (activity.department ?? [])
    .map(cleanCoordenadoriaName)
    .filter((item) => item && item !== "Sem Setor");

  const cleanedDept = executors[0] ?? "Sem Setor";

  let computedStatus = mapApiStatus(activity.status);
  if (computedStatus !== "ok" && prazoAtivo) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = parseLocalIsoDate(prazoAtivo);
    if (deadline && deadline < today) {
      computedStatus = "late";
    }
  }

  return {
    id: activity.id,
    project_id: activity.project_id,
    mrae: activity.mrae ?? null,
    instrument: activity.instrument ?? activity.contract ?? null,
    clause: activity.clause ?? null,
    phase: activity.phase ?? null,
    thematic_group: activity.thematic_group ?? activity.group_item ?? null,
    nature: activity.nature ?? null,
    atividade: activity.description,
    prior_step: activity.prior_step ?? null,
    prior_step_deadline: activity.prior_step_deadline ?? null,
    prior_step_deadline_text: activity.prior_step_deadline_text ?? null,
    primary_responsible: activity.primary_responsible ?? null,
    coordenadoria: cleanedDept,
    executors,
    responsavel: executors.join(", "),
    progresso: deriveProgress(activity.status),
    prazo: formatDateShort(prazoAtivo),
    status: computedStatus,
    projeto: activity.project_name,
    data_inicio: activity.start_date,
    initial_deadline_text: activity.initial_deadline_text ?? null,
    data_fim: prazoAtivo,
    final_deadline_text: activity.final_deadline_text ?? null,
    contractual_deadline_text: activity.contractual_deadline_text ?? null,
    periodicity: activity.periodicity ?? null,
    contrato: activity.instrument ?? activity.contract ?? null,
    contrato_url: activity.contract_url ?? null,
    contrato_links: activity.contract_links ?? [],
    sei_number: activity.sei_number,
    sei_2: activity.sei_2 ?? null,
    working_days: activity.working_days,
    deadline: activity.deadline,
    new_date: activity.new_date,
    raw_status: activity.status,
    arpe_status: activity.arpe_status ?? null,
    observations: activity.observations,
    object_summary: activity.object_summary ?? null,
    summary: activity.summary ?? null,
    group_item: activity.group_item,
    step_number: activity.step_number,
    actual_start_date: activity.actual_start_date,
    actual_end_date: activity.actual_end_date ?? null,
    arpe_entry_date: activity.arpe_entry_date ?? null,
    arpe_final_date: activity.arpe_final_date ?? null,
    delay_justification_problem: activity.delay_justification_problem ?? null,
    delay_justification_action: activity.delay_justification_action ?? null,
    delay_justification_responsible: activity.delay_justification_responsible ?? null,
    created_at: activity.created_at,
    updated_at: activity.updated_at,
  };
}

export function extractCoordenadorias(atividades: Atividade[]): string[] {
  const set = new Set<string>();
  for (const a of atividades) {
    const items = a.executors?.length ? a.executors : [a.coordenadoria];
    for (const item of items) {
      if (item && item !== "Sem Setor" && !isCombinedSector(item)) {
        set.add(item);
      }
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
