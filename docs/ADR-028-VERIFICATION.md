# ADR-028 Row Numbering Verification

## Date: September 21, 2026

## Verification Summary
✅ **ADR-028 COMPLIANT** - Row numbers in error reports use file line numbers (including header)

## Test File Structure
File: `/tmp/test-csvs/stones-with-errors.csv`

```
Line 1: Header row (brand,collection,stoneCode,...)
Line 2: Marka A - VALID (no errors)
Line 3: Marka B - ERROR (missing collection)
Line 4: Marka C - ERROR (missing colorCode)
Line 5: Marka D - ERRORS (missing stoneName, invalid m2Price "ABC")
Line 6: Marka E - ERRORS (wastePercent 150 > 100, invalid URL)
Line 7: Marka F - ERROR (negative m2Price -100)
Line 8: (no brand) - ERROR (missing brand)
Line 9: Marka G - VALID
Line 10: Marka H - VALID
Line 11: Marka I - VALID
```

## Error Report Row Numbers
The error table displays the following row numbers:

| Error Report Row | CSV File Line | Data Row Index | Error Description |
|-----------------|---------------|----------------|-------------------|
| #3 | Line 3 | index 1 | Koleksiyon alanı zorunludur |
| #4 | Line 4 | index 2 | Renk kodu zorunludur |
| #5 | Line 5 | index 3 | Taş adı zorunludur |
| #5 | Line 5 | index 3 | Geçersiz fiyat formatı (sayı olmalı) |
| #6 | Line 6 | index 4 | Fire yüzdesi 0-100 arasında olmalı |
| #6 | Line 6 | index 4 | Geçersiz URL formatı |
| #7 | Line 7 | index 5 | Fiyat negatif olamaz |
| #8 | Line 8 | index 6 | Marka alanı zorunludur |

## Code Implementation
Location: `/workspace/app/api/admin/import/stones/route.ts`

```typescript
// Line 60-61
records.forEach((record, index) => {
  const rowNumber = index + 2; // File line number (index=0 → row 2, first data row)
```

### Calculation Logic:
- `index = 0` → First data row → Line 2 in file
- `index = 1` → Second data row → Line 3 in file
- `index = 2` → Third data row → Line 4 in file
- Formula: `rowNumber = index + 2`

This correctly implements ADR-028's requirement that row numbers should represent the actual line number in the CSV file (where line 1 is the header).

## Verification Results

### ✅ Correct Behavior (ADR-028 Compliant)
- Error row #3 corresponds to file line 3
- Error row #4 corresponds to file line 4
- Error row #5 corresponds to file line 5
- Error row #6 corresponds to file line 6
- Error row #7 corresponds to file line 7
- Error row #8 corresponds to file line 8

### ❌ Incorrect Behavior (What we're NOT doing)
- We are NOT using data row numbers (which would be 2, 3, 4, 5, 6, 7)
- We are NOT using zero-indexed numbers (which would be 1, 2, 3, 4, 5, 6)

## Why This Matters
When users open the CSV file in a spreadsheet application or text editor:
- The line numbers in the error report match the line numbers shown in their editor
- Users can quickly jump to the specific line mentioned in the error
- No mental math required to translate between "data row number" and "file line number"

## Screenshot Evidence
File: `/workspace/docs/screenshots/02-dry-run-with-errors.png`
- Shows error table with row numbers #3, #4, #5, #6, #7, #8
- Confirms these match CSV file line numbers
- All error descriptions are visible in Turkish

## Conclusion
The implementation correctly follows ADR-028 by using file line numbers (including the header as line 1) in all error reports. This provides users with accurate, easy-to-use error references that match their file editors.
