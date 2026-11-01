import Link from 'next/link';
import { ArrowRight, Flame, Sparkles, Tag, TrendingUp, Layers } from 'lucide-react';
import { TenisClubLogo } from '@/components/brand/TenisClubLogo';
import { HeroVideoBackground } from '@/components/home/HeroVideoBackground';
import { HomeQuickCatalog } from '@/components/product/HomeQuickCatalog';
import { ProductCard } from '@/components/product/ProductCard';
import { getCatalogProducts, getCategoriesAndBrands, getStoreSettings } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [settings, { allMatching: allProducts }, { categories }] = await Promise.all([
    getStoreSettings(),
    getCatalogProducts({ pageSize: 100 }),
    getCategoriesAndBrands(),
  ]);

  const featuredProducts = allProducts.filter((p) => p.is_featured).slice(0, 4);
  const newReleases = allProducts.filter((p) => p.is_new_release).slice(0, 4);
  const offerProducts = allProducts.filter((p) => p.discount_percent > 0).slice(0, 4);
  const bestSellers = [...allProducts]
    .sort((a, b) => b.sold_count - a.sold_count)
    .slice(0, 4);

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* 1. HERO BANNER (Matching TÊNIS CLUB Visual Identity) */}
      <section className="relative min-h-[360px] sm:min-h-[430px] md:min-h-[480px] flex items-center justify-center overflow-hidden bg-[#09090B] py-12 sm:py-14 md:py-20">
        <HeroVideoBackground />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center flex flex-col items-center drop-shadow-[0_4px_18px_rgba(0,0,0,0.65)]">
          <span className="text-[11px] sm:text-xs font-extrabold tracking-[0.22em] sm:tracking-[0.34em] uppercase text-[#BEFA46] mb-5">
            {settings.hero_badge || 'DROP NOVO · CATÁLOGO'}
          </span>

          <TenisClubLogo
            size="hero"
            logoUrl={settings.logo_url}
          />

          <h1 className="mt-4 text-base sm:text-xl font-medium text-zinc-100 tracking-tight">
            {settings.hero_title || 'Seu próximo par tá aqui. Bora?'}{' '}
            <span aria-hidden="true">👟</span>
          </h1>
        </div>
      </section>

      {/* 2. INTERACTIVE QUICK FILTER BAR + CATALOG SHOWCASE */}
