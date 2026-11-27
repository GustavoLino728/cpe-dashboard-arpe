import calendar
import re
import unicodedata
from datetime import date

_ISO_MONTH_RE = re.compile(r"^(\d{4})-(\d{1,2})$")
_BR_MONTH_RE = re.compile(r"^(\d{1,2})/(\d{4})$")
_ARPE_WRAPPER_RE = re.compile(r"^ARPE\s*\(([^)]+)\)$", re.IGNORECASE)


def parse_month_bounds(month_value: str | None) -> tuple[date, date] | None:
    """
    Converte 'YYYY-MM' ou 'MM/YYYY' para (primeiro_dia_do_mes, ultimo_dia_do_mes).
    Retorna None quando vazio e lanca ValueError em formato/mes invalido.
    """
    if month_value is None:
        return None
    cleaned = month_value.strip()
    if not cleaned:
        return None

    iso_match = _ISO_MONTH_RE.match(cleaned)
    br_match = _BR_MONTH_RE.match(cleaned)
    if iso_match:
        year, month = int(iso_match.group(1)), int(iso_match.group(2))
    elif br_match:
        month, year = int(br_match.group(1)), int(br_match.group(2))
    else:
        raise ValueError(
            f"Formato de mes invalido: '{month_value}'. Use AAAA-MM ou MM/AAAA."
        )

    if not 1 <= month <= 12:
        raise ValueError(f"Mes fora do intervalo 1..12: '{month_value}'.")

    last_day = calendar.monthrange(year, month)[1]
    return date(year, month, 1), date(year, month, last_day)


def resolve_period_bounds(
    mes_inicial: str | None,
    mes_final: str | None,
) -> tuple[date | None, date | None]:
    """
    Resolve os limites [primeiro_dia_inicial, ultimo_dia_final] e valida coerencia cronologica.
    """
    start_bounds = parse_month_bounds(mes_inicial)
    end_bounds = parse_month_bounds(mes_final)
    period_start = start_bounds[0] if start_bounds else None
    period_end = end_bounds[1] if end_bounds else None

    if period_start is not None and period_end is not None and period_start > period_end:
        raise ValueError("Mês inicial não pode ser posterior ao mês final.")

    return period_start, period_end


def fold_accents(value: str) -> str:
    """
    Remove marcas diacriticas e normaliza caixa para comparacoes tolerantes a acentuacao.
    """
    decomposed = unicodedata.normalize("NFKD", value)
    without_marks = "".join(ch for ch in decomposed if not unicodedata.combining(ch))
    return without_marks.lower()


def escape_like_term(term: str) -> str:
    """
    Escapa curingas SQL LIKE ('\\', '%' e '_') antes de montar filtros ILIKE (RNF01).
    """
    return term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def clean_executor_label(name: str | None) -> str:
    """
    Extrai sigla canonica de executores (ex.: 'ARPE (DSAN)' -> 'DSAN') removendo espacos.
    """
    if not name:
        return ""
    trimmed = name.strip()
    match = _ARPE_WRAPPER_RE.match(trimmed)
    if match:
        return match.group(1).strip()
    return trimmed


def normalize_status_filter_key(status_filter: str | None) -> str | None:
    """
    Normaliza chaves de API ('ok', 'warn', 'pending', 'late') ou rotulos de UI para chave canonica.
    """
    if not status_filter:
        return None
    cleaned = fold_accents(status_filter.strip())
    if not cleaned or cleaned in ("todos", "todas"):
        return None
    if cleaned == "ok" or "conclu" in cleaned:
        return "ok"
    if cleaned == "warn" or "andamento" in cleaned:
        return "warn"
    if cleaned == "late" or "atrasad" in cleaned:
        return "late"
    if cleaned == "pending" or "iniciar" in cleaned or "iniciado" in cleaned:
        return "pending"
    return None


def classify_effective_status(
    raw_status: str | None,
    effective_deadline: date | None,
    reference_date: date | None = None,
) -> str:
    """
    RN01 — Classifica o status efetivo de uma atividade para filtros e KPIs:
    'Concluído', 'Atrasado', 'Em andamento' ou 'A Iniciar'.
    """
    today = reference_date or date.today()
    normalized = (raw_status or "").strip().lower()

    if "conclu" in normalized:
        return "Concluído"
    if effective_deadline is not None and effective_deadline < today:
        return "Atrasado"
    if "andamento" in normalized:
        return "Em andamento"
    return "A Iniciar"


def matches_period_scope(
    start_date: date | None,
    effective_deadline: date | None,
    period_start: date | None,
    period_end: date | None,
) -> bool:
    """
    RN04 — Avalia se uma atividade pertence ao recorte [period_start .. period_end].
    Atividades com start_date e sem effective_deadline tem vigencia aberta [start_date, +inf).
    """
    if period_start is None and period_end is None:
        return True
    if start_date is None and effective_deadline is None:
        return False

    if period_start is not None and period_end is not None:
        if start_date is not None and effective_deadline is not None:
            return start_date <= period_end and effective_deadline >= period_start
        if start_date is not None:
            return start_date <= period_end
        return period_start <= effective_deadline <= period_end

    if period_start is not None:
        if effective_deadline is None:
            return start_date is not None
        return effective_deadline >= period_start

    anchor_date = start_date if start_date is not None else effective_deadline
    return anchor_date is not None and anchor_date <= period_end


def summarize_activity_kpis(effective_statuses: list[str]) -> dict[str, int]:
    """
    Agrega os 5 contadores reativos da faixa de KPIs sobre um conjunto de status efetivos.
    """
    summary = {
        "total": len(effective_statuses),
        "concluidas": 0,
        "atrasadas": 0,
        "em_andamento": 0,
        "a_iniciar": 0,
    }
    for current in effective_statuses:
        if current == "Concluído":
            summary["concluidas"] += 1
        elif current == "Atrasado":
            summary["atrasadas"] += 1
        elif current == "Em andamento":
            summary["em_andamento"] += 1
        else:
            summary["a_iniciar"] += 1
    return summary
