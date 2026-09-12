# Plan de Implementación: Mercury MVP

## Sprint 1 — Definición

El Sprint 1 cubre las **Fases 0, 1 y 2** completas. Al terminar el Sprint 1, el equipo tiene:

- Monorepo configurado con pnpm workspaces, ESLint, TypeScript strict y Husky
- Docker Compose funcionando para desarrollo local (PostgreSQL + Redis)
- Pipeline CI/CD activo en GitHub Actions (lint → typecheck → test → build)
- API NestJS con estructura base, respuesta uniforme y Swagger docs
- Schema Prisma completo migrado, seed ejecutado y PrismaService inyectado

**Duración estimada:** 1 semana  
**Criterio de done del sprint:** `pnpm install`, `docker-compose up -d db redis`, `pnpm dev` y `pnpm test --run` completan sin errores. CI verde en `develop`.

**Tareas del Sprint 1:** Tareas 1 a 15 (Fases 0, 1 y 2)

---

## Overview

Implementación incremental del MVP de Mercury — plataforma SaaS de Market Intelligence para el mercado cubano. Cada fase construye sobre la anterior. El orden sigue el Implementation Playbook definido en el diseño técnico.

Stack: NestJS 11+ / Next.js 15+ / TypeScript / Prisma / PostgreSQL (Supabase) / pnpm workspaces / Node.js 22 LTS.

---

## Tareas

### Fase 0 — Setup del Monorepo

- [x] 1. Inicializar monorepo con pnpm workspaces y estructura de directorios
  - Crear `pnpm-workspace.yaml` con workspaces: `apps/*`, `packages/*`, `workers/*`, `database`
  - Crear estructura de carpetas: `apps/api`, `apps/web`, `packages/types`, `packages/ui`, `packages/config`, `packages/validation`, `packages/utils`, `packages/constants`, `workers/collectors`, `workers/ai`, `workers/scheduler`, `workers/image-processing`, `workers/notifications`, `database/prisma`, `database/migrations`, `database/seed`
  - Crear `package.json` raíz con scripts: `dev`, `build`, `test`, `lint`, `typecheck`
  - _Requirements: 12.1_

- [x] 2. Configurar herramientas de calidad de código
  - Crear `packages/config/eslint-base.js` con reglas TypeScript strict (prohibir `any` sin justificación, no `console.log`)
  - Crear `packages/config/tsconfig.base.json` con `strict: true`, `noImplicitAny: true`
  - Crear `packages/config/prettier.js`
  - Crear `.eslintrc.js` en raíz que extiende la config base
  - Configurar Husky + lint-staged para pre-commit hooks
  - _Requirements: 11.2 (Coding Constitution)_

- [x] 3. Configurar variables de entorno
  - Crear `.env.example` raíz con todas las variables: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `JWT_EXPIRY`, `AI_PROVIDER`, `AI_API_KEY`, `REDIS_URL`, `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`, `NODE_ENV`, `API_BASE_URL`, `WEB_BASE_URL`
  - Crear `apps/api/.env.example` y `apps/web/.env.example` con sus variables específicas
  - Agregar `.env` y `.env.local` a `.gitignore`
  - _Requirements: 10.2 (seguridad de secrets)_

- [x] 4. Configurar Docker Compose para desarrollo local
  - Crear `docker-compose.yml` en raíz del monorepo con servicios: `db` (postgres:16-alpine), `redis` (redis:7-alpine), `api` (NestJS dev), `web` (Next.js dev)
  - Configurar healthchecks en el servicio `db` (`pg_isready`) y dependencias correctas entre servicios
  - Crear `apps/api/Dockerfile.dev` y `apps/web/Dockerfile.dev` con hot-reload habilitado
  - Agregar script `docker:up` en `package.json` raíz: `docker-compose up -d db redis`
  - Verificar que `docker-compose up -d db redis` levanta postgres accesible en `localhost:5432`
  - _Requirements: (infraestructura local de desarrollo)_

- [x] 5. Configurar CI/CD con GitHub Actions
  - Crear `.github/workflows/ci.yml` con 4 jobs en secuencia: `lint → typecheck → test → build`
  - Job `test`: usar servicio `postgres:16-alpine` en GitHub Actions, ejecutar migraciones, correr `pnpm test --run`
  - Configurar branch protection en `main` y `develop`: requerir CI verde antes de merge
  - Configurar rama `develop` como rama base de trabajo; crear desde `main`
  - Agregar `.github/PULL_REQUEST_TEMPLATE.md` con checklist: tests, lint, typecheck
  - _Requirements: (calidad y proceso de desarrollo)_

- [x] 6. Checkpoint Fase 0
  - Verificar que `pnpm install` completa sin errores
  - Verificar que `pnpm lint` pasa en todos los workspaces
  - Verificar que `pnpm typecheck` pasa en todos los workspaces
  - Verificar que `docker-compose up -d db redis` inicia PostgreSQL sin errores
  - Asegurarse de que no hay errores antes de continuar

---

### Fase 1 — Arquitectura Base del Backend (NestJS)

- [x] 7. Inicializar app NestJS con Clean Architecture
  - Crear `apps/api` con NestJS 11+ usando `@nestjs/cli`
  - Configurar estructura de módulos en `apps/api/src/modules/`
  - Crear `apps/api/src/common/` con carpetas: `guards/`, `interceptors/`, `pipes/`, `filters/`, `decorators/`
  - Crear `apps/api/src/config/` con configuración de NestJS (ConfigModule)
  - Configurar `main.ts` con: prefijo global `/api/v1/`, ValidationPipe global, Helmet, CORS con whitelist
  - _Requirements: 12.1, 10.3 (seguridad)_

- [x] 8. Implementar estructura de respuesta uniforme y manejo de errores global
  - Crear `GlobalExceptionFilter` en `common/filters/global-exception.filter.ts` que mapea excepciones a `{ success, message, data, errors, meta }`
  - Crear jerarquía de excepciones de dominio en `packages/types/src/errors.ts`: `MercuryException`, `ValidationException`, `UnauthorizedException`, `ForbiddenException`, `NotFoundException`, `ConflictException`, `BusinessRuleException`
  - Crear `ResponseInterceptor` que envuelve respuestas exitosas en `{ success: true, data, meta }`
  - Registrar filtro e interceptor globalmente en `AppModule`
  - Verificar que `Content-Type: application/json; charset=utf-8` se incluye en todas las respuestas
  - _Requirements: 12.2, 12.3, 12.4_

  - [ ]* 8.1 Escribir property test P23 — Estructura de respuesta uniforme
    - **Property 23: Estructura de respuesta uniforme y Content-Type correcto**
    - **Validates: Requirements 12.2, 12.4**
    - Tag: `// Feature: mercury-mvp, Property 23: Estructura de respuesta uniforme`

  - [ ]* 8.2 Escribir property test P24 — Validación devuelve campos inválidos
    - **Property 24: Validación de input devuelve lista de campos inválidos**
    - **Validates: Requirements 12.5**
    - Tag: `// Feature: mercury-mvp, Property 24: Validación de input devuelve campos inválidos`

