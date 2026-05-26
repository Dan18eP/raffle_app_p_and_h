# app/services/csv_loader.py
import pandas as pd
from sqlalchemy.orm import Session
from app.db import models

def load_participants_from_file(file_path: str, db: Session) -> dict:
    """
    Loads participants and their tickets from CSV or Excel into the database.
    Supports merging participants by full_name and global ticket uniqueness.
    """
    if file_path.endswith(".csv"):
        df = pd.read_csv(file_path)
    elif file_path.endswith((".xls", ".xlsx")):
        df = pd.read_excel(file_path)
    else:
        raise ValueError("Unsupported file format")

    df.columns = df.columns.str.strip().str.lower()
    
    # Mapping for flexible column names
    col_map = {
        "full_name": ["full_name", "nombre_completo", "nombre", "participante", "comprador", "cliente", "persona"],
        "ticket_number": ["ticket_number", "ticket", "boleta", "numero_boleta", "nro_boleta", "nro", "numero", "id_boleta"]
    }
    
    actual_cols = {}
    for standard, options in col_map.items():
        for opt in options:
            if opt in df.columns:
                actual_cols[standard] = opt
                break
    
    if "full_name" not in actual_cols or "ticket_number" not in actual_cols:
        raise ValueError(f"Missing required columns. Expected something like 'full_name' and 'ticket_number'. Found: {list(df.columns)}")

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
            # Remove decimals if pandas read them from Excel (e.g. "1.0")
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
