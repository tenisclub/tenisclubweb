import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { revalidateStoreData } from '@/lib/revalidate-store';
import { createServiceClient } from '@/lib/supabase/server';

function toSaoPauloDateStr(isoDate: string): string {
  try {
    const dt = new Date(isoDate);
// etapa 1/20
