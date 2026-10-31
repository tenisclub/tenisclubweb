import type { Metadata } from 'next';
import { getStoreSettings } from '@/lib/catalog';

export const revalidate = 300;
export const metadata: Metadata = { title: 'Política de Privacidade (LGPD)' };

export default async function PrivacidadePage() {
  const settings = await getStoreSettings();
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-6">
      <h1 className="text-3xl font-black text-white">Política de Privacidade (LGPD)</h1>
      <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-6 sm:p-8 space-y-4 text-sm text-zinc-300 leading-relaxed">
        <p className="whitespace-pre-line">{settings.privacy_policy}</p>
        <h2 className="text-base font-extrabold text-white pt-2">1. Dados Coletados</h2>
        <p className="text-zinc-400">
          Coletamos apenas nome completo, e-mail, telefone/WhatsApp e endereço de entrega necessários para autenticação, registro de pedidos e contato comercial.
        </p>
        <h2 className="text-base font-extrabold text-white pt-2">2. Login com Google (OAuth 2.0)</h2>
        <p className="text-zinc-400">
          Quando você opta por entrar com o Google, utilizamos exclusivamente o protocolo oficial OAuth 2.0/OpenID Connect. Nunca temos acesso nem armazenamos sua senha do Google.
        </p>
        <h2 className="text-base font-extrabold text-white pt-2">3. Seus Direitos (LGPD)</h2>
        <p className="text-zinc-400">
          Você pode consultar e atualizar seus dados diretamente em &ldquo;Minha Conta&rdquo; ou solicitar correção e exclusão entrando em contato pelo e-mail {settings.email}.
        </p>
      </div>
    </div>
  );
}

