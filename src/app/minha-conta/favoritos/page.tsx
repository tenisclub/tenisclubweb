import Link from 'next/link';
import { Heart } from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';
import { requireAuth } from '@/lib/auth';
import {
  getCatalogProducts,
  getStoreSettings,
  getUserFavoriteIds,
} from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export default async function FavoritosPage() {
  const session = await requireAuth('/minha-conta/favoritos');
  const [favIds, { allMatching }, settings] = await Promise.all([
    getUserFavoriteIds(session.userId),
    getCatalogProducts({ pageSize: 200 }),
    getStoreSettings(),
  ]);

  const favProducts = allMatching.filter((p) => favIds.includes(p.id));

  return (
    <div className="space-y-6">
// step 2/5
