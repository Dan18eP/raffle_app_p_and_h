# app/services/csv_loader.py
import pandas as pd
import unicodedata
from sqlalchemy.orm import Session
from app.db import models

def strip_accents(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s)
                  if unicodedata.category(c) != 'Mn')

def clean_header(h):
    # Convierte a string, quita espacios, acentos y símbolos
    h = strip_accents(str(h)).strip().lower()
    for char in ['#', '°', 'nro', 'num', '.', ':', '_', ' ', '-', '(', ')']:
        h = h.replace(char, '')
    return h.strip()

def load_participants_from_file(file_path: str, db: Session) -> dict:
    """
    Carga participantes y sus boletas desde CSV o Excel.
    Implementa un 'Header Hunter' para encontrar las columnas correctas
    incluso si hay filas vacías o títulos al inicio del archivo.
    """
    if file_path.endswith(".csv"):
        df = pd.read_csv(file_path)
    elif file_path.endswith((".xls", ".xlsx")):
        df = pd.read_excel(file_path)
    else:
        raise ValueError("Unsupported file format")

    # Mapping for flexible column names (sin acentos ni símbolos)
    col_map = {
        "full_name": ["fullname", "nombrecompleto", "nombre", "participante", "comprador", "compradores", "cliente", "persona"],
        "ticket_number": ["ticketnumber", "ticket", "boleta", "numeroboleta", "nroboleta", "boletas", "nro", "numero", "idboleta", "talonario"]
    }
    
    actual_cols = {}
    
    # --- SMART HEADER HUNTER ---
    # Buscamos en las primeras 10 filas del archivo por si los encabezados no están en la fila 1
    for i in range(10):
        cleaned_cols = {clean_header(col): col for col in df.columns if not str(col).lower().startswith('unnamed')}
        
        # Intentar encontrar mapeo para ambos campos requeridos
        temp_map = {}
        for standard, options in col_map.items():
            # 1. Coincidencia exacta
            for opt in options:
                if opt in cleaned_cols:
                    temp_map[standard] = cleaned_cols[opt]
                    break
            
            # 2. Búsqueda por sub-cadena si no se encontró exacta
            if standard not in temp_map:
                for clean_h, original_col in cleaned_cols.items():
                    if any(opt in clean_h for opt in options):
                        temp_map[standard] = original_col
                        break
        
        # ¿Encontramos ambos?
        if "full_name" in temp_map and "ticket_number" in temp_map:
            actual_cols = temp_map
            break
            
        # Si no encontramos y aún hay filas, bajamos una fila (usamos la fila 0 como nuevos nombres de columnas)
        if i < 9 and len(df) > 0:
            df.columns = df.iloc[0]
            df = df[1:].reset_index(drop=True)
        else:
            # Si llegamos al final sin éxito, lanzamos el error original con contexto
            detected = [str(c) for c in df.columns]
            raise ValueError(f"No se encontró la columna de 'Comprador' o 'Boleta'. Columnas analizadas en fila {i+1}: {detected}")

    stats = {
        "participants_created": 0,
        "participants_reused": 0,
        "tickets_created": 0,
        "errors": []
    }

    # Cache for the current session to avoid repeated DB queries for the same name in a single file
    participant_cache = {} # full_name -> id

    for index, row in df.iterrows():
        try:
            name = str(row[actual_cols["full_name"]]).strip()
            raw_ticket = str(row[actual_cols["ticket_number"]]).strip()

            if not name or name.lower() == "nan" or not raw_ticket or raw_ticket.lower() == "nan":
                continue

            # Validate and format ticket
            if "." in raw_ticket:
                raw_ticket = raw_ticket.split(".")[0]
                
            if not raw_ticket.isdigit():
                stats["errors"].append({
                    "row": index + 2,
                    "ticket_number": raw_ticket,
                    "error": f"La boleta '{raw_ticket}' debe ser numérica"
                })
                continue
            
            ticket_num = raw_ticket.zfill(4)

            # 1. Get or create participant
            p_id = participant_cache.get(name)
            if not p_id:
                db_p = db.query(models.Participant).filter(models.Participant.full_name == name).first()
                if db_p:
                    p_id = db_p.id
                    stats["participants_reused"] += 1
                else:
                    new_p = models.Participant(full_name=name)
                    db.add(new_p)
                    db.flush() # Ensure we get an ID
                    p_id = new_p.id
                    stats["participants_created"] += 1
                participant_cache[name] = p_id

            # 2. Attempt to create ticket (Global uniqueness check)
            exists_t = db.query(models.Ticket).filter(models.Ticket.ticket_number == ticket_num).first()
            if exists_t:
                stats["errors"].append({
                    "row": index + 2,
                    "ticket_number": ticket_num,
                    "error": f"Ticket number '{ticket_num}' already exists globally"
                })
                continue

            new_t = models.Ticket(
                participant_id=p_id,
                ticket_number=ticket_num,
                status=models.TicketStatus.ELIGIBLE
            )
            db.add(new_t)
            stats["tickets_created"] += 1

        except Exception as e:
            stats["errors"].append({
                "row": index + 2,
                "error": str(e)
            })

    db.commit()
    return stats
