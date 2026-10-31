import type { Metadata } from 'next';
import { Store, Truck } from 'lucide-react';
import { getStoreSettings } from '@/lib/catalog';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Entrega e Retirada' };

export default async function EntregaRetiradaPage() {
  const settings = await getStoreSettings();
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-8">
      <h1 className="text-3xl font-black text-white">Entrega e Retirada</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-6 space-y-3">
          <Store className="w-7 h-7 text-[#BEFA46]" />
          <h2 className="text-lg font-black text-white">Retirada na Loja Física</h2>
          <p className="text-sm text-zinc-300 leading-relaxed">{settings.pickup_info}</p>
          <p className="text-xs text-zinc-400 pt-2">
            <strong>Endereço:</strong> {settings.address}
            <br />
            <strong>Horários:</strong> {settings.business_hours}
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-6 space-y-3">
          <Truck className="w-7 h-7 text-[#BEFA46]" />
          <h2 className="text-lg font-black text-white">Entrega Local</h2>
          <p className="text-sm text-zinc-300 leading-relaxed">{settings.delivery_info}</p>
          <p className="text-xs text-zinc-400 pt-2">
            Basta informar seu endereço e ponto de referência durante o checkout. Nossa equipe entrará em contato para alinhar o horário de entrega.
          </p>
        </div>
      </div>
    </div>
  );
}
