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
  const settings = await getStoreSettings();

  return (
    <html
      lang="pt-BR"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${montserrat.variable} dark`}
    >
      <body className="min-h-screen flex flex-col bg-[#09090B] text-zinc-100 antialiased font-sans">
        <StoreProvider>
          <Navbar settings={settings} />
          <main className="flex-1">{children}</main>
          <Footer settings={settings} />
        </StoreProvider>
      </body>
    </html>
  );
}
