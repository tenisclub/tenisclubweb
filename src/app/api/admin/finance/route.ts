import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { revalidateStoreData } from '@/lib/revalidate-store';
import { createServiceClient } from '@/lib/supabase/server';
import { slugify } from '@/lib/utils';

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

export async function GET() {
  const session = await getAuthSession();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }

  try {
    const supabase = createServiceClient();

    const [entriesRes, columnsRes, productsRes] = await Promise.all([
      supabase
        .from('financial_entries')
        .select(
          `
          *,
          order:orders(id, order_number, customer_name, status, payment_status),
          product:products(id, name, sku)
        `
        )
        .order('entry_date', { ascending: false })
        .order('occurred_at', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase
        .from('financial_custom_columns')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true }),
      supabase
        .from('products')
        .select('id, name, sku, base_price, promo_price, cost_price')
        .order('name', { ascending: true }),
    ]);
// etapa 6/22
