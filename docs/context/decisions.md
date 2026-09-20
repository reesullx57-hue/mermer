# Architecture Decision Records

This document tracks key architectural decisions for the kitchen countertop configurator pricing engine.

---

## ADR-001 — Contract v1.0.0 Snapshot Format
**Status:** Accepted.

**Decision:** All pricing snapshots follow contract v1.0.0 with consistent decimal formatting:
- Money fields: 2 decimals (`"1680.00"`)
- Coefficients: 2 decimals (`"1.10"`)
- VAT rate: 4 decimals (`"0.2000"`)
- Areas/quantities: 4 decimals (`"2.9689"`)

**Rationale:** Consistent formatting prevents ambiguity and ensures money calculations are always represented with exact precision as strings.

**Impact:** All API responses and database snapshots use fixed decimal string formatting.

---

## ADR-002 — VAT Centralization
**Status:** Accepted.

**Decision:** VAT rate is stored only in `TaxConfig.vatRate`, not in `PriceRule`.

**Rationale:** VAT is a tax configuration, not a pricing rule. `PriceRule` handles service fees (SINK_HOLE, COOKTOP_HOLE, INSTALL, SKIRTING, TRIM) and thresholds (MIN_AREA_M2, MIN_ORDER_AMOUNT, WASTE_DEFAULT_PERCENT).

**Impact:** Single source of truth for VAT. TaxConfig table required for all quote computations.

---

## ADR-003 — Waste Source Tracking
**Status:** Accepted.

**Decision:** Waste percentage can come from `StoneColor.wastePercent` (stone-specific) or `PriceRule.WASTE_DEFAULT_PERCENT` (global default). The snapshot includes `wasteSource: "stone-specific" | "global"`.

**Rationale:** Some stones have unique waste characteristics. Tracking the source aids auditing and debugging.

**Impact:** Quote snapshots include `wasteSource` field.

---

## ADR-004 — Geometry Module Separation
**Status:** Accepted.

**Decision:** Area computation (`computeArea`) and waste application (`applyWaste`) are separated into `modules/geometry/`. Pricing module imports geometry functions.

**Rationale:** Clear separation of concerns. Geometry calculations are reusable and testable independently.

**Impact:** Pricing module depends on geometry module. No duplicate waste application.

---

## ADR-005 — Decimal.js for Money Operations
**Status:** Accepted.

**Decision:** All money calculations use `Decimal.js` with ROUND_HALF_UP to 2 decimal places. JavaScript floating-point arithmetic is forbidden for money.

**Rationale:** Prevents floating-point precision errors in financial calculations.

**Impact:** `decimal.js` is a required dependency. All money operations go through Decimal.

---

## ADR-006 — Skirting/Trim Quantity Calculation
**Status:** Accepted.

**Decision:** Skirting and trim quantities are calculated as `leg1 / 100` for L/U forms and `length / 100` for STRAIGHT/ISLAND forms (converting cm to meters).

**Rationale:** PO specified 3.20m for L form with leg1=320cm. Linear measurement based on primary counter length.

**Impact:** Skirting/trim lines use 2-decimal quantity formatting (meters).

---

## ADR-007 — Flat Contract Response
**Status:** Accepted.

**Decision:** `POST /api/pricing/quote` returns a flat JSON structure with no `{ success, data }` wrapper. Response includes `currency`, `lines`, money totals, `pricingSnapshot`, and `warnings` at the root level.

**Rationale:** Frontend integration requires flat contract format for easier consumption.

**Impact:** API responses are flat. `total` field is included as an alias for `totalInclVat` for FE compatibility.

---

## ADR-008 — Always-Present Fields
**Status:** Accepted.

**Decision:** API responses always include:
- `currency: "TRY"`
- `warnings: []` (empty array when no warnings)
- `appliedDiscounts: []` (empty array when no discounts)
- `computedAt` (ISO timestamp)

**Rationale:** Consistent response shape simplifies frontend parsing and error handling.

**Impact:** These fields are never null or omitted.

---

## ADR-009 — Error Response Format
**Status:** Accepted.

