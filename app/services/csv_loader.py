# app/services/csv_loader.py
import pandas as pd
import unicodedata
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.db import models

def strip_accents(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s)
                  if unicodedata.category(c) != 'Mn')

def clean_header(h):
    h = strip_accents(str(h)).strip().lower()
    for char in ['#', '°', 'nro', 'num', '.', ':', '_', ' ', '-', '(', ')']:
        h = h.replace(char, '')
    return h.strip()

def load_participants_from_file(file_path: str, db: Session) -> dict:
    """
    Carga masiva OPTIMIZADA. Reduce llamadas a BD usando mapas en memoria.
    """
    if file_path.endswith(".csv"):
        df = pd.read_csv(file_path)
    elif file_path.endswith((".xls", ".xlsx")):
        df = pd.read_excel(file_path)
    else:
        raise ValueError("Unsupported file format")

    col_map = {
        "full_name": ["fullname", "nombrecompleto", "nombre", "participante", "comprador", "compradores", "cliente", "persona"],
        "ticket_number": ["ticketnumber", "ticket", "boleta", "numeroboleta", "nroboleta", "boletas", "nro", "numero", "idboleta", "talonario"]
    }
    
    actual_cols = {}
    
    # 1. ENCONTRAR COLUMNAS (Header Hunter)
    found_headers = False
    for i in range(min(10, len(df))):
        cleaned_cols = {clean_header(col): col for col in df.columns if not str(col).lower().startswith('unnamed')}
        temp_map = {}
        for standard, options in col_map.items():
            for opt in options:
                if opt in cleaned_cols:
                    temp_map[standard] = cleaned_cols[opt]
                    break
            if standard not in temp_map:
                for clean_h, original_col in cleaned_cols.items():
                    if any(opt in clean_h for opt in options):
                        temp_map[standard] = original_col
                        break
        
        if "full_name" in temp_map and "ticket_number" in temp_map:
            actual_cols = temp_map
            found_headers = True
            break
        if i < 9 and len(df) > 0:
            df.columns = df.iloc[0]
            df = df[1:].reset_index(drop=True)

    if not found_headers:
        raise ValueError(f"No se encontró 'Comprador' o 'Boleta'. Columnas: {list(df.columns)}")

    # 2. PRE-PROCESAR DATOS DEL DATAFRAME
    # Limpiamos y normalizamos boletas para evitar duplicados en el mismo archivo
    df[actual_cols["full_name"]] = df[actual_cols["full_name"]].astype(str).str.strip()
    
    def normalize_ticket(val):
        s = str(val).strip()
        if "." in s: s = s.split(".")[0]
        return s.zfill(4) if s.isdigit() else None

    df['clean_ticket'] = df[actual_cols["ticket_number"]].apply(normalize_ticket)
    
    # Eliminar filas donde falta nombre o boleta inválida
    valid_df = df[df[actual_cols["full_name"]].notna() & (df['clean_ticket'].notnull())].copy()

    # 3. CARGAR DATOS EXISTENTES EN MEMORIA (Consultas Únicas)
    unique_names = valid_df[actual_cols["full_name"]].unique().tolist()
    unique_tickets = valid_df['clean_ticket'].unique().tolist()

    # Mapa de Participantes existentes: full_name -> id
    existing_participants = {p.full_name: p.id for p in db.query(models.Participant).filter(models.Participant.full_name.in_(unique_names)).all()}
    
    # Set de Tickets existentes para verificación rápida de unicidad global
    existing_ticket_nums = {t.ticket_number for t in db.query(models.Ticket.ticket_number).filter(models.Ticket.ticket_number.in_(unique_tickets)).all()}

    stats = {"participants_created": 0, "participants_reused": 0, "tickets_created": 0, "errors": []}
    
    new_participants_to_add = {} # name -> object
    new_tickets_to_add = []

    # 4. PROCESAR FILAS
    for index, row in valid_df.iterrows():
        name = row[actual_cols["full_name"]]
        ticket_num = row['clean_ticket']

        # Obtener ID del participante (existente, recién creado o pendiente de crear)
        p_id = existing_participants.get(name)
        
        if p_id is None:
            if name not in new_participants_to_add:
                new_p = models.Participant(full_name=name)
                new_participants_to_add[name] = new_p
                stats["participants_created"] += 1
            participant_obj = new_participants_to_add[name]
        else:
            stats["participants_reused"] += 1
            participant_obj = None # Ya existe en BD

        # Verificar unicidad de boleta
        if ticket_num in existing_ticket_nums:
            stats["errors"].append({"row": index + 2, "ticket_number": ticket_num, "error": "Boleta ya registrada globalmente"})
            continue
        
        # Crear ticket (si es participante nuevo, lo vinculamos al objeto; si no, al ID)
        if participant_obj:
            new_t = models.Ticket(ticket_number=ticket_num, status=models.TicketStatus.ELIGIBLE, participant=participant_obj)
        else:
            new_t = models.Ticket(ticket_number=ticket_num, status=models.TicketStatus.ELIGIBLE, participant_id=p_id)
        
        new_tickets_to_add.append(new_t)
        existing_ticket_nums.add(ticket_num) # Evitar duplicados en el mismo lote
        stats["tickets_created"] += 1

    # 5. GUARDAR TODO EN BLOQUE
    try:
        if new_participants_to_add:
            db.add_all(new_participants_to_add.values())
        if new_tickets_to_add:
            db.add_all(new_tickets_to_add)
        db.commit()
    except Exception as e:
        db.rollback()
        raise e

    return stats
