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
    const set = new Set<string>(extraDates);
    set.add(todayYmd);
    for (const e of entries) {
      if (e.entry_date) set.add(e.entry_date.slice(0, 10));
    }
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [entries, extraDates, todayYmd]);

  // Default to the most recent date page that has entries, or today
  const [selectedDatePage, setSelectedDatePage] = useState<string>(() => {
    if (initialEntries.length > 0 && initialEntries[0].entry_date) {
      return initialEntries[0].entry_date.slice(0, 10);
    }
    return todayYmd;
  });

  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [jumpDateInput, setJumpDateInput] = useState('');

  // New entry form modal / drawer state
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [formType, setFormType] = useState<FinancialEntryType>('income');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('Venda de Produto');
  const [formStoreLink, setFormStoreLink] = useState('Tênis Club — Loja Online');
  const [formProductId, setFormProductId] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCostAmount, setFormCostAmount] = useState('');
  const [formPaymentMethod, setFormPaymentMethod] = useState('Pix');
  const [formOccurredAt, setFormOccurredAt] = useState(() => getNowLocalInputValue());
  const [formCustomValues, setFormCustomValues] = useState<Record<string, string>>({});
  const [savingEntry, setSavingEntry] = useState(false);

  // New custom column modal state
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState<FinancialCustomColumnType>('text');
  const [savingColumn, setSavingColumn] = useState(false);

  // Track row saving spinner
  const [savingRowId, setSavingRowId] = useState<string | null>(null);

  const openNewEntryForm = (type: FinancialEntryType) => {
    setFormType(type);
    setFormDescription('');
    setFormCategory(type === 'income' ? 'Venda de Produto' : 'Compra de Mercadoria / Fornecedor');
    setFormStoreLink('Tênis Club — Loja Online');
    setFormProductId('');
    setFormAmount('');
    setFormCostAmount('');
    setFormPaymentMethod('Pix');
    setFormOccurredAt(getNowLocalInputValue(selectedDatePage));
    setFormCustomValues({});
    setShowEntryForm(true);
  };

  // Filtered entries for the current date page
  const pageEntries = useMemo(() => {
    return entries.filter((entry) => {
      const entryYmd = (entry.entry_date || '').slice(0, 10);
      if (selectedDatePage !== 'all' && entryYmd !== selectedDatePage) {
        return false;
      }
      if (typeFilter !== 'all' && entry.entry_type !== typeFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inDesc = (entry.description || '').toLowerCase().includes(q);
        const inStore = (entry.store_link || '').toLowerCase().includes(q);
        const inCat = (entry.category || '').toLowerCase().includes(q);
        const inOrder = (entry.order?.order_number || '').toLowerCase().includes(q);
        const inProd = (entry.product?.name || '').toLowerCase().includes(q);
        const inCustom = Object.values(entry.custom_values || {}).some((v) =>
          String(v).toLowerCase().includes(q)
        );
        if (!inDesc && !inStore && !inCat && !inOrder && !inProd && !inCustom) {
          return false;
        }
      }
      return true;
    });
  }, [entries, selectedDatePage, typeFilter, searchQuery]);

  // Summary metrics for the active page
  const metrics = useMemo(() => {
    let grossIncome = 0;
    let salesCost = 0;
    let totalExpenses = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    for (const e of pageEntries) {
      const amt = Number(e.amount) || 0;
      const cost = Number(e.cost_amount) || 0;
      if (e.entry_type === 'income') {
        grossIncome += amt;
        salesCost += cost;
        incomeCount += 1;
      } else {
        totalExpenses += amt + cost;
        expenseCount += 1;
      }
    }

    const grossProfitFromSales = grossIncome - salesCost;
    const netProfit = grossIncome - salesCost - totalExpenses;
    const marginPercent = grossIncome > 0 ? (netProfit / grossIncome) * 100 : 0;

    return {
      grossIncome,
      salesCost,
      grossProfitFromSales,
      totalExpenses,
      netProfit,
      marginPercent,
      incomeCount,
      expenseCount,
    };
  }, [pageEntries]);

  // Count per date page for tabs
  const datePageStats = useMemo(() => {
    const map: Record<string, { count: number; net: number }> = {};
    for (const e of entries) {
      const ymd = (e.entry_date || '').slice(0, 10);
      if (!ymd) continue;
      if (!map[ymd]) map[ymd] = { count: 0, net: 0 };
      map[ymd].count += 1;
      const amt = Number(e.amount) || 0;
      const cost = Number(e.cost_amount) || 0;
      if (e.entry_type === 'income') {
        map[ymd].net += amt - cost;
      } else {
        map[ymd].net -= amt + cost;
      }
    }
    return map;
  }, [entries]);

  const handleOpenOrJumpDate = (ymd: string) => {
    if (!ymd) return;
    if (!extraDates.includes(ymd)) {
      setExtraDates((prev) => [...prev, ymd]);
    }
    setSelectedDatePage(ymd);
  };

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDescription.trim()) {
      showToast('Informe a descrição do lançamento.', 'error');
      return;
    }

    const numAmount = Number(String(formAmount).replace(',', '.')) || 0;
    const numCost = Number(String(formCostAmount).replace(',', '.')) || 0;

    setSavingEntry(true);
    try {
      const occurredIso = formOccurredAt
        ? new Date(formOccurredAt).toISOString()
        : new Date().toISOString();
      const entryDateYmd = formOccurredAt
        ? formOccurredAt.slice(0, 10)
        : selectedDatePage !== 'all'
          ? selectedDatePage
          : todayYmd;

      const res = await fetch('/api/admin/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry_type: formType,
          description: formDescription.trim(),
          category: formCategory.trim() || (formType === 'income' ? 'Entrada' : 'Saída'),
          store_link: formStoreLink.trim() || 'Tênis Club — Loja Online',
          product_id: formProductId || null,
          amount: numAmount,
          cost_amount: formType === 'income' ? numCost : 0,
          payment_method: formPaymentMethod.trim(),
          occurred_at: occurredIso,
          entry_date: entryDateYmd,
          custom_values: formCustomValues,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Erro ao registrar lançamento.', 'error');
        return;
      }

      const created = data.entry as FinancialEntry;
      setEntries((prev) => [created, ...prev]);
      if (created.entry_date) {
        handleOpenOrJumpDate(created.entry_date.slice(0, 10));
      }
      setShowEntryForm(false);
      showToast(
        formType === 'income'
          ? 'Entrada registrada na planilha financeira!'
          : 'Saída registrada na planilha financeira!',
        'success'
      );
    } catch {
      showToast('Erro de conexão ao salvar lançamento.', 'error');
    } finally {
      setSavingEntry(false);
    }
  };

  const handleUpdateEntryField = async (
    entryId: string,
    updates: Record<string, unknown>,
    silent = false
  ) => {
    setSavingRowId(entryId);
    try {
      const res = await fetch(`/api/admin/finance/${entryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Erro ao atualizar linha.', 'error');
        return;
      }
      const updated = data.entry as FinancialEntry;
      setEntries((prev) => prev.map((item) => (item.id === entryId ? updated : item)));
      if (!silent) {
        showToast('Planilha atualizada!', 'success');
      }
    } catch {
      showToast('Erro ao salvar alteração na planilha.', 'error');
    } finally {
      setSavingRowId(null);
    }
  };

  const handleDeleteEntry = async (entry: FinancialEntry) => {
    if (
      !window.confirm(
        `Deseja realmente remover o lançamento "${entry.description}" da planilha financeira?`
      )
    ) {
      return;
    }

    setSavingRowId(entry.id);
    try {
      const res = await fetch(`/api/admin/finance/${entry.id}`, { method: 'DELETE' });
      if (!res.ok) {
        showToast('Erro ao excluir lançamento.', 'error');
        return;
      }
      setEntries((prev) => prev.filter((item) => item.id !== entry.id));
      showToast('Lançamento removido da planilha.', 'info');
    } catch {
      showToast('Erro ao excluir lançamento.', 'error');
    } finally {
      setSavingRowId(null);
    }
  };

  const handleCreateColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnName.trim()) {
      showToast('Digite o nome da nova coluna.', 'error');
      return;
    }
    setSavingColumn(true);
    try {
      const res = await fetch('/api/admin/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_column',
          name: newColumnName.trim(),
          column_type: newColumnType,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Erro ao criar coluna.', 'error');
        return;
      }
      setCustomColumns((prev) => [...prev, data.column as FinancialCustomColumn]);
      setNewColumnName('');
      setNewColumnType('text');
      setShowColumnModal(false);
      showToast('Nova coluna adicionada à planilha!', 'success');
    } catch {
      showToast('Erro ao criar coluna personalizada.', 'error');
    } finally {
      setSavingColumn(false);
    }
  };

  const handleDeleteColumn = async (col: FinancialCustomColumn) => {
    if (
      !window.confirm(
        `Remover a coluna personalizada "${col.name}" da planilha?`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/finance/${col.id}?target=column`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        showToast('Erro ao remover coluna.', 'error');
        return;
      }
      setCustomColumns((prev) => prev.filter((c) => c.id !== col.id));
      showToast(`Coluna "${col.name}" removida.`, 'info');
    } catch {
      showToast('Erro ao remover coluna.', 'error');
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'Data',
      'Hora',
      'Tipo',
      'Origem',
      'Descricao',
      'Vinculo Loja',
      'Categoria',
      'Pagamento',
      'Valor Bruto (R$)',
      'Custo da Venda (R$)',
      'Lucro Liquido (R$)',
// etapa 27/85
