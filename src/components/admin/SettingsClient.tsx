'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Copy,
  FileText,
  Globe,
  LayoutGrid,
  Phone,
  Save,
  Sparkles,
  Upload,
} from 'lucide-react';
import { CheckoutStep3Customizer } from '@/components/admin/CheckoutStep3Customizer';
import { useStore } from '@/components/providers/StoreProvider';
import {
  DEFAULT_CHECKOUT_DELIVERY_CONFIG,
  normalizeCheckoutDeliveryConfig,
  type CheckoutDeliveryConfig,
} from '@/lib/checkout-config';
import { cn } from '@/lib/utils';
import type { StoreSettings } from '@/types/database';

type SettingsSectionTab = 'all' | 'checkout' | 'identity' | 'contact' | 'policies';

export function SettingsClient({ initialSettings }: { initialSettings: StoreSettings }) {
  const router = useRouter();
  const { toast } = useStore();
  const isDirtyRef = useRef(false);
  const [activeTab, setActiveTab] = useState<SettingsSectionTab>('all');

  const [form, setForm] = useState<StoreSettings>(() => ({
    ...initialSettings,
    checkout_delivery_config: normalizeCheckoutDeliveryConfig(
      initialSettings.checkout_delivery_config
    ),
  }));
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // Sync external Realtime changes when admin does not have unsaved local edits
  useEffect(() => {
    if (isDirtyRef.current || saving) return;
    const normalized = normalizeCheckoutDeliveryConfig(
      initialSettings.checkout_delivery_config
    );
    setForm({
      ...initialSettings,
      checkout_delivery_config: normalized,
    });
  }, [initialSettings, saving]);

  const deliveryCfg = useMemo(
    () => normalizeCheckoutDeliveryConfig(form.checkout_delivery_config),
    [form.checkout_delivery_config]
  );

  const setField = (key: keyof StoreSettings, value: unknown) => {
    isDirtyRef.current = true;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateDeliveryCfg = (patch: Partial<CheckoutDeliveryConfig>) => {
    isDirtyRef.current = true;
    setForm((prev) => {
      const current = normalizeCheckoutDeliveryConfig(prev.checkout_delivery_config);
      const next = { ...current, ...patch };
      return { ...prev, checkout_delivery_config: next };
    });
  };

  const resetEtapa3ToDefault = () => {
    isDirtyRef.current = true;
    setForm((prev) => ({
      ...prev,
      checkout_delivery_config: {
        ...DEFAULT_CHECKOUT_DELIVERY_CONFIG,
        extra_cards: [],
        custom_buttons: [],
      },
    }));
    toast('Cards da Etapa 3 restaurados para o padrão! Clique em Salvar para publicar.', 'info');
  };

  const handleUploadAsset = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'logo_url' | 'hero_banner_url'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingField(field);
// step 2/12
