# CSV Import API Examples

## POST /api/admin/import/stones

### Request Format

**Endpoint**: `POST /api/admin/import/stones?dryRun=false`

**Headers**:
```
Content-Type: multipart/form-data
X-User-Id: <admin-user-id>
X-User-Email: admin@example.com
X-User-Role: ADMIN
```

**Body**: Multipart form with `file` field containing CSV

**CSV Columns**:
- `brand` (required): Stone brand code/name
- `collection` (required): Collection code/name
- `stoneCode` (required): Unique stone code
- `stoneName` (required): Stone display name
- `colorCode` (required): Color code (unique per stone)
- `colorName` (required): Color display name
- `m2Price` (required): Price per m² (e.g., "1680.00")
- `wastePercent` (optional): Waste percentage (e.g., "0.05")
- `textureUrl` (optional): Texture image URL

---

## Success Response (200)

```json
{
  "success": true,
  "totalRows": 10,
  "imported": {
    "brands": 1,
    "collections": 1,
    "stones": 10,
    "colors": 10
  }
}
```

---

## Validation Error Response (400)

**Scenario**: CSV with row 7 (data row 7, line 8 including header) having invalid `m2Price` value "abc"

```json
{
  "success": false,
  "errors": [
    {
      "row": 8,
      "field": "m2Price",
      "reason": "Invalid m2Price format"
    }
  ]
}
```

**Notes**:
- Row number is 1-indexed from the start of the file (header = row 1, first data row = row 2)
- Multiple validation errors are returned together
- **Atomic behavior**: If ANY row fails validation, ZERO rows are inserted
- An `ImportJob` record is created with `status: "VALIDATION_ERROR"` and `errorReport` JSON

---

## DryRun Response (200)

**Endpoint**: `POST /api/admin/import/stones?dryRun=true`

```json
{
  "success": true,
  "dryRun": true,
  "preview": {
    "totalRows": 10,
    "sampleRows": [
      {
        "brand": "ImportBrand",
        "collection": "ImportCollection",
        "stoneCode": "IS001",
        "stoneName": "Import Stone 1",
        "colorCode": "IC001",
        "colorName": "Import Color 1",
        "m2Price": "1500.50",
        "wastePercent": "0.05"
      }
    ],
    "brands": ["ImportBrand"],
    "collections": ["ImportCollection"],
    "stones": ["IS001", "IS002", "IS003"],
    "colors": ["IC001", "IC002", "IC003"]
  }
}
```

**Notes**:
- No database writes occur
- Validation still runs (errors returned if invalid)
- Useful for previewing import before committing

---

## Authorization Error (403)

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Admin role required"
  }
}
```

---

## Empty File Error (400)

```json
{
  "error": {
    "code": "EMPTY_FILE",
    "message": "CSV file is empty"
  }
}
```

---

## Missing File Error (400)

```json
{
  "error": {
    "code": "FILE_REQUIRED",
    "message": "CSV file is required"
  }
}
```

---

## Database Records Created

### On Success

1. **ImportJob** record:
```json
{
  "id": "cm...",
  "userId": "admin-user-id",
  "entityType": "Stone",
  "filename": "stones.csv",
  "totalRows": 10,
  "successRows": 10,
  "errorRows": 0,
  "status": "SUCCESS",
  "errorReport": null,
  "createdAt": "2026-09-20T19:30:00.000Z"
}
```

2. **AuditLog** summary:
```json
{
  "id": "cm...",
  "userId": "admin-user-id",
  "action": "IMPORT",
  "entityType": "Stone",
  "entityId": "<ImportJob.id>",
  "before": null,
  "after": {
    "filename": "stones.csv",
    "totalRows": 10,
    "imported": {
      "brands": 1,
      "collections": 1,
      "stones": 10,
      "colors": 10
    }
  },
  "createdAt": "2026-09-20T19:30:00.100Z"
}
```

3. **Cache invalidation**: `stones:v1:all` + `pricing:v1:all`

### On Validation Error

**ImportJob** record only (no AuditLog, no entity writes):
```json
{
  "id": "cm...",
  "userId": "admin-user-id",
  "entityType": "Stone",
  "filename": "invalid.csv",
  "totalRows": 10,
  "successRows": 0,
  "errorRows": 1,
  "status": "VALIDATION_ERROR",
  "errorReport": [
    {
      "row": 8,
      "field": "m2Price",
      "reason": "Invalid m2Price format"
    }
  ],
  "createdAt": "2026-09-20T19:30:00.000Z"
}
```
