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
        )}
        <h1 className="text-2xl sm:text-3xl font-black text-white">Entrega e Retirada</h1>
      </div>

      {selectableOptions.length > 0 && (
        <div
          className={cn(
            'grid grid-cols-1 gap-4 sm:gap-5',
            selectableOptions.length >= 2 && 'md:grid-cols-2'
          )}
        >
          {selectableOptions.map((opt) => (
            <div
              key={opt.key}
              className="rounded-3xl border border-zinc-800 bg-[#121216] p-5 sm:p-6 space-y-3"
            >
              <div className="flex items-center justify-between">
                {opt.icon !== 'none' ? (
                  <CheckoutIcon name={opt.icon} className="w-7 h-7 text-[#BEFA46]" />
                ) : (
                  <span />
                )}
                <span
                  className={cn(
                    'text-xs font-extrabold',
                    opt.badgeLabel === 'Grátis' ? 'text-emerald-400' : 'text-zinc-200'
                  )}
                >
                  {opt.badgeLabel}
                </span>
              </div>
              <h2 className="text-lg font-black text-white">{opt.title}</h2>
              {opt.kind === 'pickup' && settings.pickup_info && (
                <p className="text-sm text-zinc-300 leading-relaxed">{settings.pickup_info}</p>
              )}
              {opt.kind === 'local_delivery' && settings.delivery_info && (
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {settings.delivery_info}
                </p>
              )}
              {opt.freeThreshold > 0 && (
                <p className="text-xs font-bold text-emerald-400">
                  Frete grátis em compras acima de {formatCurrency(opt.freeThreshold)}!
                </p>
              )}
              {opt.subtitle && (
                <p className="text-xs text-zinc-400 pt-1">
                  {opt.kind === 'pickup' ? (
                    <>
                      <strong>Endereço:</strong> {opt.subtitle}
                      {cfg.show_pickup_hours && settings.business_hours && (
                        <>
                          <br />
                          <strong>Horários:</strong> {settings.business_hours}
                        </>
                      )}
                    </>
                  ) : (
                    opt.subtitle
                  )}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {infoCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {infoCards.map((card) => (
            <div
              key={card.id}
              className="rounded-2xl border border-zinc-800 bg-[#121216] p-5 space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {card.icon !== 'none' && (
                    <CheckoutIcon name={card.icon} className="w-4 h-4 text-[#BEFA46]" />
                  )}
                  <h3 className="text-sm font-extrabold text-white">{card.title}</h3>
                </div>
                {card.badge && (
                  <span className="text-xs font-bold text-[#BEFA46]">{card.badge}</span>
                )}
              </div>
              {card.description && (
                <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
                  {card.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {cfg.custom_buttons.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {cfg.custom_buttons
            .filter((btn) => btn.label.trim() && btn.url.trim())
            .map((btn) => (
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
    </div>
  );
}
