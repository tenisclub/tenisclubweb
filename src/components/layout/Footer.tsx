'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MapPin,
  Phone,
  Clock,
  Mail,
  ArrowUp,
  MessageCircle,
  ShieldCheck,
  Truck,
  RefreshCw,
} from 'lucide-react';
import { TenisClubLogo } from '@/components/brand/TenisClubLogo';
import { cleanWhatsAppNumber } from '@/lib/utils';
import type { StoreSettings } from '@/types/database';

export function Footer({ settings }: { settings: StoreSettings }) {
  const pathname = usePathname();
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 500);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (pathname.startsWith('/admin')) {
    return null;
  }

  const waUrl = `https://wa.me/${cleanWhatsAppNumber(settings.whatsapp)}?text=${encodeURIComponent(
    'Olá, Tênis Club! Gostaria de tirar uma dúvida sobre os produtos.'
  )}`;

  return (
    <footer className="border-t border-zinc-800/80 bg-[#070709] text-zinc-400 mt-20">
      {/* Trust Highlights */}
      <div className="border-b border-zinc-800/70 bg-[#0E0E12]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-[#BEFA46]/10 border border-[#BEFA46]/25 text-[#BEFA46] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Estoque Real por Numeração</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Disponibilidade verificada par a par do 33 ao 44 com reserva imediata no pedido.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-[#BEFA46]/10 border border-[#BEFA46]/25 text-[#BEFA46] shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Retirada na Loja ou Entrega Local</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Escolha retirar rapidamente na loja ou receba no seu endereço com acompanhamento.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-[#BEFA46]/10 border border-[#BEFA46]/25 text-[#BEFA46] shrink-0">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Troca Garantida & Atendimento Humano</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Suporte direto pelo WhatsApp para confirmar numeração, pagamento e entrega.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div className="space-y-4">
          <TenisClubLogo size="md" logoUrl={settings.logo_url} />
          <p className="text-sm text-zinc-400 leading-relaxed">
            {settings.tagline}. {settings.hero_subtitle}
          </p>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#BEFA46] hover:bg-[#d1ff70] text-[#09090B] text-xs font-extrabold transition"
          >
            <MessageCircle className="w-4 h-4" />
            Atendimento via WhatsApp
          </a>
        </div>

        <div>
          <h4 className="text-xs font-extrabold tracking-widest uppercase text-white mb-4">
            Catálogo
          </h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/produtos" className="hover:text-[#BEFA46] transition">Todos os Calçados</Link></li>
            <li><Link href="/categoria/masculino" className="hover:text-[#BEFA46] transition">Linha Masculina</Link></li>
            <li><Link href="/categoria/feminino" className="hover:text-[#BEFA46] transition">Linha Feminina</Link></li>
            <li><Link href="/categoria/infantil" className="hover:text-[#BEFA46] transition">Linha Infantil</Link></li>
            <li><Link href="/ofertas" className="hover:text-[#BEFA46] transition">Ofertas & Promoções</Link></li>
            <li><Link href="/novidades" className="hover:text-[#BEFA46] transition">Novidades / Drop Novo</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-extrabold tracking-widest uppercase text-white mb-4">
            Institucional & Ajuda
          </h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/sobre" className="hover:text-[#BEFA46] transition">Sobre nós</Link></li>
            <li><Link href="/entrega-e-retirada" className="hover:text-[#BEFA46] transition">Entrega e Retirada</Link></li>
            <li><Link href="/trocas-e-devolucoes" className="hover:text-[#BEFA46] transition">Trocas e Devoluções</Link></li>
            <li><Link href="/duvidas-frequentes" className="hover:text-[#BEFA46] transition">Dúvidas Frequentes</Link></li>
            <li><Link href="/contato" className="hover:text-[#BEFA46] transition">Contato</Link></li>
            <li><Link href="/privacidade" className="hover:text-[#BEFA46] transition">Política de Privacidade (LGPD)</Link></li>
            <li><Link href="/termos" className="hover:text-[#BEFA46] transition">Termos de Uso</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-extrabold tracking-widest uppercase text-white mb-4">
            Nossa Loja
          </h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-[#BEFA46] shrink-0 mt-0.5" />
              <span>{settings.address}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-[#BEFA46] shrink-0" />
              <span>{settings.phone}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-[#BEFA46] shrink-0" />
              <span className="truncate">{settings.email}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-[#BEFA46] shrink-0 mt-0.5" />
              <span>{settings.business_hours}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Legal Strip */}
      <div className="border-t border-zinc-900 py-6 px-4 text-center text-xs text-zinc-500">
        <p>
          © {new Date().getFullYear()} <strong className="text-zinc-300">{settings.store_name}</strong>. Todos os direitos reservados. Protegido conforme a LGPD.
        </p>
      </div>

      {/* Floating Back-to-Top Button (Section 8.2) */}
      {showTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-5 left-5 z-40 p-3 rounded-full bg-[#18181F] border border-zinc-700 hover:border-[#BEFA46] text-[#BEFA46] shadow-xl transition"
          aria-label="Voltar ao topo"
          title="Voltar ao topo"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}
    </footer>
  );
}
