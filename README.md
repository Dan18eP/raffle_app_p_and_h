# Peace & Hope Raffle App

Aplicación full-stack para gestionar sorteos de obras de arte de la fundación **Peace & Hope for the Children of Colombia**.

## Stack

- **Backend**: FastAPI, SQLAlchemy, PostgreSQL, JWT + Argon2, Pandas/openpyxl
- **Frontend**: React + Vite, React Router, Axios, CSS vanilla

## Funcionalidades principales

- Gestión de obras de arte (CRUD + upload de imágenes con UUID)
- Gestión de participantes (CRUD individual, carga masiva vía CSV/Excel)
- Sorteo ponderado: `peso = tickets / (1 + ganancias_previas)`, máximo 4 obras por participante, exclusión de tickets=0 y obras ya sorteadas
- Panel de sorteo con countdown, confetti y efectos de sonido
- Multi-admin con JWT (Argon2 para contraseñas)
- Dashboard con estadísticas y búsqueda/paginación de participantes

## Modelos de datos

| Modelo | Campos clave |
|---|---|
| Admin | username, email, hashed_password, is_active |
| Participant | first_name, last_name, document_id (único), tickets, email |
| Artwork | name, artist, image_url |
| RaffleResult | participant_id, artwork_id, won_at |

## Endpoints principales

- `POST /login` — login admin, retorna JWT
- `POST /admins/bootstrap` — crear primer admin (sin auth)
- `POST /participants/`, `/bulk`, `/upload` (CSV/Excel), `GET /`, `/count`, `GET/PUT/DELETE /{id}`
- `POST /artworks/` (con imagen), `/bulk`, `GET /`, `/count`, `GET/PUT/DELETE /{id}`
- `POST /raffle/run` (sortea una obra), `POST /raffle/test` (sortea todas)
- `GET /raffle/next`, `/awarded`, `/available-count`, `/last-result`

Todos los endpoints excepto `/login` y `/admins/bootstrap` requieren JWT (`Authorization: Bearer <token>`).

## Estructura del proyecto

```
raffle_app_p_and_h/
├── app/                  # Backend FastAPI
│   ├── main.py
│   ├── db/               # models, database, schemas
│   ├── routers/          # auth, admin, artworks, participants, raffle
│   ├── services/         # raffle.py (algoritmo), csv_loader.py
│   ├── utils/            # dependencies (get_current_admin, get_db)
│   └── static/artworks/  # imágenes subidas (UUID)
└── frontend/             # React + Vite
    └── src/
        ├── pages/         # Login, Dashboard, Participants, Artworks, Raffle, Admin
        ├── components/     # ProtectedRoute, Sidebar, SessionBanner
        └── services/api.js # cliente Axios + JWT interceptor
```

## Instalación

### Backend
```bash
cd app
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
# Crear .env con DB_*, SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
python db/init_db.py
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm install
# Crear .env con VITE_API_URL=http://localhost:8000
npm run dev
```

API: `http://localhost:8000` (docs en `/docs`) · Frontend: `http://localhost:5173`

## Seguridad

- Contraseñas: Argon2 (time_cost=2, memory_cost=65536)
- JWT: HS256, payload `{sub, exp, iat}`
- CORS restringido a `localhost:5173`
- ORM parametrizado (SQLAlchemy) contra SQL injection
- Validación de uploads por MIME type, archivos guardados con UUID

## Pendientes / mejoras futuras

Rate limiting, logging completo, tests unitarios, Docker, notificaciones por email, backups automáticos, dashboard de analytics, 2FA, audit trail, exportación de resultados.

---
**Fundación**: Peace & Hope for the Children of Colombia · **Desarrollador**: Daniel Echeverría
