# CSV loading service

import pandas as pd
from sqlalchemy.orm import Session
from db import models


EXPECTED_COLUMNS = {
    "first_name",
    "last_name",
    "document_id",
    "tickets",
    "email",
}


def load_participants_from_file(
    file_path: str,
    db: Session
) -> dict:
    """
    Loads participants from CSV or Excel into the database.
    """

    if file_path.endswith(".csv"):
        df = pd.read_csv(file_path)
    elif file_path.endswith((".xls", ".xlsx")):
        df = pd.read_excel(file_path)
    else:
        raise ValueError("Unsupported file format")

    df.columns = df.columns.str.strip().str.lower()

    missing = EXPECTED_COLUMNS - set(df.columns)
    if missing:
        raise ValueError(f"Missing columns: {missing}")

    created = 0
    skipped = 0
    errors = []

    for index, row in df.iterrows():
        try:
            document_id = str(row["document_id"]).strip()

            if not document_id:
                skipped += 1
                continue

            exists = db.query(models.Participant).filter(
                models.Participant.document_id == document_id
            ).first()

            if exists:
                skipped += 1
                continue

            participant = models.Participant(
                first_name=str(row["first_name"]).strip(),
                last_name=str(row["last_name"]).strip(),
                document_id=document_id,
                tickets=int(row.get("tickets", 0)) if not pd.isna(row.get("tickets")) else 0,
                email=str(row.get("email")).strip() if not pd.isna(row.get("email")) else None
            )

            db.add(participant)
            created += 1

        except Exception as e:
            errors.append({
                "row": index + 1,
                "error": str(e)
            })

    db.commit()

    return {
        "created": created,
        "skipped": skipped,
        "errors": errors
    }