- [x] 9. Configurar Swagger / OpenAPI
  - Instalar `@nestjs/swagger`
  - Configurar `SwaggerModule` en `main.ts` con título "Mercury API", versión "1.0", tag `Bearer`
  - Decorar todos los DTOs con `@ApiProperty()`
  - Exponer docs en `/api/docs` solo en entornos no-producción
  - _Requirements: 12.1_

- [x] 10. Checkpoint Fase 1
  - Verificar que `GET /api/v1/` responde con estructura uniforme
  - Verificar que `GET /api/docs` devuelve Swagger UI
  - Verificar que una ruta inexistente devuelve 404 con `ENDPOINT_NOT_FOUND`
  - Asegurarse de que no hay errores antes de continuar

---

### Fase 2 — Base de Datos

- [x] 11. Implementar Prisma schema completo y migración inicial
  - Crear `database/prisma/schema.prisma` con todos los modelos definidos en el diseño: `Role`, `Location`, `User`, `Category`, `Brand`, `Product`, `ProductAttribute`, `Source`, `Seller`, `Publication`, `PublicationImage`, `PriceHistory`, `Favorite`, `Alert`, `Notification`, `SearchHistory`, `Log`, `RawPublication`, y el scaffold SaaS: `Organization`, `OrganizationMember`, `Plan`, `Subscription`, `UserPreferences`, `NotificationPreferences`, `SystemEvent`, `AutomationLog`
  - Incluir todos los enums: `UserRole`, `UserStatus`, `Currency`, `PublicationStatus`, `AlertStatus`, `AlertType`, `SourceName`, `PlanName`
  - Verificar que todos los índices están definidos (incluyendo `@@index` y `@@unique`)
  - Ejecutar `prisma migrate dev --name init` para crear migración reversible `0001_init`
  - Verificar que la migración tiene `down` (reversible)
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 12. Crear índices de rendimiento para búsqueda full-text y rangos de precio
  - Crear migración `0002_search_indexes` con los índices GIN para full-text: `idx_publications_search` usando `to_tsvector('spanish', title || ' ' || COALESCE(description, ''))`
  - Crear índice de rango de precios: `idx_publications_price_range` en `(price, currency) WHERE status = 'ACTIVE'`
  - Crear índice de dashboard: `idx_publications_product_active` en `(product_id, status, created_at DESC) WHERE status = 'ACTIVE'`
  - _Requirements: 6.1 (rendimiento < 800ms)_

- [x] 13. Crear seed de datos iniciales
  - Crear `database/seed/seed.ts` que inserta: roles (`PERSONAL`, `BUSINESS`, `SELLER`, `ADMIN`), sources (`FACEBOOK`, `REVOLICO`, `MANUAL`, `IMPORT`, `API`), árbol de categorías iniciales (mínimo 5 categorías raíz con subcategorías), municipios de La Habana en tabla `locations`
  - Configurar script `db:seed` en `package.json`
  - _Requirements: 4.1, 4.2_

- [x] 14. Crear PrismaService e inyectarlo en la app NestJS
  - Crear `apps/api/src/modules/database/prisma.service.ts` que extiende `PrismaClient` y maneja `onModuleInit` / `onModuleDestroy`
  - Crear `DatabaseModule` como módulo global exportando `PrismaService`
  - _Requirements: 11.5 (transacciones)_

- [x] 15. Checkpoint Fase 2
  - Ejecutar `pnpm db:seed` sin errores
  - Verificar integridad del schema con `prisma validate`
  - Asegurarse de que no hay errores antes de continuar

---

### Fase 3 — Autenticación (Auth)

- [x] 16. Implementar módulo Auth — registro y login
  - Crear `apps/api/src/modules/auth/` con estructura completa: controller, service, repository, module, DTOs, entities, interfaces, mappers
  - Crear `RegisterDto` con validación: `@IsEmail() email`, `@MinLength(8) password`, `@IsNotEmpty() fullName`
  - Crear `LoginDto` con: `email`, `password`
  - Implementar `AuthService.register()`: hash bcrypt con cost factor ≥ 10, crear user con rol PERSONAL, devolver JWT + user
  - Implementar `AuthService.login()`: verificar credenciales, devolver JWT con userId y rol, expiración 24h
  - Implementar `AuthRepository` que accede a Prisma (NUNCA el controller)
  - Endpoints: `POST /auth/register` (201), `POST /auth/login` (200), `GET /auth/me` (200)
  - JWT firmado con HMAC-SHA256 usando `JWT_SECRET` de env (≥ 256 bits)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.5_

  - [ ]* 16.1 Escribir property test P1 — Register + Login round trip
    - **Property 1: Register + Login round trip**
    - **Validates: Requirements 1.1, 2.1**
    - Tag: `// Feature: mercury-mvp, Property 1: Register + Login round trip`

  - [ ]* 16.2 Escribir property test P2 — Registro rechaza inputs inválidos
    - **Property 2: Registro rechaza todos los inputs inválidos**
    - **Validates: Requirements 1.2, 1.3, 1.4**
    - Tag: `// Feature: mercury-mvp, Property 2: Registro rechaza inputs inválidos`

  - [ ]* 16.3 Escribir property test P3 — Contraseñas nunca en texto plano
    - **Property 3: Contraseñas nunca almacenadas en texto plano**
    - **Validates: Requirements 1.5**
    - Tag: `// Feature: mercury-mvp, Property 3: Contraseñas nunca en texto plano`

- [x] 17. Implementar JWT guards y protección de rutas
  - Crear `JwtAuthGuard` en `common/guards/jwt-auth.guard.ts` que verifica JWT en header `Authorization: Bearer`
  - Crear `RolesGuard` en `common/guards/roles.guard.ts` que verifica rol del usuario
  - Crear `AccountStatusGuard` en `common/guards/account-status.guard.ts` que verifica `status === ACTIVE`
  - Crear decorador `@CurrentUser()` para extraer usuario del request
  - Crear decorador `@Roles()` para marcar endpoints por rol
  - Implementar `POST /auth/logout` (invalida sesión) y `POST /auth/refresh` (renueva JWT)
  - _Requirements: 2.3, 2.4, 3.3, 10.3_

  - [ ]* 17.1 Escribir property test P4 — JWT expirado siempre es rechazado
    - **Property 4: JWT expirado siempre es rechazado**
    - **Validates: Requirements 2.4**
    - Tag: `// Feature: mercury-mvp, Property 4: JWT expirado rechazado`

  - [ ]* 17.2 Escribir property test P5 — Autorización — no autenticados y no-admin rechazados
    - **Property 5: Autorización — no autenticados y no-admin son rechazados**
    - **Validates: Requirements 3.3, 8.5, 10.6**
    - Tag: `// Feature: mercury-mvp, Property 5: Autorización general`

