import type { Metadata } from 'next';
import { CheckoutIcon } from '@/components/cart/CheckoutDeliveryIcons';
import { getStoreSettings } from '@/lib/catalog';
import {
  getSelectableCheckoutOptions,
  normalizeCheckoutDeliveryConfig,
} from '@/lib/checkout-config';
import { cn, formatCurrency } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Entrega e Retirada' };

export default async function EntregaRetiradaPage() {
  const settings = await getStoreSettings();
  const cfg = normalizeCheckoutDeliveryConfig(settings.checkout_delivery_config);
  const selectableOptions = getSelectableCheckoutOptions(cfg, settings.address, 0);
  const infoCards = cfg.extra_cards.filter(
    (c) => c.enabled && c.card_type === 'info' && (c.title.trim() || c.description.trim())
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 space-y-6 sm:space-y-8">
      <div className="flex items-center gap-3">
        {cfg.step_icon !== 'none' && (
          <CheckoutIcon name={cfg.step_icon} className="w-6 h-6 sm:w-7 sm:h-7 text-[#BEFA46] shrink-0" />
// step 1/6
