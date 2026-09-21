import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Mock data - Replace with actual Prisma queries when models are ready
  const users = [
    { id: 'user-1', name: 'Admin Kullanıcı' },
    { id: 'user-2', name: 'Sistem Yöneticisi' },
    { id: 'user-3', name: 'Test Kullanıcı' },
  ];

  const entityTypes = [
    'Stone',
    'PriceRule',
    'ShippingRule',
    'TaxRate',
    'Discount',
    'ImportJob',
    'Catalog',
    'User',
  ];

  return NextResponse.json({
    users,
    entityTypes,
  });
}
