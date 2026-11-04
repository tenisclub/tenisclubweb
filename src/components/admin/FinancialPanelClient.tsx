'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
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
  Sun,
  Moon,
  SlidersHorizontal,
  Receipt,
  CreditCard,
  Percent,
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

  // Scoped theme exclusively for the Financial Panel (defaults to Light theme, never touches storefront)
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('tc_finance_theme');
      if (saved === 'dark' || saved === 'light') {
        setTheme(saved);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const toggleTheme = (next: 'light' | 'dark') => {
    setTheme(next);
    try {
      window.localStorage.setItem('tc_finance_theme', next);
    } catch {
      // ignore
    }
  };

  const isLight = theme === 'light';

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

  const [selectedDatePage, setSelectedDatePage] = useState<string>(() => {
    if (initialEntries.length > 0 && initialEntries[0].entry_date) {
      return initialEntries[0].entry_date.slice(0, 10);
    }
    return todayYmd;
  });

  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [jumpDateInput, setJumpDateInput] = useState('');

  // New entry form state
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

  // Quick inline add bar at bottom of spreadsheet
  const [quickType, setQuickType] = useState<FinancialEntryType>('expense');
  const [quickDesc, setQuickDesc] = useState('');
  const [quickStore, setQuickStore] = useState('Tênis Club — Loja Online');
  const [quickAmount, setQuickAmount] = useState('');
  const [quickCost, setQuickCost] = useState('');
  const [savingQuick, setSavingQuick] = useState(false);

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

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickDesc.trim()) {
      showToast('Digite a descrição do lançamento rápido.', 'error');
      return;
    }
    const numAmount = Number(String(quickAmount).replace(',', '.')) || 0;
    const numCost = Number(String(quickCost).replace(',', '.')) || 0;

    setSavingQuick(true);
    try {
      const nowIso = getNowLocalInputValue(selectedDatePage);
      const occurredIso = new Date(nowIso).toISOString();
      const entryDateYmd = selectedDatePage !== 'all' ? selectedDatePage : todayYmd;

      const res = await fetch('/api/admin/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry_type: quickType,
          description: quickDesc.trim(),
          category: quickType === 'income' ? 'Entrada Loja' : 'Saída / Custo',
          store_link: quickStore.trim() || 'Tênis Club — Loja Online',
          amount: numAmount,
          cost_amount: quickType === 'income' ? numCost : 0,
          payment_method: 'Pix',
          occurred_at: occurredIso,
          entry_date: entryDateYmd,
          custom_values: {},
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Erro ao adicionar linha.', 'error');
        return;
      }

      const created = data.entry as FinancialEntry;
      setEntries((prev) => [created, ...prev]);
      setQuickDesc('');
      setQuickAmount('');
      setQuickCost('');
      showToast('Linha adicionada à planilha!', 'success');
    } catch {
      showToast('Erro ao salvar linha rápida.', 'error');
    } finally {
      setSavingQuick(false);
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
    if (!window.confirm(`Remover a coluna personalizada "${col.name}" da planilha?`)) {
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
      ...customColumns.map((c) => c.name),
    ];

    const rows = pageEntries.map((e) => {
      const dt = formatDateTimeDisplay(e.occurred_at);
      const amt = Number(e.amount) || 0;
      const cost = Number(e.cost_amount) || 0;
      const net = e.entry_type === 'income' ? amt - cost : -(amt + cost);
      return [
        dt.date,
        dt.time,
        e.entry_type === 'income' ? 'Entrada' : 'Saída',
        e.source_type === 'order_sale' ? 'Venda Automática' : 'Manual',
        `"${(e.description || '').replace(/"/g, '""')}"`,
        `"${(e.store_link || '').replace(/"/g, '""')}"`,
        `"${(e.category || '').replace(/"/g, '""')}"`,
        `"${(e.payment_method || '').replace(/"/g, '""')}"`,
        amt.toFixed(2).replace('.', ','),
        cost.toFixed(2).replace('.', ','),
        net.toFixed(2).replace('.', ','),
        ...customColumns.map(
          (c) => `"${String(e.custom_values?.[c.column_key] || '').replace(/"/g, '""')}"`
        ),
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `planilha-financeira-${selectedDatePage === 'all' ? 'completa' : selectedDatePage}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const activePageLabel =
    selectedDatePage === 'all'
      ? 'Todas as Datas'
      : formatDatePageTab(selectedDatePage, todayYmd).title;

  return (
    <div
      style={{ zoom: 0.85 }}
      className={cn(
        '-m-3.5 sm:-m-6 lg:-m-8 min-h-[calc(118dvh-4rem)] p-3.5 sm:p-5 lg:p-6 transition-colors duration-200 space-y-4',
        isLight
          ? 'bg-[#F8FAFC] text-slate-800'
          : 'bg-[#0E0E12] text-zinc-100'
      )}
    >
      {/* Top Action Toolbar (Texts removed as requested) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Theme Switcher (Scoped only to Painel Financeiro) */}
        <div
          className={cn(
            'inline-flex items-center rounded-xl p-0.5 border',
            isLight
              ? 'bg-white border-slate-200 shadow-2xs'
              : 'bg-zinc-900 border-zinc-800'
          )}
          title="Alternar tema apenas do Painel Financeiro"
        >
          <button
            type="button"
            onClick={() => toggleTheme('light')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all',
              isLight
                ? 'bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs'
                : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <Sun className="h-3.5 w-3.5 text-amber-500" />
            Claro
          </button>
          <button
            type="button"
            onClick={() => toggleTheme('dark')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all',
              !isLight
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            )}
          >
            <Moon className="h-3.5 w-3.5 text-indigo-500" />
            Escuro
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => openNewEntryForm('income')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-emerald-700 active:scale-[0.99]"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            Nova Entrada
          </button>

          <button
            type="button"
            onClick={() => openNewEntryForm('expense')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-rose-700 active:scale-[0.99]"
          >
            <TrendingDown className="h-3.5 w-3.5 stroke-[2.5]" />
            Nova Saída
          </button>

          <button
            type="button"
            onClick={() => setShowColumnModal(true)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all',
              isLight
                ? 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                : 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20'
            )}
          >
            <Columns3 className="h-3.5 w-3.5" />
            + Nova Coluna
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all',
              isLight
                ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs'
                : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
            )}
            title="Baixar planilha em formato Excel (.CSV)"
          >
            <Download className="h-3.5 w-3.5" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* KPI Cards Row (Compact & Proportional) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Entradas Brutas */}
        <div
          className={cn(
            'relative overflow-hidden rounded-xl border p-3.5 transition-all',
            isLight
              ? 'bg-white border-slate-200/90 shadow-2xs'
              : 'bg-zinc-900/90 border-zinc-800'
          )}
        >
          <div className="flex items-center justify-between">
            <span
              className={cn(
                'text-[11px] font-bold uppercase tracking-wider',
                isLight ? 'text-slate-500' : 'text-zinc-400'
              )}
            >
              Entradas Brutas
            </span>
            <span
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-lg border',
                isLight
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              )}
            >
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
          <p
            className={cn(
              'mt-1.5 text-xl font-extrabold tracking-tight tabular-nums',
              isLight ? 'text-emerald-600' : 'text-emerald-400'
            )}
          >
            {formatCurrency(metrics.grossIncome)}
          </p>
          <div className="mt-1 flex items-center justify-between text-[11px]">
            <span className={isLight ? 'text-slate-500' : 'text-zinc-400'}>
              {metrics.incomeCount}{' '}
              {metrics.incomeCount === 1 ? 'entrada registrada' : 'entradas registradas'}
            </span>
            <span
              className={cn(
                'font-semibold',
                isLight ? 'text-slate-700' : 'text-zinc-300'
              )}
            >
              {activePageLabel}
            </span>
          </div>
        </div>

        {/* Card 2: Custo das Vendas */}
        <div
          className={cn(
            'relative overflow-hidden rounded-xl border p-3.5 transition-all',
            isLight
              ? 'bg-white border-amber-200/90 shadow-2xs'
              : 'bg-zinc-900/90 border-amber-500/25'
          )}
        >
          <div className="flex items-center justify-between">
            <span
              className={cn(
                'text-[11px] font-bold uppercase tracking-wider',
                isLight ? 'text-amber-800' : 'text-amber-300'
              )}
            >
              Custo das Vendas
            </span>
            <span
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-lg border',
                isLight
                  ? 'bg-amber-50 border-amber-200 text-amber-600'
                  : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
              )}
            >
              <Package className="h-4 w-4" />
            </span>
          </div>
          <p
            className={cn(
              'mt-1.5 text-xl font-extrabold tracking-tight tabular-nums',
              isLight ? 'text-amber-600' : 'text-amber-400'
            )}
          >
            {formatCurrency(metrics.salesCost)}
          </p>
          <p
            className={cn(
              'mt-1 text-[11px]',
              isLight ? 'text-slate-500' : 'text-zinc-400'
            )}
          >
            Quanto foi gasto para realizar as vendas
          </p>
        </div>

        {/* Card 3: Saídas / Despesas */}
        <div
          className={cn(
            'relative overflow-hidden rounded-xl border p-3.5 transition-all',
            isLight
              ? 'bg-white border-slate-200/90 shadow-2xs'
              : 'bg-zinc-900/90 border-zinc-800'
          )}
        >
          <div className="flex items-center justify-between">
            <span
              className={cn(
                'text-[11px] font-bold uppercase tracking-wider',
                isLight ? 'text-slate-500' : 'text-zinc-400'
              )}
            >
              Saídas & Despesas
            </span>
            <span
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-lg border',
                isLight
                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
              )}
            >
              <ArrowDownRight className="h-4 w-4" />
            </span>
          </div>
          <p
            className={cn(
              'mt-1.5 text-xl font-extrabold tracking-tight tabular-nums',
              isLight ? 'text-rose-600' : 'text-rose-400'
            )}
          >
            {formatCurrency(metrics.totalExpenses)}
          </p>
          <p
            className={cn(
              'mt-1 text-[11px]',
              isLight ? 'text-slate-500' : 'text-zinc-400'
            )}
          >
            {metrics.expenseCount}{' '}
            {metrics.expenseCount === 1 ? 'saída lançada nesta página' : 'saídas lançadas nesta página'}
          </p>
        </div>

        {/* Card 4: Lucro Líquido Real */}
        <div
          className={cn(
            'relative overflow-hidden rounded-xl border p-3.5 transition-all',
            metrics.netProfit >= 0
              ? isLight
                ? 'bg-emerald-50/70 border-emerald-200 text-slate-900 shadow-2xs'
                : 'bg-zinc-950 border-[#BEFA46]/40 text-white shadow-sm'
              : isLight
                ? 'bg-rose-50/80 border-rose-200 text-slate-900 shadow-2xs'
                : 'bg-rose-950/60 border-rose-500/40 text-white shadow-sm'
          )}
        >
          <div className="flex items-center justify-between">
            <span
              className={cn(
                'text-[11px] font-bold uppercase tracking-wider',
                metrics.netProfit >= 0
                  ? isLight
                    ? 'text-emerald-900'
                    : 'text-slate-300'
                  : isLight
                    ? 'text-rose-900'
                    : 'text-slate-300'
              )}
            >
              Lucro Líquido Real
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold',
                metrics.netProfit >= 0
                  ? isLight
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#BEFA46] text-slate-950'
                  : 'bg-rose-600 text-white'
              )}
            >
              <Percent className="h-2.5 w-2.5" />
              Margem {metrics.marginPercent.toFixed(1)}%
            </span>
          </div>
          <p
            className={cn(
              'mt-1.5 text-xl font-extrabold tracking-tight tabular-nums',
              metrics.netProfit >= 0
                ? isLight
                  ? 'text-emerald-700'
                  : 'text-[#BEFA46]'
                : isLight
                  ? 'text-rose-600'
                  : 'text-rose-300'
            )}
          >
            {formatCurrency(metrics.netProfit)}
          </p>
          <p
            className={cn(
              'mt-1 text-[11px]',
              isLight ? 'text-slate-600' : 'text-slate-300'
            )}
          >
            Entradas − Custo das Vendas − Saídas
          </p>
        </div>
      </div>

      {/* Modal / Expandable Card: Cadastrar Entrada ou Saída Completa */}
      {showEntryForm && (
        <form
          onSubmit={handleCreateEntry}
          className={cn(
            'rounded-2xl border p-5 sm:p-6 shadow-lg transition-all',
            isLight
              ? 'bg-white border-slate-300 text-slate-900'
              : 'bg-zinc-900 border-zinc-700 text-zinc-100'
          )}
        >
          <div
            className={cn(
              'mb-5 flex flex-wrap items-center justify-between gap-3 border-b pb-4',
              isLight ? 'border-slate-200' : 'border-zinc-800'
            )}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl',
                  formType === 'income'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-rose-100 text-rose-700'
                )}
              >
                {formType === 'income' ? (
                  <TrendingUp className="h-5 w-5" />
                ) : (
                  <TrendingDown className="h-5 w-5" />
                )}
              </span>
              <div>
                <h2 className="text-base font-extrabold">
                  {formType === 'income'
                    ? 'Nova Entrada Financeira na Loja'
                    : 'Nova Saída / Despesa da Loja'}
                </h2>
                <p className={cn('text-xs', isLight ? 'text-slate-500' : 'text-zinc-400')}>
                  Preencha os dados abaixo para adicionar o registro na página da data correspondente
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'inline-flex rounded-xl p-1 border',
                  isLight ? 'bg-slate-100 border-slate-200' : 'bg-zinc-950 border-zinc-800'
                )}
              >
                <button
                  type="button"
                  onClick={() => {
                    setFormType('income');
                    setFormCategory('Venda de Produto');
                  }}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-bold transition-all',
                    formType === 'income'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : isLight
                        ? 'text-slate-600 hover:text-slate-900'
                        : 'text-zinc-400 hover:text-white'
                  )}
                >
                  Entrada (+)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormType('expense');
                    setFormCategory('Compra de Mercadoria / Fornecedor');
                  }}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-bold transition-all',
                    formType === 'expense'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : isLight
                        ? 'text-slate-600 hover:text-slate-900'
                        : 'text-zinc-400 hover:text-white'
                  )}
                >
                  Saída (−)
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowEntryForm(false)}
                className={cn(
                  'rounded-xl p-2 transition-colors',
                  isLight
                    ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                )}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="md:col-span-5">
              <label
                className={cn(
                  'mb-1.5 block text-xs font-bold',
                  isLight ? 'text-slate-700' : 'text-zinc-300'
                )}
              >
                Descrição (O que foi essa {formType === 'income' ? 'entrada' : 'saída'}?) *
              </label>
              <input
                type="text"
                required
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder={
                  formType === 'income'
                    ? 'Ex.: Venda presencial Nike Air Force 1 Tam. 40'
                    : 'Ex.: Pagamento fornecedor 10 pares / Compra de sacolas'
                }
                className={cn(
                  'w-full rounded-xl border px-3.5 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2',
                  isLight
                    ? 'border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:ring-slate-900/10'
                    : 'border-zinc-700 bg-zinc-950 text-white placeholder-zinc-500 focus:border-[#BEFA46] focus:ring-[#BEFA46]/20'
                )}
              />
            </div>

            <div className="md:col-span-3">
              <label
                className={cn(
                  'mb-1.5 block text-xs font-bold',
                  isLight ? 'text-slate-700' : 'text-zinc-300'
                )}
              >
                Data e Hora *
              </label>
              <input
                type="datetime-local"
                required
                value={formOccurredAt}
                onChange={(e) => setFormOccurredAt(e.target.value)}
                className={cn(
                  'w-full rounded-xl border px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2',
                  isLight
                    ? 'border-slate-300 bg-white text-slate-900 focus:border-slate-900 focus:ring-slate-900/10'
                    : 'border-zinc-700 bg-zinc-950 text-white focus:border-[#BEFA46] focus:ring-[#BEFA46]/20'
                )}
              />
            </div>

            <div className="md:col-span-2">
              <label
                className={cn(
                  'mb-1.5 block text-xs font-bold',
                  isLight ? 'text-slate-700' : 'text-zinc-300'
                )}
              >
                {formType === 'income' ? 'Valor Bruto (R$) *' : 'Valor da Saída (R$) *'}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="0,00"
                className={cn(
                  'w-full rounded-xl border px-3 py-2.5 text-sm font-bold transition-colors focus:outline-none focus:ring-2',
                  isLight
                    ? 'border-slate-300 bg-white text-slate-900 focus:border-slate-900 focus:ring-slate-900/10'
                    : 'border-zinc-700 bg-zinc-950 text-white focus:border-[#BEFA46] focus:ring-[#BEFA46]/20'
                )}
              />
            </div>

            {formType === 'income' && (
              <div className="md:col-span-2">
                <label
                  className={cn(
                    'mb-1.5 block text-xs font-bold',
                    isLight ? 'text-amber-800' : 'text-amber-300'
                  )}
                >
                  Custo desta Venda (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formCostAmount}
                  onChange={(e) => setFormCostAmount(e.target.value)}
                  placeholder="Quanto gastou?"
                  className={cn(
                    'w-full rounded-xl border px-3 py-2.5 text-sm font-bold transition-colors focus:outline-none focus:ring-2',
                    isLight
                      ? 'border-amber-300 bg-amber-50/60 text-amber-900 placeholder-amber-400 focus:border-amber-500 focus:ring-amber-500/20'
                      : 'border-amber-500/40 bg-zinc-950 text-amber-300 placeholder-zinc-500 focus:border-amber-400 focus:ring-amber-400/20'
                  )}
                />
              </div>
            )}

            <div className="md:col-span-3">
              <label
                className={cn(
                  'mb-1.5 block text-xs font-bold',
                  isLight ? 'text-slate-700' : 'text-zinc-300'
                )}
              >
                Vínculo com a Loja
              </label>
              <input
                type="text"
                list="store-link-presets"
                value={formStoreLink}
                onChange={(e) => setFormStoreLink(e.target.value)}
                placeholder="Tênis Club — Loja Online"
                className={cn(
                  'w-full rounded-xl border px-3 py-2 text-xs transition-colors focus:outline-none',
                  isLight
                    ? 'border-slate-300 bg-white text-slate-900 focus:border-slate-900'
                    : 'border-zinc-700 bg-zinc-950 text-white focus:border-[#BEFA46]'
                )}
              />
              <datalist id="store-link-presets">
                {STORE_LINK_PRESETS.map((preset) => (
                  <option key={preset} value={preset} />
                ))}
              </datalist>
            </div>

            <div className="md:col-span-3">
              <label
                className={cn(
                  'mb-1.5 block text-xs font-bold',
                  isLight ? 'text-slate-700' : 'text-zinc-300'
                )}
              >
                Categoria
              </label>
              <input
                type="text"
                list="category-presets"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className={cn(
                  'w-full rounded-xl border px-3 py-2 text-xs transition-colors focus:outline-none',
                  isLight
                    ? 'border-slate-300 bg-white text-slate-900 focus:border-slate-900'
                    : 'border-zinc-700 bg-zinc-950 text-white focus:border-[#BEFA46]'
                )}
              />
              <datalist id="category-presets">
                {(formType === 'income' ? CATEGORY_PRESETS_INCOME : CATEGORY_PRESETS_EXPENSE).map(
                  (cat) => (
                    <option key={cat} value={cat} />
                  )
                )}
              </datalist>
            </div>

            <div className="md:col-span-3">
              <label
                className={cn(
                  'mb-1.5 block text-xs font-bold',
                  isLight ? 'text-slate-700' : 'text-zinc-300'
                )}
              >
                Vincular a Produto (opcional)
              </label>
              <select
                value={formProductId}
                onChange={(e) => {
                  const pid = e.target.value;
                  setFormProductId(pid);
                  const found = products.find((p) => p.id === pid);
                  if (found && formType === 'income' && !formAmount) {
                    setFormAmount(String(found.promo_price ?? found.base_price ?? ''));
                    if (found.cost_price && !formCostAmount) {
                      setFormCostAmount(String(found.cost_price));
                    }
                  }
                }}
                className={cn(
                  'w-full rounded-xl border px-3 py-2 text-xs transition-colors focus:outline-none',
                  isLight
                    ? 'border-slate-300 bg-white text-slate-900 focus:border-slate-900'
                    : 'border-zinc-700 bg-zinc-950 text-white focus:border-[#BEFA46]'
                )}
              >
                <option value="">Sem produto específico (Geral da Loja)</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.sku ? `(${p.sku})` : ''} —{' '}
                    {formatCurrency(p.promo_price ?? p.base_price)}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <label
                className={cn(
                  'mb-1.5 block text-xs font-bold',
                  isLight ? 'text-slate-700' : 'text-zinc-300'
                )}
              >
                Forma de Pagamento
              </label>
              <input
                type="text"
                value={formPaymentMethod}
                onChange={(e) => setFormPaymentMethod(e.target.value)}
                placeholder="Ex.: Pix, Cartão, Dinheiro"
                className={cn(
                  'w-full rounded-xl border px-3 py-2 text-xs transition-colors focus:outline-none',
                  isLight
                    ? 'border-slate-300 bg-white text-slate-900 focus:border-slate-900'
                    : 'border-zinc-700 bg-zinc-950 text-white focus:border-[#BEFA46]'
                )}
              />
            </div>

            {customColumns.length > 0 && (
              <div
                className={cn(
                  'md:col-span-12 border-t pt-4',
                  isLight ? 'border-slate-200' : 'border-zinc-800'
                )}
              >
                <p
                  className={cn(
                    'mb-2.5 text-xs font-bold uppercase tracking-wider',
                    isLight ? 'text-slate-500' : 'text-zinc-400'
                  )}
                >
                  Colunas Personalizadas (opcional)
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {customColumns.map((col) => (
                    <div key={col.id}>
                      <label
                        className={cn(
                          'mb-1 block text-xs font-semibold',
                          isLight ? 'text-slate-700' : 'text-zinc-300'
                        )}
                      >
                        {col.name}
                      </label>
                      <input
                        type={col.column_type === 'number' ? 'number' : 'text'}
                        value={formCustomValues[col.column_key] || ''}
                        onChange={(e) =>
                          setFormCustomValues((prev) => ({
                            ...prev,
                            [col.column_key]: e.target.value,
                          }))
                        }
                        placeholder={`Preencher ${col.name}...`}
                        className={cn(
                          'w-full rounded-lg border px-3 py-1.5 text-xs focus:outline-none',
                          isLight
                            ? 'border-slate-300 bg-white text-slate-900 focus:border-slate-900'
                            : 'border-zinc-700 bg-zinc-950 text-white focus:border-[#BEFA46]'
                        )}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div
            className={cn(
              'mt-5 flex items-center justify-end gap-2.5 border-t pt-4',
              isLight ? 'border-slate-200' : 'border-zinc-800'
            )}
          >
            <button
              type="button"
              onClick={() => setShowEntryForm(false)}
              className={cn(
                'rounded-xl border px-4 py-2 text-xs font-bold transition-colors',
                isLight
                  ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  : 'border-zinc-700 text-zinc-300 hover:bg-zinc-800'
              )}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={savingEntry}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
            >
              {savingEntry ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Salvar na Planilha
            </button>
          </div>
        </form>
      )}

      {/* Modal: Nova Coluna Personalizada */}
      {showColumnModal && (
        <form
          onSubmit={handleCreateColumn}
          className={cn(
            'rounded-2xl border p-5 shadow-lg',
            isLight
              ? 'bg-white border-indigo-200 text-slate-900'
              : 'bg-zinc-900 border-indigo-500/40 text-zinc-100'
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold">
                Adicionar Nova Coluna Personalizada
              </h3>
              <p className={cn('mt-0.5 text-xs', isLight ? 'text-slate-500' : 'text-zinc-400')}>
                Crie colunas extras do seu interesse (ex.: Fornecedor, Taxa Maquininha, Motoboy, Observação). Elas não são preenchidas automaticamente nas vendas e ficam livres para edição manual.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowColumnModal(false)}
              className="rounded-lg p-1 text-slate-400 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label
                className={cn(
                  'mb-1 block text-xs font-bold',
                  isLight ? 'text-slate-700' : 'text-zinc-300'
                )}
              >
                Nome da Coluna *
              </label>
              <input
                type="text"
                required
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                placeholder="Ex.: Fornecedor, Taxa Cartão, Entregador, Comissão..."
                className={cn(
                  'w-full rounded-xl border px-3.5 py-2 text-sm focus:outline-none',
                  isLight
                    ? 'border-slate-300 bg-white text-slate-900 focus:border-indigo-600'
                    : 'border-zinc-700 bg-zinc-950 text-white focus:border-indigo-400'
                )}
              />
            </div>

            <div className="sm:w-48">
              <label
                className={cn(
                  'mb-1 block text-xs font-bold',
                  isLight ? 'text-slate-700' : 'text-zinc-300'
                )}
              >
                Tipo de Dado
              </label>
              <select
                value={newColumnType}
                onChange={(e) => setNewColumnType(e.target.value as FinancialCustomColumnType)}
                className={cn(
                  'w-full rounded-xl border px-3 py-2 text-sm focus:outline-none',
                  isLight
                    ? 'border-slate-300 bg-white text-slate-900 focus:border-indigo-600'
                    : 'border-zinc-700 bg-zinc-950 text-white focus:border-indigo-400'
                )}
              >
                <option value="text">Texto Livre</option>
                <option value="currency">Valor em R$</option>
                <option value="number">Número</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={savingColumn}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
            >
              {savingColumn ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Criar Coluna
            </button>
          </div>
        </form>
      )}

      {/* Spreadsheet Container (Date Pages Header + Filter Bar + Grid Table) */}
      <div
        className={cn(
          'overflow-hidden rounded-2xl border shadow-sm',
          isLight ? 'bg-white border-slate-200/90' : 'bg-zinc-900 border-zinc-800'
        )}
      >
        {/* Top Sheet Tabs Bar (Páginas da Planilha Separadas por Data) */}
        <div
          className={cn(
            'border-b px-4 pt-3.5 pb-3',
            isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-zinc-950/60 border-zinc-800'
          )}
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileSpreadsheet
                className={cn('h-4 w-4', isLight ? 'text-emerald-600' : 'text-[#BEFA46]')}
              />
              <span
                className={cn(
                  'text-xs font-extrabold uppercase tracking-wider',
                  isLight ? 'text-slate-700' : 'text-zinc-200'
                )}
              >
                Páginas da Planilha por Data
              </span>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                  isLight
                    ? 'bg-slate-200/80 text-slate-700'
                    : 'bg-zinc-800 text-zinc-400'
                )}
              >
                {allDatePages.length} {allDatePages.length === 1 ? 'página' : 'páginas'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'text-xs font-medium',
                  isLight ? 'text-slate-500' : 'text-zinc-400'
                )}
              >
                Abrir página de data:
              </span>
              <input
                type="date"
                value={jumpDateInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setJumpDateInput(val);
                  if (val) handleOpenOrJumpDate(val);
                }}
                className={cn(
                  'rounded-lg border px-2.5 py-1 text-xs font-semibold focus:outline-none',
                  isLight
                    ? 'border-slate-300 bg-white text-slate-800 focus:border-slate-900'
                    : 'border-zinc-700 bg-zinc-900 text-white focus:border-[#BEFA46]'
                )}
              />
            </div>
          </div>

          {/* Horizontal Date Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {allDatePages.map((ymd) => {
              const { title, badge } = formatDatePageTab(ymd, todayYmd);
              const stat = datePageStats[ymd] || { count: 0, net: 0 };
              const isSelected = selectedDatePage === ymd;

              return (
                <button
                  key={ymd}
                  type="button"
                  onClick={() => setSelectedDatePage(ymd)}
                  className={cn(
                    'group flex shrink-0 items-center gap-2.5 rounded-xl border px-3.5 py-2 text-left transition-all',
                    isSelected
                      ? isLight
                        ? 'border-emerald-500 bg-emerald-50/90 text-emerald-950 shadow-2xs ring-2 ring-emerald-500/15'
                        : 'border-[#BEFA46] bg-[#BEFA46]/15 text-white'
                      : isLight
                        ? 'border-slate-200/90 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-100/70'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  )}
                >
                  <Calendar
                    className={cn(
                      'h-4 w-4 shrink-0',
                      isSelected
                        ? isLight
                          ? 'text-emerald-600'
                          : 'text-[#BEFA46]'
                        : isLight
                          ? 'text-slate-400 group-hover:text-slate-600'
                          : 'text-zinc-500'
                    )}
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold tracking-tight">{title}</span>
                      {badge && (
                        <span
                          className={cn(
                            'rounded-md px-1.5 py-0.2 text-[10px] font-extrabold uppercase',
                            isSelected
                              ? isLight
                                ? 'bg-emerald-600 text-white'
                                : 'bg-[#BEFA46] text-slate-950'
                              : isLight
                                ? 'bg-slate-200 text-slate-700'
                                : 'bg-zinc-800 text-zinc-300'
                          )}
                        >
                          {badge}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px]">
                      <span
                        className={
                          isSelected
                            ? isLight
                              ? 'text-emerald-800/80'
                              : 'text-slate-300'
                            : isLight
                              ? 'text-slate-500'
                              : 'text-zinc-500'
                        }
                      >
                        {stat.count} {stat.count === 1 ? 'item' : 'itens'}
                      </span>
                      {stat.count > 0 && (
                        <span
                          className={cn(
                            'font-bold tabular-nums',
                            stat.net >= 0
                              ? isSelected
                                ? isLight
                                  ? 'text-emerald-700'
                                  : 'text-[#BEFA46]'
                                : 'text-emerald-600'
                              : isSelected
                                ? isLight
                                  ? 'text-rose-600'
                                  : 'text-rose-300'
                                : 'text-rose-600'
                          )}
                        >
                          {stat.net >= 0 ? '+' : ''}
                          {formatCurrency(stat.net)}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setSelectedDatePage('all')}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-left transition-all',
                selectedDatePage === 'all'
                  ? isLight
                    ? 'border-emerald-500 bg-emerald-50/90 text-emerald-950 shadow-2xs ring-2 ring-emerald-500/15'
                    : 'border-[#BEFA46] bg-[#BEFA46]/15 text-white'
                  : isLight
                    ? 'border-slate-200/90 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-100/70'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
              )}
            >
              <div>
                <div className="text-xs font-bold">Todas as Datas</div>
                <div
                  className={cn(
                    'text-[10px]',
                    selectedDatePage === 'all'
                      ? isLight
                        ? 'text-emerald-800/80'
                        : 'text-slate-300'
                      : isLight
                        ? 'text-slate-500'
                        : 'text-zinc-500'
                  )}
                >
                  {entries.length} registros no total
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Filter & Search Sub-Toolbar */}
        <div
          className={cn(
            'flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
            isLight ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-800'
          )}
        >
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-bold transition-all',
                typeFilter === 'all'
                  ? isLight
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-[#BEFA46] text-slate-950'
                  : isLight
                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
              )}
            >
              Todos ({pageEntries.length})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('income')}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-bold transition-all',
                typeFilter === 'income'
                  ? 'bg-emerald-600 text-white'
                  : isLight
                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
              )}
            >
              Entradas ({metrics.incomeCount})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('expense')}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-bold transition-all',
                typeFilter === 'expense'
                  ? 'bg-rose-600 text-white'
                  : isLight
                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                    : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
              )}
            >
              Saídas ({metrics.expenseCount})
            </button>
          </div>

          <div className="relative w-full sm:w-80">
            <Search
              className={cn(
                'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2',
                isLight ? 'text-slate-400' : 'text-zinc-500'
              )}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar descrição, pedido, produto, loja..."
              className={cn(
                'w-full rounded-xl border py-1.5 pl-9 pr-3 text-xs transition-colors focus:outline-none',
                isLight
                  ? 'border-slate-300 bg-slate-50/70 text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:bg-white'
                  : 'border-zinc-700 bg-zinc-950 text-white placeholder-zinc-500 focus:border-[#BEFA46]'
              )}
            />
          </div>
        </div>

        {/* Spreadsheet Grid */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr
                className={cn(
                  'border-b text-[11px] font-bold uppercase tracking-wider',
                  isLight
                    ? 'bg-slate-100/90 border-slate-200 text-slate-600'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                )}
              >
                <th
                  className={cn(
                    'w-9 border-r px-2 py-2.5 text-center font-mono',
                    isLight ? 'border-slate-200/80 text-slate-400' : 'border-zinc-800 text-zinc-500'
                  )}
                >
                  #
                </th>
                <th
                  className={cn(
                    'w-28 border-r px-2.5 py-2.5',
                    isLight ? 'border-slate-200/80' : 'border-zinc-800'
                  )}
                >
                  Data & Hora
                </th>
                <th
                  className={cn(
                    'w-32 border-r px-2.5 py-2.5',
                    isLight ? 'border-slate-200/80' : 'border-zinc-800'
                  )}
                >
                  Tipo / Origem
                </th>
                <th
                  className={cn(
                    'min-w-[210px] border-r px-3 py-2.5',
                    isLight ? 'border-slate-200/80' : 'border-zinc-800'
                  )}
                >
                  Descrição da Entrada ou Saída
                </th>
                <th
                  className={cn(
                    'min-w-[155px] border-r px-2.5 py-2.5',
                    isLight ? 'border-slate-200/80' : 'border-zinc-800'
                  )}
                >
                  Vínculo com a Loja
                </th>
                <th
                  className={cn(
                    'w-32 border-r px-2.5 py-2.5 text-right',
                    isLight ? 'border-slate-200/80' : 'border-zinc-800'
                  )}
                >
                  Valor Bruto (R$)
                </th>
                <th
                  className={cn(
                    'w-36 border-r px-2.5 py-2.5 text-right',
                    isLight
                      ? 'bg-amber-50/90 border-amber-200/80 text-amber-900'
                      : 'bg-amber-500/10 border-zinc-800 text-amber-300'
                  )}
                >
                  <div>Custo da Venda (R$)</div>
                  <div
                    className={cn(
                      'text-[9px] font-medium normal-case',
                      isLight ? 'text-amber-700' : 'text-amber-300/75'
                    )}
                  >
                    Quanto gastei p/ vender
                  </div>
                </th>
                <th
                  className={cn(
                    'w-32 border-r px-2.5 py-2.5 text-right',
                    isLight
                      ? 'bg-emerald-50/60 border-slate-200/80 text-emerald-950'
                      : 'bg-emerald-500/5 border-zinc-800 text-[#BEFA46]'
                  )}
                >
                  <div>Lucro Real</div>
                  <div
                    className={cn(
                      'text-[9px] font-medium normal-case',
                      isLight ? 'text-emerald-700' : 'text-zinc-400'
                    )}
                  >
                    Resultado líquido
                  </div>
                </th>

                {customColumns.map((col) => (
                  <th
                    key={col.id}
                    className={cn(
                      'min-w-[155px] border-r px-3 py-3',
                      isLight
                        ? 'bg-indigo-50/50 border-slate-200/80 text-indigo-950'
                        : 'bg-indigo-950/20 border-zinc-800 text-indigo-200'
                    )}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="truncate" title={col.name}>
                        {col.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteColumn(col)}
                        className={cn(
                          'rounded p-0.5 transition-colors',
                          isLight
                            ? 'text-slate-400 hover:bg-rose-100 hover:text-rose-600'
                            : 'text-zinc-500 hover:bg-rose-500/20 hover:text-rose-400'
                        )}
                        title={`Remover coluna "${col.name}"`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div
                      className={cn(
                        'text-[9px] font-medium normal-case',
                        isLight ? 'text-indigo-600/80' : 'text-indigo-400/70'
                      )}
                    >
                      Coluna personalizada
                    </div>
                  </th>
                ))}

                <th className="w-12 px-2.5 py-3 text-center">Ações</th>
              </tr>
            </thead>

            <tbody
              className={cn(
                'divide-y',
                isLight ? 'divide-slate-200/80' : 'divide-zinc-800'
              )}
            >
              {pageEntries.length === 0 ? (
                <tr>
                  <td
                    colSpan={9 + customColumns.length}
                    className="px-6 py-14 text-center"
                  >
                    <div className="mx-auto max-w-md space-y-2">
                      <div
                        className={cn(
                          'mx-auto flex h-12 w-12 items-center justify-center rounded-2xl',
                          isLight ? 'bg-slate-100 text-slate-400' : 'bg-zinc-800 text-zinc-500'
                        )}
                      >
                        <FileSpreadsheet className="h-6 w-6" />
                      </div>
                      <p
                        className={cn(
                          'text-sm font-bold',
                          isLight ? 'text-slate-800' : 'text-white'
                        )}
                      >
                        Nenhum lançamento registrado nesta data ({activePageLabel})
                      </p>
                      <p
                        className={cn(
                          'text-xs',
                          isLight ? 'text-slate-500' : 'text-zinc-400'
                        )}
                      >
                        As vendas de produtos entram automaticamente aqui. Para registrar uma saída ou entrada manual agora, use a linha rápida abaixo ou clique em <strong>Nova Entrada / Nova Saída</strong>.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                pageEntries.map((entry, idx) => (
                  <SpreadsheetRow
                    key={entry.id}
                    rowNumber={idx + 1}
                    entry={entry}
                    customColumns={customColumns}
                    isLight={isLight}
                    isSaving={savingRowId === entry.id}
                    onUpdateField={handleUpdateEntryField}
                    onDelete={handleDeleteEntry}
                  />
                ))
              )}

              {/* Quick Inline Add Row at the bottom of the spreadsheet */}
              <tr
                className={cn(
                  'border-t-2',
                  isLight
                    ? 'bg-slate-50/90 border-slate-200'
                    : 'bg-zinc-950/60 border-zinc-800'
                )}
              >
                <td
                  className={cn(
                    'border-r px-3 py-2.5 text-center font-bold',
                    isLight ? 'border-slate-200 text-emerald-600' : 'border-zinc-800 text-[#BEFA46]'
                  )}
                >
                  +
                </td>
                <td
                  className={cn(
                    'border-r px-3.5 py-2.5 text-[11px] font-semibold',
                    isLight ? 'border-slate-200 text-slate-500' : 'border-zinc-800 text-zinc-400'
                  )}
                >
                  Lançamento Rápido
                </td>
                <td
                  className={cn(
                    'border-r px-2.5 py-2',
                    isLight ? 'border-slate-200' : 'border-zinc-800'
                  )}
                >
                  <select
                    value={quickType}
                    onChange={(e) => setQuickType(e.target.value as FinancialEntryType)}
                    className={cn(
                      'w-full rounded-lg border px-2 py-1.5 text-xs font-bold focus:outline-none',
                      quickType === 'income'
                        ? isLight
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                          : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                        : isLight
                          ? 'border-rose-300 bg-rose-50 text-rose-800'
                          : 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                    )}
                  >
                    <option value="income">Entrada (+)</option>
                    <option value="expense">Saída (−)</option>
                  </select>
                </td>
                <td
                  className={cn(
                    'border-r px-2.5 py-2',
                    isLight ? 'border-slate-200' : 'border-zinc-800'
                  )}
                >
                  <input
                    type="text"
                    value={quickDesc}
                    onChange={(e) => setQuickDesc(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleQuickAdd(e);
                    }}
                    placeholder="Digite a descrição da entrada ou saída rápida..."
                    className={cn(
                      'w-full rounded-lg border px-2.5 py-1.5 text-xs focus:outline-none',
                      isLight
                        ? 'border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:border-slate-900'
                        : 'border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500 focus:border-[#BEFA46]'
                    )}
                  />
                </td>
                <td
                  className={cn(
                    'border-r px-2.5 py-2',
                    isLight ? 'border-slate-200' : 'border-zinc-800'
                  )}
                >
                  <input
                    type="text"
                    list="store-link-presets"
                    value={quickStore}
                    onChange={(e) => setQuickStore(e.target.value)}
                    className={cn(
                      'w-full rounded-lg border px-2 py-1.5 text-xs focus:outline-none',
                      isLight
                        ? 'border-slate-300 bg-white text-slate-800 focus:border-slate-900'
                        : 'border-zinc-700 bg-zinc-900 text-zinc-200 focus:border-[#BEFA46]'
                    )}
                  />
                </td>
                <td
                  className={cn(
                    'border-r px-2.5 py-2',
                    isLight ? 'border-slate-200' : 'border-zinc-800'
                  )}
                >
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={quickAmount}
                    onChange={(e) => setQuickAmount(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleQuickAdd(e);
                    }}
                    placeholder="Valor R$"
                    className={cn(
                      'w-full rounded-lg border px-2 py-1.5 text-right text-xs font-bold focus:outline-none',
                      isLight
                        ? 'border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:border-slate-900'
                        : 'border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500 focus:border-[#BEFA46]'
                    )}
                  />
                </td>
                <td
                  className={cn(
                    'border-r px-2.5 py-2',
                    isLight ? 'bg-amber-50/40 border-slate-200' : 'bg-amber-500/5 border-zinc-800'
                  )}
                >
                  {quickType === 'income' ? (
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={quickCost}
                      onChange={(e) => setQuickCost(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleQuickAdd(e);
                      }}
                      placeholder="Custo R$"
                      className={cn(
                        'w-full rounded-lg border px-2 py-1.5 text-right text-xs font-bold focus:outline-none',
                        isLight
                          ? 'border-amber-300 bg-white text-amber-900 placeholder-amber-400 focus:border-amber-600'
                          : 'border-amber-500/40 bg-zinc-900 text-amber-300 placeholder-zinc-500'
                      )}
                    />
                  ) : (
                    <div className="text-right text-[11px] text-slate-400">—</div>
                  )}
                </td>
                <td
                  colSpan={1 + customColumns.length}
                  className={cn(
                    'border-r px-3 py-2 text-right',
                    isLight ? 'border-slate-200' : 'border-zinc-800'
                  )}
                >
                  <button
                    type="button"
                    disabled={savingQuick}
                    onClick={handleQuickAdd}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition-all',
                      quickType === 'income'
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-rose-600 hover:bg-rose-700'
                    )}
                  >
                    {savingQuick ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                    Adicionar Linha
                  </button>
                </td>
                <td />
              </tr>
            </tbody>

            {/* Spreadsheet Footer Totals */}
            {pageEntries.length > 0 && (
              <tfoot>
                <tr
                  className={cn(
                    'border-t-2 font-extrabold',
                    isLight
                      ? 'bg-slate-100 border-slate-300 text-slate-900'
                      : 'bg-zinc-950 border-zinc-700 text-white'
                  )}
                >
                  <td
                    colSpan={5}
                    className={cn(
                      'border-r px-4 py-3.5 text-right text-xs uppercase tracking-wider',
                      isLight
                        ? 'border-slate-200 text-slate-600'
                        : 'border-zinc-800 text-zinc-400'
                    )}
                  >
                    Totais da Página ({pageEntries.length}{' '}
                    {pageEntries.length === 1 ? 'registro' : 'registros'}):
                  </td>
                  <td
                    className={cn(
                      'border-r px-3.5 py-3.5 text-right tabular-nums',
                      isLight ? 'border-slate-200' : 'border-zinc-800'
                    )}
                  >
                    <div className={isLight ? 'text-emerald-700' : 'text-emerald-400'}>
                      +{formatCurrency(metrics.grossIncome)}
                    </div>
                    {metrics.totalExpenses > 0 && (
                      <div
                        className={cn(
                          'text-[11px]',
                          isLight ? 'text-rose-600' : 'text-rose-400'
                        )}
                      >
                        −{formatCurrency(metrics.totalExpenses)} saídas
                      </div>
                    )}
                  </td>
                  <td
                    className={cn(
                      'border-r px-3.5 py-3.5 text-right tabular-nums',
                      isLight
                        ? 'bg-amber-100/70 border-amber-200 text-amber-900'
                        : 'bg-amber-500/10 border-zinc-800 text-amber-300'
                    )}
                  >
                    {formatCurrency(metrics.salesCost)}
                  </td>
                  <td
                    className={cn(
                      'border-r px-3.5 py-3.5 text-right text-sm tabular-nums',
                      isLight ? 'border-slate-200' : 'border-zinc-800',
                      metrics.netProfit >= 0
                        ? isLight
                          ? 'bg-emerald-100/70 text-emerald-900'
                          : 'text-[#BEFA46]'
                        : isLight
                          ? 'bg-rose-100 text-rose-800'
                          : 'text-rose-400'
                    )}
                  >
                    {metrics.netProfit >= 0 ? '+' : ''}
                    {formatCurrency(metrics.netProfit)}
                  </td>
                  {customColumns.map((col) => (
                    <td
                      key={col.id}
                      className={cn(
                        'border-r px-3 py-3.5',
                        isLight ? 'border-slate-200' : 'border-zinc-800'
                      )}
                    />
                  ))}
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}

function SpreadsheetRow({
  rowNumber,
  entry,
  customColumns,
  isLight,
  isSaving,
  onUpdateField,
  onDelete,
}: {
  rowNumber: number;
  entry: FinancialEntry;
  customColumns: FinancialCustomColumn[];
  isLight: boolean;
  isSaving: boolean;
  onUpdateField: (id: string, updates: Record<string, unknown>, silent?: boolean) => Promise<void>;
  onDelete: (entry: FinancialEntry) => Promise<void>;
}) {
  const [desc, setDesc] = useState(entry.description || '');
  const [storeLink, setStoreLink] = useState(entry.store_link || 'Tênis Club — Loja Online');
  const [amountStr, setAmountStr] = useState(String(entry.amount ?? 0));
  const [costStr, setCostStr] = useState(String(entry.cost_amount ?? 0));
  const [editingDateTime, setEditingDateTime] = useState(false);
  const [dateTimeVal, setDateTimeVal] = useState(() => isoToLocalInputValue(entry.occurred_at));
  const [customVals, setCustomVals] = useState<Record<string, string>>(entry.custom_values || {});

  useEffect(() => {
    setDesc(entry.description || '');
    setStoreLink(entry.store_link || 'Tênis Club — Loja Online');
    setAmountStr(String(entry.amount ?? 0));
    setCostStr(String(entry.cost_amount ?? 0));
    setDateTimeVal(isoToLocalInputValue(entry.occurred_at));
    setCustomVals(entry.custom_values || {});
  }, [entry]);

  const dtDisplay = formatDateTimeDisplay(entry.occurred_at);
  const numericAmount = Number(String(amountStr).replace(',', '.')) || 0;
  const numericCost = Number(String(costStr).replace(',', '.')) || 0;
  const netResult =
    entry.entry_type === 'income'
      ? numericAmount - numericCost
      : -(numericAmount + numericCost);
  const profitMargin =
    entry.entry_type === 'income' && numericAmount > 0
      ? ((numericAmount - numericCost) / numericAmount) * 100
      : null;

  return (
    <tr
      className={cn(
        'group transition-colors',
        isLight ? 'hover:bg-slate-50/90' : 'hover:bg-zinc-800/40'
      )}
    >
      {/* Row # */}
      <td
        className={cn(
          'border-r px-2.5 py-3 text-center font-mono text-[11px]',
          isLight
            ? 'border-slate-200/80 bg-slate-50/50 text-slate-400'
            : 'border-zinc-800 bg-zinc-950/40 text-zinc-500'
        )}
      >
        {rowNumber}
      </td>

      {/* Data e Hora */}
      <td
        className={cn(
          'whitespace-nowrap border-r px-3.5 py-2.5 align-middle',
          isLight ? 'border-slate-200/80' : 'border-zinc-800'
        )}
      >
        {editingDateTime ? (
          <input
            type="datetime-local"
            value={dateTimeVal}
            onChange={(e) => setDateTimeVal(e.target.value)}
            onBlur={() => {
              setEditingDateTime(false);
              if (dateTimeVal) {
                const iso = new Date(dateTimeVal).toISOString();
                const ymd = dateTimeVal.slice(0, 10);
                onUpdateField(entry.id, { occurred_at: iso, entry_date: ymd }, true);
              }
            }}
            className={cn(
              'rounded-lg border px-2 py-1 text-[11px] focus:outline-none',
              isLight
                ? 'border-slate-900 bg-white text-slate-900'
                : 'border-[#BEFA46] bg-zinc-950 text-white'
            )}
            autoFocus
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingDateTime(true)}
            className="text-left group/dt"
            title="Clique para editar data e hora"
          >
            <div
              className={cn(
                'font-bold tabular-nums',
                isLight
                  ? 'text-slate-800 group-hover/dt:text-indigo-600'
                  : 'text-zinc-200 group-hover/dt:text-[#BEFA46]'
              )}
            >
              {dtDisplay.date}
            </div>
            <div
              className={cn(
                'mt-0.5 inline-flex items-center gap-1 text-[11px] tabular-nums',
                isLight ? 'text-slate-500' : 'text-zinc-400'
              )}
            >
              <Clock className="h-3 w-3 opacity-70" />
              {dtDisplay.time}
            </div>
          </button>
        )}
      </td>

      {/* Tipo / Origem */}
      <td
        className={cn(
          'whitespace-nowrap border-r px-3 py-2.5 align-middle',
          isLight ? 'border-slate-200/80' : 'border-zinc-800'
        )}
      >
        <div className="flex flex-col items-start gap-1">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
              entry.entry_type === 'income'
                ? isLight
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : isLight
                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                  : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
            )}
          >
            {entry.entry_type === 'income' ? 'Entrada' : 'Saída'}
          </span>

          {entry.source_type === 'order_sale' && entry.order ? (
            <Link
              href={`/admin/pedidos/${entry.order.id}`}
              className={cn(
                'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold transition-colors',
                isLight
                  ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                  : 'bg-indigo-500/15 text-indigo-300 hover:underline'
              )}
              title="Abrir detalhes do pedido"
            >
              <Sparkles className="h-2.5 w-2.5" />
              #{entry.order.order_number}
              <ExternalLink className="h-2.5 w-2.5" />
            </Link>
          ) : (
            <span
              className={cn(
                'text-[10px] font-medium',
                isLight ? 'text-slate-500' : 'text-zinc-500'
              )}
            >
              {entry.category}
            </span>
          )}
        </div>
      </td>

      {/* Descrição Editável */}
      <td
        className={cn(
          'border-r px-3 py-2.5 align-middle',
          isLight ? 'border-slate-200/80' : 'border-zinc-800'
        )}
      >
        <input
          type="text"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          onBlur={() => {
            if (desc.trim() && desc.trim() !== entry.description) {
              onUpdateField(entry.id, { description: desc.trim() }, true);
            } else {
              setDesc(entry.description);
            }
          }}
          placeholder="Descreva esta entrada/saída..."
          className={cn(
            'w-full rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-xs font-semibold transition-all focus:outline-none',
            isLight
              ? 'text-slate-900 hover:border-slate-300 hover:bg-white focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/15'
              : 'text-white hover:border-zinc-700 focus:border-[#BEFA46] focus:bg-zinc-950'
          )}
        />
        {entry.product && (
          <div
            className={cn(
              'mt-0.5 flex items-center gap-1 px-2 text-[11px]',
              isLight ? 'text-slate-500' : 'text-zinc-400'
            )}
          >
            <Package className="h-3 w-3 shrink-0 opacity-70" />
            <span>
              Produto:{' '}
              <strong className={isLight ? 'text-slate-700' : 'text-zinc-200'}>
                {entry.product.name}
              </strong>
            </span>
          </div>
        )}
      </td>

      {/* Vínculo com a Loja */}
      <td
        className={cn(
          'border-r px-3 py-2.5 align-middle',
          isLight ? 'border-slate-200/80' : 'border-zinc-800'
        )}
      >
        <div className="flex items-center gap-1.5">
          <Store
            className={cn(
              'h-3.5 w-3.5 shrink-0',
              isLight ? 'text-slate-400' : 'text-zinc-500'
            )}
          />
          <input
            type="text"
            list="store-link-presets"
            value={storeLink}
            onChange={(e) => setStoreLink(e.target.value)}
            onBlur={() => {
              if (storeLink.trim() && storeLink.trim() !== entry.store_link) {
                onUpdateField(entry.id, { store_link: storeLink.trim() }, true);
              } else {
                setStoreLink(entry.store_link);
              }
            }}
            className={cn(
              'w-full rounded-lg border border-transparent bg-transparent px-2 py-1 text-xs font-medium transition-all focus:outline-none',
              isLight
                ? 'text-slate-700 hover:border-slate-300 hover:bg-white focus:border-indigo-500 focus:bg-white'
                : 'text-zinc-300 hover:border-zinc-700 focus:border-[#BEFA46] focus:bg-zinc-950'
            )}
          />
        </div>
      </td>

      {/* Valor Bruto */}
      <td
        className={cn(
          'whitespace-nowrap border-r px-3 py-2.5 text-right align-middle',
          isLight ? 'border-slate-200/80' : 'border-zinc-800'
        )}
      >
        <div className="inline-flex items-center justify-end gap-1">
          <span
            className={cn(
              'text-[10px] font-bold',
              isLight ? 'text-slate-400' : 'text-zinc-500'
            )}
          >
            R$
          </span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            onBlur={() => {
              const parsed = Math.max(0, Number(String(amountStr).replace(',', '.')) || 0);
              if (parsed !== Number(entry.amount)) {
                onUpdateField(entry.id, { amount: parsed }, true);
              }
            }}
            className={cn(
              'w-24 rounded-lg border border-transparent bg-transparent px-2 py-1 text-right text-xs font-extrabold tabular-nums transition-all focus:outline-none',
              isLight
                ? 'hover:border-slate-300 hover:bg-white focus:border-indigo-500 focus:bg-white'
                : 'hover:border-zinc-700 focus:border-[#BEFA46] focus:bg-zinc-950',
              entry.entry_type === 'income'
                ? isLight
                  ? 'text-emerald-700'
                  : 'text-emerald-400'
                : isLight
                  ? 'text-rose-600'
                  : 'text-rose-400'
            )}
          />
        </div>
      </td>

      {/* Custo da Venda ("Quanto gastei pra fazer essa venda?") */}
      <td
        className={cn(
          'whitespace-nowrap border-r px-3.5 py-2.5 text-right align-middle',
          isLight
            ? 'bg-amber-50/45 border-amber-200/70'
            : 'bg-amber-500/5 border-zinc-800'
        )}
      >
        {entry.entry_type === 'income' ? (
          <div className="inline-flex items-center justify-end gap-1">
            <span
              className={cn(
                'text-[10px] font-bold',
                isLight ? 'text-amber-700/70' : 'text-amber-400/70'
              )}
            >
              R$
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={costStr}
              onChange={(e) => setCostStr(e.target.value)}
              onBlur={() => {
                const parsed = Math.max(0, Number(String(costStr).replace(',', '.')) || 0);
                if (parsed !== Number(entry.cost_amount)) {
                  onUpdateField(entry.id, { cost_amount: parsed }, true);
                }
              }}
              placeholder="0,00"
              title="Informe quanto você gastou para realizar esta venda"
              className={cn(
                'w-24 rounded-lg border px-2 py-1 text-right text-xs font-extrabold tabular-nums transition-all focus:outline-none',
                isLight
                  ? 'border-amber-300/90 bg-white text-amber-900 shadow-2xs hover:border-amber-400 focus:border-amber-600 focus:ring-2 focus:ring-amber-500/15'
                  : 'border-amber-500/30 bg-zinc-950 text-amber-300 hover:border-amber-400 focus:border-amber-400'
              )}
            />
          </div>
        ) : (
          <span className={cn('text-xs', isLight ? 'text-slate-400' : 'text-zinc-600')}>
            —
          </span>
        )}
      </td>

      {/* Lucro Real / Resultado */}
      <td
        className={cn(
          'whitespace-nowrap border-r px-3.5 py-2.5 text-right align-middle',
          isLight
            ? 'bg-emerald-50/25 border-slate-200/80'
            : 'border-zinc-800'
        )}
      >
        <div
          className={cn(
            'font-extrabold tabular-nums',
            netResult >= 0
              ? isLight
                ? 'text-emerald-700'
                : 'text-[#BEFA46]'
              : isLight
                ? 'text-rose-600'
                : 'text-rose-400'
          )}
        >
          {netResult >= 0 ? '+' : ''}
          {formatCurrency(netResult)}
        </div>
        {profitMargin !== null && (
          <div
            className={cn(
              'mt-0.5 inline-block rounded px-1.5 py-0.2 text-[10px] font-semibold',
              profitMargin >= 30
                ? isLight
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-emerald-500/15 text-emerald-300'
                : isLight
                  ? 'bg-slate-200 text-slate-700'
                  : 'bg-zinc-800 text-zinc-300'
            )}
          >
            Margem {profitMargin.toFixed(0)}%
          </div>
        )}
      </td>

      {/* Colunas Personalizadas pelo Usuário */}
      {customColumns.map((col) => {
        const val = customVals[col.column_key] ?? '';
        return (
          <td
            key={col.id}
            className={cn(
              'border-r px-2.5 py-2.5 align-middle',
              isLight ? 'border-slate-200/80' : 'border-zinc-800'
            )}
          >
            <input
              type={col.column_type === 'number' ? 'number' : 'text'}
              value={val}
              onChange={(e) =>
                setCustomVals((prev) => ({
                  ...prev,
                  [col.column_key]: e.target.value,
                }))
              }
              onBlur={() => {
                const prevVal = entry.custom_values?.[col.column_key] ?? '';
                if (val !== prevVal) {
                  const nextCustom = {
                    ...(entry.custom_values || {}),
                    [col.column_key]: val,
                  };
                  onUpdateField(entry.id, { custom_values: nextCustom }, true);
                }
              }}
              placeholder="Preencher..."
              className={cn(
                'w-full rounded-lg border border-transparent bg-transparent px-2 py-1 text-xs transition-all focus:outline-none',
                isLight
                  ? 'text-slate-800 placeholder-slate-300 hover:border-slate-300 hover:bg-white focus:border-indigo-500 focus:bg-white'
                  : 'text-zinc-200 placeholder-zinc-600 hover:border-zinc-700 focus:border-[#BEFA46] focus:bg-zinc-950'
              )}
            />
          </td>
        );
      })}

      {/* Ações */}
      <td className="px-2.5 py-2.5 text-center align-middle">
        {isSaving ? (
          <Loader2
            className={cn(
              'mx-auto h-4 w-4 animate-spin',
              isLight ? 'text-indigo-600' : 'text-[#BEFA46]'
            )}
          />
        ) : (
          <button
            type="button"
            onClick={() => onDelete(entry)}
            className={cn(
              'rounded-lg p-1.5 transition-colors',
              isLight
                ? 'text-slate-400 hover:bg-rose-50 hover:text-rose-600'
                : 'text-zinc-500 hover:bg-rose-500/15 hover:text-rose-400'
            )}
            title="Excluir lançamento"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </td>
    </tr>
  );
}
