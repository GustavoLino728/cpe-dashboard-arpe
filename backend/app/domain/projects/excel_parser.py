import re
from datetime import date, datetime


def parse_date(val):
    if val is None:
        return None
    if isinstance(val, (datetime, date)):
        if isinstance(val, datetime):
            return val.date()
        return val

    val_str = str(val).strip()

    match = re.search(r"(\d{4}[/\-]\d{1,2}[/\-]\d{1,2})", val_str)
    if not match:
        match = re.search(r"(\d{1,2}[/\-]\d{1,2}[/\-]\d{4})", val_str)
    if not match:
        match = re.search(r"(\d{1,2}[/\-]\d{1,2}[/\-]\d{2})", val_str)
    if not match:
        match = re.search(r"(\d{2}[/\-]\d{1,2}[/\-]\d{1,2})", val_str)

    if match:
        val_str = match.group(1)

    for fmt in (
        "%d/%m/%Y",
        "%d/%m/%y",
        "%d-%m-%Y",
        "%d-%m-%y",
        "%Y-%m-%d",
        "%Y/%m/%d",
        "%y-%m-%d",
        "%y/%m/%d",
    ):
        try:
            return datetime.strptime(val_str, fmt).date()
        except ValueError:
            pass
    return None


def clean_cell(val):
    if val is None:
        return None
    text = str(val).strip()
    return text if text else None


def get_cell(row, idx):
    if idx < 0 or idx >= len(row):
        return None
    return clean_cell(row[idx])


def is_activity_step(step):
    if not step:
        return False
    return bool(re.match(r"^\d+(?:\.\d+)*$", str(step).strip()))


def is_non_activity_label(description):
    if not description:
        return True
    normalized = re.sub(r"\s+", " ", str(description).strip().lower())
    labels = {
        "atrasada",
        "atrasado",
        "a iniciar",
        "cancelada",
        "cancelado",
        "suspensa",
        "suspenso",
        "concluida",
        "concluída",
        "concluido",
        "concluído",
        "em andamento",
        "inventario",
        "inventário",
        "status",
    }
    return normalized in labels


def parse_sheet_activities(rows: list[list]) -> list[dict]:
    if not rows:
        return []

    header_row_idx = -1
    for idx, row in enumerate(rows[:15]):
        row_str = [str(c).lower().strip() if c is not None else "" for c in row]
        if "etapas" in row_str and "status" in row_str and any("respons" in c for c in row_str):
            header_row_idx = idx
            break

    if header_row_idx == -1:
        return []

    headers = [str(c).lower().strip() if c is not None else "" for c in rows[header_row_idx]]

    col_map = {
        "description": -1,
        "sei_number": -1,
        "department": -1,
        "start_date": 5,
        "deadline": 6,
        "new_date": 8,
        "status": -1,
        "observations": -1,
        "group_item": 0,
        "contract": 1,
        "step_number": 3,
        "actual_start_date": 7,
        "delay_justification_problem": 12,
        "delay_justification_action": 13,
        "delay_justification_responsible": 14,
    }

    for idx, header in enumerate(headers):
        if header == "etapas":
            col_map["description"] = idx
        elif header in ["cláusulas", "clausulas"]:
            col_map["sei_number"] = idx
        elif "respons" in header and "etapa" in header:
            col_map["department"] = idx
        elif header == "status":
            col_map["status"] = idx
        elif "observ" in header:
            col_map["observations"] = idx

    if col_map["description"] == -1:
        col_map["description"] = 4
    if col_map["department"] == -1:
        col_map["department"] = 9

    activities = []
    data_start_idx = header_row_idx + 1

    for row in rows[data_start_idx:]:
        if all(cell is None or str(cell).strip() == "" for cell in row):
            continue

        step_number = get_cell(row, col_map["step_number"])

        desc_val = get_cell(row, col_map["description"])
        if not desc_val and col_map["description"] != 4:
            desc_val = get_cell(row, 4)
        if not desc_val and step_number:
            for idx in range(col_map["step_number"] + 1, len(row)):
                candidate = get_cell(row, idx)
                if candidate:
                    desc_val = candidate
                    break

        if not desc_val:
            continue

        description = str(desc_val).strip()

        sei_number = get_cell(row, col_map["sei_number"]) if col_map["sei_number"] != -1 else None

        dept_val = get_cell(row, col_map["department"]) if col_map["department"] != -1 else None
        department = None
        if dept_val is not None:
            dept_str = str(dept_val).replace(";", ",").replace("/", ",")
            department = [d.strip() for d in dept_str.split(",") if d.strip()]

        start_date = parse_date(get_cell(row, col_map["start_date"]))
        deadline = parse_date(get_cell(row, col_map["deadline"]))
        new_date = parse_date(get_cell(row, col_map["new_date"]))

        status_val = get_cell(row, col_map["status"]) if col_map["status"] != -1 else None
        status_str = normalize_status(status_val)

        observations = get_cell(row, col_map["observations"]) if col_map["observations"] != -1 else None
        group_item = get_cell(row, col_map["group_item"])
        contract = get_cell(row, col_map["contract"])

        has_activity_shape = (
            is_activity_step(step_number)
            or contract is not None
            or department is not None
            or start_date is not None
            or deadline is not None
            or new_date is not None
            or observations is not None
        )
        if not has_activity_shape:
            continue
        if not is_activity_step(step_number) and is_non_activity_label(description):
            continue

        actual_start_date = parse_date(get_cell(row, col_map["actual_start_date"]))
        delay_justification_problem = get_cell(row, col_map["delay_justification_problem"])
        delay_justification_action = get_cell(row, col_map["delay_justification_action"])
        delay_justification_responsible = get_cell(row, col_map["delay_justification_responsible"])

        activities.append(
            {
                "description": description,
                "sei_number": sei_number,
                "department": department,
                "start_date": start_date,
                "deadline": deadline,
                "new_date": new_date,
                "status": status_str,
                "observations": observations,
                "group_item": group_item,
                "contract": contract,
                "step_number": step_number,
                "actual_start_date": actual_start_date,
                "delay_justification_problem": delay_justification_problem,
                "delay_justification_action": delay_justification_action,
                "delay_justification_responsible": delay_justification_responsible,
            }
        )

    return activities


def normalize_status(status_val):
    status_str = str(status_val).strip() if status_val is not None else "Não Iniciado"
    lower_status = status_str.lower()
    if "conclu" in lower_status:
        return "Concluído"
    if "andamento" in lower_status or "em_andamento" in lower_status:
        return "Em andamento"
    return "Não Iniciado"