- [x] 18. Implementar ThrottleGuard y rate limiting
  - Instalar `@nestjs/throttler`
  - Configurar límites: `POST /auth/login` → 5/min por IP, `POST /auth/register` → 10/hora por IP, general → 100/min por usuario
  - _Requirements: 10.3 (seguridad)_

- [x] 19. Checkpoint Fase 3
  - Verificar que `POST /auth/register` devuelve JWT y usuario con rol PERSONAL
  - Verificar que `POST /auth/login` con credenciales incorrectas devuelve `INVALID_CREDENTIALS`
  - Verificar que ruta protegida sin JWT devuelve `UNAUTHORIZED`
  - Asegurarse de que no hay errores antes de continuar

---

### Fase 4 — Usuarios

- [x] 20. Implementar módulo Users — perfil y gestión
  - Crear `apps/api/src/modules/users/` con estructura completa
  - Crear `UpdateUserDto` con campos permitidos: `fullName?`, `locationId?` (NUNCA `email` ni `role`)
  - Implementar `UsersService.getProfile()`: devuelve nombre, correo, rol, fecha de registro, municipio
  - Implementar `UsersService.updateProfile()`: solo modifica `fullName` y `locationId`, ignorar otros campos
  - Implementar `UsersService.softDelete()`: marca `deletedAt`, no elimina físicamente
  - Endpoints: `GET /users/:id`, `PATCH /users/:id`, `DELETE /users/:id`
  - `GET` y `DELETE` verifican que sea el propio usuario o Admin; `PATCH` solo propio usuario
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 20.1 Escribir property test P6 — Actualización de perfil solo modifica campos permitidos
    - **Property 6: Actualización de perfil solo modifica campos permitidos**
    - **Validates: Requirements 3.2, 3.4**
    - Tag: `// Feature: mercury-mvp, Property 6: Perfil solo modifica campos permitidos`

- [x] 21. Checkpoint Fase 4
  - Verificar que `PATCH /users/:id` con `{ email: "otro@test.com" }` NO cambia el email
  - Verificar que un usuario no puede acceder al perfil de otro usuario
  - Asegurarse de que no hay errores antes de continuar

---

### Fase 5 — Catálogo: Productos, Categorías y Marcas

- [x] 22. Implementar módulo Categories
  - Crear `apps/api/src/modules/categories/` con estructura completa
  - Implementar `CategoriesService.listRoots()`: devuelve categorías raíz ordenadas alfabéticamente en < 500ms
  - Implementar `CategoriesService.getChildren()`: subcategorías de una categoría
  - Crear `CreateCategoryDto` con: `name`, `description?`, `parentCategoryId?`, `slug`
  - Validar unicidad de nombre en el mismo nivel jerárquico (error `CATEGORY_NAME_DUPLICATE`)
  - Endpoints: `GET /categories`, `GET /categories/:id/children`, `POST /categories` (Admin), `PATCH /categories/:id` (Admin)
  - _Requirements: 4.1, 4.2, 10.5_

  - [ ]* 22.1 Escribir property test P7 — Invariante del árbol de categorías
    - **Property 7: Invariante del árbol de categorías — productos solo en hojas**
    - **Validates: Requirements 4.5, 10.5**
    - Tag: `// Feature: mercury-mvp, Property 7: Productos solo en categorías hoja`

- [x] 23. Implementar módulo Products
  - Crear `apps/api/src/modules/products/` con estructura completa
  - Implementar `ProductsService.create()`: validar que `categoryId` es categoría hoja (sin hijos)
  - Implementar `ProductsService.list()`: paginación, filtro por categoría
  - Implementar `ProductsService.getDetail()`: detalle con atributos, marca, categoría
  - Crear `CreateProductDto` y `UpdateProductDto` con validación completa
  - Endpoints: `GET /products`, `GET /products/:id`, `POST /products` (Admin), `PATCH /products/:id` (Admin), `DELETE /products/:id` (Admin)
  - _Requirements: 4.3, 4.4, 4.5_

- [x] 24. Checkpoint Fase 5
  - Verificar que `POST /products` con categoría no-hoja devuelve error de validación
  - Verificar que `GET /categories` responde en < 500ms
  - Asegurarse de que no hay errores antes de continuar

---

### Fase 6 — Publicaciones, Sellers y Sources

- [x] 25. Implementar módulo Sellers y Sources
  - Crear `apps/api/src/modules/sellers/` y `apps/api/src/modules/sources/` con estructura completa
  - `SellerRepository`: crear o encontrar seller por teléfono/nombre
  - `SourceRepository`: listar sources disponibles, encontrar por `SourceName`
  - _Requirements: 11.1 (integridad — publicación tiene exactamente un seller y source)_

- [x] 26. Implementar módulo Publications
  - Crear `apps/api/src/modules/publications/` con estructura completa
  - Implementar `PublicationsService.create()`: crear con status `PENDING`, asociar seller y source obligatoriamente (nunca publicación huérfana), registrar entrada en `price_history` al crear
  - Implementar `PublicationsService.getDetail()`: devuelve publicación activa con todos sus campos en < 300ms
  - Implementar `PublicationsService.list()`: solo publicaciones `ACTIVE`, paginadas
  - Validar que `price > 0` con precisión de 2 decimales; rechazar negativos y nulos
  - `updated_at` siempre ≥ `created_at` (forzado por lógica de servicio)
  - Implementar transacciones en operaciones críticas (crear publicación)
  - Endpoints: `GET /publications`, `GET /publications/:id`, `POST /publications` (autenticado), `PATCH /publications/:id` (Admin), `DELETE /publications/:id` (Admin → status INACTIVE)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 11.1, 11.4, 11.5_

  - [ ]* 26.1 Escribir property test P9 — Invariante temporal updated_at ≥ created_at
    - **Property 9: Invariante temporal updated_at ≥ created_at**
    - **Validates: Requirements 5.4**
    - Tag: `// Feature: mercury-mvp, Property 9: updated_at ≥ created_at`

  - [ ]* 26.2 Escribir property test P21 — Invariante de integridad del modelo de publicación
    - **Property 21: Invariante de integridad del modelo de publicación**
    - **Validates: Requirements 11.1, 11.4**
    - Tag: `// Feature: mercury-mvp, Property 21: Invariante de integridad del modelo`

  - [ ]* 26.3 Escribir property test P22 — Atomicidad transaccional
    - **Property 22: Atomicidad — operaciones críticas son transaccionales**
    - **Validates: Requirements 11.5**
    - Tag: `// Feature: mercury-mvp, Property 22: Atomicidad transaccional`

