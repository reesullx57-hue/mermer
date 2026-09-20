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
