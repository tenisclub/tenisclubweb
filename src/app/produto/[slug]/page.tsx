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
      : undefined,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'BRL',
      price: product.effective_price.toFixed(2),
      availability:
        product.total_stock > 0 || product.allow_backorder
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-8 sm:space-y-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumbs */}
      <nav className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-400">
        <Link href="/" className="hover:text-[#BEFA46]">Início</Link>
