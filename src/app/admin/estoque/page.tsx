import {
  InventoryManagerClient,
  type StockRowItem,
} from '@/components/admin/InventoryManagerClient';
import { getAdminProducts } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export default async function AdminEstoquePage() {
  const products = [...(await getAdminProducts())].sort((a, b) =>
    a.name.localeCompare(b.name, 'pt-BR')
  );

  const stockRows: StockRowItem[] = [];
  for (const prod of products) {
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
        allowBackorder: prod.allow_backorder,
      });
    }
  }

  return <InventoryManagerClient initialRows={stockRows} />;
}
