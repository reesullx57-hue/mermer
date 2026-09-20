import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import { z } from 'zod';
import { PrismaClient, Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { getCurrentUser, requireAdmin } from '@/lib/auth';
import { invalidateCatalogCache } from '@/modules/pricing';

const prisma = new PrismaClient();

const StoneImportRowSchema = z.object({
  brand: z.string().min(1, 'Brand required'),
  collection: z.string().min(1, 'Collection required'),
  stoneCode: z.string().min(1, 'Stone code required'),
  stoneName: z.string().min(1, 'Stone name required'),
  colorCode: z.string().min(1, 'Color code required'),
  colorName: z.string().min(1, 'Color name required'),
  m2Price: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid m2Price format'),
  wastePercent: z.string().optional(),
  textureUrl: z.string().optional(),
});

type StoneImportRow = z.infer<typeof StoneImportRowSchema>;

interface ImportError {
  row: number;
  field: string;
  reason: string;
}

export async function POST(request: NextRequest) {
  // Auth
  const user = getCurrentUser(request);
  const authError = requireAdmin(user);
  if (authError) return authError;

  try {
    // Get dryRun flag from query params
    const searchParams = request.nextUrl.searchParams;
    const dryRun = searchParams.get('dryRun') === 'true';

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: { code: 'FILE_REQUIRED', message: 'CSV file is required' } },
        { status: 400 }
      );
    }

    const filename = file.name;
    const csvText = await file.text();

    // Parse CSV
    let records: any[];
    try {
      records = parse(csvText, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (err: any) {
      return NextResponse.json(
        {
          success: false,
          errors: [{ row: 0, field: 'file', reason: `CSV parse error: ${err.message}` }],
        },
        { status: 400 }
      );
    }

    if (records.length === 0) {
      return NextResponse.json(
        { error: { code: 'EMPTY_FILE', message: 'CSV file is empty' } },
        { status: 400 }
      );
    }

    // Validate all rows
    const errors: ImportError[] = [];
    const validRows: StoneImportRow[] = [];

    records.forEach((record, index) => {
      const rowNumber = index + 2; // +1 for 0-index, +1 for header row
      const result = StoneImportRowSchema.safeParse(record);

      if (!result.success) {
        result.error.issues.forEach((issue) => {
          errors.push({
            row: rowNumber,
            field: issue.path[0] as string,
            reason: issue.message,
          });
        });
      } else {
        validRows.push(result.data);
      }
    });

    // If any errors, return immediately (no writes)
    if (errors.length > 0) {
      // Create ImportJob for validation failure
      await prisma.importJob.create({
        data: {
          userId: user!.id,
          entityType: 'Stone',
          filename,
          totalRows: records.length,
          successRows: 0,
          errorRows: errors.length,
          status: 'VALIDATION_ERROR',
          errorReport: errors as any,
        },
      });

      return NextResponse.json(
        {
          success: false,
          errors,
        },
        { status: 400 }
      );
    }

    // DryRun mode: return preview without writing
    if (dryRun) {
      const preview = {
        totalRows: validRows.length,
        sampleRows: validRows.slice(0, 3),
        brands: [...new Set(validRows.map((r) => r.brand))],
        collections: [...new Set(validRows.map((r) => r.collection))],
        stones: [...new Set(validRows.map((r) => r.stoneCode))],
        colors: [...new Set(validRows.map((r) => r.colorCode))],
      };

      return NextResponse.json({
        success: true,
        dryRun: true,
        preview,
      });
    }

    // Execute atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      const brandMap = new Map<string, string>();
      const collectionMap = new Map<string, string>();
      const stoneMap = new Map<string, string>();

      // Upsert brands
      for (const row of validRows) {
        if (!brandMap.has(row.brand)) {
          const brand = await tx.stoneBrand.upsert({
            where: { code: row.brand },
            update: { nameTr: row.brand },
            create: { code: row.brand, nameTr: row.brand, isActive: true },
          });
          brandMap.set(row.brand, brand.id);
        }
      }

      // Upsert collections
      for (const row of validRows) {
        const collectionKey = `${row.brand}:${row.collection}`;
        if (!collectionMap.has(collectionKey)) {
          const brandId = brandMap.get(row.brand)!;
          const collection = await tx.stoneCollection.upsert({
            where: {
              brandId_code: {
                brandId,
                code: row.collection,
              },
            },
            update: { nameTr: row.collection },
            create: {
              code: row.collection,
              nameTr: row.collection,
              brandId,
              isActive: true,
            },
          });
          collectionMap.set(collectionKey, collection.id);
        }
      }

      // Upsert stones
      for (const row of validRows) {
        const stoneKey = `${row.collection}:${row.stoneCode}`;
        if (!stoneMap.has(stoneKey)) {
          const collectionKey = `${row.brand}:${row.collection}`;
          const collectionId = collectionMap.get(collectionKey)!;
          const brandId = brandMap.get(row.brand)!;
          const stone = await tx.stone.upsert({
            where: { code: row.stoneCode },
            update: { nameTr: row.stoneName },
            create: {
              code: row.stoneCode,
              nameTr: row.stoneName,
              brandId,
              collectionId,
              isActive: true,
            },
          });
          stoneMap.set(stoneKey, stone.id);
        }
      }

      // Upsert colors
      for (const row of validRows) {
        const stoneKey = `${row.collection}:${row.stoneCode}`;
        const stoneId = stoneMap.get(stoneKey)!;
        const m2Price = new Decimal(row.m2Price);
        const wastePercent = row.wastePercent ? new Decimal(row.wastePercent) : null;

        await tx.stoneColor.upsert({
          where: {
            stoneId_code: {
              stoneId,
              code: row.colorCode,
            },
          },
          update: {
            nameTr: row.colorName,
            m2Price,
            wastePercent,
            textureUrl: row.textureUrl || null,
          },
          create: {
            code: row.colorCode,
            nameTr: row.colorName,
            stoneId,
            m2Price,
            wastePercent,
            textureUrl: row.textureUrl || null,
            isActive: true,
          },
        });
      }

      return {
        brands: brandMap.size,
        collections: collectionMap.size,
        stones: stoneMap.size,
        colors: validRows.length,
      };
    });

    // Create ImportJob for success
    const importJob = await prisma.importJob.create({
      data: {
        userId: user!.id,
        entityType: 'Stone',
        filename,
        totalRows: validRows.length,
        successRows: validRows.length,
        errorRows: 0,
        status: 'SUCCESS',
        errorReport: Prisma.JsonNull,
      },
    });

    // Create AuditLog summary
    await prisma.auditLog.create({
      data: {
        userId: user!.id,
        action: 'IMPORT',
        entityType: 'Stone',
        entityId: importJob.id,
        before: Prisma.JsonNull,
        after: {
          filename,
          totalRows: validRows.length,
          imported: result,
        },
      },
    });

    // Invalidate cache
    await invalidateCatalogCache('stones');

    return NextResponse.json({
      success: true,
      imported: result,
      totalRows: validRows.length,
    });
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
