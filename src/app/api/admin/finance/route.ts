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

    if (entriesRes.error) {
      return NextResponse.json({ error: entriesRes.error.message }, { status: 400 });
    }

    return NextResponse.json({
      entries: entriesRes.data || [],
      customColumns: columnsRes.data || [],
      products: productsRes.data || [],
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao carregar painel financeiro.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const supabase = createServiceClient();

    // Create a custom user column
    if (body.action === 'create_column') {
      const name = String(body.name || '').trim();
      if (!name) {
        return NextResponse.json({ error: 'Informe o nome da nova coluna.' }, { status: 400 });
      }

      const columnType = ['text', 'currency', 'number'].includes(body.column_type)
        ? body.column_type
        : 'text';

      const baseKey = slugify(name).replace(/-/g, '_') || 'coluna';
      const columnKey = `${baseKey}_${Date.now().toString(36).slice(-4)}`;

      const { count } = await supabase
        .from('financial_custom_columns')
        .select('*', { count: 'exact', head: true });

      const { data: column, error } = await supabase
        .from('financial_custom_columns')
        .insert({
          name,
// etapa 12/22
