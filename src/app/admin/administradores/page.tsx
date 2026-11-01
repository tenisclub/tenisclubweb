import {
  AdminsManagerClient,
  type AdminLogRow,
  type AdminUserItem,
} from '@/components/admin/AdminsManagerClient';
import { requireSuperAdmin } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminAdministradoresPage() {
  await requireSuperAdmin();
  const supabase = createServiceClient();

// step 1/5
