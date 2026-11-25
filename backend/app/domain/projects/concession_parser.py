import hashlib
import re
import unicodedata
from collections import Counter
from datetime import date
from typing import Any

from app.domain.projects.excel_parser import clean_cell, get_cell, parse_date


ACRONYMS = {"ARPE", "CCPE", "CIA", "CNR", "CRJ", "DAF", "DEF", "DPRES", "DSAN", "MRAE", "OUV", "OUVI", "VI"}


def normalize_header(text: Any) -> str:
    """Normaliza nome de cabeçalho removendo acentos, espaços extras e caixa."""
    if text is None:
        return ""
    nfkd = unicodedata.normalize("NFKD", str(text))
    without_accents = "".join(c for c in nfkd if not unicodedata.combining(c))
    return re.sub(r"\s+", " ", without_accents).strip().lower()


def normalize_mrae(val: Any) -> str | None:
    """Padroniza identificadores MRAE (ex.: 'MRAE - I ' -> 'MRAE - I')."""
    text = clean_cell(val)
    if not text:
        return None
    collapsed = re.sub(r"\s+", " ", text).strip().upper()
    return re.sub(r"\s*-\s*", " - ", collapsed)


def normalize_concession_status(val: Any) -> str:
    """
    Normaliza o status da ação da aba Concessão.
    Regra RN01: valores nulos/vazios e 'A Iniciar' convergem para 'A Iniciar'.
    """
    text = clean_cell(val)
    if not text:
        return "A Iniciar"
    lower = text.lower()
    if "conclu" in lower:
        return "Concluído"
    if "andamento" in lower or "em_andamento" in lower:
        return "Em andamento"
    if "iniciar" in lower or "nao iniciado" in lower or "não iniciado" in lower:
        return "A Iniciar"
    return text


def _smart_title_token(token: str) -> str:
    upper = token.upper()
    if upper in ACRONYMS:
        return upper
    if token.lower() in {"da", "de", "do", "das", "dos", "e", "ou", "a", "o"}:
        return token.lower()
    return token.capitalize()


def normalize_responsible(val: Any) -> str | None:
    """Uniformiza variações de caixa e ponto final no campo Responsável."""
    text = clean_cell(val)
    if not text:
        return None
    cleaned = re.sub(r"\s+", " ", text).strip().rstrip(".")
    lower = cleaned.lower()

    canonical_map = {
        "nao se aplica": "Não se aplica",
        "não se aplica": "Não se aplica",
        "concessionaria": "Concessionária",
        "concessionária": "Concessionária",
        "poder concedente": "Poder Concedente",
        "verificador independente": "Verificador Independente",
        "certificador independente": "Certificador Independente",
        "comite tecnico": "Comitê Técnico",
        "comitê técnico": "Comitê Técnico",
        "partes": "Partes",
    }
    if lower in canonical_map:
        return canonical_map[lower]

    if cleaned.isupper():
        parts = re.split(r"(\s+|/)", cleaned)
        return "".join(
            part if part in {"/", " "} or part.isspace() else _smart_title_token(part)
            for part in parts
        )
    return cleaned


def normalize_periodicity(val: Any) -> str | None:
    """Uniformiza variações simples de caixa/gênero em Periodicidade."""
    text = clean_cell(val)
    if not text:
        return None
    cleaned = re.sub(r"\s+", " ", text).strip()
    lower = cleaned.lower()
    canonical = {
        "anual": "Anual",
        "mensal": "Mensal",
        "unica": "Única",
        "única": "Única",
        "unico": "Única",
        "único": "Única",
        "por demanda": "Por demanda",
        "nao se aplica": "Não se aplica",
        "não se aplica": "Não se aplica",
    }
    return canonical.get(lower, cleaned)


def split_executors(val: Any) -> list[str] | None:
    """
    Extrai lista normalizada de áreas executoras da ARPE.
    Divide por '/', ';', ',' ou conjunção ' e ' (palavra inteira).
    """
    text = clean_cell(val)
    if not text:
        return None
    parts = re.split(r"\s*[/;,]\s*|\s+e\s+", text)
    normalized = [re.sub(r"\s+", " ", part).strip() for part in parts if part and part.strip()]
    return normalized or None


def parse_hybrid_date(val: Any) -> tuple[date | None, str | None]:
    """
    Trata colunas híbridas de prazo:
    - Se for data válida -> (date, None)
    - Se for texto regulatório ('Não se aplica', '90 dias') -> (None, texto)
    - Se for vazio -> (None, None)
    """
    text = clean_cell(val)
    if not text:
        return None, None
    parsed = parse_date(val)
    if parsed is not None:
        return parsed, None
    return None, text


