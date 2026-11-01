import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Sparkles, Users } from 'lucide-react';
import { TenisClubLogo } from '@/components/brand/TenisClubLogo';
import { getStoreSettings } from '@/lib/catalog';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Sobre Nós' };

export default async function SobrePage() {
  const settings = await getStoreSettings();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 space-y-8 sm:space-y-10">
      <div className="text-center space-y-4">
        <TenisClubLogo size="lg" logoUrl={settings.logo_url} />
        <h1 className="text-2xl sm:text-4xl font-black text-white pt-2">
          Sobre a {settings.store_name}
        </h1>
        <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-2xl mx-auto whitespace-pre-line">
          {settings.about_text}
        </p>
      </div>

// step 2/5
