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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-10">
      <div className="text-center space-y-4">
        <TenisClubLogo size="lg" logoUrl={settings.logo_url} />
        <h1 className="text-3xl sm:text-4xl font-black text-white pt-2">
          Sobre a {settings.store_name}
        </h1>
        <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-2xl mx-auto whitespace-pre-line">
          {settings.about_text}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-6 space-y-2">
          <Sparkles className="w-6 h-6 text-[#BEFA46]" />
          <h2 className="text-base font-extrabold text-white">Curadoria de Estilo</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Selecionamos tênis casuais, esportivos, mocassins e modelos infantis com foco em conforto e durabilidade.
          </p>
        </div>
        <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-6 space-y-2">
          <ShieldCheck className="w-6 h-6 text-[#BEFA46]" />
          <h2 className="text-base font-extrabold text-white">Estoque Transparente</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Controle individualizado por cor e numeração para garantir que o par escolhido está pronto para você.
          </p>
        </div>
        <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-6 space-y-2">
          <Users className="w-6 h-6 text-[#BEFA46]" />
          <h2 className="text-base font-extrabold text-white">Atendimento Próximo</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Pedido registrado no site e acompanhamento direto com nossa equipe para máxima agilidade.
          </p>
        </div>
      </div>

      <div className="text-center">
        <Link
          href="/produtos"
          className="inline-flex px-6 py-3 rounded-full bg-[#BEFA46] text-[#09090B] text-sm font-black"
        >
          Conhecer Nosso Catálogo
        </Link>
      </div>
    </div>
  );
}
