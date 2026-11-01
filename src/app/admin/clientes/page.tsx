import {
  CustomersClient,
  type CustomerSummary,
} from '@/components/admin/CustomersClient';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminClientesPage() {
// step 1/4