- [x] 27. Implementar scheduler de expiración automática de publicaciones
  - Crear `workers/scheduler/src/tasks/expire-publications.task.ts`
  - Tarea cron cada 24 horas: encontrar publicaciones `ACTIVE` con `updated_at` < (now - 30 días) y cambiar estado a `EXPIRED`
  - Registrar en `logs` la acción de expiración con `entity = 'publication'`
  - _Requirements: 5.5_

  - [ ]* 27.1 Escribir property test P10 — Expiración automática de publicaciones
    - **Property 10: Expiración automática de publicaciones sin actualización en 30 días**
    - **Validates: Requirements 5.5**
    - Tag: `// Feature: mercury-mvp, Property 10: Expiración automática 30 días`

  - [ ]* 27.2 Escribir property test P8 — INACTIVE/EXPIRED excluidos de resultados públicos
    - **Property 8: Publicaciones INACTIVE o EXPIRED excluidas de resultados públicos**
    - **Validates: Requirements 5.3, 7.2**
    - Tag: `// Feature: mercury-mvp, Property 8: INACTIVE/EXPIRED excluidos`

- [x] 28. Checkpoint Fase 6
  - Verificar que `POST /publications` sin `sellerId` o `sourceId` falla con error de validación
  - Verificar que `GET /publications/:id` de una publicación EXPIRED devuelve 404 o excluye del listado
  - Verificar que `price: -100` es rechazado
  - Asegurarse de que no hay errores antes de continuar

---

### Fase 7 — Motor de Búsqueda

- [x] 29. Implementar módulo Search con PostgreSQL Full Text Search
  - Crear `apps/api/src/modules/search/` con estructura completa
  - Implementar `SearchService.search()` usando `prisma.$queryRaw` con `to_tsvector('spanish', ...)` y `@@` operator para búsqueda full-text case-insensitive
  - Validar que `q` tenga mínimo 2 caracteres; rechazar con `QUERY_TOO_SHORT` si es menor
  - Implementar filtros acumulables: `category` (ID), `price_min` / `price_max` (validar min ≤ max), `location` (municipio ID), `source` (SourceName)
  - Implementar paginación: `page` (default 1), `limit` (10-50, default 20); respuesta incluye `total`, `page`, `totalPages`
  - Implementar ordenamiento: `price_asc`, `price_desc`, `date_desc`
  - Devolver lista vacía + HTTP 200 cuando no hay resultados (nunca error)
  - Excluir publicaciones `INACTIVE` y `EXPIRED` siempre
  - Endpoint: `GET /search`
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [ ]* 29.1 Escribir property test P11 — Búsqueda sin falsos negativos
    - **Property 11: Búsqueda completa — no hay falsos negativos para substring exacto**
    - **Validates: Requirements 6.1**
    - Tag: `// Feature: mercury-mvp, Property 11: Búsqueda sin falsos negativos`

  - [ ]* 29.2 Escribir property test P12 — Filtros de búsqueda correctos y acumulables
    - **Property 12: Todos los filtros de búsqueda son correctos y acumulables**
    - **Validates: Requirements 6.2, 6.3, 6.4**
    - Tag: `// Feature: mercury-mvp, Property 12: Filtros acumulables`

  - [ ]* 29.3 Escribir property test P13 — Paginación sin pérdida ni duplicados
    - **Property 13: Paginación sin pérdida ni duplicados**
    - **Validates: Requirements 6.6**
    - Tag: `// Feature: mercury-mvp, Property 13: Paginación correcta`

- [x] 30. Implementar guardado de historial de búsquedas del usuario
  - En `SearchService.search()`: si hay usuario autenticado, insertar en `search_history`
  - _Requirements: 6.1 (experiencia de usuario)_

- [x] 31. Checkpoint Fase 7
  - Verificar que `GET /search?q=a` devuelve `QUERY_TOO_SHORT`
  - Verificar que `GET /search?q=aceite&price_min=100&price_max=50` devuelve error de validación
  - Verificar que búsqueda con resultados devuelve `total`, `page`, `totalPages` correctos
  - Asegurarse de que no hay errores antes de continuar

---

### Fase 8 — Favoritos y Alertas

- [x] 32. Implementar módulo Favorites
  - Crear `apps/api/src/modules/favorites/` con estructura completa
  - Implementar `FavoritesService.add()`: usar `upsert` de Prisma para garantizar idempotencia (no duplicados), devolver HTTP 200 siempre
  - Implementar `FavoritesService.remove()`: eliminar relación, HTTP 200
  - Implementar `FavoritesService.list()`: devolver favoritos del usuario ordenados por `createdAt DESC`, paginados a 20 por página
  - Todos los endpoints verifican `JwtAuthGuard` + `AccountStatusGuard`
  - Endpoints: `GET /favorites`, `POST /favorites`, `DELETE /favorites/:id`
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 32.1 Escribir property test P16 — Idempotencia de favoritos
    - **Property 16: Idempotencia de favoritos**
    - **Validates: Requirements 8.1, 8.2**
    - Tag: `// Feature: mercury-mvp, Property 16: Idempotencia de favoritos`

- [x] 33. Implementar módulo Alerts
  - Crear `apps/api/src/modules/alerts/` con estructura completa
  - Implementar `AlertsService.create()`: validar `maximumPrice > 0`, soportar los 6 tipos de alerta (`AlertType` enum), verificar límite de 20 alertas ACTIVE para rol PERSONAL (error `ALERT_LIMIT_REACHED`), persistir con status `ACTIVE`
  - Soportar `alertType`: `PRICE_BELOW` (precio < umbral), `PRICE_ABOVE` (precio > umbral), `PRICE_CHANGE_PERCENT` (variación > X%), `NEW_PRODUCT_MATCH` (nueva publicación del producto), `HIGH_OPPORTUNITY` (score ≥ umbral), `MARKET_CHANGE` (promedio mercado cambia > X%)
  - Campo `changePercent` requerido para tipos `PRICE_CHANGE_PERCENT` y `MARKET_CHANGE`
  - Implementar `AlertsService.pause()` / `AlertsService.reactivate()`: cambiar entre `ACTIVE` y `PAUSED`
  - Implementar `AlertsService.delete()`: soft-delete → status `DELETED`, conservar historial
  - Implementar `AlertsService.list()`: alertas del usuario con estado, producto y tipo
  - Usar transacciones para crear alerta
  - Endpoints: `GET /alerts`, `POST /alerts`, `PATCH /alerts/:id`, `DELETE /alerts/:id`
  - _Requirements: 9.1, 9.5, 9.6_

  - [ ]* 33.1 Escribir property test P19 — Límite de 20 alertas activas por usuario PERSONAL
    - **Property 19: Límite de 20 alertas activas por usuario PERSONAL**
    - **Validates: Requirements 9.6**
    - Tag: `// Feature: mercury-mvp, Property 19: Límite alertas PERSONAL`

