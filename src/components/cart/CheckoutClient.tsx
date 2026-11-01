'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Banknote,
  Check,
  ChevronDown,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  QrCode,
  ShoppingBag,
  User,
  Wallet,
} from 'lucide-react';
import { CheckoutIcon } from '@/components/cart/CheckoutDeliveryIcons';
import { useStore } from '@/components/providers/StoreProvider';
import {
  calculateCheckoutShipping,
  getSelectableCheckoutOptions,
  normalizeCheckoutDeliveryConfig,
  resolveDefaultOptionKey,
  shouldRequireCheckoutAddress,
} from '@/lib/checkout-config';
import { buildOrderWhatsAppUrl, cn, formatCurrency } from '@/lib/utils';
import type {
  CartItemView,
  DeliveryMethod,
  Order,
  StoreSettings,
  UserAddress,
  UserProfile,
} from '@/types/database';

function formatPhoneBr(value: string): string {
  const digits = (value || '').replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

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
  const router = useRouter();
  const { setCartCount, showOrderConfirmedPopup } = useStore();
  const topAnchorRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [mobileItemsOpen, setMobileItemsOpen] = useState(false);

  const deliveryCfg = useMemo(
    () => normalizeCheckoutDeliveryConfig(settings.checkout_delivery_config),
    [settings.checkout_delivery_config]
  );

  const selectableOptions = useMemo(
    () => getSelectableCheckoutOptions(deliveryCfg, settings.address, total),
    [deliveryCfg, settings.address, total]
  );

  // Step 2: Customer info & intended payment method
  const [customerName, setCustomerName] = useState(profile.full_name || '');
  const [customerEmail, setCustomerEmail] = useState(profile.email || '');
  const [customerPhone, setCustomerPhone] = useState(() =>
    formatPhoneBr(profile.phone || '')
  );
  const [paymentChoice, setPaymentChoice] = useState<
    'pix' | 'card' | 'cash' | 'other' | ''
  >('');
  const [customPaymentMethod, setCustomPaymentMethod] = useState('');

  const resolvedPaymentMethod = useMemo(() => {
    if (paymentChoice === 'pix') return 'Pix';
    if (paymentChoice === 'card') return 'Cartão';
    if (paymentChoice === 'cash') return 'Dinheiro';
    if (paymentChoice === 'other') return customPaymentMethod.trim();
    return '';
  }, [paymentChoice, customPaymentMethod]);

  // Step 3: Delivery or Pickup (supports main cards AND custom selectable cards)
  const [selectedOptionKey, setSelectedOptionKey] = useState<string>(() =>
    resolveDefaultOptionKey(deliveryCfg)
  );

  // Keep selectedOptionKey valid when admin updates Etapa 3 cards in real time
  useEffect(() => {
    if (selectableOptions.length === 0) return;
    if (!selectableOptions.some((o) => o.key === selectedOptionKey)) {
      setSelectedOptionKey(selectableOptions[0].key);
    }
  }, [selectableOptions, selectedOptionKey]);

  const activeSelectedOption =
    selectableOptions.find((o) => o.key === selectedOptionKey) ??
    selectableOptions[0] ??
    null;

  const effectiveDeliveryMethod: DeliveryMethod =
    activeSelectedOption?.deliveryMethod ?? 'pickup';

  const defaultAddr = savedAddresses.find((a) => a.is_default) || savedAddresses[0];
  const [zipCode, setZipCode] = useState(defaultAddr?.zip_code || '');
  const [street, setStreet] = useState(defaultAddr?.street || '');
  const [number, setNumber] = useState(defaultAddr?.number || '');
  const [complement, setComplement] = useState(defaultAddr?.complement || '');
  const [neighborhood, setNeighborhood] = useState(defaultAddr?.neighborhood || '');
  const [city, setCity] = useState(defaultAddr?.city || 'São Paulo');
  const [stateUf, setStateUf] = useState(defaultAddr?.state || 'SP');
  const [reference, setReference] = useState(defaultAddr?.reference || '');

  // Notes & submission
  const [customerNotes, setCustomerNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const totalUnits = useMemo(
    () => items.reduce((acc, item) => acc + item.quantity, 0),
    [items]
  );

  const shippingCalc = useMemo(
    () =>
      calculateCheckoutShipping(
        deliveryCfg,
        activeSelectedOption?.key ?? selectedOptionKey,
        total
      ),
    [deliveryCfg, activeSelectedOption?.key, selectedOptionKey, total]
  );

  const finalOrderTotal = total + shippingCalc.shippingCost;

  const visibleInfoCards = useMemo(
    () =>
      deliveryCfg.extra_cards.filter(
        (c) =>
          c.enabled &&
          c.card_type === 'info' &&
          (c.title.trim() || c.description.trim()) &&
          (c.visibility === 'always' || c.visibility === effectiveDeliveryMethod)
      ),
    [deliveryCfg.extra_cards, effectiveDeliveryMethod]
  );

  const visibleCustomButtons = useMemo(
    () =>
      deliveryCfg.custom_buttons.filter(
        (b) =>
          b.label.trim() &&
          b.url.trim() &&
          (b.visibility === 'always' || b.visibility === effectiveDeliveryMethod)
      ),
    [deliveryCfg.custom_buttons, effectiveDeliveryMethod]
  );

  const showAddressForm = useMemo(
    () =>
      shouldRequireCheckoutAddress(
        deliveryCfg,
        activeSelectedOption,
        effectiveDeliveryMethod
      ),
    [deliveryCfg, activeSelectedOption, effectiveDeliveryMethod]
  );

  const goToStep = (nextStep: 1 | 2 | 3) => {
    setErrorMsg('');
    setStep(nextStep);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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

  const handleContinueFromStep2 = () => {
    if (!customerName.trim() || !customerPhone.trim() || !customerEmail.trim()) {
      setErrorMsg('Preencha seu nome, WhatsApp e e-mail para continuar.');
      return;
    }
    if (!paymentChoice) {
      setErrorMsg('Selecione como pretende pagar (Pix, Cartão, Dinheiro ou Outro).');
      return;
    }
    if (paymentChoice === 'other' && !customPaymentMethod.trim()) {
      setErrorMsg('Digite qual forma de pagamento você pretende usar em "Outro".');
      return;
    }
    goToStep(3);
  };

  const handleConfirmOrder = async () => {
    if (!customerName.trim() || !customerPhone.trim() || !customerEmail.trim()) {
      setErrorMsg('Preencha nome, WhatsApp e e-mail na Etapa 2 antes de finalizar.');
      return;
    }
    if (!resolvedPaymentMethod) {
      setErrorMsg('Informe a forma de pagamento na Etapa 2 antes de finalizar.');
      return;
    }

    if (
      showAddressForm &&
      (!street.trim() || !number.trim() || !neighborhood.trim() || !city.trim())
    ) {
      setErrorMsg('Informe rua, número, bairro e cidade para entrega.');
      return;
    }

    setErrorMsg('');
    setSubmitting(true);

    // Open blank window synchronously during click gesture so mobile/desktop browsers never block WhatsApp
    let waPopup: Window | null = null;
    try {
      waPopup = window.open('about:blank', '_blank');
      if (waPopup && !waPopup.closed) {
        waPopup.document.write(
          '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Abrindo WhatsApp...</title></head><body style="margin:0;background:#09090B;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;font-size:14px;">Abrindo WhatsApp da loja...</body></html>'
        );
        waPopup.document.close();
      }
    } catch {
      waPopup = null;
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerPhone,
          paymentMethod: resolvedPaymentMethod,
          deliveryMethod:
            !activeSelectedOption && showAddressForm
              ? 'local_delivery'
              : effectiveDeliveryMethod,
          selectedOptionKey: activeSelectedOption?.key ?? 'pickup',
          shippingAddress: showAddressForm
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
        if (waPopup && !waPopup.closed) waPopup.close();
        setErrorMsg(data.error || 'Não foi possível criar o pedido.');
        setSubmitting(false);
        return;
      }

      const created = data.order as Order | null;
      const orderNumber = data.orderNumber || created?.order_number || '';
      const waUrl = created
        ? buildOrderWhatsAppUrl(settings.whatsapp, created, settings.store_name)
        : undefined;

      setCartCount(0);
      showOrderConfirmedPopup({ orderNumber, waUrl });
      router.replace('/');

      if (waUrl) {
        if (waPopup && !waPopup.closed) {
          waPopup.location.href = waUrl;
        } else {
          window.setTimeout(() => {
            window.location.href = waUrl;
          }, 80);
        }
      }
    } catch {
      if (waPopup && !waPopup.closed) waPopup.close();
      setErrorMsg('Falha ao confirmar pedido. Verifique sua conexão.');
      setSubmitting(false);
    }
  };

  return (
    <div ref={topAnchorRef} className="space-y-4 sm:space-y-6">
      {/* Interactive 3-Step Progress Bar */}
      <div className="grid grid-cols-3 gap-2">
        {(
          [
            { n: 1 as const, short: 'Itens', full: 'Revisão' },
            { n: 2 as const, short: 'Dados', full: 'Seus Dados' },
            { n: 3 as const, short: 'Finalizar', full: 'Finalizar' },
          ] as const
        ).map((s) => {
          const isActive = step === s.n;
          const isCompleted = step > s.n;
          return (
            <button
              key={s.n}
              type="button"
              disabled={!isCompleted}
              onClick={() => isCompleted && goToStep(s.n)}
              className={cn(
                'rounded-xl border px-2.5 py-2.5 flex items-center justify-center gap-1.5 text-xs font-extrabold transition min-w-0',
                isActive &&
                  'border-[#BEFA46] bg-[#BEFA46] text-[#09090B] shadow-[0_4px_18px_rgba(190,250,70,0.2)]',
                isCompleted &&
                  'border-[#BEFA46]/40 bg-[#BEFA46]/10 text-[#BEFA46] hover:bg-[#BEFA46]/15 cursor-pointer',
                !isActive &&
                  !isCompleted &&
                  'border-zinc-800/90 bg-[#121216] text-zinc-500 cursor-default'
              )}
            >
              <span
                className={cn(
                  'w-5 h-5 rounded-full text-[11px] font-black inline-flex items-center justify-center shrink-0',
                  isActive && 'bg-[#09090B] text-[#BEFA46]',
                  isCompleted && 'bg-[#BEFA46] text-[#09090B]',
                  !isActive && !isCompleted && 'bg-zinc-800 text-zinc-400'
                )}
              >
                {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : s.n}
              </span>
              <span className="truncate sm:hidden">{s.short}</span>
              <span className="truncate hidden sm:inline">{s.full}</span>
            </button>
          );
        })}
      </div>

      {/* Mobile Collapsible Bag Strip on Steps 2 & 3 (Replaces bottom redundant Resumo box) */}
      {step > 1 && (
        <div className="lg:hidden rounded-2xl border border-zinc-800/90 bg-[#121216] overflow-hidden">
          <button
            type="button"
            onClick={() => setMobileItemsOpen((v) => !v)}
            className="w-full px-3.5 py-3 flex items-center justify-between gap-2 text-left cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <ShoppingBag className="w-4 h-4 text-[#BEFA46] shrink-0" />
              <span className="text-xs font-bold text-zinc-200 truncate">
                {mobileItemsOpen ? 'Ocultar itens' : 'Ver itens da sacola'} ({totalUnits})
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-sm font-black text-[#BEFA46]">
                {formatCurrency(finalOrderTotal)}
              </span>
              <ChevronDown
                className={cn(
                  'w-4 h-4 text-zinc-400 transition-transform',
                  mobileItemsOpen && 'rotate-180'
                )}
              />
            </div>
          </button>

          {mobileItemsOpen && (
            <div className="px-3.5 pb-3.5 pt-1 border-t border-zinc-800/80 space-y-2.5 bg-[#0D0D11]">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.product_image}
                      alt={item.product_name}
                      className="w-10 h-10 rounded-lg object-cover bg-[#EAE0D5] shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">
                        {item.product_name}
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        Tam. {item.size} • Qtd {item.quantity}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-white shrink-0">
                    {formatCurrency(item.subtotal)}
                  </span>
                </div>
              ))}
              <div className="pt-1 flex justify-end">
                <Link
                  href="/carrinho"
                  className="text-[11px] font-bold text-[#BEFA46] hover:underline"
                >
                  Editar sacola
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs sm:text-sm text-red-300 font-semibold">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* MAIN STEP CARD */}
        <div className="lg:col-span-8 rounded-3xl border border-zinc-800/90 bg-[#121216] p-4 sm:p-7">
          {/* STEP 1: REVIEW ITEMS */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base sm:text-xl font-black text-white flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-[#BEFA46] shrink-0" />
                  <span>Confira sua sacola</span>
                </h2>
                <Link
                  href="/carrinho"
                  className="text-xs font-bold text-zinc-400 hover:text-white inline-flex items-center gap-1 shrink-0"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Editar
                </Link>
              </div>

              <div className="space-y-2.5">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-zinc-800/80 bg-[#0D0D11] p-3 sm:p-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover bg-[#EAE0D5] shrink-0"
                      />
                      <div className="min-w-0 space-y-1.5">
                        <p className="text-xs sm:text-sm font-extrabold text-white line-clamp-2 leading-snug">
                          {item.product_name}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                          <span className="px-2 py-0.5 rounded-md bg-zinc-800/90 text-zinc-200 font-bold">
                            Tam. {item.size}
                          </span>
                          {item.color && (
                            <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 truncate max-w-[120px]">
                              {item.color}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 font-semibold">
                            {item.quantity} {item.quantity === 1 ? 'par' : 'pares'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm sm:text-base font-black text-[#BEFA46] block">
                        {formatCurrency(item.subtotal)}
                      </span>
                      {item.quantity > 1 && (
                        <span className="text-[10px] text-zinc-500 block">
                          {formatCurrency(item.unit_price)} cada
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile Inline Total Strip */}
              <div className="lg:hidden rounded-2xl border border-zinc-800/90 bg-[#0B0B0E] px-4 py-3 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] text-zinc-400 block">Subtotal dos itens</span>
                  {subtotal > total && (
                    <span className="text-[11px] font-bold text-emerald-400">
                      Economia de {formatCurrency(subtotal - total)}
                    </span>
                  )}
                </div>
                <span className="text-lg font-black text-[#BEFA46]">
                  {formatCurrency(total)}
                </span>
              </div>

              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => goToStep(2)}
                  className="w-full h-12 rounded-2xl bg-[#BEFA46] hover:bg-[#d1ff70] text-[#09090B] text-sm font-black inline-flex items-center justify-center gap-2 shadow-[0_6px_22px_rgba(190,250,70,0.22)] transition cursor-pointer"
                >
                  <span>Continuar para Seus Dados</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CUSTOMER INFO */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base sm:text-xl font-black text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-[#BEFA46] shrink-0" />
                  <span>Quem vai receber?</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Usaremos estes dados para identificar seu pedido no atendimento.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">Nome completo *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Digite seu nome"
                      className="w-full h-12 pl-10 pr-4 rounded-xl bg-[#0D0D11] border border-zinc-800 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#BEFA46]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">
                    WhatsApp / Telefone *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(formatPhoneBr(e.target.value))}
                      placeholder="(11) 99999-9999"
                      className="w-full h-12 pl-10 pr-4 rounded-xl bg-[#0D0D11] border border-zinc-800 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#BEFA46]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">E-mail *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="voce@email.com"
                      className="w-full h-12 pl-10 pr-4 rounded-xl bg-[#0D0D11] border border-zinc-800 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#BEFA46]"
                    />
                  </div>
                </div>
              </div>

              {/* Intended Payment Method Selector */}
              <div className="pt-2 border-t border-zinc-800/80 space-y-2.5">
                <div>
                  <label className="text-xs font-bold text-zinc-200 block">
                    Como você pretende pagar? *
                  </label>
                  <p className="text-[11px] text-zinc-500">
                    Apenas informativo para a loja já agilizar seu atendimento.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {(
                    [
                      { key: 'pix' as const, label: 'Pix', Icon: QrCode },
                      { key: 'card' as const, label: 'Cartão', Icon: CreditCard },
                      { key: 'cash' as const, label: 'Dinheiro', Icon: Banknote },
                      { key: 'other' as const, label: 'Outro', Icon: Wallet },
                    ] as const
                  ).map(({ key, label, Icon }) => {
                    const active = paymentChoice === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setPaymentChoice(key);
                          if (errorMsg) setErrorMsg('');
                        }}
                        className={cn(
                          'h-12 px-3 rounded-xl border text-xs sm:text-sm font-extrabold inline-flex items-center justify-center gap-2 transition cursor-pointer',
                          active
                            ? 'border-[#BEFA46] bg-[#BEFA46]/12 text-[#BEFA46] shadow-[0_0_16px_rgba(190,250,70,0.12)]'
                            : 'border-zinc-800 bg-[#0D0D11] text-zinc-300 hover:border-zinc-700 hover:text-white'
                        )}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>

                {paymentChoice === 'other' && (
                  <div className="pt-1">
                    <input
                      type="text"
                      autoFocus
                      value={customPaymentMethod}
                      onChange={(e) => setCustomPaymentMethod(e.target.value)}
                      placeholder="Digite como pretende pagar (ex: Pix + Cartão, Parcelado em 2x...)"
                      className="w-full h-11 px-3.5 rounded-xl bg-[#0D0D11] border border-[#BEFA46]/50 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#BEFA46]"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleContinueFromStep2}
                  className="w-full h-12 rounded-2xl bg-[#BEFA46] hover:bg-[#d1ff70] text-[#09090B] text-sm font-black inline-flex items-center justify-center gap-2 shadow-[0_6px_22px_rgba(190,250,70,0.22)] transition cursor-pointer"
                >
                  <span>Ir para Confirmação</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => goToStep(1)}
                  className="w-full py-2 text-xs font-bold text-zinc-400 hover:text-white inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Voltar para sacola
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: DELIVERY / PICKUP & FINAL CONFIRMATION */}
          {step === 3 && (
            <div className="space-y-5">
              {/* 1. Compact Buyer Strip (Separated cleanly, never mixed with items) */}
              <div className="rounded-2xl border border-zinc-800/90 bg-[#0B0B0E] px-3.5 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-[#BEFA46]" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-xs sm:text-sm font-extrabold text-white truncate">
                        {customerName}
                      </p>
                      {resolvedPaymentMethod && (
                        <span className="px-2 py-0.5 rounded-md bg-[#BEFA46]/15 text-[10px] font-extrabold text-[#BEFA46] truncate max-w-[160px]">
                          Pgto: {resolvedPaymentMethod}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 truncate">
                      {formatPhoneBr(customerPhone) || customerPhone}
                      {customerEmail ? ` · ${customerEmail}` : ''}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => goToStep(2)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#16161D] border border-zinc-800 hover:border-zinc-700 text-[11px] font-bold text-zinc-300 hover:text-white inline-flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Pencil className="w-3 h-3" />
                  Editar
                </button>
              </div>

              {/* 2. Dynamic Step Title & Selectable Options */}
              {(deliveryCfg.step_title || selectableOptions.length > 0) && (
                <div className="space-y-3">
                  {deliveryCfg.step_title && (
                    <h2 className="text-base sm:text-xl font-black text-white flex items-center gap-2">
                      {deliveryCfg.step_icon !== 'none' && (
                        <CheckoutIcon
                          name={deliveryCfg.step_icon}
                          className="w-5 h-5 text-[#BEFA46] shrink-0"
                        />
                      )}
                      <span>{deliveryCfg.step_title}</span>
                    </h2>
                  )}

                  {selectableOptions.length > 0 && (
                    <div
                      className={cn(
                        'grid grid-cols-1 gap-3',
                        selectableOptions.length >= 2 && 'sm:grid-cols-2'
                      )}
                    >
                      {selectableOptions.map((opt) => {
                        const selected = activeSelectedOption?.key === opt.key;
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => setSelectedOptionKey(opt.key)}
                            className={cn(
                              'rounded-2xl border p-3.5 sm:p-4 text-left space-y-2 transition cursor-pointer',
                              selected
                                ? 'border-[#BEFA46] bg-[#BEFA46]/[0.08]'
                                : 'border-zinc-800 bg-[#0D0D11] hover:border-zinc-700'
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className={cn(
                                    'w-4 h-4 rounded-full border flex items-center justify-center shrink-0',
                                    selected
                                      ? 'border-[#BEFA46] bg-[#BEFA46]'
                                      : 'border-zinc-600 bg-transparent'
                                  )}
                                >
                                  {selected && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#09090B]" />
                                  )}
                                </span>
                                {opt.icon !== 'none' && (
                                  <CheckoutIcon
                                    name={opt.icon}
                                    className="w-4 h-4 text-[#BEFA46] shrink-0"
                                  />
                                )}
                                <span className="text-xs sm:text-sm font-extrabold text-white truncate">
                                  {opt.title}
                                </span>
                              </div>

                              <span
                                className={cn(
                                  'px-2 py-0.5 rounded-md text-[11px] font-extrabold shrink-0',
                                  opt.badgeLabel === 'Grátis'
                                    ? 'bg-emerald-500/15 text-emerald-400'
                                    : selected
                                      ? 'bg-[#BEFA46]/20 text-[#BEFA46]'
                                      : 'bg-zinc-800 text-zinc-200'
                                )}
                              >
                                {opt.badgeLabel}
                              </span>
                            </div>

                            {opt.subtitle && (
                              <p className="text-xs text-zinc-400 pl-6 leading-relaxed">
                                {opt.subtitle}
                              </p>
                            )}
                            {opt.freeThreshold > 0 && total < opt.freeThreshold && (
                              <p className="text-[11px] font-semibold text-[#BEFA46] pl-6">
                                Frete grátis acima de {formatCurrency(opt.freeThreshold)}
                              </p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 3. Distinct Info Callouts (Left Accent Bar so they never blend with inputs/options) */}
              {effectiveDeliveryMethod === 'pickup' &&
                !deliveryCfg.pickup_info_removed &&
                deliveryCfg.pickup_info_card_enabled &&
                (settings.pickup_info ||
                  (deliveryCfg.show_pickup_hours && settings.business_hours)) && (
                  <div className="rounded-xl border border-zinc-800/90 border-l-[3px] border-l-[#BEFA46] bg-[#16161E] px-4 py-3 text-xs text-zinc-300 space-y-1">
                    {deliveryCfg.pickup_info_card_title && (
                      <div className="flex items-center gap-1.5 font-extrabold text-white">
                        {deliveryCfg.pickup_info_card_icon !== 'none' && (
                          <CheckoutIcon
                            name={deliveryCfg.pickup_info_card_icon}
                            className="w-4 h-4 text-[#BEFA46] shrink-0"
                          />
                        )}
                        <span>{deliveryCfg.pickup_info_card_title}</span>
                      </div>
                    )}
                    {settings.pickup_info && (
                      <p className="whitespace-pre-line text-zinc-300 leading-relaxed">
                        {settings.pickup_info}
                      </p>
                    )}
                    {deliveryCfg.show_pickup_hours && settings.business_hours && (
                      <p className="text-zinc-400">Horário: {settings.business_hours}</p>
                    )}
                  </div>
                )}

              {effectiveDeliveryMethod === 'local_delivery' &&
                !deliveryCfg.delivery_removed &&
                deliveryCfg.delivery_info_card_enabled &&
                settings.delivery_info && (
                  <div className="rounded-xl border border-zinc-800/90 border-l-[3px] border-l-[#BEFA46] bg-[#16161E] px-4 py-3 text-xs text-zinc-300 space-y-1">
                    {deliveryCfg.delivery_info_card_title && (
                      <div className="flex items-center gap-1.5 font-extrabold text-white">
                        {deliveryCfg.delivery_info_card_icon !== 'none' && (
                          <CheckoutIcon
                            name={deliveryCfg.delivery_info_card_icon}
                            className="w-4 h-4 text-[#BEFA46] shrink-0"
                          />
                        )}
                        <span>{deliveryCfg.delivery_info_card_title}</span>
                      </div>
                    )}
                    <p className="whitespace-pre-line text-zinc-300 leading-relaxed">
                      {settings.delivery_info}
                    </p>
                  </div>
                )}

              {visibleInfoCards.length > 0 && (
                <div className="space-y-2.5">
                  {visibleInfoCards.map((card) => (
                    <div
                      key={card.id}
                      className="rounded-xl border border-zinc-800/90 border-l-[3px] border-l-[#BEFA46] bg-[#16161E] px-4 py-3 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 font-extrabold text-white">
                          {card.icon !== 'none' && (
                            <CheckoutIcon
                              name={card.icon}
                              className="w-4 h-4 text-[#BEFA46] shrink-0"
                            />
                          )}
                          <span>{card.title}</span>
                        </div>
                        {card.badge && (
                          <span className="px-2 py-0.5 rounded-md bg-[#BEFA46]/15 text-[11px] font-extrabold text-[#BEFA46] shrink-0">
                            {card.badge}
                          </span>
                        )}
                      </div>
                      {card.description && (
                        <p className="whitespace-pre-line text-zinc-400 leading-relaxed">
                          {card.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Custom Action Buttons */}
              {visibleCustomButtons.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {visibleCustomButtons.map((btn) => (
                    <a
                      key={btn.id}
                      href={btn.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        'w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition',
                        btn.variant === 'volt' &&
                          'bg-[#BEFA46] hover:bg-[#d1ff70] text-[#09090B] font-black',
                        btn.variant === 'whatsapp' &&
                          'bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300',
                        btn.variant === 'outline' &&
                          'bg-[#18181F] hover:bg-zinc-800 border border-zinc-700 text-white',
                        btn.variant === 'subtle' &&
                          'bg-zinc-900 hover:bg-zinc-800 text-zinc-300'
                      )}
                    >
                      {btn.icon !== 'none' && (
                        <CheckoutIcon name={btn.icon} className="w-4 h-4 shrink-0" />
                      )}
                      <span>{btn.label}</span>
                    </a>
                  ))}
                </div>
              )}

              {/* 4. Dedicated Delivery Address Sub-Panel */}
              {showAddressForm && (
                <div className="rounded-2xl border border-zinc-800/90 bg-[#0D0D11] p-4 space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-white flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#BEFA46]" />
                      Endereço
                    </span>
                    {savedAddresses.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {savedAddresses.map((addr) => (
                          <button
                            key={addr.id}
                            type="button"
                            onClick={() => applySavedAddress(addr)}
                            className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] font-bold text-[#BEFA46] cursor-pointer"
                          >
                            {addr.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-12 gap-2.5">
                    <div className="col-span-5 sm:col-span-4">
                      <label className="text-[11px] font-semibold text-zinc-400">CEP</label>
                      <input
                        type="text"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        placeholder="00000-000"
                        className="mt-1 w-full h-10 px-3 rounded-xl bg-[#15151C] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#BEFA46]"
                      />
                    </div>
                    <div className="col-span-7 sm:col-span-6">
                      <label className="text-[11px] font-semibold text-zinc-400">Cidade *</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="mt-1 w-full h-10 px-3 rounded-xl bg-[#15151C] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#BEFA46]"
                      />
                    </div>
                    <div className="col-span-3 sm:col-span-2 hidden sm:block">
                      <label className="text-[11px] font-semibold text-zinc-400">UF</label>
                      <input
                        type="text"
                        maxLength={2}
                        value={stateUf}
                        onChange={(e) => setStateUf(e.target.value.toUpperCase())}
                        className="mt-1 w-full h-10 px-3 rounded-xl bg-[#15151C] border border-zinc-800 text-sm text-white text-center focus:outline-none focus:border-[#BEFA46]"
                      />
                    </div>

                    <div className="col-span-8 sm:col-span-9">
                      <label className="text-[11px] font-semibold text-zinc-400">
                        Rua / Avenida *
                      </label>
                      <input
                        type="text"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        className="mt-1 w-full h-10 px-3 rounded-xl bg-[#15151C] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#BEFA46]"
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-3">
                      <label className="text-[11px] font-semibold text-zinc-400">Número *</label>
                      <input
                        type="text"
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                        className="mt-1 w-full h-10 px-3 rounded-xl bg-[#15151C] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#BEFA46]"
                      />
                    </div>

                    <div className="col-span-6">
                      <label className="text-[11px] font-semibold text-zinc-400">Bairro *</label>
                      <input
                        type="text"
                        value={neighborhood}
                        onChange={(e) => setNeighborhood(e.target.value)}
                        className="mt-1 w-full h-10 px-3 rounded-xl bg-[#15151C] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#BEFA46]"
                      />
                    </div>
                    <div className="col-span-6">
                      <label className="text-[11px] font-semibold text-zinc-400">
                        Complemento
                      </label>
                      <input
                        type="text"
                        value={complement}
                        onChange={(e) => setComplement(e.target.value)}
                        placeholder="Apto, Casa..."
                        className="mt-1 w-full h-10 px-3 rounded-xl bg-[#15151C] border border-zinc-800 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#BEFA46]"
                      />
                    </div>

                    <div className="col-span-12">
                      <label className="text-[11px] font-semibold text-zinc-400">
                        Ponto de Referência
                      </label>
                      <input
                        type="text"
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        placeholder="Ex: Próximo à estação / portão branco"
                        className="mt-1 w-full h-10 px-3 rounded-xl bg-[#15151C] border border-zinc-800 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#BEFA46]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 5. Compact Optional Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">
// step 21/24
