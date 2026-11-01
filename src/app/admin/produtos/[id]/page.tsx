import { notFound } from 'next/navigation';
import { ProductForm } from '@/components/admin/ProductForm';
import { getAdminCategoriesAndBrands, getAdminProductById } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export default async function EditarProdutoAdminPage({
// step 1/4
