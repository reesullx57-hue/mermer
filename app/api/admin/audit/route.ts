import { getSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const entityType = searchParams.get('entityType') || '';
  const entityId = searchParams.get('entityId') || '';
  const userId = searchParams.get('userId') || '';
  const action = searchParams.get('action') || '';
  const dateFrom = searchParams.get('dateFrom') || '';
  const dateTo = searchParams.get('dateTo') || '';

  // Mock data - Replace with actual Prisma query when AuditLog model is ready
  const mockLogs = generateMockLogs();

  // Apply filters
  let filteredLogs = mockLogs;

  if (entityType) {
    filteredLogs = filteredLogs.filter((log) => log.entityType === entityType);
  }

  if (entityId) {
    filteredLogs = filteredLogs.filter((log) =>
      log.entityId.toLowerCase().includes(entityId.toLowerCase())
    );
  }

  if (userId) {
    filteredLogs = filteredLogs.filter((log) => log.userId === userId);
  }

  if (action) {
    filteredLogs = filteredLogs.filter((log) => log.action === action);
  }

  if (dateFrom) {
    const fromDate = new Date(dateFrom);
    filteredLogs = filteredLogs.filter((log) => new Date(log.createdAt) >= fromDate);
  }

  if (dateTo) {
    const toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59, 999);
    filteredLogs = filteredLogs.filter((log) => new Date(log.createdAt) <= toDate);
  }

  // Sort by createdAt DESC
  filteredLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Pagination
  const totalCount = filteredLogs.length;
  const totalPages = Math.ceil(totalCount / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  return NextResponse.json({
    logs: paginatedLogs,
    totalCount,
    totalPages,
    currentPage: page,
    pageSize: limit,
  });
}

function generateMockLogs() {
  const now = Date.now();
  const users = [
    { id: 'user-1', name: 'Admin Kullanıcı' },
    { id: 'user-2', name: 'Sistem Yöneticisi' },
    { id: 'user-3', name: 'Test Kullanıcı' },
  ];

  const entityTypes = ['Stone', 'PriceRule', 'ShippingRule', 'TaxRate', 'Discount', 'ImportJob'];
  const actions = ['CREATE', 'UPDATE', 'DELETE', 'IMPORT'];

  const logs = [];

  // Generate 100 mock logs
  for (let i = 0; i < 100; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const entityType = entityTypes[Math.floor(Math.random() * entityTypes.length)];
    const action = actions[Math.floor(Math.random() * actions.length)] as any;
    const createdAt = new Date(now - Math.random() * 30 * 24 * 60 * 60 * 1000); // Last 30 days

    const log: any = {
      id: `audit-${i + 1}`,
      createdAt: createdAt.toISOString(),
      userId: user.id,
      userName: user.name,
      action,
      entityType,
      entityId: `${entityType.toLowerCase()}-${Math.floor(Math.random() * 1000)}`,
      summary: generateSummary(action, entityType),
    };

    // Add before/after data for non-IMPORT actions
    if (action === 'CREATE') {
      log.after = generateMockEntityData(entityType);
    } else if (action === 'UPDATE') {
      log.before = generateMockEntityData(entityType);
      log.after = generateMockEntityData(entityType, true);
    } else if (action === 'DELETE') {
      log.before = generateMockEntityData(entityType);
    } else if (action === 'IMPORT' && entityType === 'ImportJob') {
      const totalCount = Math.floor(Math.random() * 100) + 50;
      const successCount = Math.floor(totalCount * (0.7 + Math.random() * 0.3));
      const errorCount = totalCount - successCount;

      log.metadata = {
        importJobId: `job-${i + 1}`,
        totalCount,
        successCount,
        errorCount,
      };

      log.after = {
        fileName: 'catalog-import.csv',
        entityType: 'Stone',
        status: errorCount === 0 ? 'completed' : 'completed_with_errors',
      };
    }

    logs.push(log);
  }

  return logs;
}

function generateSummary(action: string, entityType: string) {
  const summaries: Record<string, Record<string, string>> = {
    CREATE: {
      Stone: 'Yeni taş kaydı oluşturuldu',
      PriceRule: 'Yeni fiyat kuralı tanımlandı',
      ShippingRule: 'Yeni nakliye kuralı eklendi',
      TaxRate: 'Yeni vergi oranı belirlendi',
      Discount: 'Yeni indirim kampanyası oluşturuldu',
      ImportJob: 'İçe aktarma işlemi başlatıldı',
    },
    UPDATE: {
      Stone: 'Taş kaydı güncellendi',
      PriceRule: 'Fiyat kuralı değiştirildi',
      ShippingRule: 'Nakliye kuralı düzenlendi',
      TaxRate: 'Vergi oranı güncellendi',
      Discount: 'İndirim kampanyası değiştirildi',
      ImportJob: 'İçe aktarma ayarları güncellendi',
    },
    DELETE: {
      Stone: 'Taş kaydı silindi',
      PriceRule: 'Fiyat kuralı kaldırıldı',
      ShippingRule: 'Nakliye kuralı silindi',
      TaxRate: 'Vergi oranı kaldırıldı',
      Discount: 'İndirim kampanyası sonlandırıldı',
      ImportJob: 'İçe aktarma işlemi iptal edildi',
    },
    IMPORT: {
      Stone: 'Taş kataloğu içe aktarıldı',
      PriceRule: 'Fiyat kuralları içe aktarıldı',
      ShippingRule: 'Nakliye kuralları içe aktarıldı',
      TaxRate: 'Vergi oranları içe aktarıldı',
      Discount: 'İndirimler içe aktarıldı',
      ImportJob: 'Toplu içe aktarma tamamlandı',
    },
  };

  return summaries[action]?.[entityType] || `${entityType} için ${action} işlemi`;
}

function generateMockEntityData(entityType: string, modified = false) {
  const baseData: Record<string, any> = {
    Stone: {
      name: modified ? 'Carrara Beyaz Mermer - Güncel' : 'Carrara Beyaz Mermer',
      code: 'CRR-WHT-001',
      pricePerSqm: modified ? 450 : 425,
      thickness: 20,
      color: 'Beyaz',
      origin: 'İtalya',
      active: true,
    },
    PriceRule: {
      name: modified ? 'Alan Bazlı Fiyatlandırma v2' : 'Alan Bazlı Fiyatlandırma',
      minArea: 0,
      maxArea: 10,
      multiplier: modified ? 1.25 : 1.2,
      active: true,
    },
    ShippingRule: {
      region: 'İstanbul',
      minWeight: 0,
      maxWeight: 100,
      cost: modified ? 150 : 125,
      currency: 'TRY',
    },
    TaxRate: {
      country: 'TR',
      rate: modified ? 20 : 18,
      type: 'VAT',
      active: true,
    },
    Discount: {
      code: 'YENI2026',
      percentage: modified ? 15 : 10,
      validFrom: '2026-01-01',
      validTo: '2026-12-31',
      maxUses: 100,
    },
    ImportJob: {
      fileName: 'stones-import.csv',
      entityType: 'Stone',
      rowCount: 50,
      status: 'processing',
    },
  };

  return baseData[entityType] || { id: 'unknown' };
}
