import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ notifications: [] });

  const { searchParams } = new URL(request.url);
  const scope = searchParams.get('scope');
  const supabase = createServiceClient();

  if (scope === 'admin' && session.isAdmin) {
    const { data } = await supabase
      .from('notifications')
// step 1/5