- [x] 34. Implementar preferencias de notificación
  - Crear `apps/api/src/modules/users/notification-preferences.service.ts`
  - Endpoint `GET /users/:id/notification-preferences`: devuelve preferencias actuales
  - Endpoint `PATCH /users/:id/notification-preferences`: actualiza flags (`alertTriggered`, `newOpportunity`, `marketChange`, `weeklyDigest`)
  - Al enviar notificación, verificar preferencias del usuario antes de crear registro en `notifications`
  - _Requirements: 9.4 (notificaciones controladas por el usuario)_

- [x] 35. Checkpoint Fase 8
  - Verificar que `POST /favorites` llamado 3 veces con los mismos datos crea solo 1 registro
  - Verificar que un usuario PERSONAL con 20 alertas recibe `ALERT_LIMIT_REACHED` al crear la 21ª
  - Verificar que crear alerta `PRICE_CHANGE_PERCENT` sin `changePercent` devuelve error de validación
  - Asegurarse de que no hay errores antes de continuar

---

### Fase 9 — Market Intelligence (PriceAnalysisService + OpportunityDetectionService)

- [x] 36. Implementar PriceAnalysisService
  - Crear `apps/api/src/modules/prices/price-analysis.service.ts`
  - Implementar `calculateStats(productId, currency)`: calcular `minPrice`, `maxPrice`, `avgPrice`, `activePublicationsCount` excluyendo INACTIVE y EXPIRED; devolver campos en `null` si no hay publicaciones activas
  - Implementar `getPriceHistory(productId, from, to)`: devolver serie temporal de precios promedio diarios del rango solicitado usando `price_history`
  - Precio de referencia: `60% Mediana + 30% Promedio + 10% Tendencia`
  - Endpoints: `GET /products/:id/market`, `GET /products/:id/price-history?from=&to=`
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ]* 36.1 Escribir property test P14 — Stats precio: consistencia matemática
    - **Property 14: Invariante de estadísticas de precio — consistencia matemática**
    - **Validates: Requirements 7.1, 7.2**
    - Tag: `// Feature: mercury-mvp, Property 14: Stats min ≤ avg ≤ max`

- [x] 37. Implementar PriceHistoryRepository con invariante append-only
  - Crear `apps/api/src/modules/prices/price-history.repository.ts`
  - Implementar `append(publicationId, price, currency, capturedAt)`: NUNCA actualizar ni eliminar registros existentes
  - Verificar que `capturedAt >= publication.createdAt` antes de insertar; lanzar error si viola la invariante
  - Llamar a `append` desde `PublicationsService.create()` y `PublicationsService.update()` dentro de transacción
  - _Requirements: 7.5, 11.2_

  - [ ]* 37.1 Escribir property test P15 — Price History append-only
    - **Property 15: Price History append-only — recorded_at ≥ publication.created_at**
    - **Validates: Requirements 7.5, 11.2**
    - Tag: `// Feature: mercury-mvp, Property 15: Price History append-only`

  - [ ]* 37.2 Escribir property test P2 (Price) — Invariante de precios en Price_History
    - **Property 2 (Req): Invariante de precios en Price_History**
    - **Validates: Requirements 5.4, 7.5**
    - Tag: `// Feature: mercury-mvp, Property 2: Invariante Price History timestamps`

- [x] 38. Implementar OpportunityDetectionService
  - Crear `apps/api/src/modules/prices/opportunity-detection.service.ts`
  - Implementar `detectOpportunities(productId)`: calcular para cada publicación activa del producto
  - Implementar `calculateOpportunityScore(publication, marketStats)`: fórmula exacta `precio×0.40 + confianza×0.20 + vendedor×0.15 + demanda×0.15 + disponibilidad×0.10`
  - Clasificación de score: 90-100 → EXCELENTE, 75-89 → BUENA, 50-74 → MEDIA, 0-49 → NO_RECOMENDADA
  - Calcular `differencePercent` respecto al `avgPrice` del mercado
  - Las `Opportunity` NO se almacenan — se calculan dinámicamente en cada request
  - Incluir oportunidades en la respuesta de `GET /products/:id/market`
  - _Requirements: 7.1 (oportunidades de compra)_

- [x] 39. Checkpoint Fase 9
  - Verificar que `GET /products/:id/market` con 0 publicaciones activas devuelve todos los campos numéricos en `null`
  - Verificar que `minPrice ≤ avgPrice ≤ maxPrice` para cualquier conjunto de publicaciones
  - Verificar que modificar o eliminar un registro de `price_history` lanza error
  - Asegurarse de que no hay errores antes de continuar

---

### Fase 10 — Dashboard (Widgets y Estadísticas)

- [x] 40. Implementar endpoints de Dashboard
  - Crear `apps/api/src/modules/dashboard/` con estructura completa
  - Implementar endpoint `GET /dashboard` que devuelve: número de productos seguidos (favoritos), alertas recientes (últimas 5 TRIGGERED), oportunidades nuevas (publicaciones con score ≥ 75 creadas en últimas 24h), tendencia de precios por categoría
  - Implementar `GET /dashboard/activity`: lista de eventos recientes del mercado (nuevas publicaciones en productos favoriteados)
  - Usar TanStack Query en el frontend para revalidación automática
  - _Requirements: 6.1, 7.1, 8.4, 9.4 (experiencia del usuario)_

---

### Fase 11 — Frontend Base (Next.js)

- [x] 41. Inicializar app Next.js 15+ con App Router
  - Crear `apps/web` con Next.js 15+, TypeScript, Tailwind CSS, shadcn/ui
  - Configurar estructura de rutas: `(auth)/login`, `(auth)/register`, `(dashboard)/layout`, `(dashboard)/page`, `(admin)/layout`
  - Configurar `apps/web/lib/api-client.ts`: cliente HTTP base con JWT en headers, manejo de errores, interceptores
  - Configurar TanStack Query (`QueryClient`, `QueryClientProvider`) en layout raíz
  - Configurar Zustand stores: `auth.store.ts`, `search.store.ts`, `alerts.store.ts`, `favorites.store.ts`
  - _Requirements: 12.1 (integración frontend-backend)_

- [x] 42. Implementar páginas de autenticación
  - Crear `app/(auth)/login/page.tsx`: formulario con `email`, `password`, validación con Zod, manejo de errores `INVALID_CREDENTIALS`
  - Crear `app/(auth)/register/page.tsx`: formulario con `email`, `password`, `fullName`, validación con Zod, manejo de errores `EMAIL_ALREADY_EXISTS`, `PASSWORD_TOO_SHORT`
  - Implementar flujo de redirección post-login al Dashboard
  - Implementar persistencia de JWT en `auth.store.ts` (Zustand)
  - Implementar middleware de Next.js para proteger rutas del dashboard
  - _Requirements: 1.1, 2.1_

