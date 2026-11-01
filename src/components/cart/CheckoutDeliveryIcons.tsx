'use client';

import React, { useState } from 'react';
import {
  MapPin,
  Store,
  Truck,
  Package,
  Clock,
  Zap,
  ShieldCheck,
  Sparkles,
  MessageCircle,
  Navigation,
  Gift,
  ExternalLink,
  Info,
  Ban,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CheckoutIconKey } from '@/lib/checkout-config';

export const CHECKOUT_ICON_OPTIONS: { key: CheckoutIconKey; label: string }[] = [
  { key: 'store', label: 'Loja' },
  { key: 'truck', label: 'Entrega' },
  { key: 'map-pin', label: 'Local' },
// step 1/6
