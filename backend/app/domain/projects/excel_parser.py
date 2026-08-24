from datetime import datetime, date

def parse_date(val):
    if val is None:
        return None
    if isinstance(val, (datetime, date)):
        if isinstance(val, datetime):
            return val.date()
        return val
    val_str = str(val).strip()
    for fmt in (
        "%d/%m/%Y", "%d/%m/%y",
        "%d-%m-%Y", "%d-%m-%y",
        "%Y-%m-%d", "%Y/%m/%d",
        "%y-%m-%d", "%y/%m/%d"
    ):
        try:
            return datetime.strptime(val_str, fmt).date()
        except ValueError:
            pass
    return None

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
        "start_date": -1,
        "deadline": -1,
        "new_date": -1,
        "status": -1,
        "observations": -1,
        "group_item": 0,
        "contract": 1,
        "step_number": 3,
        "actual_start_date": 7,
        "delay_justification_problem": 12,
        "delay_justification_action": 13,
        "delay_justification_responsible": 14
    }
    
    for idx, h in enumerate(headers):
        if h == "etapas":
            col_map["description"] = idx
        elif h in ["cláusulas", "clausulas"]:
            col_map["sei_number"] = idx
        elif "respons" in h and "etapa" in h:
            col_map["department"] = idx
        elif h == "status":
            col_map["status"] = idx
        elif "observ" in h:
            col_map["observations"] = idx
            
    col_map["start_date"] = 5
    col_map["deadline"] = 6
    col_map["new_date"] = 8
    
    if col_map["description"] == -1:
        col_map["description"] = 4
    if col_map["department"] == -1:
        col_map["department"] = 9

    activities = []
    
    data_start_idx = header_row_idx + 3
    
    for row in rows[data_start_idx:]:
        if all(cell is None or str(cell).strip() == "" for cell in row):
            continue
            
        desc_val = row[col_map["description"]] if col_map["description"] < len(row) else None
        if not desc_val or str(desc_val).strip() == "":
            continue
            
        description = str(desc_val).strip()
        
        sei_val = row[col_map["sei_number"]] if col_map["sei_number"] != -1 and col_map["sei_number"] < len(row) else None
        sei_number = str(sei_val).strip() if sei_val is not None else None
        
        dept_val = row[col_map["department"]] if col_map["department"] != -1 and col_map["department"] < len(row) else None
        department = None
        if dept_val is not None:
            dept_str = str(dept_val)
            dept_str = dept_str.replace(";", ",").replace("/", ",")
            department = [d.strip() for d in dept_str.split(",") if d.strip()]
            
        start_date = parse_date(row[col_map["start_date"]]) if col_map["start_date"] < len(row) else None
        deadline = parse_date(row[col_map["deadline"]]) if col_map["deadline"] < len(row) else None
        new_date = parse_date(row[col_map["new_date"]]) if col_map["new_date"] < len(row) else None
        
        status_val = row[col_map["status"]] if col_map["status"] != -1 and col_map["status"] < len(row) else None
        status_str = str(status_val).strip() if status_val is not None else "Não Iniciado"
        if "conclu" in status_str.lower():
            status_str = "Concluído"
        elif "andamento" in status_str.lower() or "em_andamento" in status_str.lower():
            status_str = "Em andamento"
        else:
            status_str = "Não Iniciado"
            
        obs_val = row[col_map["observations"]] if col_map["observations"] != -1 and col_map["observations"] < len(row) else None
        observations = str(obs_val).strip() if obs_val is not None else None
        
        group_item_val = row[col_map["group_item"]] if col_map["group_item"] < len(row) else None
        group_item = str(group_item_val).strip() if group_item_val is not None else None
        
        contract_val = row[col_map["contract"]] if col_map["contract"] < len(row) else None
        contract = str(contract_val).strip() if contract_val is not None else None
        
        step_val = row[col_map["step_number"]] if col_map["step_number"] < len(row) else None
        step_number = str(step_val).strip() if step_val is not None else None
        
        actual_start_date = parse_date(row[col_map["actual_start_date"]]) if col_map["actual_start_date"] < len(row) else None
        
        prob_val = row[col_map["delay_justification_problem"]] if col_map["delay_justification_problem"] < len(row) else None
        delay_justification_problem = str(prob_val).strip() if prob_val is not None else None
        
        act_val = row[col_map["delay_justification_action"]] if col_map["delay_justification_action"] < len(row) else None
        delay_justification_action = str(act_val).strip() if act_val is not None else None
        
        resp_val = row[col_map["delay_justification_responsible"]] if col_map["delay_justification_responsible"] < len(row) else None
        delay_justification_responsible = str(resp_val).strip() if resp_val is not None else None
        
        activities.append({
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
            "delay_justification_responsible": delay_justification_responsible
        })
        
    return activities
