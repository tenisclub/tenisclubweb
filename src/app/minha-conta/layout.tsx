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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start">
        <div className="lg:col-span-3 min-w-0">
          <AccountSidebar />
        </div>
        <div className="lg:col-span-9 min-w-0">{children}</div>
      </div>
    </div>
  );
}

