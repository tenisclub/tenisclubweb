import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Sparkles, Users } from 'lucide-react';
import { TenisClubLogo } from '@/components/brand/TenisClubLogo';
import { getStoreSettings } from '@/lib/catalog';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Sobre Nós' };

export default async function SobrePage() {
  const settings = await getStoreSettings();

// step 1/5