- [x] 43. Implementar layout principal del Dashboard
  - Crear `app/(dashboard)/layout.tsx`: Header fijo con barra de búsqueda, Sidebar colapsable, área de contenido
  - Header: logo Mercury, `SearchBox` global con debounce, iconos de notificación, toggle tema, perfil de usuario
  - Sidebar: links a Dashboard, Buscar, Productos, Mercado, Alertas, Favoritos, Configuración
  - Implementar 5 estados de pantalla: `loading` → `<LoadingSkeleton />`, `empty` → `<EmptyState />`, `error` → `<ErrorState />`, `offline` → `<OfflineState />`, `data` → contenido
  - _Requirements: 9.1 (UX: ≤ 3 clics para encontrar producto)_

- [x] 44. Checkpoint Fase 11
  - Verificar que la página de login redirige al dashboard tras autenticación exitosa
  - Verificar que acceder al dashboard sin JWT redirige al login
  - Verificar que todos los estados de pantalla se renderizan correctamente
  - Asegurarse de que no hay errores antes de continuar

---

### Fase 12 — Frontend Módulos

- [ ] 45. Implementar módulo de búsqueda en frontend
  - Crear `app/(dashboard)/search/page.tsx` con `SearchBox` global, panel de filtros, lista de resultados paginada
  - Integrar filtros: categoría (dropdown), rango de precio (inputs), municipio (dropdown), fuente, ordenamiento
  - Usar TanStack Query para `GET /search` con caché y refetch
  - Mostrar `PublicationCard` por resultado: imagen, título, precio, variación vs promedio, ubicación, fuente, vendedor
  - Implementar `<Pagination />` con navegación de páginas
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [ ] 46. Implementar módulo de productos en frontend
  - Crear `app/(dashboard)/products/page.tsx`: catálogo de productos con filtro de categoría
  - Crear `app/(dashboard)/products/[id]/page.tsx`: pantalla de producto con stats de mercado, gráfico de historial de precios (`MarketChart` con Recharts), botón "+ Alerta", lista de publicaciones ordenadas por opportunity score
  - Usar `OpportunityBadge` para mostrar porcentaje de diferencia vs promedio
  - _Requirements: 4.3, 7.1, 7.3_

- [ ] 47. Implementar módulo de publicaciones en frontend
  - Crear `app/(dashboard)/publications/[id]/page.tsx`: detalle completo de publicación — imágenes, precio, vendedor, fuente, ubicación, historial de precio, botón de favorito, enlace original
  - Implementar acción "Agregar/quitar de favoritos" con optimistic update
  - _Requirements: 5.1, 5.2, 8.1_

- [ ] 48. Implementar módulo de favoritos en frontend
  - Crear `app/(dashboard)/favorites/page.tsx`: lista de publicaciones favoritas paginadas (20/página), ordenadas por fecha de adición
  - Acción de eliminar favorito con confirmación
  - _Requirements: 8.3, 8.4_

- [ ] 49. Implementar módulo de alertas en frontend
  - Crear `app/(dashboard)/alerts/page.tsx`: lista de alertas del usuario con estado (ACTIVE, TRIGGERED, PAUSED), acciones de pausar/reactivar/eliminar
  - Crear modal "Nueva Alerta": seleccionar producto, tipo de alerta, precio umbral/porcentaje, moneda y municipio opcional
  - Mostrar contador de alertas usadas vs límite (20 para PERSONAL)
  - _Requirements: 9.1, 9.5, 9.6_

- [ ] 50. Checkpoint Fase 12
  - Verificar flujo completo: buscar producto → ver detalle → agregar favorito → crear alerta
  - Verificar que el flujo completo cabe en ≤ 3 clics según objetivo UX
  - Asegurarse de que no hay errores antes de continuar

---

### Fase 13 — Pipeline de Ingesta (Stage-Based)

- [ ] 51. Implementar interfaces y estructura base del pipeline
  - Crear `workers/collectors/src/interfaces/pipeline.interface.ts` con `ProcessingContext`, `PipelineStage`
  - Crear `workers/collectors/src/interfaces/source-connector.interface.ts` con `RawPublication`, `NormalizedPublication`, `SourceConnector`
  - Crear `workers/collectors/src/pipeline/pipeline.runner.ts` que ejecuta etapas en secuencia, captura errores por etapa sin detener pipeline, registra errores en `ctx.errors`
  - _Requirements: 5.1 (ingesta de publicaciones)_

- [x] 52. Implementar conector Manual (MVP 1)
  - Crear `workers/collectors/src/connectors/manual.connector.ts` que implementa `SourceConnector`
  - Implementar `collect()`: recibe datos de publicación vía API interna `POST /publications`
  - Implementar `normalize()`: normalizar precio (ej. "25mil" → 25000), moneda, teléfono (+53XXXXXXXX), ubicación (texto → Location)
  - Implementar `validate()`: verificar campos requeridos
  - _Requirements: 5.1_

- [ ] 53. Implementar conector CSV (MVP 1)
  - Crear `workers/collectors/src/connectors/csv.connector.ts` que implementa `SourceConnector`
  - Soportar columnas: título, descripción, precio, moneda, teléfono vendedor, municipio, URL imagen, fecha publicación
  - Parsear y normalizar usando el mismo flujo que el conector Manual
  - Exponer endpoint Admin `POST /admin/import/csv` para subir archivo
  - _Requirements: 5.1_

- [x] 54. Implementar etapas del pipeline
  - Crear `NormalizationStage`: normalizar precio, moneda, teléfono, ubicación, limpiar texto
  - Crear `DuplicateDetectionStage`: implementar sistema de puntuación `URL(30) + Phone(25) + Images(20) + Text(15) + Price+Location(10)`, threshold 70 → marcar como duplicado y no procesar
  - Crear `ProductMatchingStage`: buscar Product existente por nombre normalizado + categoría; si no existe, crear nuevo Product
  - Crear `PriceRegistrationStage`: insertar en `price_history` (append-only), emitir evento `PriceChanged` si precio difiere del último registrado
  - Crear `AlertEvaluationStage`: verificar alertas ACTIVE del producto, marcar TRIGGERED si `price_min ≤ alert.maxPrice`
  - _Requirements: 5.1, 7.5, 9.2_

  - [ ]* 54.1 Escribir property test P17 — Alerta se dispara cuando precio mínimo ≤ umbral
    - **Property 17: Alerta se dispara cuando precio mínimo ≤ umbral configurado**
    - **Validates: Requirements 9.2**
    - Tag: `// Feature: mercury-mvp, Property 17: Alerta se dispara correctamente`

  - [ ]* 54.2 Escribir property test P18 — Notificación de alerta contiene todos los campos
    - **Property 18: Notificación de alerta contiene todos los campos requeridos**
    - **Validates: Requirements 9.4**
    - Tag: `// Feature: mercury-mvp, Property 18: Notificación alerta campos requeridos`

