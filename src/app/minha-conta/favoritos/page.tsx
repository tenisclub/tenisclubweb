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
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white">Meus Favoritos</h1>
        <p className="text-xs sm:text-sm text-zinc-400">
          Seus modelos salvos para acompanhar preço e disponibilidade.
        </p>
      </div>
