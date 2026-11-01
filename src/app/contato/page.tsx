import type { Metadata } from 'next';
import { MapPin, Phone, Mail, Clock, MessageCircle } from 'lucide-react';
import { getStoreSettings } from '@/lib/catalog';
import { cleanWhatsAppNumber } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Contato' };

export default async function ContatoPage() {
  const settings = await getStoreSettings();
  const waUrl = `https://wa.me/${cleanWhatsAppNumber(settings.whatsapp)}?text=${encodeURIComponent(
    'Olá, Tênis Club! Preciso de atendimento.'
  )}`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 space-y-6 sm:space-y-8">
      <div>
// step 1/5
