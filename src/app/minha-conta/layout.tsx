import React from 'react';
import { AccountSidebar } from '@/components/account/AccountSidebar';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function MinhaContaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth('/minha-conta');

// step 2/4
