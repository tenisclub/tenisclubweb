'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Store,
  Columns3,
  Download,
  Search,
  ExternalLink,
  Check,
  X,
  Loader2,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  FileSpreadsheet,
} from 'lucide-react';
import { useStore } from '@/components/providers/StoreProvider';
import { cn, formatCurrency } from '@/lib/utils';
import type {
  FinancialCustomColumn,
  FinancialCustomColumnType,
  FinancialEntry,
  FinancialEntryType,
} from '@/types/database';

interface ProductSummary {
  id: string;
  name: string;
  sku: string | null;
  base_price: number;
  promo_price: number | null;
  cost_price?: number;
}

const STORE_LINK_PRESETS = [
  'Tênis Club — Loja Online',
  'Tênis Club — Loja Física',
  'Tênis Club — Geral',
  'Fornecedor / Estoque',
  'Logística / Entrega',
  'Marketing / Tráfego',
  'Embalagens / Insumos',
  'Custos Fixos da Loja',
];

const CATEGORY_PRESETS_INCOME = [
  'Venda de Produto',
  'Entrada Loja Física',
  'Recebimento Pix / Cartão',
  'Aporte / Caixa',
  'Outras Entradas',
];

const CATEGORY_PRESETS_EXPENSE = [
  'Compra de Mercadoria / Fornecedor',
  'Frete / Motoboy / Correios',
  'Embalagens / Sacolas / Caixas',
  'Marketing / Tráfego Pago',
  'Taxa de Maquininha / Gateway',
  'Aluguel / Internet / Energia',
  'Retirada / Pró-labore',
  'Outras Saídas',
];

function getTodaySaoPaulo(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function getNowLocalInputValue(targetDate?: string): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const ymd =
    targetDate && targetDate !== 'all'
      ? targetDate
      : `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return `${ymd}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function isoToLocalInputValue(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return getNowLocalInputValue();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  } catch {
    return getNowLocalInputValue();
  }
}

function formatDatePageTab(ymd: string, todayYmd: string): { title: string; badge?: string } {
  const [y, m, d] = ymd.split('-');
  const formatted = d && m && y ? `${d}/${m}/${y}` : ymd;
  if (ymd === todayYmd) {
    return { title: formatted, badge: 'Hoje' };
  }
  const yesterday = new Date(`${todayYmd}T12:00:00`);
  yesterday.setDate(yesterday.getDate() - 1);
  const yestYmd = yesterday.toISOString().slice(0, 10);
  if (ymd === yestYmd) {
    return { title: formatted, badge: 'Ontem' };
  }
  return { title: formatted };
}

function formatDateTimeDisplay(iso: string): { date: string; time: string } {
  try {
    const d = new Date(iso);
    return {
      date: new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'America/Sao_Paulo',
      }).format(d),
      time: new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo',
      }).format(d),
    };
  } catch {
    return { date: '--/--/----', time: '--:--' };
  }
}

export function FinancialPanelClient({
  initialEntries,
  initialColumns,
  products,
}: {
  initialEntries: FinancialEntry[];
  initialColumns: FinancialCustomColumn[];
  products: ProductSummary[];
}) {
  const { toast: showToast } = useStore();
  const todayYmd = useMemo(() => getTodaySaoPaulo(), []);

  const [entries, setEntries] = useState<FinancialEntry[]>(initialEntries);
  const [customColumns, setCustomColumns] = useState<FinancialCustomColumn[]>(initialColumns);

  useEffect(() => {
    setEntries(initialEntries);
  }, [initialEntries]);

  useEffect(() => {
    setCustomColumns(initialColumns);
  }, [initialColumns]);

  // Date pages management
  const [extraDates, setExtraDates] = useState<string[]>([todayYmd]);
  const allDatePages = useMemo(() => {
// etapa 9/85
