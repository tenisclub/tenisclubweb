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
// step 2/24
