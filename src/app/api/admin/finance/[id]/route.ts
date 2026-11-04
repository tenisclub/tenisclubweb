import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { revalidateStoreData } from '@/lib/revalidate-store';
import { createServiceClient } from '@/lib/supabase/server';

function toSaoPauloDateStr(isoDate: string): string {
  try {
    const dt = new Date(isoDate);
    if (Number.isNaN(dt.getTime())) {
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
    }
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(dt);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const supabase = createServiceClient();

    if (body.target === 'column') {
      const updates: Record<string, unknown> = {};
      if (body.name !== undefined) {
// etapa 4/20
