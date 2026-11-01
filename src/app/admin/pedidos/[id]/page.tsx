import { notFound } from 'next/navigation';
import { OrderDetailAdminClient } from '@/components/admin/OrderDetailAdminClient';
import { createServiceClient } from '@/lib/supabase/server';
import type { Order } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function AdminPedidoDetailPage({
// step 1/4
