import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { revalidateStoreData } from '@/lib/revalidate-store';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.isSuperAdmin) {
    return NextResponse.json(
      { error: 'Apenas o Administrador Principal pode gerenciar acessos administrativos.' },
      { status: 403 }
    );
  }

  try {
    const { email, fullName, phone, password, roleName } = await request.json();

    if (!email?.trim() || !roleName || !['admin_operational', 'super_admin'].includes(roleName)) {
      return NextResponse.json({ error: 'E-mail e nível de permissão são obrigatórios.' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id, email')
      .eq('email', cleanEmail)
      .maybeSingle();

    let targetUserId = existingProfile?.id;

    if (!targetUserId) {
      if (!password || String(password).length < 6) {
        return NextResponse.json(
          { error: 'Informe uma senha inicial de pelo menos 6 caracteres para o novo administrador.' },
          { status: 400 }
        );
      }

      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email: cleanEmail,
        password: String(password),
        email_confirm: true,
        user_metadata: {
          full_name: fullName?.trim() || 'Administrador',
          phone: phone?.trim() || '',
        },
      });

      if (createErr) {
        return NextResponse.json({ error: createErr.message }, { status: 400 });
      }
      targetUserId = created.user.id;
    }

    const { data: roleRow } = await supabase
      .from('roles')
      .select('id')
      .eq('name', roleName)
      .single();

    if (!roleRow) {
      return NextResponse.json({ error: 'Função administrativa não encontrada.' }, { status: 400 });
    }

    // Remove previous admin roles and assign the chosen admin role
    const { data: adminRoles } = await supabase
      .from('roles')
      .select('id')
      .in('name', ['admin_operational', 'super_admin']);

    const adminRoleIds = (adminRoles || []).map((r) => r.id);
    if (adminRoleIds.length > 0) {
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', targetUserId)
        .in('role_id', adminRoleIds);
    }

    await supabase.from('user_roles').insert({
      user_id: targetUserId,
      role_id: roleRow.id,
      assigned_by: session.userId,
    });

    await supabase.from('admin_logs').insert({
      admin_id: session.userId,
      action: 'admin.grant_role',
      entity_type: 'user_profile',
      entity_id: targetUserId,
      details: { email: cleanEmail, role: roleName },
    });

    revalidateStoreData();
    return NextResponse.json({ success: true, userId: targetUserId });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao configurar administrador.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const session = await getAuthSession();
  if (!session?.isSuperAdmin) {
    return NextResponse.json(
      { error: 'Apenas o Administrador Principal pode alterar permissões.' },
      { status: 403 }
    );
  }

  const { userId, roleName, is_active } = await request.json();
