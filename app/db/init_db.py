from app.db.database import engine, Base
from app.db.models import * # importa los modelos para registrar tablas en Base.metadata

print("Creating database tables...")

Base.metadata.create_all(bind=engine)

print("Database tables created successfully.")