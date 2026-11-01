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
