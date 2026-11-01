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
// step 1/5
