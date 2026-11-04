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

  return (
    <div className="space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-neon/15 border border-neon/30 text-neon">
              <Wallet className="h-5 w-5" />
            </span>
            <div>
              <h1 className="font-display text-2xl font-black uppercase tracking-wider text-white sm:text-3xl">
                Painel Financeiro
              </h1>
              <p className="text-xs text-zinc-400 sm:text-sm">
                Planilha inteligente separada por data • Vendas entram automaticamente • Controle de custos, saídas e colunas personalizadas
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => openNewEntryForm('income')}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-dark-950 shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            Nova Entrada
          </button>

          <button
            type="button"
            onClick={() => openNewEntryForm('expense')}
            className="inline-flex items-center gap-2 rounded-xl bg-red-500/90 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-lg shadow-red-500/20 transition-all hover:bg-red-500"
          >
            <TrendingDown className="h-4 w-4 stroke-[2.5]" />
            Nova Saída
          </button>

          <button
            type="button"
            onClick={() => setShowColumnModal(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-neon/40 bg-neon/10 px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider text-neon transition-all hover:bg-neon/20"
          >
            <Columns3 className="h-4 w-4" />
            + Nova Coluna
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-xl border border-dark-700 bg-dark-900 px-3.5 py-2.5 text-xs font-bold text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
            title="Exportar página atual para Excel (.CSV)"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Date Pages Navigation Bar (Páginas da Planilha Separadas por Data) */}
      <div className="rounded-2xl border border-dark-700 bg-dark-900/90 p-3 sm:p-4">
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-neon" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-200">
              Páginas da Planilha por Data
            </span>
            <span className="rounded-full bg-dark-800 px-2 py-0.5 text-[11px] font-semibold text-zinc-400">
              {allDatePages.length} {allDatePages.length === 1 ? 'página' : 'páginas'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[11px] font-semibold text-zinc-400">Abrir/Criar página de data:</label>
            <input
              type="date"
              value={jumpDateInput}
              onChange={(e) => {
                const val = e.target.value;
                setJumpDateInput(val);
                if (val) handleOpenOrJumpDate(val);
              }}
              className="rounded-lg border border-dark-700 bg-dark-950 px-2.5 py-1 text-xs font-semibold text-white focus:border-neon focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
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
                  'group relative flex shrink-0 items-center gap-2.5 rounded-xl border px-3.5 py-2 text-left transition-all',
                  isSelected
                    ? 'border-neon bg-neon/15 text-white shadow-sm shadow-neon/10'
                    : 'border-dark-700 bg-dark-950/70 text-zinc-400 hover:border-dark-600 hover:text-zinc-200'
                )}
              >
                <Calendar
                  className={cn(
                    'h-4 w-4 shrink-0',
                    isSelected ? 'text-neon' : 'text-zinc-500 group-hover:text-zinc-300'
                  )}
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold tracking-tight">{title}</span>
                    {badge && (
                      <span
                        className={cn(
                          'rounded px-1.5 py-0.2 text-[10px] font-black uppercase',
                          isSelected
                            ? 'bg-neon text-dark-950'
                            : 'bg-dark-800 text-zinc-300'
                        )}
                      >
                        {badge}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="text-zinc-400">
                      {stat.count} {stat.count === 1 ? 'registro' : 'registros'}
                    </span>
                    {stat.count > 0 && (
                      <span
                        className={cn(
                          'font-bold',
                          stat.net >= 0 ? 'text-emerald-400' : 'text-red-400'
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
                ? 'border-neon bg-neon/15 text-white'
                : 'border-dark-700 bg-dark-950/70 text-zinc-400 hover:border-dark-600 hover:text-zinc-200'
            )}
          >
            <div>
              <div className="text-xs font-extrabold">Todas as Datas</div>
              <div className="text-[10px] text-zinc-400">{entries.length} registros no total</div>
            </div>
          </button>
        </div>
      </div>

      {/* KPI Cards for the Selected Date Page */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-emerald-500/25 bg-dark-900/90 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Entradas Brutas
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 font-display text-2xl font-black text-emerald-400">
            {formatCurrency(metrics.grossIncome)}
          </p>
          <p className="mt-1 text-[11px] text-zinc-400">
            {metrics.incomeCount} {metrics.incomeCount === 1 ? 'entrada registrada' : 'entradas registradas'} nesta página
          </p>
        </div>

        <div className="rounded-2xl border border-amber-500/25 bg-dark-900/90 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300/90">
              Custo das Vendas
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
              <Package className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 font-display text-2xl font-black text-amber-400">
            {formatCurrency(metrics.salesCost)}
          </p>
          <p className="mt-1 text-[11px] text-zinc-400">
            Quanto você gastou para realizar essas vendas
          </p>
        </div>

        <div className="rounded-2xl border border-red-500/25 bg-dark-900/90 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Saídas / Despesas da Loja
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/15 text-red-400">
              <ArrowDownRight className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 font-display text-2xl font-black text-red-400">
            {formatCurrency(metrics.totalExpenses)}
          </p>
          <p className="mt-1 text-[11px] text-zinc-400">
            {metrics.expenseCount} {metrics.expenseCount === 1 ? 'saída lançada' : 'saídas lançadas'} nesta página
          </p>
        </div>

        <div
          className={cn(
            'rounded-2xl border p-4',
            metrics.netProfit >= 0
              ? 'border-neon/35 bg-gradient-to-br from-dark-900 to-neon/5'
              : 'border-red-500/35 bg-gradient-to-br from-dark-900 to-red-500/5'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Lucro Líquido Real
            </span>
            <span
              className={cn(
                'rounded-md px-2 py-0.5 text-[10px] font-black uppercase',
                metrics.netProfit >= 0
                  ? 'bg-neon/20 text-neon'
                  : 'bg-red-500/20 text-red-400'
              )}
            >
              Margem {metrics.marginPercent.toFixed(1)}%
            </span>
          </div>
          <p
            className={cn(
              'mt-2 font-display text-2xl font-black',
              metrics.netProfit >= 0 ? 'text-neon' : 'text-red-400'
            )}
          >
            {formatCurrency(metrics.netProfit)}
          </p>
          <p className="mt-1 text-[11px] text-zinc-400">
            Entradas − Custo das Vendas − Saídas
          </p>
        </div>
      </div>

      {/* New Entry Inline Card (when opened) */}
      {showEntryForm && (
        <form
          onSubmit={handleCreateEntry}
          className="rounded-2xl border border-neon/40 bg-dark-900 p-5 shadow-2xl"
        >
          <div className="mb-4 flex items-center justify-between border-b border-dark-700 pb-3">
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black',
                  formType === 'income'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/20 text-red-400'
                )}
              >
                {formType === 'income' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              </span>
              <div>
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-white">
                  {formType === 'income'
                    ? 'Cadastrar Nova Entrada na Loja'
                    : 'Cadastrar Nova Saída / Custo da Loja'}
                </h2>
                <p className="text-xs text-zinc-400">
// etapa 44/85
