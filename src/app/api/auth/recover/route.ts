import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const { email } = await request.json();
  const cleanEmail = (email || '').trim().toLowerCase();

// step 1/4
