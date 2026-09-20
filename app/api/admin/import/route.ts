import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

interface CsvRow {
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

interface ImportError {
  row: number;
  field: string;
  reason: string;
}

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split('\n').filter(line => line.trim());
  
  if (lines.length < 1) {
    return { headers: [], rows: [] };
  }

  const headers = lines[0].split(',').map(h => h.trim());
  const rows = lines.slice(1).map(line => 
    line.split(',').map(v => v.trim())
  );

  return { headers, rows };
}

function validateRow(row: CsvRow, rowNumber: number): ImportError[] {
  const errors: ImportError[] = [];

  if (!row.brand) {
    errors.push({
      row: rowNumber,
      field: 'brand',
      reason: 'Marka boş olamaz'
    });
  }

  if (!row.collection) {
    errors.push({
      row: rowNumber,
      field: 'collection',
      reason: 'Koleksiyon boş olamaz'
    });
  }

  if (!row.stoneCode) {
    errors.push({
      row: rowNumber,
      field: 'stoneCode',
      reason: 'Taş kodu boş olamaz'
    });
  }

  if (!row.stoneName) {
    errors.push({
      row: rowNumber,
      field: 'stoneName',
      reason: 'Taş adı boş olamaz'
    });
  }

  if (!row.colorCode) {
    errors.push({
      row: rowNumber,
      field: 'colorCode',
      reason: 'Renk kodu boş olamaz'
    });
  }

  if (!row.colorName) {
    errors.push({
      row: rowNumber,
      field: 'colorName',
      reason: 'Renk adı boş olamaz'
    });
  }

  if (!row.m2Price) {
    errors.push({
      row: rowNumber,
      field: 'm2Price',
      reason: 'm² fiyat boş olamaz'
    });
  } else if (isNaN(parseFloat(row.m2Price))) {
    errors.push({
      row: rowNumber,
      field: 'm2Price',
      reason: 'm² fiyat sayı olmalıdır'
    });
  } else if (parseFloat(row.m2Price) <= 0) {
    errors.push({
      row: rowNumber,
      field: 'm2Price',
      reason: 'm² fiyat 0\'dan büyük olmalıdır'
    });
  }

  if (!row.wastePercent) {
    errors.push({
      row: rowNumber,
      field: 'wastePercent',
      reason: 'Fire yüzdesi boş olamaz'
    });
  } else if (isNaN(parseFloat(row.wastePercent))) {
    errors.push({
      row: rowNumber,
      field: 'wastePercent',
      reason: 'Fire yüzdesi sayı olmalıdır'
    });
  } else if (parseFloat(row.wastePercent) < 0 || parseFloat(row.wastePercent) > 100) {
    errors.push({
      row: rowNumber,
      field: 'wastePercent',
      reason: 'Fire yüzdesi 0-100 arasında olmalıdır'
    });
  }

  if (row.textureUrl && !isValidUrl(row.textureUrl)) {
    errors.push({
      row: rowNumber,
      field: 'textureUrl',
      reason: 'Geçersiz URL formatı'
    });
  }

  return errors;
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Oturum bulunamadı' },
        { status: 401 }
      );
    }

    if (session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Bu işlem için yetkiniz bulunmamaktadır' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const dryRun = formData.get('dryRun') === 'true';

    if (!file) {
      return NextResponse.json(
        { error: 'Dosya seçilmedi' },
        { status: 400 }
      );
    }

    const text = await file.text();
    const { headers, rows } = parseCsv(text);

    if (headers.length === 0 || rows.length === 0) {
      return NextResponse.json(
        { error: 'CSV dosyası boş veya geçersiz' },
        { status: 400 }
      );
    }

    const requiredHeaders = [
      'brand', 'collection', 'stoneCode', 'stoneName',
      'colorCode', 'colorName', 'm2Price', 'wastePercent', 'textureUrl'
    ];

    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      return NextResponse.json(
        { 
          error: 'Eksik kolonlar: ' + missingHeaders.join(', '),
          message: 'CSV dosyası gerekli tüm kolonları içermelidir'
        },
        { status: 400 }
      );
    }

    const allErrors: ImportError[] = [];
    const validRows: CsvRow[] = [];

    rows.forEach((rowValues, index) => {
      const rowNumber = index + 2;
      const row: any = {};
      
      headers.forEach((header, idx) => {
        row[header] = rowValues[idx] || '';
      });

      const errors = validateRow(row as CsvRow, rowNumber);
      
      if (errors.length > 0) {
        allErrors.push(...errors);
      } else {
        validRows.push(row as CsvRow);
      }
    });

    if (dryRun) {
      return NextResponse.json({
        success: allErrors.length === 0,
        imported: validRows.length,
        errors: allErrors,
        message: allErrors.length === 0 
          ? `${validRows.length} satır doğrulandı, hata yok`
          : `${validRows.length} satır geçerli, ${allErrors.length} hata bulundu`
      });
    }

    if (allErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          imported: 0,
          errors: allErrors,
          message: 'Veri hataları bulundu, kayıt yapılmadı'
        },
        { status: 400 }
      );
    }

    const importedCount = validRows.length;

    return NextResponse.json({
      success: true,
      imported: importedCount,
      errors: [],
      message: `${importedCount} satır başarıyla yüklendi`
    });

  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { 
        error: 'İçe aktarma işlemi başarısız',
        message: error instanceof Error ? error.message : 'Bilinmeyen hata'
      },
      { status: 500 }
    );
  }
}
