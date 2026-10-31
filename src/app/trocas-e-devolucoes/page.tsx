import type { Metadata } from 'next';
import { getStoreSettings } from '@/lib/catalog';

export const revalidate = 300;
export const metadata: Metadata = { title: 'Trocas e Devoluções' };

export default async function TrocasPage() {
  const settings = await getStoreSettings();
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-6">
      <h1 className="text-3xl font-black text-white">Trocas e Devoluções</h1>
      <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-6 sm:p-8 space-y-4 text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
        <p>{settings.exchange_policy}</p>
        <h2 className="text-base font-extrabold text-white pt-2">Condições Gerais</h2>
        <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
          <li>O calçado deve estar sem indícios de uso na sola ou cabedal e na embalagem original.</li>
          <li>Informe o número do pedido no atendimento ou na área &ldquo;Minha Conta&rdquo;.</li>
          <li>A disponibilidade para troca de numeração respeita o estoque vigente no momento da solicitação.</li>
        </ul>
      </div>
    </div>
  );
}

