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
// step 2/4
