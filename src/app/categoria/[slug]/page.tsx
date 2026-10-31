import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { CatalogExplorer } from '@/components/product/CatalogExplorer';
import { getCatalogProducts, getCategoriesAndBrands, getStoreSettings } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

const GENDER_SLUGS: Record<string, { title: string; subtitle: string }> = {
  masculino: {
    title: 'Calçados Masculinos',
    subtitle: 'Tênis casuais, corrida, mocassins e loafers sociais masculinos.',
  },
  feminino: {
    title: 'Calçados Femininos',
    subtitle: 'Tênis urbanos, esportivos, scarpins e sandálias femininas.',
  },
  infantil: {
    title: 'Calçados Infantis',
    subtitle: 'Modelos confortáveis e resistentes para acompanhar toda a energia das crianças.',
  },
  unissex: {
    title: 'Modelos Unissex',
    subtitle: 'Clássicos versáteis que combinam com todos os estilos.',
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const gInfo = GENDER_SLUGS[slug.toLowerCase()];
  if (gInfo) {
    return { title: gInfo.title, description: gInfo.subtitle };
  }
  return {
    title: `Categoria: ${slug.charAt(0).toUpperCase() + slug.slice(1)}`,
  };
}

export default async function CategoriaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cleanSlug = slug.toLowerCase();

  const [{ allMatching }, { categories, brands }, settings] = await Promise.all([
    getCatalogProducts({ pageSize: 200 }),
    getCategoriesAndBrands(),
    getStoreSettings(),
  ]);

  const isGender = Boolean(GENDER_SLUGS[cleanSlug]);
  const matchedCat = categories.find((c) => c.slug.toLowerCase() === cleanSlug);

  const heading = isGender
    ? GENDER_SLUGS[cleanSlug].title
    : matchedCat?.name || `Categoria: ${slug}`;

  const subheading = isGender
    ? GENDER_SLUGS[cleanSlug].subtitle
    : matchedCat?.description || 'Explore os pares selecionados nesta categoria.';

  return (
    <div>
      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <nav className="flex items-center gap-1.5 text-xs text-zinc-400">
          <Link href="/" className="hover:text-[#BEFA46]">Início</Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
          <Link href="/produtos" className="hover:text-[#BEFA46]">Catálogo</Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
          <span className="text-zinc-200 font-semibold">{heading}</span>
        </nav>
      </div>

      <CatalogExplorer
        products={allMatching}
        categories={categories}
        brands={brands}
        whatsapp={settings.whatsapp}
        initialGender={isGender ? cleanSlug : 'todos'}
        initialCategory={!isGender && matchedCat ? matchedCat.slug : 'todos'}
        heading={heading}
        subheading={subheading}
      />
    </div>
  );
}
