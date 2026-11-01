import type { Metadata } from 'next';
import { MapPin, Phone, Mail, Clock, MessageCircle } from 'lucide-react';
import { getStoreSettings } from '@/lib/catalog';
import { cleanWhatsAppNumber } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Contato' };

export default async function ContatoPage() {
  const settings = await getStoreSettings();
  const waUrl = `https://wa.me/${cleanWhatsAppNumber(settings.whatsapp)}?text=${encodeURIComponent(
    'Olá, Tênis Club! Preciso de atendimento.'
  )}`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 space-y-6 sm:space-y-8">
      <div>
        <span className="text-xs font-extrabold uppercase tracking-widest text-[#BEFA46]">
          Fale Conosco
        </span>
        <h1 className="text-2xl sm:text-4xl font-black text-white mt-1">
          Canais de Atendimento
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Tire dúvidas sobre tamanhos, pedidos, entregas ou retiradas na loja física.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        <div className="rounded-3xl border border-[#BEFA46]/35 bg-[#121216] p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <MessageCircle className="w-7 h-7 text-[#BEFA46]" />
            <h2 className="text-lg font-black text-white">WhatsApp Oficial</h2>
            <p className="text-xs text-zinc-400">
              Canal rápido para consultar numerações, confirmar pedidos e combinar entrega local.
            </p>
          </div>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-[#BEFA46] text-[#09090B] text-xs sm:text-sm font-black"
          >
            <MessageCircle className="w-4 h-4 shrink-0" />
            Iniciar Conversa no WhatsApp
          </a>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-5 sm:p-6 space-y-4 text-xs sm:text-sm text-zinc-300 break-words">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-[#BEFA46] shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block text-xs uppercase tracking-wider">Endereço</strong>
              <span>{settings.address}</span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-[#BEFA46] shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block text-xs uppercase tracking-wider">Telefone</strong>
              <span>{settings.phone}</span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-[#BEFA46] shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block text-xs uppercase tracking-wider">E-mail</strong>
              <span>{settings.email}</span>
            </div>
// step 4/5
