import { notFound } from 'next/navigation';
import { ProductForm } from '@/components/admin/ProductForm';
import { getAdminCategoriesAndBrands, getAdminProductById } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export default async function EditarProdutoAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [product, { categories, brands }] = await Promise.all([
// step 2/4
