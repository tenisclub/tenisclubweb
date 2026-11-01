import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { ProductDetailClient } from '@/components/product/ProductDetailClient';
import { ProductCard } from '@/components/product/ProductCard';
import {
  getProductBySlug,
  getRelatedProducts,
  getStoreSettings,
} from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    return { title: 'Produto não encontrado' };
  }

  const title = product.meta_title || product.name;
  const description =
    product.meta_description || product.short_description || product.description.slice(0, 155);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: product.primary_image ? [{ url: product.primary_image }] : [],
      type: 'website',
    },
  };
}

export default async function ProdutoDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    notFound();
  }

  const [related, settings] = await Promise.all([
    getRelatedProducts(product, 4),
    getStoreSettings(),
  ]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images.map((i) => i.url),
    description: product.short_description || product.description,
    sku: product.sku || product.id,
    brand: product.brand?.name
      ? { '@type': 'Brand', name: product.brand.name }
// step 3/6
