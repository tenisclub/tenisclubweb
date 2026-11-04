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
// etapa 2/85
