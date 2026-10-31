'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUp } from 'lucide-react';
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

  return (
    <footer className="border-t border-zinc-900 bg-[#070709] text-zinc-500 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <p>
          © {new Date().getFullYear()}{' '}
          <strong className="text-zinc-300 font-semibold">{settings.store_name}</strong>. Todos os
          direitos reservados.
        </p>

        <div className="flex items-center gap-4 text-zinc-500">
          <Link href="/privacidade" className="hover:text-zinc-300 transition">
            Privacidade
          </Link>
          <span>·</span>
          <Link href="/termos" className="hover:text-zinc-300 transition">
            Termos
          </Link>
        </div>
      </div>

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
