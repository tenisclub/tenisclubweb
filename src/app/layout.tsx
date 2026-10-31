import type { Metadata } from 'next';
import { Inter, Montserrat } from 'next/font/google';
import './globals.css';
import { StoreProvider } from '@/components/providers/StoreProvider';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { getStoreSettings, getUserCartView, getUserFavoriteIds } from '@/lib/catalog';
import { getAuthSession } from '@/lib/auth';

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
  return {
    title: {
      default: `${settings.store_name} — ${settings.tagline}`,
      template: `%s | ${settings.store_name}`,
    },
    description: settings.hero_subtitle,
    openGraph: {
      title: `${settings.store_name} — ${settings.tagline}`,
      description: settings.hero_subtitle,
      type: 'website',
      locale: 'pt_BR',
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [settings, session] = await Promise.all([
    getStoreSettings(),
    getAuthSession(),
  ]);

  let initialCartCount = 0;
  let initialFavoriteIds: string[] = [];

  if (session) {
    const [cart, favs] = await Promise.all([
      getUserCartView(session.userId),
      getUserFavoriteIds(session.userId),
    ]);
    initialCartCount = cart.totalItems;
    initialFavoriteIds = favs;
  }

  return (
    <html lang="pt-BR" className={`${inter.variable} ${montserrat.variable} dark`}>
      <body className="min-h-screen flex flex-col bg-[#09090B] text-zinc-100 antialiased font-sans">
        <StoreProvider
          initialAuth={Boolean(session)}
          initialUser={session?.profile || null}
          initialRole={session?.role || 'visitor'}
          initialCartCount={initialCartCount}
          initialFavoriteIds={initialFavoriteIds}
        >
          <Navbar settings={settings} />
          <main className="flex-1">{children}</main>
          <Footer settings={settings} />
        </StoreProvider>
      </body>
    </html>
  );
}
