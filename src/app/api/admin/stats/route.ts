import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { getAdminBadgeCounts } from '@/lib/catalog';

export async function GET() {
  const session = await getAuthSession();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }

  const badges = await getAdminBadgeCounts();
  return NextResponse.json(badges);
}
