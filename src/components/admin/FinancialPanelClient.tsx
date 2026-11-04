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
// etapa 4/85
