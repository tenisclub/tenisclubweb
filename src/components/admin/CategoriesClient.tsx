'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useStore } from '@/components/providers/StoreProvider';
import { cn } from '@/lib/utils';
import type { Category } from '@/types/database';

export function CategoriesClient({ initialCategories }: { initialCategories: Category[] }) {
  const { toast } = useStore();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState('1');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
// step 1/6
