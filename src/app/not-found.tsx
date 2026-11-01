import Link from 'next/link';
import { ArrowLeft, Search } from 'lucide-react';
import { TenisClubLogo } from '@/components/brand/TenisClubLogo';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center space-y-6">
      <TenisClubLogo size="lg" />
      <div className="space-y-2 max-w-md">
        <p className="text-xs font-extrabold tracking-[0.3em] uppercase text-[#BEFA46]">
          Erro 404
        </p>
        <h1 className="text-3xl sm:text-4xl font-black text-white">
          Página não encontrada
        </h1>
        <p className="text-sm text-zinc-400">
          O endereço que você procurou não existe ou o modelo já saiu do ar. Que tal conferir os lançamentos disponíveis?
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#BEFA46] text-[#09090B] text-sm font-extrabold"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Início
        </Link>
        <Link
          href="/produtos"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#18181F] border border-zinc-800 text-sm font-bold text-white hover:border-zinc-700"
        >
          <Search className="w-4 h-4 text-[#BEFA46]" />
          Ver Catálogo
        </Link>
      </div>
    </div>
  );
}