**Decision:** Error responses use structure:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": []
  }
}
```

**Rationale:** Consistent error structure with machine-readable codes and optional details.

**Impact:** All API errors follow this format with appropriate HTTP status codes (400/404/500).

---

## ADR-010 — Quote Persistence Deferred
**Status:** Accepted.

**Decision:** `POST /api/pricing/quote` computes and returns quotes without persisting them. Quote persistence is a separate feature (F3+).

**Rationale:** F1/F2 focus on calculation accuracy. Persistence requires additional decisions (versioning, immutability, user sessions).

**Impact:** Quote responses are stateless. No database writes occur during quote computation.

---

## ADR-011 — Line Item Sorting
**Status:** Accepted.

**Decision:** Quote lines include a `sortOrder` field (integer) to preserve display order: STONE_M2 → services → skirting/trim → shipping.

**Rationale:** Consistent presentation across frontend displays and PDF exports.

**Impact:** Line generation assigns sequential sortOrder starting from 0.

---

## ADR-012 — Zod Schema Validation
**Status:** Accepted.

**Decision:** All API request bodies are validated using Zod schemas matching contract v1.0.0.

**Rationale:** Type-safe validation with clear error messages. Zod provides runtime type checking and automatic TypeScript type inference.

**Impact:** Zod is a required dependency. Invalid requests return 400 with Zod error details.

---

## ADR-013 — Quote Request Uses DB IDs (Not Enums)
**Status:** Accepted.

**Decision:** `POST /api/pricing/quote` accepts `configuration.stoneColorId`, `thicknessId`, `formTypeId`, `edgeTypeId` (CUID strings referencing database rows). Contract v1.0.0 enum body (`thickness: 2|3|4`, `formType: "L"`, `edgeType: "radius"`) was misleading.

**Rationale:** Thickness/FormType/EdgeType are database entities carrying coefficients; ID references are natural. Each entity has specific coefficient values (e.g., thickness 3cm → 1.10) that must be loaded from the database. Using enums would require additional mapping logic and could introduce inconsistencies.

**Impact:** 
- `api-contract.json` request schema updated to use IDs
- Frontend must load IDs from catalog endpoints (F1 demo may hardcode seed IDs)
- F2+ needs catalog endpoints: `/api/thicknesses`, `/api/form-types`, `/api/edge-types` (or equivalent)
- The `dimensions.formType` field inside the dimensions object is still required for discriminated union validation and geometry calculations

**Example Request:**
```json
{
  "stoneColorId": "cmu9pojis000vjrrp5epidwok",
  "thicknessId": "cmu9pojiy001djrrp8x5dfbpi",
  "formTypeId": "cmu9pojj0001gjrrp0678b8d4",
  "edgeTypeId": "cmu9pojj2001jjrrps0l86qvb",
  "dimensions": {
    "formType": "L",
    "leg1": 320,
    "leg2": 180,
    "depth": 65
  }
}
```

---

## ADR-014 — Catalog List Endpoints
**Status:** Accepted (F2).

**Decision:** Add `GET /api/thicknesses`, `GET /api/form-types`, `GET /api/edge-types` returning active rows with `id`, `code`/`cm`, `nameTr`, `coefficient` (as fixed decimal strings), `isActive`. Frontend must load IDs from these endpoints (no hardcoded seed IDs).

**Rationale:** ADR-013 established that quote requests use database IDs. The frontend needs a way to discover available options and their IDs dynamically. Catalog endpoints provide the necessary data for building UI dropdowns and form validation.

**Impact:**
- Frontend can build dynamic configuration forms without hardcoding IDs
- Coefficients returned as fixed-decimal strings for consistency with pricing contract
- `isActive` field allows filtering in UI (only show active options)
- Endpoints are read-only; no authentication required (public catalog data)
- Admin CRUD for these entities comes in later F2 gates

**Response Format:**
```json
[
  {
    "id": "cmu9pojiy001djrrp8x5dfbpi",
    "cm": 3,
    "nameTr": "3 cm",
    "coefficient": "1.10",
    "isActive": true
  }
]
```

---

## ADR-015 — Admin RBAC
**Status:** Accepted (F2).

**Decision:** Only `Role.ADMIN` users may access `/admin/*` routes and mutating admin APIs. This is enforced via middleware and server-side guards. Layout and UI rendering are owned by the frontend; this ADR documents the authorization rule.

**Rationale:** Admin operations (price rule management, stone catalog imports, configuration changes) carry business risk. Restricting these operations to admin users prevents unauthorized modifications and provides an audit trail.

**Impact:**
- All `/admin/*` routes require authentication + `Role.ADMIN` check
- API endpoints for mutations (POST/PUT/DELETE on admin resources) must verify admin role
- Unauthorized requests return 403 Forbidden
- Frontend must check user role and hide/disable admin UI for non-admins (defense in depth)
- F2+ implements session/JWT middleware with role checks

**Authorization Flow:**
1. User authenticates (session or JWT)
2. Middleware extracts user from token
3. Route/endpoint checks `user.role === 'ADMIN'`
4. If not admin: return 403, else: proceed

---

## ADR-016 — CSV Import Atomic
**Status:** Accepted (F2).

**Decision:** Stone/StoneColor CSV import operations are atomic: one bad row causes the entire batch to roll back. Error reports include row number, field name, and validation failure reason.

**Rationale:** Partial imports lead to inconsistent catalog state. If a CSV contains 100 rows and row 73 is invalid, importing rows 1-72 and stopping would leave the database in a half-updated state. Atomic imports ensure all-or-nothing: either the entire CSV is valid and imported, or nothing changes.

**Impact:**
- CSV import uses database transactions (Prisma `$transaction`)
- Validation occurs before any writes (two-pass: validate all, then import all)
- Error response lists all validation failures with specific row/field/reason
- User can fix CSV and retry without worrying about duplicate imports
- Idempotency: re-importing the same valid CSV (with same codes/IDs) should be safe (upsert strategy)

**Error Response Format:**
```json
{
  "error": {
    "code": "CSV_VALIDATION_FAILED",
    "message": "CSV validation failed",
    "details": [
      {
        "row": 73,
        "field": "m2Price",
        "reason": "Must be a positive number"
      },
      {
        "row": 89,
        "field": "brandCode",
        "reason": "Brand 'XYZ-999' not found"
      }
    ]
  }
}
```

---

## ADR-017 — Admin Authorization Response Patterns
**Status:** Accepted (F2 Gate 2).

**Decision:** 
- **Pages** (`/admin/*`): Unauthorized users receive HTTP 307 redirect to `/403` (frontend-rendered forbidden page). Middleware intercepts and redirects before page render.
- **APIs** (`/api/admin/*`): Unauthorized users receive HTTP 403 JSON response with structured error. APIs never redirect.

**Error Format (APIs):**
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Admin role required"
  }
}
```

**Rationale:** 
- Pages need user-friendly error screens; redirects to `/403` provide consistent UX
- APIs must return machine-readable errors; redirects break API clients and CORS
- Separation allows page middleware and API guards to use appropriate patterns

**Implementation:**
```typescript
// Page middleware (middleware.ts)
if (!isAdmin && pathname.startsWith('/admin')) {
  return NextResponse.redirect(new URL('/403', request.url));
}

// API route handler
if (!isAdmin) {
  return NextResponse.json(
    { error: { code: 'FORBIDDEN', message: 'Admin role required' } },
    { status: 403 }
  );
}
```

**Impact:**
- Frontend implements `/403` page (static or simple component)
- API clients handle 403 status + parse error JSON
- Consistent error handling across admin surfaces

---

## ADR-018 — Last Updater from AuditLog
**Status:** Accepted (F2 Gate 2).

**Decision:** Admin UI "son güncelleyen" (last updated by) information comes from the latest `AuditLog` row for that entity (`UPDATE` or `CREATE` action), not from an `updatedBy` column on `PriceRule` or other entities. The `updatedAt` timestamp remains on the model; actor name/ID is retrieved from `AuditLog.userId`.

**Rationale:** 
- Avoid database migration to add `updatedBy` FK to every mutable entity
- `AuditLog` already stores complete actor information (userId, action, timestamp)
- Consistent pattern: all mutations write AuditLog, so latest entry is always accurate
- Provides audit trail with before/after state, not just "who last touched it"

**Implementation:**
```typescript
// Query latest audit log for an entity
const latestAudit = await prisma.auditLog.findFirst({
  where: {
    entityType: 'PriceRule',
    entityId: ruleId,
    action: { in: ['CREATE', 'UPDATE'] },
  },
  orderBy: { createdAt: 'desc' },
  include: { user: true },
});

const lastUpdatedBy = latestAudit?.user.email;
const lastUpdatedAt = latestAudit?.createdAt;
```

**Impact:**
- Frontend fetches audit log when displaying "last updated by"
- Slightly higher query complexity vs. FK column, but negligible for admin UIs
- Scales naturally to all entity types without schema changes
- Future: consider materialized view or cached computed field if performance becomes issue

---

## ADR-019 — Texture Upload Strategy
**Status:** Accepted (F2 Gate 3).

**Decision:** F2 implements local filesystem stub for stone texture uploads (`/uploads/textures/`). F3+ will add cloud storage adapter (R2/S3) with CDN integration. StoneColor.textureUrl stores the public URL or path.

**Rationale:**
- F2 needs texture upload for stone catalog admin, but cloud storage integration is out of scope
- Local filesystem sufficient for demo/testing
- Adapter pattern allows seamless F3+ migration without API contract changes

**Implementation:**
- F2: POST /api/admin/stone-colors accepts optional texture file → save to `/uploads/textures/{id}.{ext}` → textureUrl = `/uploads/textures/{id}.{ext}`
- F3+: Adapter uploads to R2/S3 → textureUrl = `https://cdn.example.com/textures/{id}.{ext}`
- StoneColor.textureUrl is nullable string (URL or path)

**Impact:**
- `/uploads/textures/` added to .gitignore
- F2 deployment must serve `/uploads/` static files
- F3 migration: batch upload existing textures to cloud, update textureUrl in DB

---

## ADR-020 — CSV Import Library and Atomic Transactions
**Status:** Planned (F2 Gate 4+).

**Decision:** CSV import for stones/dealers/shipping uses a streaming parser library (e.g., `papaparse`, `csv-parse`) with atomic transaction boundaries. Full validation before commit; rollback on any row failure.

**Rationale:**
- Large CSV files (1000+ stones) require memory-efficient streaming
- All-or-nothing import prevents partial/corrupt data
- Pre-validation pass before DB writes ensures clean rollback on error

**Implementation (planned):**
```typescript
// Parse → Validate all rows → Prisma.$transaction([...creates])
// Return: { success: true, imported: 1234 } or { success: false, errors: [...] }
```

**Impact:**
- Import endpoint will be slower (validation + transaction overhead) but safer
- Error response includes row-level detail for user correction
- Detailed design deferred to import gate

---

## ADR-021 — AuditLog UI Filtering Approach
**Status:** Planned (F2 Gate 5+ Audit UI).

**Decision:** Admin audit log UI supports filtering by: entityType, action, userId (actor), date range, and optional entityId. Pagination required (cursor or offset). Full-text search on before/after JSON deferred to F3+.

**Rationale:**
- AuditLog table grows unbounded; must paginate
- Common admin queries: "who changed this entity?" and "what did user X change today?"
- JSON search (e.g., PostgreSQL `jsonb_path_query`) adds index complexity; defer until user demand

**Implementation (planned):**
```typescript
GET /api/admin/audit-logs?entityType=PriceRule&action=UPDATE&userId={id}&from=2026-09-01&limit=50&cursor={id}
```

**Impact:**
- Index on (entityType, action, userId, createdAt) required for performance
- Detailed design deferred to audit UI gate

---

## ADR-022 — Cache Tag Strategy for Catalog Mutations
**Status:** Accepted (F2 Gate 3).

**Decision:** Cache invalidation tags by mutation type:
- **PriceRule mutations**: `pricing:v1:*` only (rules, tax, shipping, all)
- **Stone/StoneColor mutations**: `stones:v1:all` + `pricing:v1:all` (stone prices affect quotes)
- **Dealer mutations** (F3+): `dealers:v1:all` + `pricing:v1:all` (discounts affect quotes)

**Rationale:**
- Stone m2Price changes must invalidate both catalog cache AND pricing quotes
- PriceRule changes (SINK_HOLE, INSTALL) don't affect stone catalog, so no stones:* invalidation
- Granular tags allow targeted invalidation; `*:all` tags for broad cache busts

**Implementation:**
```typescript
// PriceRule update
invalidatePricingCache(); // → ['pricing:v1:all', 'pricing:v1:rules', ...]

// StoneColor update (m2Price change)
invalidateCatalogCache('stones'); // → ['stones:v1:all', 'pricing:v1:all']
```

**Impact:**
- Pricing module expands to `invalidateCatalogCache(type: 'stones' | 'dealers')`
- Integration tests assert correct tag combinations for each mutation type
- Next.js revalidateTag called for production; stub logs tags in F2
