import Link from 'next/link';
import { ArrowRight, Flame, Sparkles, Tag, TrendingUp, Layers } from 'lucide-react';
import { TenisClubLogo } from '@/components/brand/TenisClubLogo';
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
    <div className="space-y-16">
      {/* 1. HERO BANNER (Matching TÊNIS CLUB Visual Identity) */}
      <section className="relative overflow-hidden border-b border-zinc-900 bg-[#070709] pt-12 pb-14 md:pt-16 md:pb-20">
        {settings.hero_banner_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={settings.hero_banner_url}
            alt={settings.store_name}
            className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
          />
        )}
        {/* Ambient Volt Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[280px] bg-[#BEFA46]/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 text-center flex flex-col items-center">
          <span className="text-[11px] sm:text-xs font-extrabold tracking-[0.34em] uppercase text-[#BEFA46] mb-5">
            {settings.hero_badge || 'DROP NOVO · CATÁLOGO'}
          </span>

          <TenisClubLogo
            size="hero"
            logoUrl={settings.logo_url}
          />

          <h1 className="mt-4 text-base sm:text-xl font-medium text-zinc-300 tracking-tight">
            {settings.hero_title || 'Seu próximo par tá aqui. Bora?'}{' '}
            <span aria-hidden="true">👟</span>
          </h1>
        </div>
      </section>

      {/* 2. INTERACTIVE QUICK FILTER BAR + CATALOG SHOWCASE */}
      <div className="-mt-16">
        <HomeQuickCatalog
          products={allProducts}
          categories={categories}
          whatsapp={settings.whatsapp}
        />
      </div>

      {/* 3. CATEGORIES SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-[#BEFA46]" />
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Navegue por Categorias
            </h2>
          </div>
          <Link
            href="/produtos"
            className="text-xs sm:text-sm font-bold text-[#BEFA46] hover:underline inline-flex items-center gap-1"
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
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#BEFA46]">
                Seleção Especial
              </span>
              <h2 className="text-xl sm:text-3xl font-black text-white flex items-center gap-2 mt-0.5">
                <Sparkles className="w-6 h-6 text-[#BEFA46]" />
                Produtos em Destaque
              </h2>
            </div>
            <Link
              href="/produtos"
              className="text-xs sm:text-sm font-bold text-[#BEFA46] hover:underline inline-flex items-center gap-1"
            >
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                whatsapp={settings.whatsapp}
              />
            ))}
          </div>
        </section>
      )}

      {/* 5. OFERTAS PROMOCIONAIS */}
      {offerProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-[#BEFA46]/25 bg-gradient-to-br from-[#13170D] via-[#111115] to-[#111115] p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#BEFA46] text-[#09090B] text-[11px] font-black uppercase tracking-wider">
                  <Tag className="w-3.5 h-3.5" />
                  Preços Especiais
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
                  Ofertas Imperdíveis
                </h2>
              </div>
              <Link
                href="/ofertas"
                className="text-xs sm:text-sm font-bold text-[#BEFA46] hover:underline inline-flex items-center gap-1"
              >
                Ver todas as ofertas <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {offerProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  whatsapp={settings.whatsapp}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. LANÇAMENTOS */}
      {newReleases.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#BEFA46]">
                Acabaram de Chegar
              </span>
              <h2 className="text-xl sm:text-3xl font-black text-white flex items-center gap-2 mt-0.5">
                <Flame className="w-6 h-6 text-[#BEFA46]" />
                Lançamentos & Novidades
              </h2>
            </div>
            <Link
              href="/novidades"
              className="text-xs sm:text-sm font-bold text-[#BEFA46] hover:underline inline-flex items-center gap-1"
            >
              Ver novidades <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {newReleases.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                whatsapp={settings.whatsapp}
              />
            ))}
          </div>
        </section>
      )}

      {/* 7. MAIS VENDIDOS */}
      {bestSellers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#BEFA46]">
                Preferidos da Galera
              </span>
              <h2 className="text-xl sm:text-3xl font-black text-white flex items-center gap-2 mt-0.5">
                <TrendingUp className="w-6 h-6 text-[#BEFA46]" />
                Mais Vendidos
              </h2>
            </div>
            <Link
              href="/produtos"
              className="text-xs sm:text-sm font-bold text-[#BEFA46] hover:underline inline-flex items-center gap-1"
            >
              Catálogo completo <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {bestSellers.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                whatsapp={settings.whatsapp}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

