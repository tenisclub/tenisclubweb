import type { Metadata } from 'next';
import { getStoreSettings } from '@/lib/catalog';

export const revalidate = 300;
export const metadata: Metadata = { title: 'Termos de Uso' };

export default async function TermosPage() {
  const settings = await getStoreSettings();
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-6">
      <h1 className="text-3xl font-black text-white">Termos de Uso</h1>
      <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-6 sm:p-8 space-y-4 text-sm text-zinc-300 leading-relaxed">
        <p className="whitespace-pre-line">{settings.terms_of_use}</p>
        <h2 className="text-base font-extrabold text-white pt-2">Regras de Pedidos e Estoque</h2>
        <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
          <li>Os preços e quantidades disponíveis por numeração são validados automaticamente no ato da criação do pedido.</li>
          <li>O pedido gerado no site constitui registro comercial oficial, sendo o pagamento e a entrega/retirada confirmados junto à loja.</li>
          <li>Pedidos não confirmados dentro do prazo de reserva informado poderão ser cancelados com retorno automático ao estoque.</li>
        </ul>
      </div>
    </div>
  );
}

