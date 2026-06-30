from datetime import datetime, date
import openpyxl
from fastapi import UploadFile, HTTPException

def parse_excel_projects(file: UploadFile) -> list[dict]:
    try:
        # Load workbook
        wb = openpyxl.load_workbook(file.file, data_only=True)
        sheet = wb.active
        if not sheet:
            raise HTTPException(status_code=400, detail="A planilha está vazia.")
        
        # Read rows
        rows = list(sheet.iter_rows(values_only=True))
        if not rows:
            raise HTTPException(status_code=400, detail="A planilha não contém dados.")
            
        # Find the header row
        header_row_idx = -1
        headers = []
        for idx, row in enumerate(rows[:15]): # scan first 15 rows to find headers
            row_str = [str(cell).lower().strip() if cell is not None else "" for cell in row]
            if any("descri" in cell and "resumida" in cell for cell in row_str) or \
               (any("sei" == cell for cell in row_str) and any("setor" in cell or "respons" in cell for cell in row_str)):
                headers = row_str
                header_row_idx = idx
                break
        
        if header_row_idx == -1:
            raise HTTPException(
                status_code=400,
                detail="Não foi possível encontrar o cabeçalho da planilha. Certifique-se de que a planilha possui as colunas 'Descrição Resumida', 'SEI', 'Setor Responsável', etc."
            )
            
        # Map headers to indices
        col_map = {
            "description": -1,
            "sei_number": -1,
            "department": -1,
            "start_date": -1,
            "deadline": -1,
            "working_days": -1,
            "new_date": -1,
            "status": -1,
            "observations": -1
        }
        
        for idx, header in enumerate(headers):
            if "descri" in header and "resumida" in header:
                col_map["description"] = idx
            elif header == "sei":
                col_map["sei_number"] = idx
            elif "setor" in header or "respons" in header:
                col_map["department"] = idx
            elif "data" in header and ("início" in header or "inicio" in header):
                col_map["start_date"] = idx
            elif "prazo" in header and ("final" in header or "fim" in header):
                col_map["deadline"] = idx
            elif "dias" in header and "corrid" in header:
                col_map["working_days"] = idx
            elif "novo" in header and "prazo" in header:
                col_map["new_date"] = idx
            elif "status" in header:
                col_map["status"] = idx
            elif "observ" in header:
                col_map["observations"] = idx

        # Verify required columns
        if col_map["description"] == -1:
            raise HTTPException(
                status_code=400,
                detail="A coluna 'Descrição Resumida' é obrigatória e não foi encontrada."
            )
        
        parsed_data = []
        
        # Iterate over data rows
        for row in rows[header_row_idx + 1:]:
            # Check if row is empty
            if all(cell is None for cell in row):
                continue
                
            desc_val = row[col_map["description"]] if col_map["description"] != -1 and col_map["description"] < len(row) else None
            
            # If description is empty, we skip the row
            if not desc_val or str(desc_val).strip() == "":
                continue
                
            description = str(desc_val).strip()
            
            # SEI
            sei_val = row[col_map["sei_number"]] if col_map["sei_number"] != -1 and col_map["sei_number"] < len(row) else None
            sei_number = str(sei_val).strip() if sei_val is not None else None
            
            # Department (array of strings)
            dept_val = row[col_map["department"]] if col_map["department"] != -1 and col_map["department"] < len(row) else None
            department = None
            if dept_val is not None:
                dept_str = str(dept_val)
                # Normalize delimiters (commas, slashes, semi-colons)
                dept_str = dept_str.replace(";", ",").replace("/", ",")
                department = [d.strip() for d in dept_str.split(",") if d.strip()]
                
            # Helper to parse dates
            def parse_date(val):
                if val is None:
                    return None
                if isinstance(val, (datetime, date)):
                    if isinstance(val, datetime):
                        return val.date()
                    return val
                val_str = str(val).strip()
                for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%Y/%m/%d"):
                    try:
                        return datetime.strptime(val_str, fmt).date()
                    except ValueError:
                        pass
                return None
                
            start_date = parse_date(row[col_map["start_date"]]) if col_map["start_date"] != -1 and col_map["start_date"] < len(row) else None
            
            deadline_val = row[col_map["deadline"]] if col_map["deadline"] != -1 and col_map["deadline"] < len(row) else None
            deadline = parse_date(deadline_val)
            # If deadline is "Imediato", we can set it to start_date
            if deadline is None and deadline_val is not None:
                if "imediato" in str(deadline_val).lower():
                    deadline = start_date
            
            # Working days
            wd_val = row[col_map["working_days"]] if col_map["working_days"] != -1 and col_map["working_days"] < len(row) else None
            working_days = None
            if wd_val is not None:
                try:
                    working_days = int(float(wd_val))
                except (ValueError, TypeError):
                    working_days = None
                    
            new_date = parse_date(row[col_map["new_date"]]) if col_map["new_date"] != -1 and col_map["new_date"] < len(row) else None
            
            # Status
            status_val = row[col_map["status"]] if col_map["status"] != -1 and col_map["status"] < len(row) else None
            status_str = str(status_val).strip() if status_val is not None else "Não Iniciado"
            # Normalize status
            if "conclu" in status_str.lower():
                status_str = "Concluído"
            elif "andamento" in status_str.lower() or "em_andamento" in status_str.lower():
                status_str = "Em andamento"
            else:
                status_str = "Não Iniciado"
                
            # Observations
            obs_val = row[col_map["observations"]] if col_map["observations"] != -1 and col_map["observations"] < len(row) else None
            observations = str(obs_val).strip() if obs_val is not None else None
            
            parsed_data.append({
                "description": description,
                "sei_number": sei_number,
                "department": department,
                "start_date": start_date,
                "deadline": deadline,
                "working_days": working_days,
                "new_date": new_date,
                "status": status_str,
                "observations": observations
            })
            
        return parsed_data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao processar a planilha: {str(e)}")