- [x] 55. Implementar sistema de notificaciones
  - Crear `workers/notifications/src/notification.service.ts`
  - Al crear notificación: insertar en tabla `notifications` con `userId`, `type`, `content` (nombre producto, precio umbral, precio actual)
  - Verificar alerta TRIGGERED cada 60 minutos (scheduler)
  - NUNCA notificar directamente desde pipeline — siempre a través de cola
  - _Requirements: 9.3, 9.4_

- [x] 56. Checkpoint Fase 13
  - Verificar que importar un CSV crea publicaciones con `seller_id` y `source_id` correctos
  - Verificar que dos publicaciones idénticas (score ≥ 70) no crean duplicado
  - Verificar que una publicación con precio menor al umbral de una alerta ACTIVE activa la alerta
  - Asegurarse de que no hay errores antes de continuar

---

### Fase 14 — Market Intelligence Engine

- [ ] 57. Implementar DuplicateDetectionService completo
  - Crear `apps/api/src/modules/publications/duplicate-detection.service.ts`
  - Implementar `calculateDuplicateScore(a, b)` con la fórmula exacta: URL(30) + Phone(25) + Images(20) + Text(15) + Price+Location(10), total máximo 100
  - Implementar `isDuplicate(score, threshold = 70)`: retorna true si score ≥ threshold
  - _Requirements: 5.1 (integridad de datos)_

- [x] 58. Implementar cálculo de market stats completo con tendencias
  - Extender `PriceAnalysisService` con: mediana, desviación estándar, distribución geográfica, variación diaria/semanal/mensual
  - Implementar `RefreshMarketStats` job que corre cada hora para productos con > 5 publicaciones activas
  - _Requirements: 7.1, 7.3_

- [x] 59. Checkpoint Fase 14
  - Verificar que `DuplicateDetectionService` con dos publicaciones con la misma URL devuelve score ≥ 30
  - Verificar que el opportunity score para una publicación con precio 40% menor al promedio es ≥ 75
  - Asegurarse de que no hay errores antes de continuar

---

### Fase 15 — Panel Administrativo

- [x] 60. Implementar módulo Admin — gestión de usuarios
  - Crear `apps/api/src/modules/admin/` con estructura completa
  - Proteger TODOS los endpoints con `@Roles('ADMIN')`; usuarios no-ADMIN reciben `FORBIDDEN`
  - Implementar `GET /admin/users`: listar usuarios paginados con nombre, correo, rol, fecha registro, estado
  - Implementar `PATCH /admin/users/:id/status`: suspender/activar cuenta, invalidar JWT activos del usuario al suspender
  - Al suspender: registrar en `logs` con `userId` del admin, acción, timestamp
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.6_

  - [ ]* 60.1 Escribir property test P20 — Suspensión de cuenta invalida tokens activos
    - **Property 20: Suspensión de cuenta invalida tokens activos**
    - **Validates: Requirements 10.3**
    - Tag: `// Feature: mercury-mvp, Property 20: Suspensión invalida tokens`

- [ ] 61. Implementar módulo Admin — gestión de publicaciones y categorías
  - Implementar `GET /admin/publications`: listar TODAS las publicaciones (incluyendo no activas), paginadas
  - Implementar `PATCH /admin/publications/:id`: editar título, descripción, estado; registrar en `logs` id admin, acción, timestamp
  - Implementar `GET /admin/logs`: listar log de auditoría con paginación y filtros
  - Endpoints de categorías ya protegidos por `@Roles('ADMIN')` desde Fase 5
  - _Requirements: 10.4, 10.5_

- [ ] 62. Implementar panel Admin en el frontend
  - Crear `app/(admin)/layout.tsx`: layout separado del dashboard, verificar rol ADMIN
  - Crear `app/(admin)/users/page.tsx`: tabla de usuarios con filtros, acciones de suspender/activar
  - Crear `app/(admin)/publications/page.tsx`: tabla de publicaciones con acciones de editar y cambiar estado
  - Crear `app/(admin)/categories/page.tsx`: árbol de categorías con acciones de crear y editar
  - Crear `app/(admin)/logs/page.tsx`: tabla de logs de auditoría con filtros por entidad y fecha
  - _Requirements: 10.1, 10.2_

- [x] 63. Checkpoint Fase 15
  - Verificar que `GET /admin/users` sin rol ADMIN devuelve `FORBIDDEN`
  - Verificar que suspender un usuario invalida su JWT (siguiente request devuelve `ACCOUNT_SUSPENDED`)
  - Verificar que editar publicación como Admin registra entrada en `logs`
  - Asegurarse de que no hay errores antes de continuar

---

### Fase 16 — Packages Compartidos

- [x] 64. Implementar package `packages/types`
  - Crear `packages/types/src/domain.ts` con interfaces: `Money`, `Address`, `Coordinates`, `ProductSpecification`, `MarketStats`, `Opportunity`
  - Crear `packages/types/src/ai.interface.ts` con: `AIProvider`, `ExtractedProductInfo`
  - Crear `packages/types/src/errors.ts` con jerarquía de excepciones `MercuryException` y subclases
  - Exportar todos los tipos desde `packages/types/src/index.ts`
  - _Requirements: 11.2 (tipado estricto, sin `any`)_

- [x] 65. Implementar package `packages/utils`
  - Crear `packages/utils/src/formatPrice.ts`: formatear precio con moneda (`25000 CUP` → `25,000 CUP`)
  - Crear `packages/utils/src/formatDate.ts`: formatear fechas relativas y absolutas
  - Crear `packages/utils/src/normalizeText.ts`: quitar emojis, normalizar espacios, lowercase
  - Crear `packages/utils/src/slugify.ts`: convertir string a slug URL-safe
  - Crear `packages/utils/src/normalizePrice.ts`: "25mil" → 25000, "25k" → 25000

  - [ ]* 65.1 Escribir unit + property tests para utils
    - Tests para `formatPrice`, `normalizeText`, `slugify`, `normalizePrice`
    - Usar `fast-check` para verificar propiedades: `slugify` siempre produce strings URL-safe, `normalizePrice` nunca devuelve negativo para inputs positivos
    - _Requirements: 11.2_

- [x] 66. Implementar package `packages/validation`
  - Crear esquemas Zod compartidos: `emailSchema`, `passwordSchema`, `moneySchema`, `paginationSchema`, `dateRangeSchema`
  - Exportar desde `packages/validation/src/index.ts`
  - _Requirements: 12.5 (validación de inputs)_

