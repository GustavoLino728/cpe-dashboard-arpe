export interface ApiActivity {
  id: string;
  project_id: string;
  description: string;
  sei_number: string | null;
  department: string[] | null;
  start_date: string | null;
  deadline: string | null;
  working_days: number | null;
  new_date: string | null;
  status: string;
  observations: string | null;
  group_item: string | null;
  contract: string | null;
  step_number: string | null;
  actual_start_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiProject {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  activities: ApiActivity[];
}

export interface ApiProjectSimple {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

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

export interface ApiSectorLoad {
  setor: string;
  total: number;
}

export interface ApiSectorStatus {
  setor: string;
  concluido: number;
  em_andamento: number;
  nao_iniciado: number;
}

export interface ApiCriticalActivity {
  id: string;
  descricao: string;
  setor: string;
  prazo_final: string | null;
  status: string;
  dias_para_prazo: number;
}

export interface ApiPhaseStatus {
  fase: string;
  concluido: number;
  em_andamento: number;
  nao_iniciado: number;
}

export interface ApiTimelineEvent {
  id: string;
  descricao: string;
  data_inicio: string | null;
  prazo_final: string | null;
  status: string;
  fase: string;
}

export type StatusType = "ok" | "warn" | "late";

export interface Atividade {
  atividade: string;
  coordenadoria: string;
  responsavel: string;
  progresso: number;
  prazo: string;
  status: StatusType;
  projeto?: string;
  data_inicio?: string | null;
  data_fim?: string | null;
  contrato?: string;
}

export interface StatusDetail {
  label: string;
  corTailwind: string;
  corHex: string;
}

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: "servidor" | "coordenador" | "admin";
  department?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiUserCreate {
  name: string;
  email: string;
  password: string;
  role: "servidor" | "coordenador" | "admin";
  department?: string | null;
}

export interface ApiUserUpdate {
  name?: string;
  email?: string;
  role?: "servidor" | "coordenador" | "admin";
  department?: string | null;
  is_active?: boolean;
  password?: string;
}

export interface ApiCoordenadoria {
  id: string;
  name: string;
  emails: string[];
  created_at: string;
  updated_at: string;
}

export interface ApiCoordenadoriaCreate {
  name: string;
  emails: string[];
}

export interface ApiCoordenadoriaUpdate {
  name?: string;
  emails?: string[];
}

export interface ApiNotification {
  id: string;
  user_id: string;
  activity_id: string | null;
  title: string;
  content: string;
  is_read: boolean;
  type: string;
  created_at: string;
  updated_at: string;
}

export interface ApiUnreadCount {
  count: number;
}
