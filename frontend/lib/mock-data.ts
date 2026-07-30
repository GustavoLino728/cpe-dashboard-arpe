export type StatusType = "ok" | "warn" | "late";

export interface Atividade {
  atividade: string;
  coordenadoria: string;
  responsavel: string;
  progresso: number; // 0 a 100
  prazo: string; // formato "DD/MM"
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
    corTailwind: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30",
    corHex: "#6B7280",
  },
  warn: {
    label: "Em andamento",
    corTailwind: "text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30",
    corHex: "#A1A7AF",
  },
  late: {
    label: "Atrasado",
    corTailwind: "text-rose-700 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30",
    corHex: "#3F444D",
  },
};

export const coordenadorias = [
  "Fiscalização",
  "Regulação Econômica",
  "Atendimento",
  "Jurídico",
  "TI",
] as const;

export type CoordenadoriaType = typeof coordenadorias[number];

export const coordColors: Record<CoordenadoriaType, string> = {
  "Fiscalização": "#4B5563",
  "Regulação Econômica": "#6B7280",
  "Atendimento": "#9CA3AF",
  "Jurídico": "#D1D5DB",
  "TI": "#374151",
};

export const atividadesMock: Atividade[] = [
  {
    atividade: "Auditoria de contratos de concessão",
    coordenadoria: "Fiscalização",
    responsavel: "C. Andrade",
    progresso: 100,
    prazo: "12/06",
    status: "ok",
  },
  {
    atividade: "Cadastro de novos fiscalizados",
    coordenadoria: "Fiscalização",
    responsavel: "C. Andrade",
    progresso: 30,
    prazo: "28/06",
    status: "late",
  },
  {
    atividade: "Vistoria em campo — Zona Norte",
    coordenadoria: "Fiscalização",
    responsavel: "D. Melo",
    progresso: 55,
    prazo: "18/07",
    status: "warn",
  },
  {
    atividade: "Relatório trimestral de fiscalização",
    coordenadoria: "Fiscalização",
    responsavel: "D. Melo",
    progresso: 100,
    prazo: "10/06",
    status: "ok",
  },
  {
    atividade: "Revisão tarifária 2026",
    coordenadoria: "Regulação Econômica",
    responsavel: "M. Souza",
    progresso: 62,
    prazo: "20/07",
    status: "warn",
  },
  {
    atividade: "Estudo de impacto regulatório",
    coordenadoria: "Regulação Econômica",
    responsavel: "M. Souza",
    progresso: 100,
    prazo: "02/06",
    status: "ok",
  },
  {
    atividade: "Nota técnica de reajuste",
    coordenadoria: "Regulação Econômica",
    responsavel: "F. Costa",
    progresso: 20,
    prazo: "25/07",
    status: "late",
  },
  {
    atividade: "Atualização do portal do cidadão",
    coordenadoria: "TI",
    responsavel: "J. Lima",
    progresso: 40,
    prazo: "01/07",
    status: "late",
  },
  {
    atividade: "Migração de base de dados patrimonial",
    coordenadoria: "TI",
    responsavel: "J. Lima",
    progresso: 70,
    prazo: "22/07",
    status: "warn",
  },
  {
    atividade: "Implantação do módulo de auditoria",
    coordenadoria: "TI",
    responsavel: "B. Rocha",
    progresso: 100,
    prazo: "15/06",
    status: "ok",
  },
  {
    atividade: "Parecer processo 2026/0143",
    coordenadoria: "Jurídico",
    responsavel: "R. Farias",
    progresso: 85,
    prazo: "15/07",
    status: "warn",
  },
  {
    atividade: "Revisão de minuta contratual",
    coordenadoria: "Jurídico",
    responsavel: "R. Farias",
    progresso: 100,
    prazo: "08/06",
    status: "ok",
  },
  {
    atividade: "Análise de recurso administrativo",
    coordenadoria: "Jurídico",
    responsavel: "L. Prado",
    progresso: 15,
    prazo: "29/07",
    status: "late",
  },
  {
    atividade: "Pesquisa de satisfação — atendimento",
    coordenadoria: "Atendimento",
    responsavel: "P. Nunes",
    progresso: 100,
    prazo: "05/06",
    status: "ok",
  },
  {
    atividade: "Reformulação do canal de ouvidoria",
    coordenadoria: "Atendimento",
    responsavel: "P. Nunes",
    progresso: 58,
    prazo: "19/07",
    status: "warn",
  },
];