- [x] 67. Implementar package `packages/constants`
  - Crear `packages/constants/src/index.ts` con: `CURRENCIES`, `ALERT_LIMIT_PERSONAL = 20`, `PUBLICATION_EXPIRY_DAYS = 30`, `SEARCH_MIN_QUERY_LENGTH = 2`, `PAGE_SIZE_DEFAULT = 20`, `PAGE_SIZE_MAX = 50`, `DUPLICATE_THRESHOLD = 70`
  - _Requirements: 6.6, 6.7, 9.3, 9.6_

- [ ] 68. Implementar package `packages/ui` — componentes reutilizables
  - Crear wrappers de shadcn/ui: `Button`, `Input`, `SearchBox` (con debounce), `Pagination`
  - Crear componentes de dominio: `ProductCard`, `PublicationCard`, `SellerCard`, `PriceBadge`, `OpportunityBadge`, `FilterPanel`
  - Crear componentes de estado: `EmptyState`, `LoadingSkeleton`, `ErrorState`, `OfflineState`
  - Crear `MarketChart` con Recharts para historial de precios
  - _Requirements: (UX del frontend)_

  - [ ]* 68.1 Escribir component tests para componentes críticos de UI
    - Tests con Vitest + Testing Library para: `SearchBox`, `ProductCard`, `PublicationCard`, `OpportunityBadge`
    - Verificar renderización correcta con datos válidos y estados vacíos

- [x] 69. Checkpoint Fase 16
  - Verificar que `pnpm typecheck` pasa en todos los packages sin errores
  - Verificar que no hay imports de `any` sin justificación documentada
  - Asegurarse de que no hay errores antes de continuar

---

### Fase 17 — Testing Integral

- [ ] 70. Configurar framework de testing con fast-check
  - Instalar `fast-check` en `apps/api` y configurar Jest
  - Crear `tests/arbitraries/domain.arbitraries.ts` con generadores: `validEmail`, `validPassword`, `validMoney`, `validPublication`, `invalidEmail`, `shortPassword`
  - Configurar `numRuns: 100` como mínimo para todos los property tests
  - Asegurar que todos los tests de propiedad siguen el tag format: `// Feature: mercury-mvp, Property N: [texto]`
  - _Requirements: (estrategia de testing del diseño)_

- [ ] 71. Completar property tests pendientes de fases anteriores
  - Revisar que todas las 24 propiedades listadas en el diseño tienen su test de propiedad implementado
  - Verificar tests P1-P24 ejecutando `pnpm test` en `apps/api`
  - Corregir cualquier test fallido

- [x] 72. Escribir integration tests de endpoints críticos
  - Crear `apps/api/src/modules/auth/tests/auth.integration.spec.ts`: flujo register → login → acceder a ruta protegida → logout
  - Crear `apps/api/src/modules/search/tests/search.integration.spec.ts`: búsqueda con filtros, paginación, exclusión de INACTIVE/EXPIRED
  - Crear `apps/api/src/modules/favorites/tests/favorites.integration.spec.ts`: add → add → count = 1, remove → list
  - Crear `apps/api/src/modules/alerts/tests/alerts.integration.spec.ts`: crear hasta límite, crear +1 → error
  - Usar base de datos real de test (PostgreSQL en contenedor o Supabase staging)
  - _Requirements: 11.5 (transacciones), 14.1_

  - [ ]* 72.1 Escribir integration test para flujo de pipeline de ingesta
    - Test: ingestar publicación vía CSV → verificar `price_history` creado → verificar alerta evaluada
    - _Requirements: 5.1, 7.5, 9.2_

- [x] 73. Verificar cobertura de tests
  - Ejecutar `pnpm test --coverage` y verificar: Domain Services ≥ 90%, API Services ≥ 80%, Repositories ≥ 70%, Pipeline Stages ≥ 80%
  - Corregir módulos con cobertura insuficiente

- [x] 74. Checkpoint Fase 17
  - Ejecutar `pnpm test --run` completo sin errores
  - Verificar que las 24 propiedades PBT pasan con `numRuns: 100`
  - Asegurarse de que no hay errores antes de continuar

---

### Fase 18 — Optimización y Lanzamiento

- [ ] 75. Optimizar rendimiento de búsqueda y consultas críticas
  - Verificar que `GET /search` responde en < 800ms con 10k publicaciones usando `EXPLAIN ANALYZE`
  - Verificar que `GET /publications/:id` responde en < 300ms
  - Verificar que `GET /categories` responde en < 500ms
  - Agregar índices adicionales si los benchmarks fallan
  - _Requirements: 6.1, 5.2, 4.2_

- [x] 76. Implementar seguridad final y hardening
  - Verificar configuración de Helmet.js: HSTS, CSP, X-Frame-Options
  - Verificar CORS: origins whitelist, no wildcard en producción
  - Verificar que no hay stacktrace expuesto en producción en `GlobalExceptionFilter`
  - Verificar que `JWT_SECRET` no está embebida en ningún archivo de código
  - Verificar que `SUPABASE_SERVICE_ROLE_KEY` solo existe en `apps/api`, nunca en `apps/web`
  - _Requirements: 10.3 (seguridad obligatoria desde MVP)_

- [x] 77. Configurar scripts de despliegue
  - Crear `Dockerfile` para `apps/api` con Node.js 22 LTS
  - Crear configuración de build para `apps/web` en Vercel (`vercel.json`)
  - Crear script `db:migrate:prod` que ejecuta `prisma migrate deploy` (sin `dev`)
  - Verificar que `pnpm build` completa sin errores en todos los workspaces
  - _Requirements: (infraestructura y despliegue del diseño)_

- [x] 78. Checkpoint Final — Verificación integral
  - Ejecutar `pnpm lint` → 0 errores
  - Ejecutar `pnpm typecheck` → 0 errores
  - Ejecutar `pnpm test --run` → todas las pruebas pasan (incluidas las 24 propiedades PBT)
  - Ejecutar `pnpm build` → build de producción exitoso
  - Verificar que `pnpm db:seed` pobla datos iniciales correctamente
  - Confirmar que el flujo completo funciona: registro → login → búsqueda → favorito → alerta → notificación

---

## Notas

- Las tareas marcadas con `*` son opcionales para un MVP más rápido, pero recomendadas para calidad de producción
- Cada tarea referencia requisitos específicos para trazabilidad
- Los checkpoints aseguran validación incremental — no continuar si hay errores
- Las 24 propiedades PBT deben ejecutarse con `numRuns: 100` mínimo usando `fast-check`
- El campo `price_history` y los `logs` son **nunca modificables ni eliminables** — esta invariante debe verificarse en cada tarea que los toque
- Nunca acceder a Prisma directamente desde un Controller — siempre a través de Repository
- Todo endpoint protegido debe verificar `JwtAuthGuard` + `AccountStatusGuard`