def build_concession_header_map(headers: list[Any]) -> dict[str, int]:
    """
    Localiza dinamicamente os índices das colunas da aba 'Concessão'.
    Lida com colunas duplicadas na planilha ao vivo (ex.: duas colunas chamadas 'SEI').
    """
    col_map: dict[str, int] = {}

    single_field_aliases = {
        "mrae": "mrae",
        "instrumento": "instrument",
        "clausula": "clause",
        "fase": "phase",
        "grupos tematicos": "thematic_group",
        "acao": "description",
        "natureza": "nature",
        "etapa previa": "prior_step",
        "prazo da etapa previa": "prior_step_deadline",
        "responsavel": "primary_responsible",
        "executor (areas da arpe)": "department",
        "prazo contratual da arpe": "contractual_deadline_text",
        "periodicidade": "periodicity",
        "prazo inicial": "start_date",
        "prazo final": "deadline",
        "prazo inicial realizado": "actual_start_date",
        "prazo final realizado": "actual_end_date",
        "status da acao": "status",
        "observacoes": "observations",
        "resumo do objeto": "object_summary",
        "data de entrada da arpe": "arpe_entry_date",
        "data de final da arpe": "arpe_final_date",
        "status": "arpe_status",
        "sei 2": "sei_2",
        "resumo": "summary",
    }

    for idx, raw_header in enumerate(headers):
        norm = normalize_header(raw_header)
        if not norm:
            continue
        if norm == "sei":
            if "sei_number" not in col_map:
                col_map["sei_number"] = idx
            elif "sei_2" not in col_map:
                col_map["sei_2"] = idx
            continue

        mapped_field = single_field_aliases.get(norm)
        if mapped_field and mapped_field not in col_map:
            col_map[mapped_field] = idx

    missing = [req for req in ("mrae", "description") if req not in col_map]
    if missing:
        raise ValueError(
            "Estrutura da aba 'Concessão' inválida: colunas obrigatórias ausentes "
            f"({', '.join(missing)})."
        )

    return col_map


def _build_source_row_key(
    mrae: str | None,
    instrument: str | None,
    clause: str | None,
    description: str,
    occurrence: int,
) -> str:
    raw = "|".join([mrae or "", instrument or "", clause or "", description, str(occurrence)])
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:32]


def parse_concession_sheet(rows: list[list[Any]]) -> list[dict[str, Any]]:
    """
    Converte a matriz bruta da aba 'Concessão' em registros normalizados para persistência.
    """
    if not rows:
        return []

    col_map = build_concession_header_map(rows[0])
    activities: list[dict[str, Any]] = []
    occurrence_counter: Counter[tuple[str, str, str, str]] = Counter()

    def read_field(row: list[Any], field: str) -> str | None:
        idx = col_map.get(field)
        if idx is None:
            return None
        return get_cell(row, idx)

    for row in rows[1:]:
        if all(clean_cell(cell) is None for cell in row):
            continue

        description = read_field(row, "description")
        if not description:
            continue

        mrae = normalize_mrae(read_field(row, "mrae"))
        instrument = read_field(row, "instrument")
        clause = read_field(row, "clause")
        phase = read_field(row, "phase")
        thematic_group = read_field(row, "thematic_group")
        nature = read_field(row, "nature")
        prior_step = read_field(row, "prior_step")
        prior_step_deadline, prior_step_deadline_text = parse_hybrid_date(
            read_field(row, "prior_step_deadline")
        )
        primary_responsible = normalize_responsible(read_field(row, "primary_responsible"))
        department = split_executors(read_field(row, "department"))
        contractual_deadline_text = read_field(row, "contractual_deadline_text")
        periodicity = normalize_periodicity(read_field(row, "periodicity"))
        start_date, initial_deadline_text = parse_hybrid_date(read_field(row, "start_date"))
        deadline, final_deadline_text = parse_hybrid_date(read_field(row, "deadline"))
        actual_start_date, _ = parse_hybrid_date(read_field(row, "actual_start_date"))
        actual_end_date, _ = parse_hybrid_date(read_field(row, "actual_end_date"))
        status = normalize_concession_status(read_field(row, "status"))
        observations = read_field(row, "observations")
        sei_number = read_field(row, "sei_number")
        object_summary = read_field(row, "object_summary")
        arpe_entry_date, _ = parse_hybrid_date(read_field(row, "arpe_entry_date"))
        arpe_final_date, _ = parse_hybrid_date(read_field(row, "arpe_final_date"))
        arpe_status = read_field(row, "arpe_status")
        sei_2 = read_field(row, "sei_2")
        summary = read_field(row, "summary")

        identity_tuple = (mrae or "", instrument or "", clause or "", description)
        occurrence_counter[identity_tuple] += 1
        source_row_key = _build_source_row_key(
            mrae, instrument, clause, description, occurrence_counter[identity_tuple]
        )

        activities.append(
            {
                "source_row_key": source_row_key,
                "mrae": mrae,
                "instrument": instrument,
                "contract": instrument,
                "clause": clause,
                "phase": phase,
                "thematic_group": thematic_group,
                "group_item": thematic_group,
                "description": description,
                "nature": nature,
                "prior_step": prior_step,
                "prior_step_deadline": prior_step_deadline,
                "prior_step_deadline_text": prior_step_deadline_text,
                "primary_responsible": primary_responsible,
                "department": department,
                "contractual_deadline_text": contractual_deadline_text,
                "periodicity": periodicity,
                "start_date": start_date,
                "initial_deadline_text": initial_deadline_text,
                "deadline": deadline,
                "final_deadline_text": final_deadline_text,
                "actual_start_date": actual_start_date,
                "actual_end_date": actual_end_date,
                "status": status,
                "observations": observations,
                "sei_number": sei_number,
                "object_summary": object_summary,
                "arpe_entry_date": arpe_entry_date,
                "arpe_final_date": arpe_final_date,
                "arpe_status": arpe_status,
                "sei_2": sei_2,
                "summary": summary,
            }
        )

    return activities
