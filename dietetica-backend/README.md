# Sistema de gestión — Dietética familiar
## Backend · Node.js + Express + Prisma + PostgreSQL

---

## Instalación

### 1. Requisitos previos
- Node.js 18+
- PostgreSQL 14+

### 2. Clonar e instalar dependencias
```bash
cd backend
npm install
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env
# Editar .env con tus datos de conexión a PostgreSQL
```

### 4. Crear la base de datos en PostgreSQL
```sql
CREATE DATABASE dietetica_db;
```

### 5. Ejecutar migraciones
```bash
npx prisma migrate dev --name init
```

### 6. Poblar con datos iniciales
```bash
npm run db:seed
```

### 7. Iniciar el servidor
```bash
npm run dev        # desarrollo (con hot-reload)
npm start          # producción
```

El servidor corre en `http://localhost:3001`

---

## Credenciales de prueba
| Rol           | Email                   | Contraseña    |
|---------------|-------------------------|---------------|
| Administrador | admin@dietetica.com     | admin123      |
| Empleado      | laura@dietetica.com     | empleado123   |

---

## Referencia de la API

### Autenticación
Todos los endpoints (excepto `/api/auth/login`) requieren el header:
```
Authorization: Bearer <token>
```

| Método | Endpoint        | Descripción                  | Rol     |
|--------|-----------------|------------------------------|---------|
| POST   | /api/auth/login | Login · devuelve JWT         | Público |
| GET    | /api/auth/me    | Perfil del usuario actual    | Todos   |

### Productos
| Método | Endpoint              | Descripción                        | Rol     |
|--------|-----------------------|------------------------------------|---------|
| GET    | /api/productos        | Listar (con filtros y búsqueda)    | Todos   |
| GET    | /api/productos/:id    | Detalle de un producto             | Todos   |
| POST   | /api/productos        | Crear producto                     | Todos   |
| PATCH  | /api/productos/:id    | Editar producto                    | Todos   |
| DELETE | /api/productos/:id    | Desactivar producto (soft delete)  | Admin   |

**Query params GET /api/productos:**
- `buscar` — texto libre (nombre, marca, descripción)
- `categoriaId` — filtrar por categoría
- `activo` — `true` / `false`
- `stockBajo` — `true` para productos bajo mínimo

### Ventas
| Método | Endpoint     | Descripción                             | Rol   |
|--------|--------------|-----------------------------------------|-------|
| GET    | /api/ventas  | Historial de ventas (con filtros)       | Admin |
| POST   | /api/ventas  | Registrar venta (descuenta stock)       | Todos |

**Body POST /api/ventas:**
```json
{
  "productoId": 1,
  "cantidad": 3,
  "precioVenta": 1900,     // opcional, usa el del producto si no se envía
  "observaciones": "..."   // opcional
}
```

### Stock
| Método | Endpoint                  | Descripción                              | Rol   |
|--------|---------------------------|------------------------------------------|-------|
| GET    | /api/stock/movimientos    | Historial de movimientos                 | Todos |
| POST   | /api/stock/ingresos       | Registrar ingreso de mercadería          | Todos |
| POST   | /api/stock/ajuste         | Ajuste manual de stock (inventario)      | Admin |

**Body POST /api/stock/ingresos:**
```json
{
  "productoId": 5,
  "cantidad": 20,
  "precioReferencia": 1850,  // opcional, actualiza precio de compra
  "observaciones": "Factura 001234"
}
```

### Reportes (solo administrador)
| Método | Endpoint                  | Descripción                             |
|--------|---------------------------|-----------------------------------------|
| GET    | /api/reportes/resumen     | Métricas del dashboard                  |
| GET    | /api/reportes/ventas      | Ventas del período con desglose diario  |
| GET    | /api/reportes/ranking     | Ranking de productos                    |
| GET    | /api/reportes/ganancias   | Ganancia por categoría                  |
| GET    | /api/reportes/alertas     | Stock bajo + sin movimiento             |

**Query params comunes:**
- `periodo` — `dia` | `semana` | `mes`
- `desde` / `hasta` — fechas YYYY-MM-DD (alternativo a periodo)

**GET /api/reportes/ranking:**
- `tipo` — `unidades` | `facturacion` | `ganancia`
- `limit` — número de resultados (default 10)

### Categorías
| Método | Endpoint         | Descripción         | Rol   |
|--------|------------------|---------------------|-------|
| GET    | /api/categorias  | Listar categorías   | Todos |
| POST   | /api/categorias  | Crear categoría     | Admin |

### Usuarios
| Método | Endpoint          | Descripción           | Rol   |
|--------|-------------------|-----------------------|-------|
| GET    | /api/usuarios     | Listar usuarios       | Admin |
| POST   | /api/usuarios     | Crear usuario         | Admin |
| PATCH  | /api/usuarios/:id | Editar usuario        | Admin |

---

## Estructura del proyecto
```
backend/
├── prisma/
│   ├── schema.prisma     ← Modelo de datos
│   └── seed.js           ← Datos iniciales
├── src/
│   ├── app.js            ← Express + middlewares + rutas
│   ├── index.js          ← Arranque del servidor
│   ├── middleware/
│   │   └── auth.js       ← JWT + control de roles
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── usuario.routes.js
│   │   ├── categoria.routes.js
│   │   ├── producto.routes.js
│   │   ├── venta.routes.js
│   │   ├── stock.routes.js
│   │   └── reporte.routes.js
│   └── utils/
│       └── prisma.js     ← Cliente Prisma singleton
├── .env.example
├── package.json
└── README.md
```

---

## Scripts útiles
```bash
npm run db:migrate    # Crear/actualizar tablas en la BD
npm run db:seed       # Poblar con datos de prueba
npm run db:studio     # Abrir Prisma Studio (interfaz visual de la BD)
npm run db:reset      # Borrar todo y recargar desde cero
```
