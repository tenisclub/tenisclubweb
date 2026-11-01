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

      {favProducts.length === 0 ? (
        <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-6 sm:p-12 text-center space-y-3">
          <Heart className="w-10 h-10 text-zinc-600 mx-auto" />
          <p className="text-base font-bold text-white">Sua lista de favoritos está vazia</p>
          <p className="text-xs text-zinc-400">
            Clique no ícone de coração nos calçados do catálogo para salvá-los aqui.
          </p>
          <Link
            href="/produtos"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#BEFA46] text-[#09090B] text-xs font-black"
          >
            Ver Produtos
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {favProducts.map((product) => (
// step 4/5
