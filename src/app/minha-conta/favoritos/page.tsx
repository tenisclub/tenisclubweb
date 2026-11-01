import Link from 'next/link';
import { Heart } from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';
import { requireAuth } from '@/lib/auth';
import {
  getCatalogProducts,
  getStoreSettings,
  getUserFavoriteIds,
} from '@/lib/catalog';

export const dynamic = 'force-dynamic';

// step 1/5
