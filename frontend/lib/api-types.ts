export interface ActivityContractLink {
  contract: string;
  url: string | null;
}

export interface ApiActivity {
  id: string;
  project_id: string;
  project_name?: string;
  source_row_key?: string | null;
  mrae?: string | null;
  instrument?: string | null;
  clause?: string | null;
  phase?: string | null;
  thematic_group?: string | null;
  nature?: string | null;
  description: string;
  prior_step?: string | null;
  prior_step_deadline?: string | null;
  prior_step_deadline_text?: string | null;
  primary_responsible?: string | null;
  sei_number: string | null;
  department: string[] | null;
  contractual_deadline_text?: string | null;
  periodicity?: string | null;
  start_date: string | null;
  initial_deadline_text?: string | null;
  deadline: string | null;
  final_deadline_text?: string | null;
  working_days: number | null;
  new_date: string | null;
  status: string;
  observations: string | null;
  object_summary?: string | null;
  arpe_entry_date?: string | null;
  arpe_final_date?: string | null;
  arpe_status?: string | null;
  sei_2?: string | null;
  summary?: string | null;
  group_item: string | null;
  contract: string | null;
  contract_url?: string | null;
  contract_links?: ActivityContractLink[];
  step_number: string | null;
  actual_start_date: string | null;
  actual_end_date?: string | null;
  delay_justification_problem?: string | null;
  delay_justification_action?: string | null;
  delay_justification_responsible?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityKpis {
  total: number;
  concluidas: number;
  atrasadas: number;
  em_andamento: number;
  a_iniciar: number;
}

export interface ApiSyncStatus {
  can_sync_now: boolean;
  cooldown_seconds: number;
  retry_after_seconds: number;
  next_allowed_at: string | null;
  last_sync_at: string | null;
  last_sync_by: string | null;
  last_sync_items: number | null;
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

export type StatusType = "ok" | "warn" | "late" | "pending";

export interface Atividade {
  id: string;
  project_id: string;
  mrae?: string | null;
  instrument?: string | null;
  clause?: string | null;
  phase?: string | null;
  thematic_group?: string | null;
  nature?: string | null;
  atividade: string;
  prior_step?: string | null;
  prior_step_deadline?: string | null;
  prior_step_deadline_text?: string | null;
  primary_responsible?: string | null;
  coordenadoria: string;
  executors: string[];
  responsavel: string;
  progresso: number;
  prazo: string;
  status: StatusType;
  projeto?: string;
  data_inicio?: string | null;
  initial_deadline_text?: string | null;
  data_fim?: string | null;
  final_deadline_text?: string | null;
  contractual_deadline_text?: string | null;
  periodicity?: string | null;
  contrato?: string | null;
  contrato_url?: string | null;
  contrato_links?: ActivityContractLink[];
  sei_number?: string | null;
  sei_2?: string | null;
  working_days?: number | null;
  deadline?: string | null;
  new_date?: string | null;
  raw_status?: string;
  arpe_status?: string | null;
  observations?: string | null;
  object_summary?: string | null;
  summary?: string | null;
  group_item?: string | null;
  step_number?: string | null;
  actual_start_date?: string | null;
  actual_end_date?: string | null;
  arpe_entry_date?: string | null;
  arpe_final_date?: string | null;
  delay_justification_problem?: string | null;
  delay_justification_action?: string | null;
  delay_justification_responsible?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PaginatedAtividades {
  total: number;
  page: number;
  limit: number;
  activities: Atividade[];
  kpis: ActivityKpis;
  coordenadorias: string[];
  projetos: string[];
  mraes: string[];
  instrumentos: string[];
  executores: string[];
}

export interface PaginatedActivitiesQuery {
  page?: number;
  limit?: number;
  search?: string;
  mrae?: string;
  instrumento?: string;
  mes_inicial?: string;
  mes_final?: string;
  executor?: string;
  coordenadoria?: string;
  responsavel?: string;
  project?: string;
  status?: string;
  prazo?: string;
  activityId?: string;
}

export interface ContractLink {
  id: string | null;
  project_id: string;
  project_name: string;
  contract: string;
  url: string | null;
  activities_count: number;
  updated_at: string | null;
}

export interface ContractLinkUpsert {
  project_id: string;
  contract: string;
  url: string;
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
