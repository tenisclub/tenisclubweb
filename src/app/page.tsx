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
      <div className="!mt-0 relative z-10">
        <HomeQuickCatalog
          products={allProducts}
          categories={categories}
          whatsapp={settings.whatsapp}
        />
      </div>

      {/* 3. CATEGORIES SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <Layers className="w-5 h-5 text-[#BEFA46] shrink-0" />
            <h2 className="text-lg sm:text-2xl font-black text-white truncate">
              Navegue por Categorias
            </h2>
          </div>
          <Link
            href="/produtos"
            className="text-xs sm:text-sm font-bold text-[#BEFA46] hover:underline inline-flex items-center gap-1 shrink-0"
          >
            Ver todas <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {[
            { label: 'Masculino', slug: 'masculino', sub: 'Tênis & Sociais' },
            { label: 'Feminino', slug: 'feminino', sub: 'Casual, Salto & Treino' },
            { label: 'Infantil', slug: 'infantil', sub: 'Conforto e Resistência' },
            ...categories.slice(0, 3).map((c) => ({
              label: c.name,
              slug: c.slug,
              sub: c.description || 'Confira os modelos',
            })),
          ].map((cat) => (
            <Link
              key={cat.slug}
              href={`/categoria/${cat.slug}`}
              className="group rounded-2xl border border-zinc-800/90 bg-[#121216] hover:border-[#BEFA46]/60 p-4 flex flex-col justify-between min-h-[112px] transition"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#BEFA46]">
                Linha
              </span>
              <div>
                <h3 className="text-base font-extrabold text-white group-hover:text-[#BEFA46] transition">
                  {cat.label}
                </h3>
                <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">{cat.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. PRODUTOS EM DESTAQUE */}
      {featuredProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#BEFA46]">
                Seleção Especial
              </span>
              <h2 className="text-lg sm:text-3xl font-black text-white flex items-center gap-2 mt-0.5">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-[#BEFA46] shrink-0" />
                <span>Produtos em Destaque</span>
              </h2>
            </div>
            <Link
              href="/produtos"
              className="text-xs sm:text-sm font-bold text-[#BEFA46] hover:underline inline-flex items-center gap-1 shrink-0 pb-0.5"
            >
// step 4/8
