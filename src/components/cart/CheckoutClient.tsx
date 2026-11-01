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
// step 1/24
