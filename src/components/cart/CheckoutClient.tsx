'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Store,
  Truck,
  ArrowRight,
  ArrowLeft,
  MessageCircle,
  ClipboardList,
  MapPin,
  UserCheck,
} from 'lucide-react';
import { useStore } from '@/components/providers/StoreProvider';
import { buildOrderWhatsAppUrl, cn, formatCurrency } from '@/lib/utils';
import type {
  CartItemView,
  DeliveryMethod,
  Order,
  StoreSettings,
  UserAddress,
  UserProfile,
} from '@/types/database';

export function CheckoutClient({
  items,
  total,
  subtotal,
  profile,
  savedAddresses,
  settings,
}: {
  items: CartItemView[];
  total: number;
  subtotal: number;
  profile: UserProfile;
  savedAddresses: UserAddress[];
  settings: StoreSettings;
}) {
  const { setCartCount, toast } = useStore();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 2: Customer info
  const [customerName, setCustomerName] = useState(profile.full_name || '');
  const [customerEmail, setCustomerEmail] = useState(profile.email || '');
  const [customerPhone, setCustomerPhone] = useState(profile.phone || '');

  // Step 3: Delivery or Pickup
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('pickup');
  const defaultAddr = savedAddresses.find((a) => a.is_default) || savedAddresses[0];
  const [zipCode, setZipCode] = useState(defaultAddr?.zip_code || '');
  const [street, setStreet] = useState(defaultAddr?.street || '');
  const [number, setNumber] = useState(defaultAddr?.number || '');
  const [complement, setComplement] = useState(defaultAddr?.complement || '');
  const [neighborhood, setNeighborhood] = useState(defaultAddr?.neighborhood || '');
  const [city, setCity] = useState(defaultAddr?.city || 'São Paulo');
  const [stateUf, setStateUf] = useState(defaultAddr?.state || 'SP');
  const [reference, setReference] = useState(defaultAddr?.reference || '');

  // Step 4: Notes & submission
  const [customerNotes, setCustomerNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Step 5: Created Order
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  const applySavedAddress = (addr: UserAddress) => {
    setZipCode(addr.zip_code || '');
    setStreet(addr.street || '');
    setNumber(addr.number || '');
    setComplement(addr.complement || '');
    setNeighborhood(addr.neighborhood || '');
    setCity(addr.city || '');
    setStateUf(addr.state || 'SP');
    setReference(addr.reference || '');
  };

  const handleConfirmOrder = async () => {
    setErrorMsg('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerPhone,
          deliveryMethod,
          shippingAddress:
            deliveryMethod === 'local_delivery'
              ? {
                  zip_code: zipCode,
                  street,
                  number,
                  complement,
                  neighborhood,
                  city,
                  state: stateUf,
                  reference,
                }
              : null,
          customerNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Não foi possível criar o pedido.');
        setSubmitting(false);
        return;
      }

      setCreatedOrder(data.order);
      setCartCount(0);
      setStep(5);
      toast(`Pedido ${data.orderNumber} criado com sucesso!`, 'success');
    } catch {
      setErrorMsg('Falha ao confirmar pedido. Verifique sua conexão.');
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 5 && createdOrder) {
    const waUrl = buildOrderWhatsAppUrl(settings.whatsapp, createdOrder);
    return (
      <div className="max-w-2xl mx-auto rounded-3xl border border-[#BEFA46]/40 bg-[#111116] p-7 sm:p-10 text-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-[#BEFA46] text-[#09090B] flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(190,250,70,0.4)]">
          <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#BEFA46]">
            Etapa 5 • Pedido Registrado!
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white">
            Pedido #{createdOrder.order_number}
          </h2>
          <p className="text-sm text-zinc-300 max-w-md mx-auto">
            Sua solicitação foi registrada oficialmente e os pares já estão reservados. Agora você pode continuar o atendimento pelo WhatsApp!
          </p>
        </div>

        {/* Summary Card */}
        <div className="rounded-2xl border border-zinc-800 bg-[#17171E] p-5 text-left space-y-3 text-xs sm:text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-400">Cliente:</span>
            <strong className="text-white">{createdOrder.customer_name}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Modalidade:</span>
            <strong className="text-white">
              {createdOrder.delivery_method === 'pickup'
                ? 'Retirada na Loja'
                : 'Entrega Local'}
            </strong>
          </div>
          <div className="border-t border-zinc-800 pt-3 space-y-1.5">
            {(createdOrder.items || []).map((it) => (
              <div key={it.id} className="flex justify-between text-zinc-300">
                <span>
                  {it.quantity}x {it.product_name} (Tam. {it.size})
                </span>
                <span className="font-bold text-white">{formatCurrency(it.subtotal)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-zinc-800 pt-3 flex justify-between items-baseline">
            <span className="font-bold text-white">Valor Total Registrado</span>
            <span className="text-xl font-black text-[#BEFA46]">
              {formatCurrency(createdOrder.total)}
            </span>
          </div>
        </div>

        {/* Official WhatsApp Button (Section 5.2) */}
        <div className="space-y-3 pt-2">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-13 rounded-2xl bg-[#BEFA46] hover:bg-[#d1ff70] text-[#09090B] font-black text-sm sm:text-base inline-flex items-center justify-center gap-2.5 shadow-[0_8px_28px_rgba(190,250,70,0.28)] transition"
          >
            <MessageCircle className="w-5 h-5 stroke-[2.4]" />
            Continuar atendimento pelo WhatsApp
          </a>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <Link
              href={`/minha-conta/pedidos/${createdOrder.id}`}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#1A1A22] border border-zinc-800 text-xs font-bold text-white hover:border-zinc-600"
            >
              <ClipboardList className="w-4 h-4 text-[#BEFA46]" />
              Acompanhar meu pedido
            </Link>
            <Link
              href="/produtos"
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white"
            >
              Voltar para a loja
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stepper Indicator */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        {[
          { n: 1, label: '1. Revisão' },
          { n: 2, label: '2. Seus Dados' },
          { n: 3, label: '3. Recebimento' },
          { n: 4, label: '4. Confirmação' },
        ].map((s) => (
          <div
            key={s.n}
            className={cn(
              'rounded-xl border px-3 py-2.5 text-center text-xs font-extrabold transition',
              step === s.n
                ? 'border-[#BEFA46] bg-[#BEFA46] text-[#09090B]'
                : step > s.n
                  ? 'border-[#BEFA46]/40 bg-[#BEFA46]/10 text-[#BEFA46]'
                  : 'border-zinc-800 bg-[#121216] text-zinc-500'
            )}
          >
            {s.label}
          </div>
        ))}
      </div>

      {errorMsg && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-xs sm:text-sm text-red-300 font-medium">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 rounded-3xl border border-zinc-800 bg-[#121216] p-6 sm:p-8 space-y-6">
          {/* STEP 1: REVIEW */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-[#BEFA46]" />
                Etapa 1 — Revise seus itens e numerações
              </h2>
              <div className="divide-y divide-zinc-800">
                {items.map((item) => (
                  <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="w-16 h-16 rounded-xl object-cover bg-[#EAE0D5]"
                      />
                      <div>
                        <p className="text-sm font-extrabold text-white">{item.product_name}</p>
                        <p className="text-xs text-zinc-400">
                          Cor: {item.color} • Numeração: <strong>{item.size}</strong> • Qtd:{' '}
                          <strong>{item.quantity}</strong>
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-black text-[#BEFA46]">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between pt-2">
                <Link
                  href="/carrinho"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Editar carrinho
                </Link>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-3 rounded-xl bg-[#BEFA46] text-[#09090B] text-sm font-black inline-flex items-center gap-2"
                >
                  Continuar
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CUSTOMER INFO */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#BEFA46]" />
                Etapa 2 — Informações do Cliente
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Nome completo *</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#BEFA46]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    Telefone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full h-11 px-4 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#BEFA46]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">E-mail *</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#BEFA46]"
                  />
                </div>
              </div>
              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!customerName.trim() || !customerPhone.trim() || !customerEmail.trim()) {
                      setErrorMsg('Preencha nome, WhatsApp e e-mail para continuar.');
                      return;
                    }
                    setErrorMsg('');
                    setStep(3);
                  }}
                  className="px-6 py-3 rounded-xl bg-[#BEFA46] text-[#09090B] text-sm font-black inline-flex items-center gap-2"
                >
                  Escolher Recebimento
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: DELIVERY OR PICKUP */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#BEFA46]" />
                Etapa 3 — Entrega ou Retirada
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <button
                  type="button"
                  onClick={() => setDeliveryMethod('pickup')}
                  className={cn(
                    'rounded-2xl border p-4 text-left space-y-1.5 transition',
                    deliveryMethod === 'pickup'
                      ? 'border-[#BEFA46] bg-[#BEFA46]/10'
                      : 'border-zinc-800 bg-[#18181F] hover:border-zinc-700'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <Store className="w-5 h-5 text-[#BEFA46]" />
                    <span className="text-xs font-extrabold text-emerald-400">Grátis</span>
                  </div>
                  <p className="text-sm font-extrabold text-white">Retirar na Loja</p>
                  <p className="text-xs text-zinc-400">{settings.address}</p>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryMethod('local_delivery')}
                  className={cn(
                    'rounded-2xl border p-4 text-left space-y-1.5 transition',
                    deliveryMethod === 'local_delivery'
                      ? 'border-[#BEFA46] bg-[#BEFA46]/10'
                      : 'border-zinc-800 bg-[#18181F] hover:border-zinc-700'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <Truck className="w-5 h-5 text-[#BEFA46]" />
                    <span className="text-xs font-semibold text-zinc-300">A combinar</span>
                  </div>
                  <p className="text-sm font-extrabold text-white">Solicitar Entrega Local</p>
                  <p className="text-xs text-zinc-400">
                    Disponibilidade e taxa confirmadas manualmente pela loja.
                  </p>
                </button>
              </div>

              {deliveryMethod === 'pickup' ? (
                <div className="rounded-2xl border border-zinc-800 bg-[#18181F] p-4 text-xs text-zinc-300 space-y-1">
                  <p className="font-bold text-white">Informações de retirada:</p>
                  <p>{settings.pickup_info}</p>
                  <p className="text-zinc-400">Horário: {settings.business_hours}</p>
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  {savedAddresses.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-semibold text-zinc-400">
                        Usar endereço salvo:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {savedAddresses.map((addr) => (
                          <button
                            key={addr.id}
                            type="button"
                            onClick={() => applySavedAddress(addr)}
                            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white"
                          >
                            {addr.label}: {addr.street}, {addr.number}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-zinc-400">CEP</label>
                      <input
                        type="text"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        placeholder="00000-000"
                        className="mt-1 w-full h-10 px-3 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#BEFA46]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs text-zinc-400">Rua / Avenida *</label>
                      <input
                        type="text"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        className="mt-1 w-full h-10 px-3 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#BEFA46]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400">Número *</label>
                      <input
                        type="text"
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                        className="mt-1 w-full h-10 px-3 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#BEFA46]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs text-zinc-400">Complemento</label>
                      <input
                        type="text"
                        value={complement}
                        onChange={(e) => setComplement(e.target.value)}
                        placeholder="Apto, Bloco, Casa..."
                        className="mt-1 w-full h-10 px-3 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#BEFA46]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400">Bairro *</label>
                      <input
                        type="text"
                        value={neighborhood}
                        onChange={(e) => setNeighborhood(e.target.value)}
                        className="mt-1 w-full h-10 px-3 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#BEFA46]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400">Cidade *</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="mt-1 w-full h-10 px-3 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#BEFA46]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400">Estado (UF)</label>
                      <input
                        type="text"
                        maxLength={2}
                        value={stateUf}
                        onChange={(e) => setStateUf(e.target.value.toUpperCase())}
                        className="mt-1 w-full h-10 px-3 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#BEFA46]"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="text-xs text-zinc-400">Ponto de Referência *</label>
                      <input
                        type="text"
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        placeholder="Ex: Próximo à estação / portão branco"
                        className="mt-1 w-full h-10 px-3 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#BEFA46]"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      deliveryMethod === 'local_delivery' &&
                      (!street.trim() || !number.trim() || !neighborhood.trim() || !city.trim())
                    ) {
                      setErrorMsg('Informe rua, número, bairro e cidade para entrega local.');
                      return;
                    }
                    setErrorMsg('');
                    setStep(4);
                  }}
                  className="px-6 py-3 rounded-xl bg-[#BEFA46] text-[#09090B] text-sm font-black inline-flex items-center gap-2"
                >
                  Revisar Confirmação
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: FINAL CONFIRMATION */}
          {step === 4 && (
            <div className="space-y-5">
              <h2 className="text-xl font-black text-white">
                Etapa 4 — Confirmação do Pedido
              </h2>

              <div className="rounded-2xl border border-zinc-800 bg-[#18181F] p-4 space-y-2 text-xs sm:text-sm text-zinc-300">
                <p>
                  <strong className="text-white">Cliente:</strong> {customerName} ({customerPhone})
                </p>
                <p>
                  <strong className="text-white">Recebimento:</strong>{' '}
                  {deliveryMethod === 'pickup'
                    ? `Retirada na loja (${settings.address})`
                    : `Entrega local em ${street}, ${number} - ${neighborhood}, ${city}/${stateUf}${
                        reference ? ` (Ref: ${reference})` : ''
                      }`}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Observações para a loja (opcional)
                </label>
                <textarea
                  rows={3}
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="Ex: Prefiro retirar após as 15h / Vou pagar no Pix..."
                  className="w-full p-3.5 rounded-xl bg-[#18181F] border border-zinc-800 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#BEFA46]"
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleConfirmOrder}
                  className="px-7 py-3.5 rounded-2xl bg-[#BEFA46] hover:bg-[#d1ff70] text-[#09090B] text-sm font-black inline-flex items-center gap-2 shadow-[0_6px_26px_rgba(190,250,70,0.28)] disabled:opacity-60"
                >
                  {submitting ? 'Confirmando e reservando...' : 'Confirmar Pedido Oficial'}
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Sidebar Summary */}
        <aside className="lg:col-span-4 rounded-3xl border border-zinc-800 bg-[#121216] p-6 space-y-4">
          <h3 className="text-base font-black text-white">Resumo Financeiro</h3>
          <div className="space-y-2 text-xs sm:text-sm border-b border-zinc-800 pb-4">
            <div className="flex justify-between text-zinc-400">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {subtotal > total && (
              <div className="flex justify-between text-emerald-400">
                <span>Economia em ofertas</span>
                <span>-{formatCurrency(subtotal - total)}</span>
              </div>
            )}
            <div className="flex justify-between text-zinc-400">
              <span>Frete / Entrega</span>
              <span>{deliveryMethod === 'pickup' ? 'Grátis' : 'A combinar'}</span>
            </div>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-sm font-bold text-white">Total do Pedido</span>
            <span className="text-2xl font-black text-[#BEFA46]">{formatCurrency(total)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

