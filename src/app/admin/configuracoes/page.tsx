import { SettingsClient } from '@/components/admin/SettingsClient';
import { getStoreSettings } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export default async function AdminConfiguracoesPage() {
  const settings = await getStoreSettings();
  return <SettingsClient initialSettings={settings} />;
}

