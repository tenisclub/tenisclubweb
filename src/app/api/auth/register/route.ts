import { NextResponse } from 'next/server';
import { computeUserSyncTag } from '@/lib/revalidate-store';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, email, phone, password, acceptedTerms } = body;

    if (!fullName?.trim() || fullName.trim().length < 3) {
      return NextResponse.json({ error: 'Informe seu nome completo.' }, { status: 400 });
    }

    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return NextResponse.json({ error: 'Informe um endereço de e-mail válido.' }, { status: 400 });
    }

    const cleanPhone = (phone || '').trim();
    if (cleanPhone.replace(/\D/g, '').length < 10) {
// step 1/6
