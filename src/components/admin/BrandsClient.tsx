'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useStore } from '@/components/providers/StoreProvider';
import { cn } from '@/lib/utils';
import type { Brand } from '@/types/database';

export function BrandsClient({ initialBrands }: { initialBrands: Brand[] }) {
  const { toast } = useStore();
  const [brands, setBrands] = useState<Brand[]>(initialBrands);
  const [name, setName] = useState('');

  useEffect(() => {
    setBrands(initialBrands);
  }, [initialBrands]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
// step 1/6
