import {
  InventoryManagerClient,
  type StockRowItem,
} from '@/components/admin/InventoryManagerClient';
import { enrichProductRow } from '@/lib/catalog';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminEstoquePage() {
  const supabase = createServiceClient();
  const { data: rows } = await supabase
    .from('products')
    .select('*, product_images(*), product_variants(*, inventory(*))')
    .order('name', { ascending: true });

  const stockRows: StockRowItem[] = [];
  for (const prodRow of rows || []) {
    const prod = enrichProductRow(prodRow, true);
    for (const v of prod.variants) {
      stockRows.push({
        variantId: v.id,
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku || '',
        image: prod.primary_image,
        color: v.color,
        size: v.size,
        quantity: v.stock,
        lowStockThreshold: v.low_stock_threshold,
      });
    }
  }

  return <InventoryManagerClient initialRows={stockRows} />;
}
