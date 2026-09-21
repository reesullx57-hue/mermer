# Architecture Decision Records (ADR)

## ADR-028: CSV Row Numbering Convention

**Status**: Adopted  
**Date**: 2026-09-21  
**Context**: Import UI Error Reporting

### Decision

CSV row numbers in error messages and UI display **MUST** use **file line numbers including the CSV header**.

### Rationale

**Single Source of Truth**: Using file line numbers (1-indexed from file start) provides:
- Unambiguous reference that users can verify in any text editor
- No confusion between "data row" vs "file line"
- Direct correspondence with Excel/LibreOffice row numbers
- Consistent numbering across all import error messages

### Convention

```
File Line | Content Type    | Row Number in Errors
----------|-----------------|---------------------
1         | Header row      | (not in errors)
2         | First data row  | row: 2
3         | Second data row | row: 3
8         | Seventh data    | row: 8
```

**Example**:
- CSV file has header on line 1
- Data starts on line 2
- An error in the 7th data row (file line 8) is reported as `row: 8`
- UI displays: **"Satır 8"** (not "Satır 7")

### Implementation

#### Pricing Engine (PE) API
- PE returns `row` as **file line number** (1-indexed from file start)
- Data row 1 → `row: 2` (second line of file)
- Data row 7 → `row: 8` (eighth line of file)

#### Frontend Display
- UI displays `error.row` directly from PE response
- **No conversion needed** - PE already uses file line numbers
- Table header: "Satır" (Row)
- Cell content: `#8` for file line 8

#### Mock API Implementation
When implementing validation:
```typescript
// CSV parsing with header
const records = parse(content, { columns: true });

// Validate each record
records.forEach((record, index) => {
  const fileLineNumber = index + 2; // +2 because:
                                     // - index starts at 0
                                     // - header is line 1
  
  if (validationFails) {
    errors.push({
      row: fileLineNumber,  // File line number
      field: 'fieldName',
      reason: 'Error message'
    });
  }
});
```

### UI Labels

**Error Table Headers** (Turkish):
- **Satır**: Row number (file line including header)
- **Alan**: Field name (CSV column name)
- **Açıklama**: Error description (Turkish message)

**Clarification in UI** (if needed):
- Tooltip or help text can explain: "Satır numaraları dosya satırlarını gösterir (başlık dahil)"
- Translation: "Row numbers show file lines (including header)"

### Benefits

1. **No Ambiguity**: "Satır 8" always means line 8 of the CSV file
2. **Editor Alignment**: Users can open CSV in text editor and jump to line 8
3. **Excel Compatibility**: Excel row numbers match (if header is row 1)
4. **Debugging**: Easy to trace errors back to source file
5. **Consistency**: Same numbering in PE, UI, logs, and documentation

### Anti-Patterns to Avoid

❌ **Don't**: Convert file line numbers to "data row" numbers in UI  
❌ **Don't**: Use 0-indexed row numbers  
❌ **Don't**: Show different row numbers in different parts of UI  
❌ **Don't**: Subtract 1 from PE row numbers for display  

✅ **Do**: Display PE row numbers exactly as returned  
✅ **Do**: Use file line numbers throughout the system  
✅ **Do**: Document this convention in error messages  

### Related

- **ADR-027**: ImportJob specification (references ADR-028 for row numbering)
- **API Endpoint**: `POST /api/admin/import/stones`
- **UI Component**: `app/admin/import/page.tsx`

### Notes

This convention applies to:
- All CSV import error reporting
- Admin UI error tables
- API responses from PE
- Logs and audit trails
- Export functionality (if errors are exported)

Last updated: 2026-09-21
