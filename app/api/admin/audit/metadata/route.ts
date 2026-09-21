import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

const PE_API_BASE_URL = process.env.PE_API_BASE_URL || 'http://localhost:3001';

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const peUrl = new URL('/api/admin/audit/metadata', PE_API_BASE_URL);

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
    console.error('Audit metadata API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit metadata' },
      { status: 500 }
    );
  }
}
