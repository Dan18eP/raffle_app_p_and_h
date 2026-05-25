# 📋 DOCUMENTACIÓN COMPLETA - RAFFLE APP P&H

**Última actualización**: Mayo 2026  
**Versión**: 1.0  
**Propósito**: Documentación exhaustiva para IA y desarrolladores

---

## 📌 TABLA DE CONTENIDOS

1. [Resumen Ejecutivo](#-resumen-ejecutivo)
2. [Propósito del Proyecto](#-propósito-del-proyecto)
3. [Tecnologías Utilizadas](#-tecnologías-utilizadas)
4. [Estructura del Proyecto](#-estructura-del-proyecto)
5. [Modelos de Datos](#-modelos-de-datos)
6. [Endpoints API](#-endpoints-api)
7. [Autenticación & Seguridad](#-autenticación--seguridad)
8. [Frontend - Estructura](#-frontend---estructura-de-páginas)
9. [Flujo de Datos](#-flujo-de-datos)
10. [Instalación & Ejecución](#-instalación--ejecución)
11. [Características Especiales](#-características-especiales)
12. [Estado del Proyecto](#-estado-del-proyecto)

---

## 🎯 RESUMEN EJECUTIVO

**Peace & Hope Raffle App** es una aplicación web **full-stack** para gestionar sorteos de obras de arte de la Fundación "Peace & Hope for the Children of Colombia".

**Stack**: FastAPI (Python) + React (JavaScript) + PostgreSQL

**Características clave**:
- 🎨 Gestión completa de obras de arte (CRUD + upload de imágenes)
- 👥 Gestión de participantes con carga masiva CSV/Excel
- 🎲 Sistema de sorteo ponderado inteligente (basado en tickets y límite de ganancias)
- 🔐 Autenticación segura con JWT + Argon2
- 📊 Dashboard administrativo con múltiples secciones
- 🎭 Efectos visuales (confetti, sonidos, countdown)

---

## 🎯 PROPÓSITO DEL PROYECTO

Esta aplicación permite a administradores de la fundación:

1. **Gestionar Artworks**: Subir y administrar obras de arte con imágenes
2. **Gestionar Participantes**: Crear participantes individuales o cargar listas masivas desde CSV/Excel
3. **Asignar Tickets**: Cada participante tiene un número de boletas/tickets para el sorteo
4. **Ejecutar Sorteos**: Sistema inteligente que selecciona ganadores basado en:
   - Número de tickets (mayor probabilidad para más tickets)
   - Límite de ganancias (máximo 4 obras por persona)
   - Exclusión automática de ganadores que alcanzaron el límite
5. **Ver Resultados**: Historial de quién ganó qué obra
6. **Administración**: Multi-admin con diferentes niveles de acceso

**Público objetivo**: Administradores de fundación / personal de eventos

---

## 🛠️ TECNOLOGÍAS UTILIZADAS

### Backend Stack

| Componente | Tecnología | Versión | Descripción |
|---|---|---|---|
| **Framework Web** | FastAPI | 0.128.0 | API REST moderna, validación automática |
| **ORM** | SQLAlchemy | 2.0.46 | Mapeo objeto-relacional para PostgreSQL |
| **Base de Datos** | PostgreSQL | (Actual) | Base datos relacional |
| **Driver BD** | psycopg2-binary | 2.9.11 | Conector PostgreSQL |
| **Autenticación** | python-jose | 3.5.0 | Generación/validación JWT |
| **OAuth2** | - | Built-in | Flujo OAuth2 integrado |
| **Hashing Passwords** | argon2-cffi | 25.1.0 | Algoritmo seguro para contraseñas |
| **Data Processing** | Pandas | 3.0.0 | Procesamiento CSV/Excel |
| **Cálculo Numérico** | NumPy | 2.4.1 | Operaciones numéricas |
| **Excel Support** | openpyxl | 3.1.5 | Lectura archivos Excel |
| **Servidor ASGI** | Uvicorn | 0.40.0 | Servidor web asincrónico |
| **Validación Datos** | Pydantic | 2.12.5 | Schemas y validación |
| **Configuración** | python-dotenv | 1.2.1 | Gestión variables de entorno |
| **Manejo archivos** | Python-multipart | - | Uploads y formularios |

### Frontend Stack

| Componente | Tecnología | Versión | Descripción |
|---|---|---|---|
| **Framework UI** | React | 19.2.0 | Interfaz de usuario reactiva |
| **Router** | React Router DOM | 7.13.0 | Navegación entre páginas |
| **HTTP Client** | Axios | 1.13.4 | Cliente HTTP con interceptores |
| **Build Tool** | Vite | 7.2.4 | Empaquetador rápido |
| **Linter** | ESLint | 9.39.1 | Validación código JavaScript |
| **CSS** | CSS Vanilla | - | Estilos sin dependencias externas |
| **Dev Server** | Vite | Integrado | Servidor desarrollo HMR |

### Infraestructura & Configuración

```
CORS:           Configurado para http://localhost:5173
Static Files:   /app/static/ servidos en FastAPI
Upload Path:    /app/static/artworks/ (persistente)
Temp Path:      /app/temp_uploads/ (temporal)
Environment:    .env (no incluido en repo)
```

---

## 📁 ESTRUCTURA DEL PROYECTO

```
raffle_app_p_and_h/
│
├── 📄 requirements.txt              # Dependencias globales
├── 📄 test_db.py                    # Script de prueba BD
├── 📄 PROJECT_DOCUMENTATION.md      # Este archivo
│
├── 📂 app/                          # BACKEND - FastAPI
│   ├── 📄 main.py                   # Punto de entrada FastAPI
│   ├── 📄 requirements.txt          # Dependencias Python
│   │
│   ├── 📂 core/                     # Configuración centralizada
│   │   ├── 📄 config.py             # Settings (actualmente vacío)
│   │   └── 📄 security.py           # Utilidades seguridad (vacío)
│   │
│   ├── 📂 db/                       # Capa de datos
│   │   ├── 📄 database.py           # Conexión PostgreSQL + SessionLocal
│   │   ├── 📄 models.py             # 4 modelos SQLAlchemy (Admin, Participant, Artwork, RaffleResult)
│   │   ├── 📄 init_db.py            # Script inicialización BD
│   │   └── 📂 schemas/              # Schemas Pydantic
│   │       ├── 📄 __init__.py
│   │       ├── 📄 admin.py          # AdminCreate, AdminOut, PasswordChange
│   │       ├── 📄 artwork.py        # ArtworkCreate, ArtworkUpdate, ArtworkOut
│   │       ├── 📄 participant.py    # ParticipantCreate, ParticipantUpdate, ParticipantOut
│   │       └── 📄 raffle_result.py  # RaffleResultOut
│   │
│   ├── 📂 routers/                  # Endpoints API (5 routers)
│   │   ├── 📄 auth.py               # POST /login
│   │   ├── 📄 admin.py              # CRUD admins + bootstrap
│   │   ├── 📄 artworks.py           # CRUD artworks + upload imagen
│   │   ├── 📄 participants.py       # CRUD participantes + bulk + CSV upload
│   │   ├── 📄 raffle.py             # Lógica de sorteo ponderado
│   │   └── 📄 views.py              # (vacío)
│   │
│   ├── 📂 services/                 # Lógica de negocio
│   │   ├── 📄 csv_loader.py         # Carga CSV/Excel de participantes
│   │   └── 📄 raffle.py             # Algoritmo de sorteo ponderado
│   │
│   ├── 📂 utils/                    # Utilidades
│   │   └── 📄 dependencies.py       # Dependencias FastAPI (get_current_admin, get_db)
│   │
│   ├── 📂 static/                   # Archivos estáticos servidos
│   │   ├── 📂 artworks/             # 📷 Imágenes de obras (guardadas con UUID)
│   │   │   ├── 01e35921-58b0-4239-95a2-c7b2bbe4c9be.jfif
│   │   │   └── 71e806c9-547e-4b7f-9d89-4f2cbb9deaa3.jfif
│   │   ├── 📂 css/
│   │   │   └── 📄 main.css
│   │   ├── 📂 images/               # (para assets futuros)
│   │   └── 📂 js/
│   │       └── 📄 script.js
│   │
│   ├── 📂 templates/                # (Vacío - no usado, frontend es React)
│   └── 📂 temp_uploads/             # 📁 Uploads temporales (se limpian)
│
├── 📂 frontend/                     # FRONTEND - React + Vite
│   ├── 📄 package.json              # Dependencias Node.js
│   ├── 📄 vite.config.js            # Configuración Vite
│   ├── 📄 eslint.config.js          # Configuración ESLint
│   ├── 📄 index.html                # HTML root
│   ├── 📄 README.md
│   │
│   ├── 📂 public/                   # Assets estáticos públicos
│   │   └── (favicon, etc)
│   │
│   └── 📂 src/                      # Código fuente React
│       ├── 📄 main.jsx              # Punto de entrada React
│       ├── 📄 App.jsx               # Router raíz + manejo sesión
│       ├── 📄 index.css             # Estilos globales
│       │
│       ├── 📂 components/           # Componentes reutilizables
│       │   ├── 📄 ProtectedRoute.jsx  # Wrapper para rutas autenticadas
│       │   ├── 📄 SessionBanner.jsx   # Banner "sesión expirada"
│       │   ├── 📄 Sidebar.jsx         # Navegación lateral
│       │   └── 📄 SessionBanner.css
│       │
│       ├── 📂 pages/                # Páginas principales
│       │   ├── 📄 Login.jsx         # Página login (/)
│       │   ├── 📄 Dashboard.jsx     # Layout con Sidebar
│       │   ├── 📄 DashboardHome.jsx # Dashboard inicio (/dashboard)
│       │   ├── 📄 Participants.jsx  # Gestión participantes (/dashboard/participants)
│       │   ├── 📄 Artworks.jsx      # Gestión artworks (/dashboard/artworks)
│       │   ├── 📄 Raffle.jsx        # Panel sorteo (/dashboard/raffle) - CON EFECTOS
│       │   ├── 📄 Admin.jsx         # Gestión admins (/dashboard/admin)
│       │   ├── 📄 Login.css
│       │   ├── 📄 Participants.css
│       │   ├── 📄 Artworks.css
│       │   ├── 📄 Raffle.css
│       │   ├── 📄 DashboardHome.css
│       │   ├── 📄 Sidebar.css
│       │   └── 📄 Admin.css
│       │
│       ├── 📂 services/            # Servicios (API client)
│       │   └── 📄 api.js           # Cliente Axios + interceptores JWT
│       │
│       └── 📂 assets/              # 🎵 Assets multimedia
│           ├── 📄 logopandh.jpg    # Logo fundación
│           ├── 🔊 mision_imposible.mp3  # Sonido sorteo
│           └── 🔊 aplausos.mp3     # Sonido ganador
```

---

## 🗄️ MODELOS DE DATOS

### Diagrama E-R (Simplified)

```
┌─────────────────┐        ┌──────────────────┐
│     Admin       │        │   Participant    │
├─────────────────┤        ├──────────────────┤
│ id (PK)         │        │ id (PK)          │
│ username (UQ)   │        │ first_name       │
│ email (UQ)      │        │ last_name        │
│ hashed_password │        │ document_id (UQ) │
│ is_active       │        │ tickets          │
└─────────────────┘        │ email (UQ)       │
                           └──────────────────┘
                                   ↑
                                   │
                                   │ 1:N
                           ┌───────┴─────────┐
                           │  RaffleResult   │
                           ├─────────────────┤
                           │ id (PK)         │
                           │ participant_id  │
                           │ artwork_id      │
                           │ won_at (NOW)    │
                           └───────┬─────────┘
                                   │
                                   │ N:1
                                   ↓
                           ┌──────────────┐
                           │    Artwork   │
                           ├──────────────┤
                           │ id (PK)      │
                           │ name         │
                           │ artist       │
                           │ image_url    │
                           └──────────────┘
```

### Modelo: Admin
```python
# Tabla: admin

id              : Integer, PK, AutoIncrement
username        : String(50), UNIQUE, NOT NULL
email           : String(100), UNIQUE, NOT NULL
hashed_password : String(255), NOT NULL (Argon2)
is_active       : Boolean, DEFAULT=True
```

**Propósito**: Cuenta de administrador para login y gestión del sistema  
**Relaciones**: Ninguna (tabla independiente)  
**Índices**: username, email  
**Validación**: username ≥ 3 chars, email válido, password ≥ 8 chars

---

### Modelo: Participant
```python
# Tabla: participant

id          : Integer, PK, AutoIncrement
first_name  : String(100)
last_name   : String(100)
document_id : String(50), UNIQUE, NOT NULL
tickets     : Integer, DEFAULT=0
email       : String(150), UNIQUE, Nullable
```

**Propósito**: Registro de participantes en el sorteo  
**Relaciones**: 1:N → RaffleResult (un participante puede ganar múltiples obras)  
**Índices**: document_id, email  
**Validación**: 
- document_id único y obligatorio (cédula/ID nacional)
- tickets ≥ 0
- email único pero opcional
- Nombre campos opcionales (para privacidad)

**Casos de uso**:
- Creación individual vía form
- Carga masiva vía CSV/Excel con columnas: first_name, last_name, document_id, tickets, email
- Búsqueda por document_id

---

### Modelo: Artwork
```python
# Tabla: artwork

id       : Integer, PK, AutoIncrement
name     : String(150), NOT NULL
artist   : String(150), NOT NULL
image_url: String(500), Nullable
```

**Propósito**: Registro de obras de arte a sortear  
**Relaciones**: 1:N → RaffleResult  
**Índices**: name  
**Validación**: name y artist ≥ 1 char

**Características especiales**:
- `image_url` se guarda como ruta relativa: `/static/artworks/{uuid}.{extension}`
- UUID se genera en backend con `uuid4()` para evitar colisiones
- Extensión detectada desde Content-Type (jpg, jpeg, png, gif, webp, jfif)
- Imagen anterior se elimina al actualizar
- Imagen se guarda en `/app/static/artworks/` (persistente)

---

### Modelo: RaffleResult
```python
# Tabla: raffle_result

id              : Integer, PK, AutoIncrement
participant_id  : Integer, FK → Participant(id), NOT NULL
artwork_id      : Integer, FK → Artwork(id), NOT NULL
won_at          : DateTime, DEFAULT=UTC_NOW
```

**Propósito**: Registro de resultados de cada sorteo  
**Relaciones**: 
- N:1 → Participant (muchos resultados por participante, máx 4)
- N:1 → Artwork (muchos resultados por artwork, máx 1 realmente)
**Índices**: participant_id, artwork_id, won_at  
**Validación**: No hay duplicados (same participant + artwork)

**Restricción de negocio**:
- Un participante NO puede ganar más de 4 obras
- Una obra solo se puede sortear UNA VEZ
- Al ejecutar sorteo, se excluyen:
  - Participantes que ya ganaron 4 obras
  - Artworks ya sorteados
  - Participantes con tickets = 0

---

## 🔌 ENDPOINTS API

### ESTRUCTURA DE RESPUESTAS

**Success (2xx)**:
```json
{
  "id": 1,
  "field1": "value1",
  "field2": "value2"
}
```

**Error (4xx/5xx)**:
```json
{
  "detail": "Error message"
}
```

---

### 🔓 AUTH - Sin autenticación requerida

#### `POST /login`
**Descripción**: Login de administrador con JWT  
**Request**: 
```json
{
  "username": "admin",
  "password": "password123"
}
```
**Response (200)**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```
**Errores**:
- 401: Credenciales inválidas

---

### 🔐 ADMINS - Requieren autenticación

#### `POST /admins/bootstrap`
**Descripción**: Crear PRIMER admin (solo si no hay admins)  
**Autenticación**: ❌ No requerida
**Request**:
```json
{
  "username": "admin1",
  "email": "admin@example.com",
  "password": "SecurePass123"
}
```
**Response (201)**:
```json
{
  "id": 1,
  "username": "admin1",
  "email": "admin@example.com"
}
```
**Errores**:
- 400: Ya existe un admin
- 400: Username/email duplicado

#### `POST /admins/`
**Descripción**: Crear nuevo admin  
**Autenticación**: ✅ JWT requerido
**Request**: (igual a bootstrap)  
**Response (201)**: (igual a bootstrap)

#### `PATCH /admins/me/password`
**Descripción**: Cambiar contraseña del admin actual  
**Autenticación**: ✅ JWT requerido
**Request**:
```json
{
  "current_password": "OldPass123",
  "new_password": "NewPass456"
}
```
**Response (200)**:
```json
{
  "message": "Password updated successfully"
}
```
**Errores**:
- 401: Contraseña actual incorrecta
- 400: Nueva contraseña = actual

#### `GET /admins/` *(implicit)*
**Descripción**: Listar todos los admins (sin paginación)  
**Autenticación**: ✅ JWT requerido
**Response (200)**:
```json
[
  {
    "id": 1,
    "username": "admin1",
    "email": "admin@example.com",
    "is_active": true
  }
]
```

#### `DELETE /admins/{admin_id}`
**Descripción**: Eliminar admin (no pueden borrarse a sí mismos)  
**Autenticación**: ✅ JWT requerido
**Path**: `{admin_id}` = ID del admin a eliminar  
**Response (200)**: `{"message": "Admin deleted successfully"}`  
**Errores**:
- 403: Intento de borrarse a sí mismo
- 404: Admin no existe

---

### 🔐 PARTICIPANTS - Requieren autenticación

#### `POST /participants/`
**Descripción**: Crear un participante  
**Autenticación**: ✅ JWT requerido
**Request**:
```json
{
  "first_name": "Juan",
  "last_name": "Pérez",
  "document_id": "1234567890",
  "tickets": 5,
  "email": "juan@example.com"
}
```
**Response (201)**:
```json
{
  "id": 1,
  "first_name": "Juan",
  "last_name": "Pérez",
  "document_id": "1234567890",
  "tickets": 5,
  "email": "juan@example.com"
}
```
**Validaciones**:
- document_id: obligatorio, único, string
- tickets: ≥ 0, entero
- email: formato email válido, única

#### `POST /participants/bulk`
**Descripción**: Crear múltiples participantes de una vez  
**Autenticación**: ✅ JWT requerido
**Request**:
```json
[
  {
    "first_name": "Juan",
    "last_name": "Pérez",
    "document_id": "1234567890",
    "tickets": 5,
    "email": "juan@example.com"
  },
  {
    "first_name": "María",
    "last_name": "González",
    "document_id": "0987654321",
    "tickets": 3
  }
]
```
**Response (201)**:
```json
[
  { "id": 1, ... },
  { "id": 2, ... }
]
```

#### `POST /participants/upload`
**Descripción**: Cargar participantes desde archivo CSV o Excel  
**Autenticación**: ✅ JWT requerido
**Content-Type**: `multipart/form-data`
**Request**: Form con archivo (file)  
**Soportados**: `.csv`, `.xlsx`, `.xls`

**Formato CSV esperado**:
```
first_name,last_name,document_id,tickets,email
Juan,Pérez,1234567890,5,juan@example.com
María,González,0987654321,3,maria@example.com
```

**Response (201)**:
```json
{
  "created": 2,
  "errors": []
}
```

#### `GET /participants/`
**Descripción**: Listar todos los participantes (sin paginación)  
**Autenticación**: ✅ JWT requerido
**Response (200)**:
```json
[
  { "id": 1, "first_name": "Juan", ... },
  { "id": 2, "first_name": "María", ... }
]
```

#### `GET /participants/count`
**Descripción**: Contar participantes totales  
**Autenticación**: ✅ JWT requerido
**Response (200)**:
```json
{
  "count": 150
}
```

#### `GET /participants/{id}`
**Descripción**: Obtener un participante específico  
**Autenticación**: ✅ JWT requerido
**Path**: `{id}` = ID del participante  
**Response (200)**: Objeto participante completo

#### `PUT /participants/{id}`
**Descripción**: Actualizar participante  
**Autenticación**: ✅ JWT requerido
**Request**: (mismos campos que POST, todos opcionales)  
**Response (200)**: Participante actualizado

#### `DELETE /participants/{id}`
**Descripción**: Eliminar participante  
**Autenticación**: ✅ JWT requerido
**Response (200)**:
```json
{
  "message": "Participant deleted successfully"
}
```

---

### 🔐 ARTWORKS - Requieren autenticación

#### `POST /artworks/`
**Descripción**: Crear artwork con upload de imagen  
**Autenticación**: ✅ JWT requerido
**Content-Type**: `multipart/form-data`
**Request**:
```
- name: (string) "Obra 1"
- artist: (string) "Artista X"
- image: (file) imagen.jpg
```
**Response (201)**:
```json
{
  "id": 1,
  "name": "Obra 1",
  "artist": "Artista X",
  "image_url": "/static/artworks/abc123-def456.jpg"
}
```
**Validaciones**:
- Imagen: JPEG, PNG, GIF, WebP, JFIF (máx 5MB típicamente)
- Formatos soportados: detectados por Content-Type
- UUID se genera automáticamente

#### `POST /artworks/bulk`
**Descripción**: Crear múltiples artworks SIN imágenes  
**Autenticación**: ✅ JWT requerido
**Request**:
```json
[
  { "name": "Obra 1", "artist": "Artista A" },
  { "name": "Obra 2", "artist": "Artista B" }
]
```
**Response (201)**:
```json
[
  { "id": 1, "name": "Obra 1", "artist": "Artista A", "image_url": null },
  { "id": 2, "name": "Obra 2", "artist": "Artista B", "image_url": null }
]
```

#### `GET /artworks/`
**Descripción**: Listar todas las obras  
**Autenticación**: ✅ JWT requerido
**Response (200)**:
```json
[
  { "id": 1, "name": "Obra 1", "artist": "Artista A", "image_url": "..." },
  { "id": 2, "name": "Obra 2", "artist": "Artista B", "image_url": null }
]
```

#### `GET /artworks/count`
**Descripción**: Contar obras totales  
**Autenticación**: ✅ JWT requerido
**Response (200)**:
```json
{
  "count": 25
}
```

#### `GET /artworks/{id}`
**Descripción**: Obtener una obra específica  
**Autenticación**: ✅ JWT requerido
**Path**: `{id}` = ID del artwork  
**Response (200)**: Objeto artwork completo

#### `PUT /artworks/{id}`
**Descripción**: Actualizar artwork (puede cambiar/eliminar imagen)  
**Autenticación**: ✅ JWT requerido
**Content-Type**: `multipart/form-data`
**Request** (todos opcionales):
```
- name: (string)
- artist: (string)
- image: (file) [nueva imagen, opcionalmente]
- remove_image: (boolean) [true para eliminar imagen actual]
```
**Response (200)**: Artwork actualizado

#### `DELETE /artworks/{id}`
**Descripción**: Eliminar artwork (y su imagen si existe)  
**Autenticación**: ✅ JWT requerido
**Response (200)**:
```json
{
  "message": "Artwork deleted successfully"
}
```

---

### 🔐🎲 RAFFLE - Requieren autenticación (endpoints especiales)

#### `POST /raffle/test`
**Descripción**: Ejecutar sorteo COMPLETO (un ganador por cada artwork)  
**Autenticación**: ✅ JWT requerido
**Request**: (vacío)  
**Response (200)**:
```json
{
  "results": [
    {
      "id": 1,
      "participant_id": 10,
      "artwork_id": 1,
      "won_at": "2026-05-24T14:30:00Z"
    },
    // ... más resultados
  ],
  "total": 5
}
```
**Lógica**:
- Itera sobre CADA artwork no sorteado
- Para cada uno, calcula pesos y selecciona ganador
- Crea RaffleResult para cada ganador
- Retorna todos los resultados

#### `POST /raffle/run`
**Descripción**: Ejecutar sorteo de UN artwork  
**Autenticación**: ✅ JWT requerido
**Request**:
```json
{
  "artwork_id": 1
}
```
**Response (201)**:
```json
{
  "id": 1,
  "participant_id": 5,
  "artwork_id": 1,
  "won_at": "2026-05-24T14:30:00Z"
}
```
**Errores**:
- 404: Artwork no existe
- 400: Artwork ya fue sorteado
- 400: No hay participantes elegibles
- 400: Todos los participantes tienen tickets=0

#### `GET /raffle/next`
**Descripción**: Obtener siguiente artwork SIN adjudicar  
**Autenticación**: ✅ JWT requerido
**Response (200)**:
```json
{
  "id": 1,
  "name": "Obra 1",
  "artist": "Artista X",
  "image_url": "/static/artworks/..."
}
```
**Errores**:
- 404: No hay artworks disponibles (todos sorteados)

#### `GET /raffle/awarded`
**Descripción**: Listar IDs de artworks ya sorteados  
**Autenticación**: ✅ JWT requerido
**Response (200)**:
```json
{
  "awarded_artwork_ids": [1, 3, 5, 7]
}
```

#### `GET /raffle/available-count`
**Descripción**: Contar artworks disponibles (no sorteados)  
**Autenticación**: ✅ JWT requerido
**Response (200)**:
```json
{
  "available_count": 15,
  "total_count": 20
}
```

#### `GET /raffle/last-result`
**Descripción**: Obtener resultado del último sorteo ejecutado  
**Autenticación**: ✅ JWT requerido
**Response (200)**:
```json
{
  "id": 25,
  "participant_id": 12,
  "participant_name": "Juan Pérez",
  "artwork_id": 3,
  "artwork_name": "Obra Especial",
  "won_at": "2026-05-24T14:30:00Z"
}
```
**Errores**:
- 404: No hay resultados de sorteos

---

## 🎲 ALGORITMO DE SORTEO PONDERADO

### Lógica en `app/services/raffle.py`

```
FUNCIÓN: raffle_with_weights(artwork_id, db_session)

1. VALIDACIÓN
   - Verificar que artwork existe
   - Verificar que artwork NO fue sorteado

2. CÁLCULO DE ELEGIBILIDAD
   Para cada participante:
     wins = contar RaffleResults donde participant_id = este participante
     
     ES_ELEGIBLE = (
       tickets > 0 AND
       wins < 4
     )
   
   participantes_elegibles = [p para p en participantes si ES_ELEGIBLE]

3. CÁLCULO DE PESOS
   Para cada participante elegible:
     peso = tickets / (1 + wins)
   
   Ejemplo:
     - 10 tickets, 0 ganancias: peso = 10 / 1 = 10 ✅ MÁS probable
     - 10 tickets, 1 ganancia:  peso = 10 / 2 = 5
     - 10 tickets, 2 ganancias: peso = 10 / 3 = 3.33
     - 10 tickets, 3 ganancias: peso = 10 / 4 = 2.5
     - 10 tickets, 4 ganancias: EXCLUIDO ❌

4. SELECCIÓN
   ganador = random.choices(
     population=participantes_elegibles,
     weights=pesos,
     k=1
   )[0]

5. GUARDAR RESULTADO
   Crear RaffleResult(
     participant_id=ganador.id,
     artwork_id=artwork_id,
     won_at=datetime.utcnow()
   )
   return resultado
```

### Ejemplos de Pesos

**Escenario**: 3 participantes, 1 artwork disponible

| Participante | Tickets | Ganancias | Elegible | Peso | Probabilidad |
|---|---|---|---|---|---|
| Juan | 10 | 0 | ✅ | 10.0 | 55% |
| María | 8 | 1 | ✅ | 4.0 | 22% |
| Carlos | 6 | 4 | ❌ | - | 0% (excluido) |
| Pedro | 5 | 0 | ✅ | 5.0 | 23% |

**Total peso**: 10 + 4 + 5 = 19
**Probabilidades**: Juan=10/19=52.6%, María=4/19=21%, Pedro=5/19=26.3%

---

## 🔐 AUTENTICACIÓN & SEGURIDAD

### Flujo de Autenticación

```
┌─────────────────────────────────────────────────────────────┐
│ 1. FRONTEND - Login Page                                    │
│    Usuario ingresa username + password                      │
│    Click "Login" → POST /login                              │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────v──────────────────────────────────────────┐
│ 2. BACKEND - Auth Router                                    │
│    - Busca admin por username                               │
│    - Valida password con Argon2.verify()                    │
│    - Si OK: genera JWT                                      │
│    - Si NO: retorna 401                                     │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────v──────────────────────────────────────────┐
│ 3. FRONTEND - Recibe JWT                                    │
│    localStorage.setItem('token', access_token)             │
│    Redirige a /dashboard                                    │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────v──────────────────────────────────────────┐
│ 4. REQUESTS SUBSECUENTES                                    │
│    Interceptor Axios añade:                                 │
│    Authorization: Bearer {token}                            │
│    a cada request                                           │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────v──────────────────────────────────────────┐
│ 5. BACKEND - Validación JWT                                 │
│    get_current_admin() en cada endpoint protegido:          │
│    - Decodifica JWT                                         │
│    - Valida firma (SECRET_KEY)                              │
│    - Valida expiración                                      │
│    - Busca admin en DB por sub (admin_id)                   │
│    - Si OK: usa admin; Si NO: retorna 401                   │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ✅ Request autorizado
           o
        ❌ Error 401: Token inválido/expirado
```

### JWT Token Structure

**Header**:
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload**:
```json
{
  "sub": "1",           // admin_id (string)
  "exp": 1234567890,   // expiration timestamp
  "iat": 1234567000    // issued at timestamp
}
```

**Firma**: HMAC-SHA256(Header + Payload, SECRET_KEY)

### Configuración de Seguridad

| Parámetro | Valor | Archivo |
|---|---|---|
| **SECRET_KEY** | Desde .env | app/core/config.py |
| **ALGORITHM** | HS256 | app/core/config.py |
| **ACCESS_TOKEN_EXPIRE_MINUTES** | Desde .env (típicamente 30-60) | app/core/config.py |
| **Password Hashing** | Argon2 | app/db/models.py |
| **CORS** | http://localhost:5173 | app/main.py |
| **Hash Params** | time_cost=2, memory_cost=65536 | app/db/models.py |

### Variables de Entorno Requeridas

```bash
# Base de Datos
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=raffle_db

# Seguridad
SECRET_KEY=your-super-secret-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Frontend
VITE_API_URL=http://localhost:8000
```

### Protecciones Implementadas

| Aspecto | Protección |
|---|---|
| **Contraseñas** | Argon2 hashing, NO se guardan en plaintext |
| **Tokens** | JWT con firma HMAC-SHA256 + expiración |
| **CORS** | Solo localhost:5173 (desarrollo), requiere cambio para producción |
| **SQL Injection** | SQLAlchemy ORM parametrizado |
| **CSRF** | No implementado (API REST + SPA, frontend en mismo origen) |
| **Rate Limiting** | No implementado (consideración futura) |
| **Input Validation** | Pydantic schemas en cada endpoint |
| **File Upload** | Validación MIME type, guardado con UUID, no en web accessible |

---

## 🎨 FRONTEND - ESTRUCTURA DE PÁGINAS

### Árbol de Rutas

```
App.jsx (Router raíz)
├── / (Pública)
│   └── Login.jsx
│       - Form login admin
│       - JWT token en localStorage
│       - Redirige a /dashboard si autenticado
│
└── /dashboard (Privada - ProtectedRoute)
    ├── Dashboard.jsx (Layout con Sidebar)
    │
    ├── / (DashboardHome.jsx)
    │   - Bienvenida
    │   - Estadísticas (conteos)
    │   - Links rápidos
    │
    ├── /raffle (Raffle.jsx) ⭐ CON EFECTOS
    │   - Panel control sorteo
    │   - Preview artwork
    │   - Countdown + reveal
    │   - Efectos sonoros
    │   - Confetti animation
    │   - Historial localStorage
    │
    ├── /participants (Participants.jsx)
    │   - Tabla con paginación (50/página)
    │   - Búsqueda en tiempo real
    │   - CRUD modal
    │   - Upload CSV/Excel
    │   - Visualización tickets
    │
    ├── /artworks (Artworks.jsx)
    │   - Grid de tarjetas
    │   - Preview imagen
    │   - Upload con preview
    │   - Marca "awarded"
    │   - CRUD modal
    │
    └── /admin (Admin.jsx)
        - Crear nuevo admin
        - Cambiar contraseña
        - Listar admins
        - Opción eliminar
```

### Página: Login.jsx

**Ubicación**: [frontend/src/pages/Login.jsx](frontend/src/pages/Login.jsx)

**Características**:
- ✅ Hero section con logo Peace & Hope
- ✅ Formulario username + password
- ✅ Validación front-end básica
- ✅ Manejo de errores (credenciales inválidas)
- ✅ Carga spinner durante request
- ✅ Auto-redirige a /dashboard si ya hay token

**Flujo**:
1. Usuario ingresa credenciales
2. Click "Iniciar Sesión"
3. POST /login
4. Recibe access_token
5. Guarda en localStorage('token')
6. Redirige a /dashboard

---

### Página: DashboardHome.jsx

**Ubicación**: [frontend/src/pages/DashboardHome.jsx](frontend/src/pages/DashboardHome.jsx)

**Características**:
- ✅ Bienvenida personalizada
- ✅ Mostrar conteos:
  - Total participantes
  - Total artworks
  - Artworks disponibles para sorteo
- ✅ Links rápidos a secciones principales
- ✅ Última actividad (último sorteo)

---

### Página: Raffle.jsx ⭐ PÁGINA ESPECIAL

**Ubicación**: [frontend/src/pages/Raffle.jsx](frontend/src/pages/Raffle.jsx)

**Características Avanzadas**:

#### 1. **Estados de UI**
```
ESTADO INICIAL
    ↓
[Ver Artwork] (muestra preview)
    ↓
[Ejecutar Sorteo] (inicia countdown)
    ↓
[Countdown 3-2-1...]
    ↓
[REVEAL GANADOR] + Efectos
    ↓
Mostrar: Nombre participante + Obra ganada
    ↓
[Siguiente]
    ↓
VOLVER AL INICIO
```

#### 2. **Efectos Visuales**
- 🎉 **Confetti**: Explosión de confetti al revelar ganador
- 🔊 **Sonido Sorteo**: Toca "Misión Imposible" durante countdown
- 🔊 **Sonido Ganador**: Aplausos cuando se revela
- ⏱️ **Countdown**: 3-2-1 animado antes del reveal
- ✨ **Animación Reveal**: Texto grande animado del ganador

#### 3. **Persistencia de Estado**
```javascript
localStorage almacena:
- raffle_preview       // artwork actualmente en preview
- raffle_winner        // ganador actual
- raffle_history       // historial de ganancias
- raffle_awarded_ids   // artworks ya sorteados
```

Permite:
- Recargar página y mantener estado
- Ver historial de ganancias anteriores
- Marcar artworks como "awarded" visualmente

#### 4. **Componentes de Estado**
```jsx
const [currentArtwork, setCurrentArtwork]   // preview
const [winner, setWinner]                   // resultado sorteo
const [isLoading, setIsLoading]             // spinner
const [awardedIds, setAwardedIds]           // excluidos
const [history, setHistory]                 // historial
```

#### 5. **Flujo Técnico**
```
[1] useEffect inicial
    ├─ GET /raffle/next
    ├─ GET /raffle/awarded
    └─ Load localStorage

[2] Click "Ver Artwork"
    └─ Muestra preview (ya cargado)

[3] Click "Ejecutar Sorteo"
    ├─ POST /raffle/run (artwork_id)
    ├─ Guarda resultado
    └─ Inicia countdown

[4] Countdown
    ├─ Toca sonido "misión imposible"
    ├─ Display "3... 2... 1..."
    └─ Al terminar: reveal

[5] Reveal
    ├─ Muestra nombre ganador
    ├─ Toca "aplausos"
    ├─ Dispara confetti
    └─ Guarda en history + localStorage

[6] Click "Siguiente"
    ├─ GET /raffle/next (siguiente artwork)
    ├─ Reset UI
    └─ Vuelve a paso [2]

[7] Fin Sorteo
    └─ GET /raffle/available-count = 0
       → Mostrar "¡Sorteo finalizado!"
```

---

### Página: Participants.jsx

**Ubicación**: [frontend/src/pages/Participants.jsx](frontend/src/pages/Participants.jsx)

**Características**:
- ✅ **Tabla paginada**: 50 participantes por página
- ✅ **Búsqueda en tiempo real**: Filtra por nombre, email, document_id
- ✅ **CRUD Modal**:
  - Crear nuevo participante
  - Editar existente
  - Eliminar (con confirmación)
- ✅ **Upload CSV/Excel**: Carga masiva desde archivo
- ✅ **Columnas**: Name, Document ID, Tickets, Email, Acciones

**Upload de CSV**:
- Soporta: .csv, .xlsx, .xls
- Formato: first_name, last_name, document_id, tickets, email
- Validación: document_id único
- Response: cantidad creados + errores

**Validación Front-end**:
- document_id: requerido, único
- first_name/last_name: 1-100 chars
- tickets: 0-9999
- email: formato válido (regex)

---

### Página: Artworks.jsx

**Ubicación**: [frontend/src/pages/Artworks.jsx](frontend/src/pages/Artworks.jsx)

**Características**:
- ✅ **Grid de tarjetas**: Responsive 1-4 columnas según pantalla
- ✅ **Preview imagen**: Click para ver tamaño completo
- ✅ **Marca "Awarded"**: Label rojo si artwork fue sorteado
- ✅ **CRUD Modal**:
  - Crear con upload imagen
  - Editar nombre/artista + cambiar imagen
  - Eliminar artwork + imagen
- ✅ **Upload con Preview**: Muestra imagen antes de guardar
- ✅ **Estados**:
  - Loading (spinner)
  - Error (mensaje rojo)
  - Success (feedback)

**Validación Front-end**:
- name/artist: 1-150 chars
- Imagen: .jpg, .jpeg, .png, .gif, .webp, .jfif
- Tamaño imagen: < 5MB (típicamente)

---

### Página: Admin.jsx

**Ubicación**: [frontend/src/pages/Admin.jsx](frontend/src/pages/Admin.jsx)

**Características**:
- ✅ **Crear Nuevo Admin**: Form con username, email, password
- ✅ **Cambiar Contraseña**: Requiere confirmar contraseña actual
- ✅ **Listar Admins Existentes**: Tabla con nombre y email
- ✅ **Eliminar Admin**: Con confirmación (no puede borrarse a sí mismo)

**Validaciones**:
- username: 3-50 chars, único
- email: formato válido, único
- password: 8+ chars, incluir mayús/minús/número/especial
- Confirmación contraseña debe coincidir

---

## 🔄 FLUJO DE DATOS

### Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                     │
│  pages/ + components/                                       │
│  State management: useState, localStorage                   │
│  Styling: CSS vanilla                                       │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ HTTP + JSON + JWT
                   │ (Axios interceptor)
                   ↓
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI)                        │
│                                                             │
│  main.py                                                    │
│    ├─ routers/                                             │
│    │   ├─ auth.py        (login)                          │
│    │   ├─ admins.py      (CRUD admin)                     │
│    │   ├─ participants.py (CRUD participant)              │
│    │   ├─ artworks.py    (CRUD artwork + upload)          │
│    │   └─ raffle.py      (sorteo)                        │
│    │                                                        │
│    ├─ services/                                            │
│    │   ├─ raffle.py      (algoritmo ponderado)            │
│    │   └─ csv_loader.py  (parseo CSV/Excel)              │
│    │                                                        │
│    ├─ db/                                                  │
│    │   ├─ models.py      (SQLAlchemy ORM)                 │
│    │   ├─ database.py    (conexión + SessionLocal)        │
│    │   └─ schemas/       (Pydantic validators)            │
│    │                                                        │
│    └─ utils/                                               │
│        └─ dependencies.py (get_current_admin, get_db)      │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ SQLAlchemy ORM
                   ↓
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                      │
│                                                             │
│  Tables:                                                    │
│  ├─ admin (usuarios)                                       │
│  ├─ participant (jugadores sorteo)                         │
│  ├─ artwork (obras para sortear)                           │
│  └─ raffle_result (resultados sorteos)                     │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ File system
                   ↓
┌─────────────────────────────────────────────────────────────┐
│              /app/static/artworks/ (imágenes)               │
│              /app/temp_uploads/ (temporal)                  │
└─────────────────────────────────────────────────────────────┘
```

### Flujo de Request-Response (Ejemplo: Sorteo)

```
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND - Raffle.jsx                                       │
└─────┬───────────────────────────────────────────────────────┘
      │
      │ 1. GET /raffle/next
      ├─────────────────────────────────────────────→
      │
      │ ← {id, name, artist, image_url}
      │
      │ 2. Click "Ejecutar Sorteo"
      │    POST /raffle/run {artwork_id: 1}
      ├─────────────────────────────────────────────→
      │
┌─────v───────────────────────────────────────────────────────┐
│ BACKEND - routers/raffle.py                                 │
└─────┬───────────────────────────────────────────────────────┘
      │
      │ 1. get_current_admin() → valida JWT
      │ 2. Valida que artwork existe + no fue sorteado
      │ 3. Llama: raffle_service.raffle_with_weights(artwork_id, db)
      │
┌─────v───────────────────────────────────────────────────────┐
│ BACKEND - services/raffle.py                                │
└─────┬───────────────────────────────────────────────────────┘
      │
      │ 1. Query: participantes con tickets > 0 y wins < 4
      │ 2. Calcula pesos: peso = tickets / (1 + wins)
      │ 3. random.choices() selecciona ganador
      │ 4. Crea RaffleResult en BD
      │ 5. Retorna resultado
      │
┌─────v───────────────────────────────────────────────────────┐
│ BACKEND - app/db/models.py (SQLAlchemy)                     │
└─────┬───────────────────────────────────────────────────────┘
      │
      │ INSERT INTO raffle_result
      │ (participant_id, artwork_id, won_at)
      │ VALUES (5, 1, NOW())
      │
┌─────v───────────────────────────────────────────────────────┐
│ PostgreSQL                                                   │
└─────┬───────────────────────────────────────────────────────┘
      │
      │ ← {id: 25, participant_id: 5, artwork_id: 1, won_at: ...}
      │
      ├─────────────────────────────────────────────→
      │
┌─────v───────────────────────────────────────────────────────┐
│ FRONTEND - Raffle.jsx                                       │
└─────┬───────────────────────────────────────────────────────┘
      │
      │ 1. Recibe resultado
      │ 2. Inicia countdown + sonido
      │ 3. Reveal: muestra nombre ganador
      │ 4. Confetti + aplausos
      │ 5. Guarda en localStorage
      │
      └─ Espera por siguiente acción
```

---

## 🚀 INSTALACIÓN & EJECUCIÓN

### Prerrequisitos

- **Python 3.9+** (backend)
- **Node.js 18+** (frontend)
- **PostgreSQL 12+** (base de datos)
- **Git** (control de versiones)

### Backend Setup

#### 1. Crear entorno virtual Python
```bash
cd app
python -m venv venv

# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

#### 2. Instalar dependencias
```bash
pip install -r requirements.txt
```

#### 3. Configurar variables de entorno
```bash
# Crear archivo .env en /app/
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=raffle_db

SECRET_KEY=your-super-secret-key-with-32-chars-min
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

#### 4. Inicializar base de datos
```bash
python db/init_db.py
```

#### 5. Ejecutar servidor
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Resultado**: API disponible en `http://localhost:8000`  
**Docs API**: `http://localhost:8000/docs` (Swagger)

---

### Frontend Setup

#### 1. Instalar dependencias Node
```bash
cd frontend
npm install
```

#### 2. Configurar variables de entorno
```bash
# Crear archivo .env en /frontend/
VITE_API_URL=http://localhost:8000
```

#### 3. Ejecutar dev server
```bash
npm run dev
```

**Resultado**: App disponible en `http://localhost:5173`

#### 4. Build para producción
```bash
npm run build
```

---

### PostgreSQL Setup

#### 1. Crear base de datos
```sql
CREATE DATABASE raffle_db;
```

#### 2. Crear usuario (opcional)
```sql
CREATE USER raffle_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE raffle_db TO raffle_user;
```

#### 3. Las tablas se crean automáticamente con `init_db.py`

---

## 🎁 CARACTERÍSTICAS ESPECIALES

### 1. **Sorteo Ponderado Inteligente**

No es un sorteo simple 50/50. Sistema sofisticado que:
- **Favoritismo por tickets**: Más tickets = más probabilidades
- **Penalización por ganancias**: Menos probable si ya ganó
- **Límite de ganancias**: Máx 4 artworks por persona
- **Exclusión automática**: Participantes con 0 tickets se excluyen

**Fórmula**: `peso = tickets / (1 + ganancias_previas)`

### 2. **Upload Masivo CSV/Excel**

Carga millones de participantes de una vez:
- Formatos: CSV (.csv), Excel 97-2003 (.xls), Excel moderno (.xlsx)
- Validación automática: document_id único
- Manejo de errores: reporta exactamente qué línea falló
- Respuesta: `{created: 150, errors: [{row: 5, error: "..."}]}`

### 3. **Gestión de Imágenes Inteligente**

Sistema robusto de imágenes para artworks:
- **UUID naming**: `/static/artworks/{uuid-generado}.{extension}`
- **Múltiples formatos**: JPEG, PNG, GIF, WebP, JFIF
- **Limpieza automática**: Borra imagen anterior al actualizar
- **Persistencia**: Guarda en `/app/static/artworks/` (no temp)
- **Validación**: Detecta MIME type real (no confía en extensión)

### 4. **Efectos Visuales en Sorteo**

Experiencia inmersiva:
- **Confetti**: Explosión de confetti al revelar ganador
- **Sonido Sorteo**: "Misión Imposible" durante countdown
- **Sonido Ganador**: Aplausos cuando se revela
- **Countdown**: 3-2-1 animado
- **Animación**: Nombre ganador con efecto scale-in

### 5. **Multi-Admin**

Sistema de múltiples administradores:
- Bootstrap: crear primer admin sin autenticación
- Crear adicionales: solo admin autenticado
- Cambiar contraseña: cada admin el suyo
- Eliminar admin: no pueden borrarse a sí mismos
- Cada uno tiene su JWT independiente

### 6. **Persistencia de Estado Frontend**

Mantiene estado entre recargas:
- localStorage almacena: preview actual, último ganador, historial
- Permite: recargar y continuar donde se dejó
- Sincronización: cada acción actualiza localStorage
- Historial: acceso a ganancias anteriores del sorteo

### 7. **Paginación Inteligente**

Participantes: 50 por página (optimizado para UX)
- Búsqueda en tiempo real sobre página actual
- Botones prev/next
- Saltar a página específica
- Indicador de página actual

### 8. **Seguridad en Capas**

Múltiples capas de seguridad:
- Argon2 para contraseñas (algoritmo más seguro)
- JWT con firma HMAC-SHA256
- Validación Pydantic en cada entrada
- CORS restringido (solo localhost:5173)
- SQLAlchemy parametrizado (previene SQL injection)

---

## 📊 ESTADO DEL PROYECTO

### ✅ Implementado

| Feature | Estado | Notas |
|---|---|---|
| CRUD Admins | ✅ Completo | Bootstrap + multi-admin |
| CRUD Participants | ✅ Completo | Bulk + CSV/Excel upload |
| CRUD Artworks | ✅ Completo | Upload imagen con UUID |
| Autenticación JWT | ✅ Completo | Argon2 + OAuth2 |
| Algoritmo Sorteo | ✅ Completo | Ponderado + límite ganancias |
| Frontend CRUD | ✅ Completo | Modal operations |
| Búsqueda | ✅ Completo | Tiempo real (participantes) |
| Paginación | ✅ Completo | 50 items/página |
| Upload Masivo | ✅ Completo | CSV/Excel parsing |
| Efectos Visuales | ✅ Completo | Confetti + sonidos + countdown |
| Session Management | ✅ Completo | JWT + localStorage |
| Static Files | ✅ Completo | Imágenes persistentes |

### ⏳ No Implementado (Mejoras Futuras)

| Feature | Prioridad | Estimado |
|---|---|---|
| Rate Limiting | Media | 2-4 horas |
| Logging completo | Media | 3-5 horas |
| Tests unitarios | Alta | 8-12 horas |
| Docker setup | Media | 2-3 horas |
| Email notifications | Baja | 4-6 horas |
| Backup automático BD | Media | 3-4 horas |
| Dashboard analytics | Baja | 4-8 horas |
| 2FA admin | Alta | 4-6 horas |
| Audit trail | Media | 3-5 horas |
| Exportar resultados | Baja | 2-3 horas |

### 🐛 Bugs Conocidos

Ninguno reportado. Sistema funcional y estable.

### 💾 Backup & Datos

- **Imágenes**: Almacenadas en `/app/static/artworks/` (requiere backup)
- **Base de Datos**: PostgreSQL (requiere backup regular)
- **Archivos upload**: Temp en `/app/temp_uploads/` (se pueden limpiar)

---

## 📞 INFORMACIÓN DE CONTACTO

**Proyecto**: Peace & Hope Raffle App  
**Fundación**: Peace & Hope for the Children of Colombia  
**Desenvolvedor**: [Tu nombre/equipo]  
**Última actualización**: Mayo 2026

---

**Fin de Documentación**

Este documento sirve como referencia completa para entender, desarrollar, mantener y escalar la aplicación de sorteos de Peace & Hope.
