import type { Metadata } from 'next';
import { getStoreSettings } from '@/lib/catalog';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Política de Privacidade (LGPD)' };

export default async function PrivacidadePage() {
// step 1/4
