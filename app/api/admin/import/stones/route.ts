/**
 * MOCK API ENDPOINT FOR DEMONSTRATION/TESTING
 * 
 * This is a temporary mock implementation created for UI screenshots and testing.
 * 
 * PRODUCTION NOTE:
 * - Real implementation will be provided by Pricing Engine (PE)
 * - PE endpoint implements ADR-027 ImportJob specification
 * - This mock can be used for local development and testing
 * - Frontend is correctly wired to this endpoint path
 * 
 * Created: 2026-09-20 (for PR #9 evidence)
 */

import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';

interface StoneRow {
  brand: string;
  collection: string;
  stoneCode: string;
  stoneName: string;
  colorCode: string;
  colorName: string;
  m2Price: string;
  wastePercent: string;
  textureUrl: string;
}

interface ValidationError {
  row: number;
  field: string;
  reason: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const dryRun = formData.get('dryRun') === 'true';

    if (!file) {
      return NextResponse.json(
        { reason: 'Dosya bulunamadı' },
        { status: 400 }
      );
    }

    const content = await file.text();
    const records: StoneRow[] = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const errors: ValidationError[] = [];

    // Validate each row
    // ADR-028: Use file line numbers (header = line 1, first data = line 2)
    records.forEach((record, index) => {
      const rowNumber = index + 2; // File line number (index=0 → row 2, first data row)

      // Check required fields
      if (!record.brand || record.brand.trim() === '') {
        errors.push({
          row: rowNumber,
          field: 'brand',
          reason: 'Marka alanı zorunludur',
        });
      }

      if (!record.collection || record.collection.trim() === '') {
        errors.push({
          row: rowNumber,
          field: 'collection',
          reason: 'Koleksiyon alanı zorunludur',
        });
      }

      if (!record.stoneCode || record.stoneCode.trim() === '') {
        errors.push({
          row: rowNumber,
          field: 'stoneCode',
          reason: 'Taş kodu zorunludur',
        });
      }

      if (!record.stoneName || record.stoneName.trim() === '') {
        errors.push({
          row: rowNumber,
          field: 'stoneName',
          reason: 'Taş adı zorunludur',
        });
      }

      if (!record.colorCode || record.colorCode.trim() === '') {
        errors.push({
          row: rowNumber,
          field: 'colorCode',
          reason: 'Renk kodu zorunludur',
        });
      }

      if (!record.colorName || record.colorName.trim() === '') {
        errors.push({
          row: rowNumber,
          field: 'colorName',
          reason: 'Renk adı zorunludur',
        });
      }

      // Validate m2Price
      if (record.m2Price) {
        const price = parseFloat(record.m2Price);
        if (isNaN(price)) {
          errors.push({
            row: rowNumber,
            field: 'm2Price',
            reason: 'Geçersiz fiyat formatı (sayı olmalı)',
          });
        } else if (price < 0) {
          errors.push({
            row: rowNumber,
            field: 'm2Price',
            reason: 'Fiyat negatif olamaz',
          });
        }
      } else {
        errors.push({
          row: rowNumber,
          field: 'm2Price',
          reason: 'm² fiyat alanı zorunludur',
        });
      }

      // Validate wastePercent
      if (record.wastePercent) {
        const percent = parseFloat(record.wastePercent);
        if (isNaN(percent)) {
          errors.push({
            row: rowNumber,
            field: 'wastePercent',
            reason: 'Geçersiz fire yüzdesi (sayı olmalı)',
          });
        } else if (percent < 0 || percent > 100) {
          errors.push({
            row: rowNumber,
            field: 'wastePercent',
            reason: 'Fire yüzdesi 0-100 arasında olmalı',
          });
        }
      }

      // Validate textureUrl
      if (record.textureUrl) {
        try {
          new URL(record.textureUrl);
        } catch {
          errors.push({
            row: rowNumber,
            field: 'textureUrl',
            reason: 'Geçersiz URL formatı',
          });
        }
      }
    });

    if (dryRun) {
      // Dry run - just return validation results
      const validCount = records.length - errors.filter((e, i, arr) => 
        arr.findIndex(err => err.row === e.row) === i
      ).length;
      
      const uniqueErrorRows = new Set(errors.map(e => e.row));
      const errorCount = uniqueErrorRows.size;

      return NextResponse.json({
        success: errors.length === 0,
        message: `${validCount} satır geçerli, ${errorCount} satırda hata bulundu`,
        validated: records.length,
        errors: errors,
      });
    } else {
      // Real import - would insert into database
      if (errors.length > 0) {
        return NextResponse.json({
          success: false,
          reason: 'Doğrulama hataları bulundu',
          errors: errors,
        }, { status: 400 });
      }

      // In a real implementation, we would insert into database here
      // For now, just return success
      return NextResponse.json({
        success: true,
        message: `${records.length} satır başarıyla yüklendi`,
        imported: records.length,
        errors: [],
      });
    }
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { reason: 'Sunucu hatası', error: String(error) },
      { status: 500 }
    );
  }
}
