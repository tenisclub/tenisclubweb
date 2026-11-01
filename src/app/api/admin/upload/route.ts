import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/svg+xml',
];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const bucket = (formData.get('bucket') as string) === 'store' ? 'store' : 'products';

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
// step 2/5
