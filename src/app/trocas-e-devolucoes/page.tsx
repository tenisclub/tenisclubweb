import type { Metadata } from 'next';
import { getStoreSettings } from '@/lib/catalog';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Trocas e Devoluções' };

export default async function TrocasPage() {
  const settings = await getStoreSettings();
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 space-y-5 sm:space-y-6">
      <h1 className="text-2xl sm:text-3xl font-black text-white">Trocas e Devoluções</h1>
      <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-5 sm:p-8 space-y-4 text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
// step 2/4
