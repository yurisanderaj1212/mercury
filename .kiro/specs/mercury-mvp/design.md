# Documento de Diseño Técnico — Mercury MVP

## Tabla de Contenidos

1. [Overview](#1-overview)
2. [Arquitectura General](#2-arquitectura-general)
3. [Componentes e Interfaces](#3-componentes-e-interfaces)
4. [Modelo de Dominio (DDD)](#4-modelo-de-dominio-ddd)
5. [Modelo de Datos (Prisma Schema)](#5-modelo-de-datos-prisma-schema)
6. [Diseño de la API](#6-diseño-de-la-api)
7. [Pipeline de Ingesta y Procesamiento](#7-pipeline-de-ingesta-y-procesamiento)
8. [Arquitectura de IA](#8-arquitectura-de-ia)
9. [Arquitectura del Frontend](#9-arquitectura-del-frontend)
10. [Infraestructura y Despliegue](#10-infraestructura-y-despliegue)
11. [Estándares de Desarrollo (AI_RULES)](#11-estándares-de-desarrollo-ai_rules)
12. [Propiedades de Corrección](#12-propiedades-de-corrección)
13. [Manejo de Errores](#13-manejo-de-errores)
14. [Estrategia de Testing](#14-estrategia-de-testing)

---

## 1. Overview

Mercury es una plataforma SaaS de **Market Intelligence** para el mercado cubano. Su propósito central es transformar publicaciones dispersas de fuentes digitales (Facebook, Revolico) en conocimiento estructurado que permita a usuarios identificar **oportunidades de compra** — publicaciones cuyo precio es significativamente mejor que el promedio del mercado.

### Hipótesis central del MVP
> Los usuarios pueden encontrar mejores oportunidades de compra utilizando Mercury.

### Alcance del MVP
El MVP valida la hipótesis con seis capacidades:

1. Registro e identidad de usuario
2. Búsqueda de productos y publicaciones
3. Visualización de publicaciones individuales
4. Comparación y análisis de precios
5. Guardado de favoritos
6. Creación de alertas de precio

El MVP está geográficamente acotado a **La Habana** (municipios).

### Concepto fundamental: Opportunity
Una **Opportunity** es una publicación cuyo precio es significativamente inferior al promedio del mercado para el mismo producto. Es el concepto de mayor valor para el usuario. En el MVP, las oportunidades se calculan dinámicamente — no se almacenan.

---

## 2. Arquitectura General

### 2.1 Visión de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────────┐
│                         MERCURY PLATFORM                            │
│                                                                     │
│  ┌──────────────────┐         ┌──────────────────────────────────┐  │
│  │   apps/web       │  HTTPS  │         apps/api                 │  │
│  │   Next.js 15+    │◄───────►│         NestJS 11+               │  │
│  │   TypeScript     │         │         REST /api/v1/            │  │
│  │   Tailwind/shadcn│         │         JWT Auth                 │  │
│  └──────────────────┘         └──────────┬───────────────────────┘  │
│                                          │                          │
│                                          │ Prisma ORM              │
│                                          ▼                          │
│                               ┌──────────────────────┐             │
│                               │   PostgreSQL          │             │
│                               │   (Supabase)          │             │
│                               └──────────────────────┘             │
│                                          │                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                        WORKERS                              │   │
│  │  collectors/ │ ai/ │ scheduler/ │ image-processing/ │ notif │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────┐    ┌─────────────────────────────────┐    │
│  │  Supabase Storage   │    │     Supabase Auth               │    │
│  │  (imágenes)         │    │     (JWT, sesiones)             │    │
│  └─────────────────────┘    └─────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Monorepo Structure

```
mercury/
├── apps/
│   ├── web/                    # Next.js 15+ — Frontend SaaS Dashboard
│   │   ├── app/                # App Router de Next.js
│   │   ├── components/         # Componentes específicos del app
│   │   ├── hooks/              # Custom hooks
│   │   ├── lib/                # API client, utils locales
│   │   └── stores/             # Estado global (Zustand)
│   └── api/                    # NestJS 11+ — API REST
│       └── src/
│           ├── modules/        # Módulos por dominio
│           ├── common/         # Guards, interceptors, pipes
│           ├── config/         # Configuración NestJS
│           └── main.ts
├── packages/
│   ├── types/                  # Interfaces TypeScript compartidas
│   ├── ui/                     # Componentes UI reutilizables (shadcn wrappers)
│   ├── config/                 # ESLint, TypeScript, Tailwind configs
│   ├── validation/             # Esquemas Zod compartidos
│   ├── utils/                  # formatPrice, formatDate, normalizeText, slugify
│   └── constants/              # Roles, Currencies, Categories, Permissions
├── workers/
│   ├── collectors/             # Source connectors (Facebook, Revolico)
│   ├── ai/                     # OCR, clasificación, extracción
│   ├── scheduler/              # Tareas programadas (cron)
│   ├── image-processing/       # Optimización, thumbnails
│   └── notifications/          # Cola de notificaciones
├── database/
│   ├── prisma/                 # schema.prisma principal
│   ├── migrations/             # Migraciones reversibles
│   ├── seed/                   # Datos iniciales (categorías, roles)
│   └── diagrams/               # Diagramas ER
├── .github/
│   └── workflows/
│       └── ci.yml              # Pipeline CI/CD (lint → test → build → deploy)
├── docker-compose.yml          # Entorno local completo (PostgreSQL, Redis, API, Web)
└── .env.example                # Variables de entorno documentadas
```

### 2.3 Patrones Arquitectónicos

| Capa | Patrón | Justificación |
|------|--------|---------------|
| Dominio | DDD (Domain-Driven Design) | El dominio de mercado cubano es complejo y cambia rápido |
| Backend | Clean Architecture | Separación clara Controller → Service → Repository → DB |
| Frontend | Feature-based folders | Escalabilidad en Next.js App Router |
| Pipeline | Stage-based Pipeline | Permite activar/desactivar etapas, reprocesar desde cualquier punto |
| IA | Gateway + Fallback | Independencia de proveedor, resiliencia ante fallos |
| Comunicación | REST + Event-driven (interno) | REST para API pública, eventos para pipeline interno |

---

## 3. Componentes e Interfaces

### 3.1 Backend — Módulos NestJS

```
apps/api/src/modules/
├── auth/           # Registro, login, JWT, refresh
├── users/          # Perfil, preferencias
├── products/       # Catálogo canónico de productos
├── categories/     # Árbol de categorías
├── publications/   # Publicaciones individuales
├── search/         # Motor de búsqueda y filtros
├── prices/         # Estadísticas, historial, oportunidades
├── favorites/      # Relación usuario-publicación
├── alerts/         # Alertas de precio y notificaciones
├── sellers/        # Perfil de vendedores
├── sources/        # Gestión de fuentes
├── admin/          # Panel administrativo
└── ai/             # Gateway de IA
```

Cada módulo sigue esta estructura interna:

```
[modulo]/
├── [modulo].controller.ts
├── [modulo].service.ts
├── [modulo].repository.ts
├── [modulo].module.ts
├── entities/
│   └── [modulo].entity.ts
├── dto/
│   ├── create-[modulo].dto.ts
│   └── update-[modulo].dto.ts
├── interfaces/
│   └── [modulo].interface.ts
├── mappers/
│   └── [modulo].mapper.ts
└── tests/
    ├── [modulo].service.spec.ts
    └── [modulo].controller.spec.ts
```

### 3.2 Interfaces de Dominio Clave

```typescript
// packages/types/src/domain.ts

interface Money {
  amount: number;     // Decimal con precisión 2
  currency: 'CUP' | 'USD' | 'MLC' | 'EUR';
}

interface Address {
  province: string;
  municipality: string;    // Para MVP: municipios de La Habana
  zone?: string;
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface ProductSpecification {
  key: string;
  value: string;
  unit?: string;
}

interface MarketStats {
  productId: string;
  currency: Money['currency'];
  minPrice: number | null;
  maxPrice: number | null;
  avgPrice: number | null;
  activePublicationsCount: number;
  calculatedAt: Date;
}

interface Opportunity {
  publicationId: string;
  productId: string;
  price: Money;
  marketAvgPrice: number;
  differencePercent: number;    // Negativo = más barato que el promedio
  opportunityScore: number;     // 0-100
}
```

### 3.3 Source Connector Interface

```typescript
// workers/collectors/src/interfaces/source-connector.interface.ts

interface RawPublication {
  sourceId: string;
  externalId: string;
  rawJson: Record<string, unknown>;
  capturedAt: Date;
}

interface NormalizedPublication {
  title: string;
  description: string;
  price: Money;
  imageUrls: string[];
  sellerName: string;
  sellerPhone?: string;
  sellerProfileUrl?: string;
  locationText: string;
  originalUrl: string;
  publishedAt: Date;
}

interface SourceConnector {
  readonly sourceName: string;
  collect(): Promise<RawPublication[]>;
  normalize(raw: RawPublication): Promise<NormalizedPublication>;
  validate(data: NormalizedPublication): Promise<boolean>;
}
```

### 3.4 Stage-Based Pipeline Interface

```typescript
// workers/collectors/src/interfaces/pipeline.interface.ts

interface ProcessingContext {
  rawPublication: RawPublication;
  normalizedData?: NormalizedPublication;
  productId?: string;
  isDuplicate?: boolean;
  duplicateScore?: number;
  priceHistoryEntry?: { price: number; currency: string; capturedAt: Date };
  marketStats?: MarketStats;
  detectedOpportunity?: Opportunity;
  errors: string[];
  metadata: Record<string, unknown>;
}

interface PipelineStage {
  readonly stageName: string;
  readonly enabled: boolean;
  process(ctx: ProcessingContext): Promise<ProcessingContext>;
}
```

### 3.5 AI Provider Interface

```typescript
// packages/types/src/ai.interface.ts

interface AIProvider {
  extractProductInfo(text: string, imageUrls?: string[]): Promise<ExtractedProductInfo>;
  runOCR(imageUrl: string): Promise<string>;
  classifyProduct(text: string): Promise<{ categoryId: string; confidence: number }>;
  detectDuplicates(pub: NormalizedPublication, candidates: NormalizedPublication[]): Promise<DuplicateResult[]>;
}

interface ExtractedProductInfo {
  productName?: string;
  brandName?: string;
  price?: Money;
  location?: string;
  sellerPhone?: string;
  quantity?: number;
  attributes?: ProductSpecification[];
  confidence: number;
}
```

---

## 4. Modelo de Dominio (DDD)

### 4.1 Mapa de Subdominios

```
┌─────────────────────────────────────────────────────────────────────┐
│                     MERCURY DOMAIN MAP                              │
│                                                                     │
│  CORE DOMAIN (ventaja competitiva):                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Mercado  │  Publicaciones  │  Análisis  │  IA              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  SUPPORTING DOMAIN (necesario, no diferenciador):                   │
│  ┌────────────────────────────────────────┐                        │
│  │  Productos  │  Búsquedas  │  Alertas   │                        │
│  └────────────────────────────────────────┘                        │
│                                                                     │
│  GENERIC DOMAIN (comprar o construir simple):                       │
│  ┌─────────────────────────────────────────────────────┐           │
│  │  Usuarios  │  Administración  │  Notificaciones      │           │
│  └─────────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Aggregates y Bounded Contexts

#### Aggregate Product
```
Product (Raíz)
 ├── brand: Brand (Value Object)
 ├── category: Category (Entity — referencia)
 ├── attributes: ProductSpecification[]
 └── status: ProductStatus
```
- Regla: Un Product no contiene publicaciones. Son agregados separados.
- Regla: Un Product pertenece exactamente a una categoría hoja.

#### Aggregate Publication
```
Publication (Raíz)
 ├── price: Money (Value Object)
 ├── location: Address (Value Object)
 ├── images: PublicationImage[]
 ├── priceHistory: PriceHistoryEntry[] (inmutable, append-only)
 ├── seller: Seller (Entity — referencia)
 └── source: Source (Entity — referencia)
```
- Regla: El Price History es append-only. Nunca se modifica ni elimina.
- Regla: La publicación pertenece a exactamente un Seller y un Source.
- Máquina de estado: `Draft → Pending → Published → Archived → Deleted`

#### Aggregate User
```
User (Raíz)
 ├── location: Address (Value Object)
 ├── preferences: UserPreferences
 ├── alerts: Alert[]
 └── favorites: Favorite[]
```
- Regla: Máximo 20 alertas ACTIVE simultáneas por usuario PERSONAL.

### 4.3 Domain Services

```typescript
// Servicio de análisis de precios
class PriceAnalysisService {
  calculateStats(publications: Publication[], currency: Currency): MarketStats;
  getPriceHistory(productId: string, from: Date, to: Date): DailyPricePoint[];
}

// Servicio de detección de oportunidades
class OpportunityDetectionService {
  // Una Opportunity NO se almacena — se calcula dinámicamente
  detectOpportunities(product: Product, publications: Publication[]): Opportunity[];
  calculateOpportunityScore(publication: Publication, marketStats: MarketStats): number;
}

// Servicio de detección de duplicados (sistema de puntuación, no binario)
class DuplicateDetectionService {
  calculateDuplicateScore(a: NormalizedPublication, b: NormalizedPublication): number;
  // Score: url(30) + phone(25) + images(20) + text(15) + price+location(10)
  isDuplicate(score: number, threshold?: number): boolean;  // threshold default: 70
}

// Servicio de matching de productos
class ProductMatchingService {
  findMatchingProduct(pub: NormalizedPublication): Promise<Product | null>;
  createProductFromPublication(pub: NormalizedPublication): Promise<Product>;
}
```

### 4.4 Domain Events

```
PublicationCreated
  → UpdatePriceHistory
  → AnalyzeDuplicates
  → UpdateMarketStats
  → EvaluateAlerts
  → DetectOpportunities
  → NotifyUsers (si hay alertas o favoritos)

PriceChanged
  → UpdatePriceHistory (append)
  → UpdateMarketStats
  → EvaluateAlerts

AlertCreated
  → ImmediateEvaluation (evaluar contra estado actual del mercado)

ProductCreated
  → IndexForSearch

UserRegistered
  → SendWelcomeNotification

PublicationExpired (automático, 30 días sin update)
  → UpdateMarketStats
  → NotifyFavoritedUsers
```

### 4.5 Lenguaje Ubicuo

| Término | Definición en dominio Mercury |
|---------|-------------------------------|
| **Product** | Objeto comercial canónico. Ej: "Aceite Vegetal 20L". Nunca es una oferta. |
| **Publication** | Anuncio específico con precio, vendedor y fuente. Ej: "Vendo Aceite 20L a 25000 CUP". |
| **Seller** | Persona o entidad que crea publicaciones. Puede tener cientos de productos. |
| **Source** | Origen de la información: Facebook, Revolico, Manual, API. |
| **Market** | Conjunto de publicaciones activas relacionadas con un Product. |
| **Opportunity** | Publicación cuyo precio es significativamente menor al promedio del mercado. Es el concepto de mayor valor. |
| **Alert** | Regla de usuario: notificar cuando precio de producto X baje de umbral Y. |
| **Favorite** | Relación usuario → publicación de interés. |
| **Price History** | Serie temporal append-only de precios observados para una publicación. |

---

## 5. Modelo de Datos (Prisma Schema)

### 5.1 Schema Completo

```prisma
// database/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── ENUMS ────────────────────────────────────────────────────────────────────

enum UserRole {
  PERSONAL
  BUSINESS
  SELLER
  ADMIN
}

enum UserStatus {
  ACTIVE
  SUSPENDED
}

enum Currency {
  CUP
  USD
  MLC
  EUR
}

enum PublicationStatus {
  DRAFT
  PENDING
  ACTIVE
  INACTIVE
  EXPIRED
  DELETED
}

enum AlertType {
  PRICE_BELOW          // Notificar cuando precio cae por debajo de umbral
  PRICE_ABOVE          // Notificar cuando precio sube por encima de umbral
  PRICE_CHANGE_PERCENT // Notificar cuando precio cambia más de X%
  NEW_PRODUCT_MATCH    // Notificar cuando aparece nueva publicación del producto
  HIGH_OPPORTUNITY     // Notificar cuando hay una oportunidad con score ≥ umbral
  MARKET_CHANGE        // Notificar cuando el promedio del mercado cambia > X%
}

enum AlertStatus {
  ACTIVE
  TRIGGERED
  PAUSED
  DISABLED
  DELETED
}

enum SourceName {
  FACEBOOK
  REVOLICO
  MANUAL
  IMPORT
  API
}

// ─── USUARIOS ─────────────────────────────────────────────────────────────────

model Role {
  id    String   @id @default(uuid())
  name  UserRole @unique
  users User[]

  @@map("roles")
}

model Location {
  id           String        @id @default(uuid())
  province     String
  municipality String
  zone         String?
  latitude     Decimal?      @db.Decimal(10, 7)
  longitude    Decimal?      @db.Decimal(10, 7)
  users        User[]
  publications Publication[]
  alerts       Alert[]

  @@unique([province, municipality, zone])
  @@index([province])
  @@index([municipality])
  @@map("locations")
}

model User {
  id            String      @id @default(uuid())
  email         String      @unique
  passwordHash  String      @map("password_hash")
  fullName      String      @map("full_name")
  phone         String?
  roleId        String      @map("role_id")
  locationId    String?     @map("location_id")
  status        UserStatus  @default(ACTIVE)
  avatarUrl     String?     @map("avatar_url")
  lastLogin     DateTime?   @map("last_login")
  createdAt     DateTime    @default(now()) @map("created_at")
  updatedAt     DateTime    @updatedAt @map("updated_at")
  deletedAt     DateTime?   @map("deleted_at")

  role          Role        @relation(fields: [roleId], references: [id])
  location      Location?   @relation(fields: [locationId], references: [id])
  favorites     Favorite[]
  alerts        Alert[]
  notifications Notification[]
  searchHistory SearchHistory[]
  logs          Log[]

  @@index([email])
  @@index([roleId])
  @@index([status])
  @@map("users")
}

// ─── CATÁLOGO ──────────────────────────────────────────────────────────────────

model Category {
  id               String     @id @default(uuid())
  name             String
  description      String?
  slug             String     @unique
  parentCategoryId String?    @map("parent_category_id")
  createdAt        DateTime   @default(now()) @map("created_at")

  parent           Category?   @relation("CategoryHierarchy", fields: [parentCategoryId], references: [id])
  children         Category[]  @relation("CategoryHierarchy")
  products         Product[]

  @@unique([name, parentCategoryId])
  @@index([slug])
  @@index([parentCategoryId])
  @@map("categories")
}

model Brand {
  id        String    @id @default(uuid())
  name      String    @unique
  slug      String    @unique
  createdAt DateTime  @default(now()) @map("created_at")

  products  Product[]

  @@index([slug])
  @@map("brands")
}

model Product {
  id           String          @id @default(uuid())
  name         String
  brandId      String?         @map("brand_id")
  categoryId   String          @map("category_id")
  description  String?
  slug         String          @unique
  status       String          @default("ACTIVE")
  createdAt    DateTime        @default(now()) @map("created_at")
  updatedAt    DateTime        @updatedAt @map("updated_at")

  brand        Brand?          @relation(fields: [brandId], references: [id])
  category     Category        @relation(fields: [categoryId], references: [id])
  attributes   ProductAttribute[]
  publications Publication[]
  alerts       Alert[]

  @@index([slug])
  @@index([categoryId])
  @@index([brandId])
  @@map("products")
}

model ProductAttribute {
  id         String  @id @default(uuid())
  productId  String  @map("product_id")
  key        String
  value      String
  unit       String?

  product    Product @relation(fields: [productId], references: [id])

  @@unique([productId, key])
  @@index([productId])
  @@map("product_attributes")
}

// ─── PUBLICACIONES ─────────────────────────────────────────────────────────────

model Source {
  id           String        @id @default(uuid())
  name         SourceName    @unique
  publications Publication[]

  @@map("sources")
}

model Seller {
  id              String        @id @default(uuid())
  name            String
  phone           String?
  email           String?
  facebookProfile String?       @map("facebook_profile")
  whatsapp        String?
  rating          Decimal?      @db.Decimal(3, 2)
  verified        Boolean       @default(false)
  createdAt       DateTime      @default(now()) @map("created_at")

  publications    Publication[]

  @@index([phone])
  @@map("sellers")
}

model Publication {
  id               String            @id @default(uuid())
  productId        String            @map("product_id")
  sellerId         String            @map("seller_id")
  sourceId         String            @map("source_id")
  title            String
  description      String?
  price            Decimal           @db.Decimal(12, 2)
  currency         Currency          @default(CUP)
  locationId       String?           @map("location_id")
  publicationUrl   String?           @map("publication_url")
  publicationDate  DateTime          @map("publication_date")
  status           PublicationStatus @default(PENDING)
  createdAt        DateTime          @default(now()) @map("created_at")
  updatedAt        DateTime          @updatedAt @map("updated_at")

  product          Product           @relation(fields: [productId], references: [id])
  seller           Seller            @relation(fields: [sellerId], references: [id])
  source           Source            @relation(fields: [sourceId], references: [id])
  location         Location?         @relation(fields: [locationId], references: [id])
  images           PublicationImage[]
  priceHistory     PriceHistory[]
  favorites        Favorite[]

  @@index([productId])
  @@index([sellerId])
  @@index([sourceId])
  @@index([locationId])
  @@index([status])
  @@index([price])
  @@index([publicationDate])
  @@index([createdAt])
  @@map("publications")
}

model PublicationImage {
  id             String      @id @default(uuid())
  publicationId  String      @map("publication_id")
  imageUrl       String      @map("image_url")
  position       Int         @default(0)
  ocrProcessed   Boolean     @default(false) @map("ocr_processed")
  aiProcessed    Boolean     @default(false) @map("ai_processed")

  publication    Publication @relation(fields: [publicationId], references: [id])

  @@index([publicationId])
  @@map("publication_images")
}

model PriceHistory {
  id            String      @id @default(uuid())
  publicationId String      @map("publication_id")
  price         Decimal     @db.Decimal(12, 2)
  currency      Currency
  capturedAt    DateTime    @default(now()) @map("captured_at")

  publication   Publication @relation(fields: [publicationId], references: [id])

  // NUNCA se modifica ni elimina — append-only
  @@index([publicationId])
  @@index([capturedAt])
  @@map("price_history")
}

// ─── FAVORITOS Y ALERTAS ───────────────────────────────────────────────────────

model Favorite {
  id            String      @id @default(uuid())
  userId        String      @map("user_id")
  publicationId String      @map("publication_id")
  createdAt     DateTime    @default(now()) @map("created_at")

  user          User        @relation(fields: [userId], references: [id])
  publication   Publication @relation(fields: [publicationId], references: [id])

  @@unique([userId, publicationId])
  @@index([userId])
  @@index([publicationId])
  @@map("favorites")
}

model Alert {
  id              String      @id @default(uuid())
  userId          String      @map("user_id")
  productId       String      @map("product_id")
  maximumPrice    Decimal     @db.Decimal(12, 2) @map("maximum_price")
  currency        Currency    @default(CUP)
  alertType       AlertType   @default(PRICE_BELOW) @map("alert_type")
  changePercent   Decimal?    @db.Decimal(5, 2) @map("change_percent") // Para PRICE_CHANGE_PERCENT y MARKET_CHANGE
  locationId      String?     @map("location_id")
  status          AlertStatus @default(ACTIVE)
  triggeredAt     DateTime?   @map("triggered_at")
  triggeredPrice  Decimal?    @db.Decimal(12, 2) @map("triggered_price")
  createdAt       DateTime    @default(now()) @map("created_at")
  updatedAt       DateTime    @updatedAt @map("updated_at")

  user            User        @relation(fields: [userId], references: [id])
  product         Product     @relation(fields: [productId], references: [id])
  location        Location?   @relation(fields: [locationId], references: [id])

  @@index([userId])
  @@index([productId])
  @@index([status])
  @@index([alertType])
  @@map("alerts")
}

// ─── NOTIFICACIONES Y ACTIVIDAD ────────────────────────────────────────────────

model Notification {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  type      String
  content   Json
  read      Boolean  @default(false)
  createdAt DateTime @default(now()) @map("created_at")

  user      User     @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([read])
  @@map("notifications")
}

model SearchHistory {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  query     String
  createdAt DateTime @default(now()) @map("created_at")

  user      User     @relation(fields: [userId], references: [id])

  @@index([userId])
  @@map("search_history")
}

model Log {
  id        String   @id @default(uuid())
  userId    String?  @map("user_id")
  action    String
  entity    String
  entityId  String?  @map("entity_id")
  metadata  Json?
  createdAt DateTime @default(now()) @map("created_at")

  user      User?    @relation(fields: [userId], references: [id])

  // NUNCA se elimina
  @@index([userId])
  @@index([entity])
  @@index([entityId])
  @@index([createdAt])
  @@map("logs")
}

// ─── DATOS CRUDOS ──────────────────────────────────────────────────────────────

model RawPublication {
  id          String     @id @default(uuid())
  source      SourceName
  jsonOriginal Json      @map("json_original")
  capturedAt  DateTime   @default(now()) @map("captured_at")

  // Datos crudos originales — no se modifican
  @@index([source])
  @@index([capturedAt])
  @@map("raw_publications")
}

// ─── SAAS SCAFFOLD (estructura preparada — implementación POST-MVP) ──────────
// Estas tablas están definidas en el schema para que las migraciones iniciales
// sean completas. La lógica de negocio de planes, cobros y multi-tenancy
// se implementa después del MVP.

enum PlanName {
  FREE
  PROFESSIONAL
  BUSINESS
}

model Organization {
  id          String    @id @default(uuid())
  name        String
  slug        String    @unique
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  members     OrganizationMember[]
  subscription Subscription?

  @@index([slug])
  @@map("organizations")
}

model OrganizationMember {
  id             String       @id @default(uuid())
  organizationId String       @map("organization_id")
  userId         String       @map("user_id")
  role           String       @default("MEMBER") // OWNER, ADMIN, MEMBER
  joinedAt       DateTime     @default(now()) @map("joined_at")

  organization   Organization @relation(fields: [organizationId], references: [id])

  @@unique([organizationId, userId])
  @@index([userId])
  @@map("organization_members")
}

model Plan {
  id          String    @id @default(uuid())
  name        PlanName  @unique
  alertLimit  Int       @default(20) @map("alert_limit")
  priceUsd    Decimal   @db.Decimal(8, 2) @map("price_usd")
  createdAt   DateTime  @default(now()) @map("created_at")

  subscriptions Subscription[]

  @@map("plans")
}

model Subscription {
  id             String       @id @default(uuid())
  organizationId String?      @unique @map("organization_id")
  planId         String       @map("plan_id")
  status         String       @default("ACTIVE") // ACTIVE, CANCELLED, PAST_DUE
  startDate      DateTime     @map("start_date")
  endDate        DateTime?    @map("end_date")
  createdAt      DateTime     @default(now()) @map("created_at")

  organization   Organization? @relation(fields: [organizationId], references: [id])
  plan           Plan          @relation(fields: [planId], references: [id])

  @@index([status])
  @@map("subscriptions")
}

model UserPreferences {
  id               String   @id @default(uuid())
  userId           String   @unique @map("user_id")
  defaultCurrency  Currency @default(CUP) @map("default_currency")
  defaultMunicipality String? @map("default_municipality")
  emailNotifications Boolean @default(true) @map("email_notifications")
  updatedAt        DateTime @updatedAt @map("updated_at")

  @@map("user_preferences")
}

model NotificationPreferences {
  id             String  @id @default(uuid())
  userId         String  @unique @map("user_id")
  alertTriggered Boolean @default(true) @map("alert_triggered")
  newOpportunity Boolean @default(false) @map("new_opportunity")
  marketChange   Boolean @default(false) @map("market_change")
  weeklyDigest   Boolean @default(true) @map("weekly_digest")

  @@map("notification_preferences")
}

model SystemEvent {
  id        String   @id @default(uuid())
  type      String   // PUBLICATION_CREATED, PRICE_CHANGED, ALERT_TRIGGERED, etc.
  entityId  String?  @map("entity_id")
  payload   Json
  createdAt DateTime @default(now()) @map("created_at")

  @@index([type])
  @@index([createdAt])
  @@map("system_events")
}

model AutomationLog {
  id          String   @id @default(uuid())
  taskName    String   @map("task_name")
  status      String   // SUCCESS, FAILED, PARTIAL
  itemsProcessed Int   @default(0) @map("items_processed")
  errors      Json?
  startedAt   DateTime @map("started_at")
  finishedAt  DateTime? @map("finished_at")

  @@index([taskName])
  @@index([startedAt])
  @@map("automation_logs")
}
```

### 5.2 Índices Críticos de Rendimiento

```sql
-- Búsqueda full-text (PostgreSQL tsvector)
CREATE INDEX idx_publications_search
ON publications USING GIN(to_tsvector('spanish', title || ' ' || COALESCE(description, '')));

-- Rango de precios
CREATE INDEX idx_publications_price_range
ON publications (price, currency) WHERE status = 'ACTIVE';

-- Dashboard: publicaciones recientes activas por producto
CREATE INDEX idx_publications_product_active
ON publications (product_id, status, created_at DESC)
WHERE status = 'ACTIVE';
```

---

## 6. Diseño de la API

### 6.1 Convenciones Generales

- Base URL: `/api/v1/`
- Autenticación: `Authorization: Bearer <JWT>`
- Content-Type: `application/json; charset=utf-8`

Formato de respuesta exitosa:
```json
{
  "success": true,
  "message": "OK",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

Formato de respuesta de error:
```json
{
  "success": false,
  "message": "Descripción legible del error",
  "errors": [
    { "field": "email", "code": "INVALID_EMAIL_FORMAT" }
  ]
}
```

### 6.2 Módulos y Endpoints

#### Auth
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/auth/register` | Registro con email + password | No |
| POST | `/auth/login` | Login, devuelve JWT | No |
| POST | `/auth/logout` | Invalida sesión | Sí |
| POST | `/auth/refresh` | Renueva JWT | Sí |
| GET | `/auth/me` | Datos del usuario autenticado | Sí |

**POST /auth/register — DTO de entrada:**
```typescript
class RegisterDto {
  @IsEmail()
  email: string;

  @MinLength(8)
  password: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;
}
```

**POST /auth/register — Respuesta (201):**
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "...", "fullName": "...", "role": "PERSONAL" },
    "token": { "accessToken": "...", "expiresIn": 86400 }
  }
}
```

#### Users
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/users/:id` | Perfil de usuario | Sí (propio o Admin) |
| PATCH | `/users/:id` | Actualizar nombre/municipio | Sí (solo propio) |
| DELETE | `/users/:id` | Soft-delete de cuenta | Sí (solo propio) |

#### Products
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/products` | Listar productos con paginación | No |
| GET | `/products/:id` | Detalle de producto | No |
| POST | `/products` | Crear producto | Admin |
| PATCH | `/products/:id` | Actualizar producto | Admin |
| DELETE | `/products/:id` | Desactivar producto | Admin |
| GET | `/products/:id/market` | Estadísticas de mercado | No |

**GET /products/:id/market — Respuesta:**
```json
{
  "success": true,
  "data": {
    "productId": "...",
    "currency": "CUP",
    "minPrice": 20000,
    "maxPrice": 35000,
    "avgPrice": 26500,
    "activePublicationsCount": 12,
    "opportunities": [
      {
        "publicationId": "...",
        "price": { "amount": 20000, "currency": "CUP" },
        "differencePercent": -24.5,
        "opportunityScore": 87
      }
    ]
  }
}
```

#### Publications
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/publications` | Listar publicaciones activas | No |
| GET | `/publications/:id` | Detalle de publicación | No |
| POST | `/publications` | Crear publicación (manual) | Sí |
| PATCH | `/publications/:id` | Actualizar publicación | Admin |
| DELETE | `/publications/:id` | Cambiar estado INACTIVE | Admin |

#### Search
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/search` | Búsqueda con filtros | No |

**Query params:**
```
q           string (min 2)    Consulta de texto
category    string            ID de categoría
price_min   number            Precio mínimo
price_max   number            Precio máximo
currency    CUP|USD|MLC       Moneda
location    string            ID de municipio
source      FACEBOOK|REVOLICO Fuente
sort        price_asc|price_desc|date_desc  Ordenamiento
page        number (default 1)
limit       number (10-50, default 20)
```

#### Prices / Market
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/products/:id/market` | Stats actuales del mercado | No |
| GET | `/products/:id/price-history` | Serie temporal de precios | No |

**GET /products/:id/price-history — Query params:**
```
from    ISO8601 date
to      ISO8601 date
```

#### Favorites
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/favorites` | Lista de favoritos del usuario | Sí |
| POST | `/favorites` | Agregar favorito (idempotente) | Sí |
| DELETE | `/favorites/:id` | Eliminar favorito | Sí |

#### Alerts
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/alerts` | Alertas del usuario | Sí |
| POST | `/alerts` | Crear alerta | Sí |
| PATCH | `/alerts/:id` | Pausar/reactivar alerta | Sí |
| DELETE | `/alerts/:id` | Eliminar (soft-delete) | Sí |

#### Admin
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/admin/users` | Listar usuarios | Admin |
| PATCH | `/admin/users/:id/status` | Suspender/activar usuario | Admin |
| GET | `/admin/publications` | Listar todas las publicaciones | Admin |
| PATCH | `/admin/publications/:id` | Editar publicación + log | Admin |
| GET | `/admin/logs` | Auditoría de acciones | Admin |
| POST | `/categories` | Crear categoría | Admin |
| PATCH | `/categories/:id` | Editar categoría | Admin |

#### AI (interno, no público)
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/ai/extract` | Extracción de info de texto/imagen |
| POST | `/ai/ocr` | OCR sobre imagen |
| POST | `/ai/classify` | Clasificación de producto |
| POST | `/ai/duplicates` | Detección de duplicados |

### 6.3 Códigos de Error

| Código | HTTP | Descripción |
|--------|------|-------------|
| `EMAIL_ALREADY_EXISTS` | 409 | Email ya registrado |
| `INVALID_EMAIL_FORMAT` | 400 | Formato de email inválido |
| `PASSWORD_TOO_SHORT` | 400 | Contraseña menor a 8 caracteres |
| `INVALID_CREDENTIALS` | 401 | Credenciales incorrectas |
| `TOKEN_EXPIRED` | 401 | JWT expirado |
| `UNAUTHORIZED` | 401 | Sin autenticación |
| `FORBIDDEN` | 403 | Sin permisos suficientes |
| `ACCOUNT_SUSPENDED` | 403 | Cuenta suspendida |
| `ALERT_LIMIT_REACHED` | 422 | Límite de 20 alertas alcanzado |
| `QUERY_TOO_SHORT` | 400 | Búsqueda menor a 2 caracteres |
| `CATEGORY_NAME_DUPLICATE` | 409 | Nombre de categoría duplicado |
| `ENDPOINT_NOT_FOUND` | 404 | Ruta inexistente |
| `VALIDATION_ERROR` | 400 | Parámetros inválidos |

### 6.4 Seguridad de la API

```typescript
// apps/api/src/common/guards/
├── jwt-auth.guard.ts         // Verifica JWT en rutas protegidas
├── roles.guard.ts            // Verifica rol (ADMIN, PERSONAL, etc.)
├── throttle.guard.ts         // Rate limiting por IP/usuario
└── account-status.guard.ts   // Verifica que cuenta esté ACTIVE

// Rate limiting (MVP):
// - POST /auth/login: 5 intentos/minuto por IP
// - POST /auth/register: 10 solicitudes/hora por IP
// - GET /search: 60 solicitudes/minuto por usuario
// - General: 100 solicitudes/minuto por usuario autenticado
```

---

## 7. Pipeline de Ingesta y Procesamiento

### 7.1 Diagrama del Pipeline

```
FUENTE EXTERNA (Facebook / Revolico)
        │
        ▼
┌─────────────────────┐
│  Source Collector   │  Solo descarga datos crudos.
│  workers/collectors │  NUNCA interpreta ni transforma.
└─────────┬───────────┘
          │ RawPublication (JSON original)
          ▼
┌─────────────────────┐
│  Raw Data Storage   │  Almacena en raw_publications.
│  (raw_publications) │  Dato original preservado siempre.
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Normalization      │  Precios: "25mil"/"25k" → 25000
│  Engine             │  Monedas, teléfonos, ubicaciones, texto
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Information        │  Extrae: producto, marca, precio,
│  Extraction         │  ubicación, teléfono, cantidad
│  (AI Gateway)       │  Fallback: Rule Engine si AI falla
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Image Processing   │  1. Optimización + thumbnails
│  workers/image-proc │  2. OCR (texto en imagen)
│                     │  3. Clasificación visual
│                     │  4. Detección de producto
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Duplicate          │  Sistema de puntuación (0-100):
│  Detection          │  URL(30)+Phone(25)+Images(20)
│                     │  +Text(15)+Price/Location(10)
│                     │  Score ≥70 → duplicado
└─────────┬───────────┘
          │ (si no es duplicado)
          ▼
┌─────────────────────┐
│  Product Matching   │  ¿Esta publicación pertenece
│                     │  a un Product existente?
│                     │  Si no → crear nuevo Product
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Price Registration │  Agrega entrada a price_history.
│                     │  NUNCA modifica precio existente.
│                     │  Emite: PriceChanged si difiere.
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Market Intelligence│  Calcula: avg, min, max,
│  Engine             │  mediana, desviación estándar,
│                     │  distribución geográfica,
│                     │  variación diaria/semanal/mensual
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Opportunity Engine │  Calcula Opportunity Score:
│                     │  diferencia vs avg + antigüedad
│                     │  + reputación vendedor + calidad
│                     │  + fotos + contacto + ubicación
│                     │  + historial + tendencia (0-100)
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Alert Evaluation   │  Revisa alertas ACTIVE del producto
│                     │  Si price_min ≤ alert.max_price
│                     │  → marcar TRIGGERED + crear notif
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Notification Queue │  NUNCA notificar directo desde
│  (BullMQ)           │  pipeline. Siempre cola con
│                     │  reintentos (max 3, backoff exp)
└─────────────────────┘
```

### 7.2 Implementación de Etapas

```typescript
// Implementación de una etapa (ejemplo: NormalizationStage)
class NormalizationStage implements PipelineStage {
  readonly stageName = 'normalization';
  readonly enabled = true;

  async process(ctx: ProcessingContext): Promise<ProcessingContext> {
    if (!ctx.rawPublication) return ctx;

    const normalized = await this.normalize(ctx.rawPublication);
    return { ...ctx, normalizedData: normalized };
  }

  private normalize(raw: RawPublication): NormalizedPublication {
    // Normalizar precio: "25mil" → 25000, "25k" → 25000, "25K" → 25000
    // Normalizar moneda: detectar CUP/USD/MLC del texto
    // Normalizar teléfono: +53XXXXXXXX
    // Normalizar ubicación: texto → Location record
    // Limpiar texto: quitar emoji, normalizar espacios
  }
}
```

### 7.3 Scheduler (Tareas Programadas)

```
Cada 60 minutos:  EvaluateAllActiveAlerts
Cada 24 horas:    ExpireOldPublications (> 30 días sin update)
Cada 1 hora:      RefreshMarketStats (productos con > 5 publicaciones)
Cada 6 horas:     CollectFromSources (Facebook, Revolico)
```

---

## 8. Arquitectura de IA

### 8.1 Principio Fundamental

> La IA es una capa transversal, NO un módulo independiente. Toda funcionalidad crítica tiene fallback determinístico en el Rule Engine. El sistema nunca llama directamente a `OpenAI.method()` — siempre usa `AIProvider.method()`.

### 8.2 Capas de IA

```
┌─────────────────────────────────────────────────────┐
│                  AI GATEWAY                         │
│  Punto único de entrada para todas las llamadas IA  │
│  - Selecciona proveedor (OpenAI / Anthropic / ...)  │
│  - Cachea resultados (Redis, preparado para MVP)     │
│  - Registra costos por operación                    │
│  - Rate limiting de llamadas IA                     │
└────────────────┬────────────────────────────────────┘
                 │
    ┌────────────┼─────────────┐
    ▼            ▼             ▼
┌────────┐ ┌──────────┐ ┌──────────────┐
│Rule    │ │AI        │ │AI Orchestrat.│
│Engine  │ │Orchestr. │ │ Decide qué   │
│(gratis)│ │          │ │ motor usar:  │
│Resuelve│ │          │ │ OCR→Vision→  │
│sin IA  │ │          │ │ LLM si falla │
└────────┘ └──────────┘ └──────────────┘
```

### 8.3 Servicios IA Especializados

| Servicio | Input | Output | Fallback |
|----------|-------|--------|---------|
| OCRService | imagen | texto extraído | — |
| NLPService | texto | entidades (precio, marca, etc.) | Regex rules |
| ClassificationService | texto + imagen | categoryId + confidence | Keyword matching |
| ProductMatchingAI | pub normalizada | productId o null | String similarity |
| DuplicateDetectionAI | dos publicaciones | score 0-100 | Hash/phone matching |
| AttributeExtractionService | texto | ProductSpecification[] | Structured regex |
| QualityScoreService | pub completa | quality score 0-100 | Rule-based scoring |

### 8.4 Human Review Queue

Cuando la confianza de cualquier operación IA es < umbral configurable (default: 0.75):

```
1. NO decidir automáticamente
2. NO contaminar la base de datos con datos de baja confianza
3. Crear tarea en human_review_queue con:
   - publicationId
   - operationType (classify / match / extract)
   - aiOutput (propuesta)
   - confidence
   - rawData
4. Un admin revisa y aprueba/corrige
5. La corrección retroalimenta el modelo (AI Memory Layer — preparado, no implementado en MVP)
```

### 8.5 Mercury Score (Arquitectura preparada, no implementada en MVP)

```
Mercury Score (0-100) =
  Opportunity Score (¿cuánto más barato que el promedio?)
  + Quality Score (¿qué tan completa es la publicación?)
  + Seller Reputation Score (historial del vendedor)
  + Risk Score (indicadores de fraude, antigüedad)
  + Market Volatility Score (¿el precio es estable?)
```

---

## 9. Arquitectura del Frontend

### 9.1 Filosofía

Mercury es un **Dashboard SaaS**, no un e-commerce. Cada pantalla responde una única pregunta. El objetivo UX es que el usuario encuentre la mejor oportunidad del mercado en el menor tiempo posible.

**UX Goals:**
- Encontrar un producto en menos de 3 clics
- Llegar a una publicación desde el Dashboard en menos de 2 clics
- Crear una alerta en menos de 30 segundos

### 9.2 Estructura del App (Next.js 15 App Router)

```
apps/web/app/
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
├── (dashboard)/
│   ├── layout.tsx              # Header + Sidebar
│   ├── page.tsx                # Dashboard principal
│   ├── search/page.tsx         # Búsqueda global
│   ├── products/
│   │   ├── page.tsx            # Catálogo de productos
│   │   └── [id]/page.tsx       # Pantalla de producto
│   ├── publications/
│   │   └── [id]/page.tsx       # Detalle de publicación
│   ├── favorites/page.tsx
│   ├── alerts/page.tsx
│   ├── market/page.tsx
│   └── profile/page.tsx
└── (admin)/
    ├── layout.tsx
    ├── users/page.tsx
    ├── publications/page.tsx
    ├── categories/page.tsx
    └── logs/page.tsx
```

### 9.3 Layout Principal

```
┌─────────────────────────────────────────────────────┐
│ HEADER (fijo)                                       │
│ [Logo] [🔍 Buscar producto... (elemento principal)] │
│                      [🔔] [☀️/🌙] [👤 Perfil]     │
├────────────┬────────────────────────────────────────┤
│ SIDEBAR    │ CONTENT AREA                           │
│ (colapsa)  │                                        │
│            │                                        │
│ Dashboard  │                                        │
│ Buscar     │                                        │
│ Productos  │                                        │
│ Mercado    │                                        │
│ Alertas    │                                        │
│ Favoritos  │                                        │
│ Config     │                                        │
│            │                                        │
└────────────┴────────────────────────────────────────┘
```

### 9.4 Pantallas Principales

**Dashboard — "¿Qué está ocurriendo en mi mercado?"**
```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Productos    │ Alertas      │ Oportunidades│ Tendencia    │
│ seguidos (N) │ recientes (N)│ nuevas (N)   │ precios ↑↓   │
└──────────────┴──────────────┴──────────────┴──────────────┘
┌─────────────────────────────┬──────────────────────────────┐
│ MIS FAVORITOS RECIENTES     │ ACTIVIDAD RECIENTE           │
│ [ProductCard] [ProductCard] │ Lista de eventos del mercado │
└─────────────────────────────┴──────────────────────────────┘
```

**Búsqueda Global — comportamiento similar a Google**
```
┌──────────────────────────────────────────────────────┐
│ 🔍 [aceite vegetal 20l                    ] [Buscar] │
├──────────────────────────────────────────────────────┤
│ FILTROS: [Categoría ▼] [Precio ___-___] [Municipio ▼]│
├──────────────────────────────────────────────────────┤
│ 142 resultados · Ordenar por: [Más relevante ▼]      │
│ ┌────────────────────────────────────────────────┐   │
│ │ [Img] Aceite Vegetal 20L                       │   │
│ │       25,000 CUP  ↓-5.2% vs promedio          │   │
│ │       📍 Plaza · Facebook · [vendedor]         │   │
│ │                              [Ver oferta]      │   │
│ └────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

**Pantalla de Producto — "¿Cómo se comporta este producto en el mercado?"**
```
┌──────────────────────────────────────────────────────┐
│ Aceite Vegetal 20L                    [+ Alerta]     │
│ 12 publicaciones activas                             │
├──────────────────────────────────────────────────────┤
│ Mín: 20,000  Prom: 26,500  Máx: 35,000 CUP          │
│ [━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━] (gráfico)│
├──────────────────────────────────────────────────────┤
│ PUBLICACIONES DISPONIBLES                            │
│ [PublicationCard sorted by opportunity score]        │
└──────────────────────────────────────────────────────┘
```

### 9.5 Sistema de Estados de Pantalla

Cada pantalla implementa 5 estados. NUNCA pantalla en blanco:

```typescript
type ScreenState = 'loading' | 'empty' | 'error' | 'offline' | 'data';

// Componentes para cada estado:
// loading  → <LoadingSkeleton />  (skeleton que imita el layout)
// empty    → <EmptyState />       (ilustración + CTA)
// error    → <ErrorState />       (mensaje + botón retry)
// offline  → <OfflineState />     (indicador de sin conexión)
// data     → contenido real
```

### 9.6 Componentes Reutilizables

```typescript
// packages/ui/src/components/
├── Button/
├── Input/
├── SearchBox/          // Buscador global con debounce y sugerencias
├── ProductCard/        // Tarjeta de producto con avg price + pub count
├── PublicationCard/    // Tarjeta de publicación con precio, variación, fuente
├── SellerCard/         // Info de vendedor con rating
├── MarketChart/        // Gráfico de historial de precios (Recharts)
├── PriceBadge/         // Precio formateado con moneda
├── OpportunityBadge/   // Badge de oportunidad con porcentaje
├── FilterPanel/        // Panel de filtros colapsable
├── EmptyState/
├── LoadingSkeleton/
├── ErrorState/
└── Pagination/
```

### 9.7 Gestión de Estado

```typescript
// apps/web/stores/
├── auth.store.ts       // Usuario autenticado, token
├── search.store.ts     // Query actual, filtros, resultados
├── alerts.store.ts     // Alertas del usuario
└── favorites.store.ts  // Favoritos del usuario

// Tecnología: Zustand (ligero, compatible con SSR de Next.js)
// Datos del servidor: TanStack Query (caché, revalidación, loading states)
```

---

## 10. Infraestructura y Despliegue

### 10.1 MVP Infrastructure

```
┌──────────────────────────────────────────────────────────────────┐
│                      MERCURY MVP INFRA                           │
│                                                                  │
│  ┌────────────────┐    ┌────────────────┐    ┌───────────────┐  │
│  │    Vercel      │    │ Render/Railway │    │   Supabase    │  │
│  │                │    │                │    │               │  │
│  │  apps/web      │───►│  apps/api      │───►│  PostgreSQL   │  │
│  │  Next.js 15    │    │  NestJS 11     │    │  Auth         │  │
│  │  Edge Network  │    │  Node.js 22    │    │  Storage      │  │
│  └────────────────┘    └────────────────┘    └───────────────┘  │
│                                │                                 │
│                                │ (proceso separado)              │
│                                ▼                                 │
│                        ┌────────────────┐                        │
│                        │ Workers        │                        │
│                        │ (Render cron   │                        │
│                        │  o similar)    │                        │
│                        └────────────────┘                        │
└──────────────────────────────────────────────────────────────────┘
```

**Decisiones de diseño:**
- Workers en proceso separado → si falla, no afecta la API
- Supabase para PostgreSQL, Auth y Storage → reduce complejidad operacional en MVP
- Cache con Redis: arquitectura preparada, no implementado en MVP
- Colas: BullMQ (MVP) → distribuida en producción

### 10.2 Variables de Entorno

```bash
# Base de datos
DATABASE_URL=postgresql://...

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Solo en API, NUNCA en frontend

# Auth
JWT_SECRET=<mínimo 256 bits, generado con openssl rand -base64 32>
JWT_EXPIRY=86400                  # 24 horas en segundos

# IA
AI_PROVIDER=openai
AI_API_KEY=sk-...

# Workers
REDIS_URL=redis://...             # Preparado para BullMQ

# Email (notificaciones)
SMTP_HOST=smtp.ejemplo.com
SMTP_USER=mercury@ejemplo.com
SMTP_PASSWORD=...

# App
NODE_ENV=production
API_BASE_URL=https://api.mercury.app
WEB_BASE_URL=https://mercury.app
```

### 10.3 Seguridad Obligatoria desde MVP

| Medida | Implementación |
|--------|----------------|
| HTTPS | Forzado en Vercel + Render |
| JWT firmado | HMAC-SHA256, clave ≥ 256 bits, no embebida en código |
| Password hashing | bcrypt con cost factor ≥ 10 |
| Rate limiting | NestJS Throttler (login: 5/min, general: 100/min) |
| Input validation | Zod (shared) + class-validator (NestJS DTOs) |
| CORS | Origins whitelist, no wildcard en producción |
| Security headers | Helmet.js (HSTS, CSP, X-Frame-Options) |
| SQL injection | Prisma ORM (queries parametrizadas) |
| Brute force | Lockout temporal tras 5 intentos fallidos |
| Secrets | Variables de entorno, nunca en código fuente |

### 10.4 Docker Compose (Entorno Local)

El archivo `docker-compose.yml` en la raíz del monorepo levanta todos los servicios necesarios para desarrollo local sin depender de Supabase Cloud.

```yaml
# docker-compose.yml
version: '3.9'

services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: mercury_dev
      POSTGRES_USER: mercury
      POSTGRES_PASSWORD: mercury_local
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U mercury -d mercury_dev']
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data

  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile.dev
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://mercury:mercury_local@db:5432/mercury_dev
      REDIS_URL: redis://redis:6379
      NODE_ENV: development
    ports:
      - '3001:3001'
    volumes:
      - ./apps/api:/app
      - /app/node_modules
    depends_on:
      db:
        condition: service_healthy

  web:
    build:
      context: ./apps/web
      dockerfile: Dockerfile.dev
    restart: unless-stopped
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001/api/v1
      NODE_ENV: development
    ports:
      - '3000:3000'
    volumes:
      - ./apps/web:/app
      - /app/node_modules
    depends_on:
      - api

volumes:
  postgres_data:
  redis_data:
```

**Comandos de desarrollo local:**

```bash
# Levantar todos los servicios
docker-compose up -d

# Solo la base de datos y Redis (para desarrollo con hot-reload manual)
docker-compose up -d db redis

# Ver logs de la API
docker-compose logs -f api

# Ejecutar migraciones dentro del contenedor
docker-compose exec api pnpm prisma migrate dev

# Detener y limpiar
docker-compose down -v
```

### 10.5 CI/CD Pipeline (GitHub Actions)

```
Push → Lint → Type Check → Tests → Build → Deploy
```

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint

  typecheck:
    name: Type Check
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck

  test:
    name: Tests
    runs-on: ubuntu-latest
    needs: typecheck
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: mercury_test
          POSTGRES_USER: mercury
          POSTGRES_PASSWORD: mercury_test
        ports: ['5432:5432']
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - name: Run migrations
        env:
          DATABASE_URL: postgresql://mercury:mercury_test@localhost:5432/mercury_test
        run: pnpm prisma migrate deploy
        working-directory: database
      - name: Run tests
        env:
          DATABASE_URL: postgresql://mercury:mercury_test@localhost:5432/mercury_test
          JWT_SECRET: test_secret_at_least_32_characters_long
        run: pnpm test --run

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: |
            apps/api/dist
            apps/web/.next
          retention-days: 7
```

**Estrategia de ramas Git:**

| Rama | Propósito | Deploy automático |
|------|-----------|-------------------|
| `main` | Producción — solo merge desde `develop` via PR | Sí → Vercel + Render (producción) |
| `develop` | Integración — base para features | Sí → staging |
| `feature/*` | Desarrollo de features individuales | No (CI only) |
| `fix/*` | Correcciones de bugs | No (CI only) |

**Reglas del workflow Git:**
- `main` y `develop` tienen branch protection — requieren PR con CI verde
- Todo commit a `feature/*` corre lint + typecheck + tests
- Merge a `develop` requiere tests completos en verde
- Merge a `main` requiere tests completos + build exitoso

---

## 11. Estándares de Desarrollo (AI_RULES)

### 11.1 Principios Fundamentales

SOLID, Clean Architecture, DDD, DRY, KISS, YAGNI

### 11.2 Coding Constitution — Reglas Absolutas

```
ARQUITECTURA
✗ NUNCA acceder a Prisma desde un Controller
✓ Dependency direction: Controller → Service → Repository → DB (NUNCA al revés)
✓ Cada caso de uso = un único Service
✓ Toda entidad tiene su Repository

TIPADO
✗ Prohibido usar `any` sin justificación documentada en el código
✓ Todo endpoint tiene DTO de entrada y DTO de salida
✓ Usar tipos del paquete packages/types/ para entidades compartidas

DOMINIO
✓ Toda regla de negocio vive en el dominio (services/entities), no en controllers
✗ No duplicar lógica de negocio
✓ Validar con Zod (shared) + class-validator (NestJS)

BASE DE DATOS
✓ Toda migración de BD es reversible (incluye down migration)
✗ El historial de precios (price_history) NUNCA se modifica ni elimina
✗ Los logs NUNCA se eliminan
✓ Toda operación crítica en transacción de BD

CALIDAD
✓ Todo cambio incluye pruebas (unit o integration)
✓ Todo componente React reutilizable cuando aplique
✓ Toda operación crítica registra en logs
✗ No usar console.log() en producción → usar Logger de NestJS

SEGURIDAD
✓ Todos los endpoints protegidos verifican JWT
✓ Endpoints admin verifican rol ADMIN
✓ Validar todos los inputs del usuario
✗ Nunca devolver stacktrace al cliente en producción
```

### 11.3 Definition of Done

Un ticket/tarea está DONE cuando:
- [ ] Cumple todos los criterios de aceptación del requisito
- [ ] Tiene pruebas unitarias con cobertura ≥ 80% del módulo
- [ ] Tiene al menos una prueba de integración del endpoint
- [ ] Ha pasado el linter (ESLint) sin errores
- [ ] Ha pasado el type checker (TypeScript strict) sin errores
- [ ] El código fue revisado por al menos otro desarrollador
- [ ] Puede desplegarse sin romper el sistema en producción
- [ ] Los cambios de BD tienen migración reversible
- [ ] Las operaciones críticas registran en logs

### 11.4 Estructura de Módulo Backend (Template)

```typescript
// Ejemplo completo: módulo alerts

// alerts.controller.ts — solo recibe y delega
@Controller('alerts')
@UseGuards(JwtAuthGuard, AccountStatusGuard)
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post()
  create(@Body() dto: CreateAlertDto, @CurrentUser() user: UserPayload) {
    return this.alertsService.create(user.id, dto);
  }
}

// alerts.service.ts — orquesta la lógica de negocio
@Injectable()
export class AlertsService {
  constructor(
    private readonly alertsRepo: AlertsRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(userId: string, dto: CreateAlertDto): Promise<Alert> {
    const activeCount = await this.alertsRepo.countActive(userId);
    if (activeCount >= 20) {
      throw new UnprocessableEntityException('ALERT_LIMIT_REACHED');
    }
    const alert = await this.alertsRepo.create(userId, dto);
    this.eventEmitter.emit('alert.created', { alertId: alert.id });
    return alert;
  }
}

// alerts.repository.ts — solo accede a Prisma
@Injectable()
export class AlertsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateAlertDto): Promise<Alert> {
    return this.prisma.alert.create({ data: { ...dto, userId } });
  }

  async countActive(userId: string): Promise<number> {
    return this.prisma.alert.count({
      where: { userId, status: 'ACTIVE' },
    });
  }
}
```

---

---

## 12. Propiedades de Corrección

*Una propiedad es una característica o comportamiento que debe mantenerse verdadero a través de todas las ejecuciones válidas de un sistema — esencialmente, un enunciado formal sobre lo que el sistema debe hacer. Las propiedades sirven como puente entre especificaciones legibles por humanos y garantías de corrección verificables automáticamente.*

Las siguientes propiedades se derivan directamente de los criterios de aceptación del documento de requisitos y están diseñadas para ser validadas con **property-based testing** usando `fast-check` en TypeScript.

---

### Property 1: Register + Login round trip

*Para cualquier* combinación de email válido, contraseña de longitud ≥8 y nombre completo no vacío, el flujo de registro seguido de login debe devolver un JWT decodificable con el mismo userId y el rol PERSONAL asignado por defecto.

**Validates: Requirements 1.1, 2.1**

---

### Property 2: Registro rechaza todos los inputs inválidos

*Para cualquier* combinación de (email inválido, contraseña válida) o (email válido, contraseña de longitud 0-7) o (email de usuario ya registrado, cualquier contraseña válida), el endpoint de registro debe rechazar la solicitud con el código de error correspondiente (`INVALID_EMAIL_FORMAT`, `PASSWORD_TOO_SHORT`, `EMAIL_ALREADY_EXISTS`) y no persistir ningún usuario nuevo.

**Validates: Requirements 1.2, 1.3, 1.4**

---

### Property 3: Contraseñas nunca almacenadas en texto plano

*Para cualquier* contraseña registrada en el sistema, el valor almacenado en la columna `password_hash` debe ser diferente al texto plano original, debe tener formato bcrypt válido (`$2b$` prefix), y nunca debe aparecer en logs ni en respuestas de la API.

**Validates: Requirements 1.5**

---

### Property 4: JWT expirado siempre es rechazado

*Para cualquier* JWT emitido con campo `exp` en el pasado (independientemente del contenido del payload, el issuer, o el número de usos previos), al usarlo en cualquier ruta protegida en un instante `t > exp`, el sistema siempre debe responder con `TOKEN_EXPIRED`.

**Validates: Requirements 2.4**

---

### Property 5: Autorización — no autenticados y no-admin son rechazados

*Para cualquier* endpoint protegido (rutas de `/favorites`, `/alerts`, `/users/:id`, `/auth/me`), una solicitud sin token JWT debe ser rechazada con `UNAUTHORIZED`. *Para cualquier* endpoint bajo `/api/v1/admin/`, una solicitud de usuario autenticado con rol distinto de ADMIN debe ser rechazada con `FORBIDDEN`.

**Validates: Requirements 3.3, 8.5, 10.6**

---

### Property 6: Actualización de perfil solo modifica campos permitidos

*Para cualquier* payload de PATCH `/users/:id` que incluya campos `email` o `role`, esos campos deben ser ignorados y los valores originales deben permanecer sin cambio en la base de datos. Solo `fullName` y `locationId` deben ser modificados cuando se proveen con valores válidos.

**Validates: Requirements 3.2, 3.4**

---

### Property 7: Invariante del árbol de categorías — productos solo en hojas

*Para cualquier* árbol de categorías y cualquier operación de asignación de producto a categoría, si esa categoría tiene al menos una subcategoría hija, la operación debe ser rechazada. La condición `product.categoryId referencia categoría sin hijos` debe mantenerse para todos los productos en cualquier estado del árbol.

**Validates: Requirements 4.5, 10.5**

---

### Property 8: Publicaciones INACTIVE o EXPIRED excluidas de resultados públicos

*Para cualquier* publicación con estado `INACTIVE` o `EXPIRED`, no debe aparecer en: resultados de búsqueda (`GET /search`), listados de publicaciones públicas (`GET /publications`), ni ser considerada en el cálculo de estadísticas de precio del producto al que pertenece.

**Validates: Requirements 5.3, 7.2**

---

### Property 9: Invariante temporal updated_at ≥ created_at

*Para cualquier* publicación en la base de datos, en cualquier momento del ciclo de vida (creación, actualización, expiración), el campo `updated_at` debe ser mayor o igual al campo `created_at`. Esta invariante debe mantenerse tras cualquier secuencia de operaciones de escritura con timestamps aleatorios válidos.

**Validates: Requirements 5.4**

---

### Property 10: Expiración automática de publicaciones sin actualización en 30 días

*Para cualquier* publicación con estado `ACTIVE` cuya `updated_at` sea anterior al momento actual menos 30 días, después de la ejecución del scheduler de expiración, dicha publicación debe tener estado `EXPIRED`.

**Validates: Requirements 5.5**

---

### Property 11: Búsqueda completa — no hay falsos negativos para substring exacto

*Para cualquier* publicación activa `p` cuyo `title` o `description` contenga exactamente la cadena de búsqueda `q` (longitud ≥ 2, comparación case-insensitive), la búsqueda `GET /search?q=q` debe incluir `p` en alguna página de los resultados devueltos.

**Validates: Requirements 6.1**

---

### Property 12: Todos los filtros de búsqueda son correctos y acumulables

*Para cualquier* combinación de filtros aplicados simultáneamente (categoría, rango de precio [min, max] con min ≤ max, municipio), todos los resultados devueltos deben satisfacer todos los filtros activos a la vez. Ningún resultado debe violar ninguno de los filtros aplicados.

**Validates: Requirements 6.2, 6.3, 6.4**

---

### Property 13: Paginación sin pérdida ni duplicados

*Para cualquier* búsqueda que retorne N resultados totales con un tamaño de página P (10 ≤ P ≤ 50), al iterar todas las páginas de 1 hasta ⌈N/P⌉, la unión de todos los conjuntos de resultados debe contener exactamente los mismos N elementos — sin omisiones y sin duplicados.

**Validates: Requirements 6.6**

---

### Property 14: Invariante de estadísticas de precio — consistencia matemática

*Para cualquier* conjunto no vacío de publicaciones activas de un producto, el objeto de estadísticas calculado debe satisfacer: `minPrice ≤ avgPrice ≤ maxPrice`, `minPrice` debe ser el precio mínimo real del conjunto, `maxPrice` el máximo real, y `avgPrice` la media aritmética de los precios. Las publicaciones `INACTIVE` o `EXPIRED` no deben influir en el cálculo.

**Validates: Requirements 7.1, 7.2**

---

### Property 15: Price History append-only — recorded_at ≥ publication.created_at

*Para cualquier* entrada en la tabla `price_history`, su campo `captured_at` debe ser mayor o igual al campo `created_at` de la publicación asociada. Ningún registro de `price_history` puede ser modificado ni eliminado tras su creación. Esta propiedad debe mantenerse para cualquier secuencia de inserciones con timestamps aleatorios válidos.

**Validates: Requirements 7.5, 11.2**

---

### Property 16: Idempotencia de favoritos

*Para cualquier* usuario autenticado `u` y publicación activa `p`, ejecutar `POST /favorites` con `publicationId = p.id` cualquier número de veces (1, 2, 10, ...) debe resultar en exactamente **una** entrada en la tabla `favorites` para el par `(userId, publicationId)`. El sistema debe devolver HTTP 200 en todos los casos sin error.

**Validates: Requirements 8.1, 8.2**

---

### Property 17: Alerta se dispara cuando precio mínimo ≤ umbral configurado

*Para cualquier* alerta con estado `ACTIVE` asociada a un producto P con precio umbral T (en moneda C), si existe al menos una publicación activa de P con precio ≤ T en moneda C, entonces después de la evaluación del sistema, la alerta debe estar en estado `TRIGGERED` y los campos `triggeredAt` y `triggeredPrice` deben estar poblados.

**Validates: Requirements 9.2**

---

### Property 18: Notificación de alerta contiene todos los campos requeridos

*Para cualquier* alerta que transite a estado `TRIGGERED`, la notificación creada en la tabla `notifications` del usuario debe contener en su campo `content`: el nombre del producto, el precio umbral configurado por el usuario, y el precio mínimo actual encontrado que activó la alerta.

**Validates: Requirements 9.4**

---

### Property 19: Límite de 20 alertas activas por usuario PERSONAL

*Para cualquier* usuario con rol `PERSONAL` que ya tenga exactamente 20 alertas en estado `ACTIVE`, el intento de crear una alerta adicional debe ser rechazado con el código de error `ALERT_LIMIT_REACHED` y la base de datos debe permanecer sin cambios.

**Validates: Requirements 9.6**

---

### Property 20: Suspensión de cuenta invalida tokens activos

*Para cualquier* usuario con JWT válido no expirado, si un Admin cambia el estado de esa cuenta a `SUSPENDED`, cualquier solicitud posterior usando ese JWT debe ser rechazada con `ACCOUNT_SUSPENDED`, independientemente de la validez criptográfica del token.

**Validates: Requirements 10.3**

---

### Property 21: Invariante de integridad del modelo de publicación

*Para cualquier* publicación almacenada en la base de datos: (a) debe tener exactamente un `seller_id` y un `source_id` no nulos; (b) el campo `price` debe ser un número decimal positivo mayor que 0 con precisión máxima de 2 decimales; (c) el campo `currency` debe ser uno de los valores del enum `Currency`.

**Validates: Requirements 11.1, 11.4**

---

### Property 22: Atomicidad — operaciones críticas son transaccionales

*Para cualquier* operación crítica de escritura (crear usuario, crear publicación, crear alerta, actualizar producto) que falle en cualquier punto intermedio de su ejecución, la base de datos debe permanecer en el estado previo a la operación — sin cambios parciales persistidos.

**Validates: Requirements 11.5**

---

### Property 23: Estructura de respuesta uniforme y Content-Type correcto

*Para cualquier* endpoint de la API, cada respuesta debe: (a) tener el header `Content-Type: application/json; charset=utf-8`; (b) tener un body JSON con estructura `{ success: boolean, data: T | null, errors: ErrorObj[] | null, meta: Meta | null }` donde `errors` es `null` en respuestas exitosas y `data` es `null` en respuestas de error.

**Validates: Requirements 12.2, 12.4**

---

### Property 24: Validación de input devuelve lista de campos inválidos

*Para cualquier* endpoint con parámetros obligatorios, si la solicitud omite uno o más parámetros obligatorios o provee tipos incorrectos, la respuesta debe ser HTTP 400 con código `VALIDATION_ERROR` y el campo `errors` debe contener una lista que incluya cada campo inválido con su código de error específico.

**Validates: Requirements 12.5**

---

## 13. Manejo de Errores

### 13.1 Estrategia General

```typescript
// apps/api/src/common/filters/global-exception.filter.ts
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // 1. Log del error interno (nunca exponer stack al cliente)
    this.logger.error(exception);

    // 2. Determinar código HTTP y error code
    const { statusCode, errorCode, message } = this.mapException(exception);

    // 3. Respuesta estructurada uniforme
    return response.status(statusCode).json({
      success: false,
      message,
      errors: [{ code: errorCode }],
      data: null,
      meta: null,
    });
  }
}
```

### 13.2 Jerarquía de Excepciones de Dominio

```typescript
// packages/types/src/errors.ts
class MercuryException extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly statusCode: number,
  ) { super(message); }
}

class ValidationException extends MercuryException { /* 400 */ }
class UnauthorizedException extends MercuryException { /* 401 */ }
class ForbiddenException extends MercuryException { /* 403 */ }
class NotFoundException extends MercuryException { /* 404 */ }
class ConflictException extends MercuryException { /* 409 */ }
class BusinessRuleException extends MercuryException { /* 422 */ }
```

### 13.3 Manejo de Errores en el Pipeline

El pipeline de procesamiento no debe lanzar excepciones no controladas. Cada stage captura sus errores, los registra en `ctx.errors`, y pasa el contexto a la siguiente etapa. Si una etapa crítica falla, el pipeline completo se aborta y la publicación queda en `raw_publications` sin procesar, disponible para reprocesamiento manual.

```typescript
async process(ctx: ProcessingContext): Promise<ProcessingContext> {
  try {
    return await this.doProcess(ctx);
  } catch (error) {
    this.logger.error(`Stage ${this.stageName} failed`, error);
    return { ...ctx, errors: [...ctx.errors, `${this.stageName}: ${error.message}`] };
  }
}
```

### 13.4 Manejo de Errores en IA

Cuando el AI Gateway falla o la confianza es baja:
1. Intentar con Rule Engine (fallback determinístico)
2. Si Rule Engine también falla → publicación va a Human Review Queue
3. Nunca dejar publicación en estado inconsistente por fallo de IA

---

## 14. Estrategia de Testing

### 14.1 Filosofía Dual

Mercury usa dos tipos de testing complementarios:

| Tipo | Herramienta | Propósito |
|------|------------|-----------|
| **Unit Tests** | Jest | Casos específicos, edge cases, errores concretos |
| **Property-Based Tests** | fast-check + Jest | Propiedades universales sobre rangos de inputs |
| **Integration Tests** | Jest + Supertest | Endpoints end-to-end con BD real |
| **Component Tests** | Vitest + Testing Library | Componentes React aislados |

Las pruebas unit son útiles para ejemplos concretos. Las pruebas de propiedades validan la corrección general. Ambas son obligatorias para código de producción.

### 14.2 Configuración de fast-check

```typescript
// Cada property test corre mínimo 100 iteraciones
import fc from 'fast-check';

// Ejemplo de test de propiedad P16 — Idempotencia de favoritos
it('Property 16: idempotencia de favoritos', async () => {
  // Feature: mercury-mvp, Property 16: Idempotencia de favoritos
  await fc.assert(
    fc.asyncProperty(
      fc.uuid(),  // userId
      fc.uuid(),  // publicationId
      fc.integer({ min: 1, max: 10 }),  // número de veces
      async (userId, publicationId, times) => {
        for (let i = 0; i < times; i++) {
          await favoritesService.add(userId, publicationId);
        }
        const count = await db.favorite.count({
          where: { userId, publicationId }
        });
        return count === 1;
      }
    ),
    { numRuns: 100 }
  );
});
```

### 14.3 Generadores de Datos de Dominio

```typescript
// tests/arbitraries/domain.arbitraries.ts

export const validEmail = fc.emailAddress();
export const validPassword = fc.string({ minLength: 8, maxLength: 100 });
export const validMoney = fc.record({
  amount: fc.float({ min: 0.01, max: 9_999_999.99, noNaN: true }),
  currency: fc.constantFrom('CUP', 'USD', 'MLC', 'EUR'),
});
export const validPublication = fc.record({
  title: fc.string({ minLength: 3, maxLength: 200 }),
  price: fc.float({ min: 0.01, max: 9_999_999.99 }),
  currency: fc.constantFrom('CUP', 'USD', 'MLC'),
  status: fc.constantFrom('ACTIVE', 'INACTIVE', 'EXPIRED'),
});
export const invalidEmail = fc.oneof(
  fc.string({ maxLength: 5 }).filter(s => !s.includes('@')),
  fc.constant('notanemail'),
  fc.constant('@nodomain'),
);
export const shortPassword = fc.string({ maxLength: 7 });
```

### 14.4 Cobertura Mínima Requerida

| Capa | Cobertura mínima |
|------|-----------------|
| Domain Services | 90% |
| API Services (NestJS) | 80% |
| Repositories | 70% |
| Pipeline Stages | 80% |
| Frontend Components (críticos) | 70% |
| Utilidades compartidas (packages/) | 90% |

### 14.5 Mapeo de Propiedades a Tests

| Propiedad | Tipo Test | Módulo a testear |
|-----------|-----------|-----------------|
| P1: Register+Login round trip | Property | `AuthService` |
| P2: Registro rechaza inputs inválidos | Property | `AuthService`, `RegisterDto` |
| P3: Contraseñas nunca en texto plano | Property | `AuthService` |
| P4: JWT expirado rechazado | Property | `JwtAuthGuard` |
| P5: Autorización general | Property | `JwtAuthGuard`, `RolesGuard` |
| P6: Perfil solo modifica campos permitidos | Property | `UsersService` |
| P7: Productos solo en categorías hoja | Property | `CategoriesService` |
| P8: INACTIVE/EXPIRED excluidos | Property | `SearchService`, `PriceService` |
| P9: updated_at ≥ created_at | Property | `PublicationsRepository` |
| P10: Expiración automática 30 días | Property | `PublicationsScheduler` |
| P11: Búsqueda sin falsos negativos | Property | `SearchService` |
| P12: Filtros de búsqueda correctos | Property | `SearchService` |
| P13: Paginación sin pérdida ni duplicados | Property | `SearchService` |
| P14: Stats min ≤ avg ≤ max | Property | `PriceAnalysisService` |
| P15: Price History append-only | Property | `PriceHistoryRepository` |
| P16: Idempotencia de favoritos | Property | `FavoritesService` |
| P17: Alerta se dispara correctamente | Property | `AlertsService` |
| P18: Notificación contiene campos requeridos | Property | `AlertsService` |
| P19: Límite 20 alertas por PERSONAL | Property | `AlertsService` |
| P20: Suspensión invalida tokens | Property | `AuthService`, `AccountStatusGuard` |
| P21: Invariante de publicación | Property | `PublicationsRepository` |
| P22: Atomicidad transaccional | Property | múltiples services |
| P23: Respuesta uniforme + Content-Type | Property | `GlobalExceptionFilter` |
| P24: Validación devuelve campos inválidos | Property | `ValidationPipe` |

### 14.6 Organización de Tests

```
apps/api/src/modules/auth/tests/
├── auth.service.spec.ts           # Unit tests + PBT del servicio
├── auth.controller.spec.ts        # Tests del controller
└── auth.integration.spec.ts       # Tests de integración con BD real

packages/
└── utils/src/
    └── __tests__/
        ├── formatPrice.spec.ts    # Unit tests
        └── normalizeText.spec.ts  # Unit + PBT
```

### 14.7 Tag Format para Property Tests

Cada test de propiedad debe incluir un comentario con el tag:

```typescript
// Feature: mercury-mvp, Property N: [texto de la propiedad]
it('Property N: [nombre descriptivo]', async () => { ... });
```
