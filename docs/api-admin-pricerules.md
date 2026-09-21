# Admin Price Rules API Specification

This document describes the expected API endpoints for the admin price rules functionality (F2 Gate 2).

## Authentication & Authorization

All endpoints require:
- Valid session authentication
- User role must be `ADMIN`

## Error Handling

Per ADR-017, all admin API routes must return literal HTTP 403 JSON responses for authorization failures (no redirects):

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Admin role required"
  }
}
```

Other errors should follow the same structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

## Endpoints

### GET /api/admin/pricerules

Retrieve all price rules.

**Request:**
```
GET /api/admin/pricerules
Authorization: Session cookie
```

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "code": "SINK_HOLE",
    "version": 1,
    "validFrom": "2024-01-01T00:00:00.000Z",
    "validTo": null,
    "value": "150.00",
    "createdAt": "2024-01-01T10:00:00.000Z",
    "updatedAt": "2024-01-01T10:00:00.000Z",
    "updatedBy": "user@example.com"
  }
]
```

**Error Response:** `403 FORBIDDEN`
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Admin role required"
  }
}
```

---

### POST /api/admin/pricerules

Create a new price rule.

**Request:**
```json
POST /api/admin/pricerules
Content-Type: application/json
Authorization: Session cookie

{
  "code": "SINK_HOLE",
  "validFrom": "2024-01-01T00:00:00.000Z",
  "validTo": "2024-12-31T23:59:59.999Z",
  "value": "150.00"
}
```

**Fields:**
- `code` (required): One of the following price rule codes:
  - `SINK_HOLE`: Fixed price for sink hole cutting
  - `COOKTOP_HOLE`: Fixed price for cooktop hole cutting
  - `INSTALL`: Installation service fee
  - `WASTE_DEFAULT_PERCENT`: Default waste percentage for material calculation
  - `MIN_AREA_M2`: Minimum order area in square meters
  - `MIN_ORDER_AMOUNT`: Minimum order amount in currency
- `validFrom` (required): ISO 8601 datetime string when rule becomes effective
- `validTo` (optional): ISO 8601 datetime string when rule expires (null = indefinite)
- `value` (required): Decimal number as string

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "code": "SINK_HOLE",
  "version": 1,
  "validFrom": "2024-01-01T00:00:00.000Z",
  "validTo": "2024-12-31T23:59:59.999Z",
  "value": "150.00",
  "createdAt": "2024-01-01T10:00:00.000Z",
  "updatedAt": "2024-01-01T10:00:00.000Z",
  "updatedBy": "admin@example.com"
}
```

**Error Responses:**

`400 Bad Request` - Invalid input
```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Invalid price rule code"
  }
}
```

`403 Forbidden` - Not authorized
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Admin role required"
  }
}
```

---

### PATCH /api/admin/pricerules/:id

Update an existing price rule.

**Request:**
```json
PATCH /api/admin/pricerules/uuid
Content-Type: application/json
Authorization: Session cookie

{
  "validFrom": "2024-02-01T00:00:00.000Z",
  "validTo": "2024-12-31T23:59:59.999Z",
  "value": "175.00"
}
```

**Fields:** All optional (at least one required)
- `validFrom`: ISO 8601 datetime string
- `validTo`: ISO 8601 datetime string or null
- `value`: Decimal number as string

**Note:** Updating a rule increments its `version` number.

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "code": "SINK_HOLE",
  "version": 2,
  "validFrom": "2024-02-01T00:00:00.000Z",
  "validTo": "2024-12-31T23:59:59.999Z",
  "value": "175.00",
  "createdAt": "2024-01-01T10:00:00.000Z",
  "updatedAt": "2024-02-01T15:30:00.000Z",
  "updatedBy": "admin@example.com"
}
```

**Error Responses:**

`404 Not Found`
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Price rule not found"
  }
}
```

`403 Forbidden`
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Admin role required"
  }
}
```

---

## Backend Implementation Notes

### Expected Behavior

1. **Cache Invalidation**: After successful create/update operations, the pricing engine cache should be invalidated.

2. **Audit Logging**: All mutations (create/update) should write to the AuditLog table:
   - Action: `CREATE_PRICE_RULE` or `UPDATE_PRICE_RULE`
   - EntityType: `PRICE_RULE`
   - EntityId: Price rule UUID
   - UserId: Current admin user ID
   - Changes: JSON diff or full object

3. **Versioning**: Each update to a price rule should increment its version number.

4. **updatedBy**: Should be set to the email or ID of the current admin user.

5. **Deactivation**: Setting `validTo` to the current timestamp effectively deactivates a rule.

### Database Schema Suggestion

```prisma
model PriceRule {
  id        String    @id @default(uuid())
  code      String    // One of the enum values
  version   Int       @default(1)
  validFrom DateTime
  validTo   DateTime?
  value     String    // Decimal as string to avoid floating point issues
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  updatedBy String?   // Email or user ID
  
  @@index([code, validFrom, validTo])
}
```

### Integration Points

The frontend is implemented and ready. It expects these API endpoints to be available at:
- `GET /api/admin/pricerules`
- `POST /api/admin/pricerules`
- `PATCH /api/admin/pricerules/:id`

The UI handles 403 FORBIDDEN responses correctly and displays appropriate error messages.
