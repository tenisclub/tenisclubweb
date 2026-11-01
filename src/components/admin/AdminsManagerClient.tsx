'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldPlus, History } from 'lucide-react';
import { useStore } from '@/components/providers/StoreProvider';
import { cn, formatDateTime } from '@/lib/utils';

export interface AdminUserItem {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  is_active: boolean;
  role: 'super_admin' | 'admin_operational';
  created_at: string;
}

export interface AdminLogRow {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
  admin_name: string;
}

export function AdminsManagerClient({
  initialAdmins,
// step 1/8
