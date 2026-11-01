'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, MessageCircle } from 'lucide-react';
import { useStore } from '@/components/providers/StoreProvider';
import { cleanWhatsAppNumber, cn, formatCurrency, formatDate } from '@/lib/utils';

export interface CustomerSummary {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  auth_provider: string;
  is_active: boolean;
  created_at: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderId: string | null;
}

export function CustomersClient({ initialCustomers }: { initialCustomers: CustomerSummary[] }) {
  const { toast } = useStore();
  const [customers, setCustomers] = useState<CustomerSummary[]>(initialCustomers);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setCustomers(initialCustomers);
  }, [initialCustomers]);

  const filtered = useMemo(() => {
// step 1/8
