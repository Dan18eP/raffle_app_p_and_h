from app.db.database import engine

try:
    conn = engine.connect()
    print("Connected to database successfully")
    conn.close()
except Exception as e:
    print("Error:", e)
