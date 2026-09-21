import { getSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

const PE_API_BASE_URL = process.env.PE_API_BASE_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);

  try {
    const peUrl = new URL('/api/admin/audit', PE_API_BASE_URL);
    searchParams.forEach((value, key) => {
      peUrl.searchParams.append(key, value);
    });

    const peResponse = await fetch(peUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token || ''}`,
      },
    });

    if (peResponse.status === 403) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!peResponse.ok) {
      throw new Error(`PE API error: ${peResponse.status}`);
    }

    const data = await peResponse.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Audit API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
