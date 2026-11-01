import type { Metadata } from 'next';
import { Inter, Montserrat } from 'next/font/google';
import './globals.css';
import { StoreProvider } from '@/components/providers/StoreProvider';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { getStoreSettings } from '@/lib/catalog';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  style: ['normal', 'italic'],
  variable: '--font-montserrat',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tenisclub.vercel.app';
  const ogImage = settings.hero_banner_url || settings.logo_url || undefined;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${settings.store_name} — ${settings.tagline}`,
      template: `%s | ${settings.store_name}`,
    },
    description: settings.hero_subtitle,
    openGraph: {
      title: `${settings.store_name} — ${settings.tagline}`,
      description: settings.hero_subtitle,
      siteName: settings.store_name,
      url: siteUrl,
      type: 'website',
      locale: 'pt_BR',
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
// step 3/5
