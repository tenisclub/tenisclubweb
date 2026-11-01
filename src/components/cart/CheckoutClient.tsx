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
