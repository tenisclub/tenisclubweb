import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';

// Load .env.local if present
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!connectionString || !supabaseUrl || !serviceRoleKey) {
  console.error('Missing required environment variables (.env.local).');
  process.exit(1);
}

// Allow self-signed cert chain from Supabase pooler on Windows Node
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  console.log('1. Connecting to Supabase PostgreSQL...');
  await client.connect();

  console.log('2. Applying supabase/schema.sql...');
  const schemaSql = fs.readFileSync(path.resolve(process.cwd(), 'supabase/schema.sql'), 'utf8');
  await client.query(schemaSql);
  console.log('   Schema, triggers, RLS policies & RPCs created!');

  if (process.argv.includes('--schema-only')) {
    const { rows } = await client.query('SELECT count(*)::int AS total FROM public.financial_entries');
    console.log(`   Financial entries synced: ${rows[0]?.total ?? 0}`);
    await client.end();
    return;
  }

  console.log('3. Configuring Supabase Storage buckets...');
  for (const bucketName of ['products', 'store']) {
    const { data: existing } = await supabase.storage.getBucket(bucketName);
    if (!existing) {
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml'],
      });
      if (error) console.warn(`   Bucket ${bucketName} warning:`, error.message);
      else console.log(`   Created public bucket: ${bucketName}`);
    } else {
      console.log(`   Bucket ${bucketName} already exists.`);
    }
  }

  // Storage RLS policies for authenticated admin uploads & public read
  await client.query(`
    DO $$
    BEGIN
      DROP POLICY IF EXISTS "storage_public_read" ON storage.objects;
      DROP POLICY IF EXISTS "storage_admin_insert" ON storage.objects;
      DROP POLICY IF EXISTS "storage_admin_update" ON storage.objects;
      DROP POLICY IF EXISTS "storage_admin_delete" ON storage.objects;

      CREATE POLICY "storage_public_read" ON storage.objects
        FOR SELECT USING (bucket_id IN ('products', 'store'));

      CREATE POLICY "storage_admin_insert" ON storage.objects
        FOR INSERT WITH CHECK (bucket_id IN ('products', 'store') AND public.is_admin());

      CREATE POLICY "storage_admin_update" ON storage.objects
        FOR UPDATE USING (bucket_id IN ('products', 'store') AND public.is_admin());

      CREATE POLICY "storage_admin_delete" ON storage.objects
        FOR DELETE USING (bucket_id IN ('products', 'store') AND public.is_admin());
    END $$;
  `);

  console.log('4. Seeding RBAC Roles, Permissions & Store Settings...');
  await client.query(`
    INSERT INTO public.roles (name, label, description) VALUES
      ('customer', 'Cliente', 'Acesso à loja, carrinho, favoritos e pedidos próprios'),
      ('admin_operational', 'Administrador Operacional', 'Gerencia produtos, categorias, marcas, estoque e pedidos'),
      ('super_admin', 'Administrador Principal', 'Acesso total ao painel, relatórios, configurações e gestão de administradores')
    ON CONFLICT (name) DO UPDATE SET
      label = EXCLUDED.label,
      description = EXCLUDED.description;

    INSERT INTO public.permissions (code, description) VALUES
      ('products.manage', 'Cadastrar, editar e excluir produtos'),
      ('inventory.manage', 'Movimentar e corrigir estoque'),
      ('orders.manage', 'Gerenciar status e pagamentos de pedidos'),
      ('customers.view', 'Visualizar e gerenciar clientes'),
      ('promotions.manage', 'Criar e gerenciar promoções'),
      ('settings.manage', 'Editar configurações gerais da loja'),
      ('reports.view', 'Visualizar relatórios gerenciais'),
      ('admins.manage', 'Gerenciar contas e permissões administrativas')
    ON CONFLICT (code) DO NOTHING;

    INSERT INTO public.store_settings (id) VALUES (1)
    ON CONFLICT (id) DO NOTHING;
  `);

  // Map permissions to roles
  await client.query(`
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT r.id, p.id
    FROM public.roles r
    CROSS JOIN public.permissions p
    WHERE r.name = 'super_admin'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT r.id, p.id
    FROM public.roles r
    CROSS JOIN public.permissions p
    WHERE r.name = 'admin_operational'
      AND p.code IN ('products.manage', 'inventory.manage', 'orders.manage', 'customers.view', 'promotions.manage')
    ON CONFLICT DO NOTHING;
  `);

  console.log('5. Ensuring initial Super Admin user exists...');
  const adminEmail = 'admin@tenisclub.com.br';
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'TenisClub@2026!';
  const { data: usersList } = await supabase.auth.admin.listUsers();
  let adminUser = usersList?.users?.find((u) => u.email?.toLowerCase() === adminEmail);

  if (!adminUser) {
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Administrador Tênis Club',
        phone: '11999999999',
      },
    });
    if (createErr) throw createErr;
    adminUser = created.user;
    console.log(`   Created Super Admin: ${adminEmail}`);
  } else {
    console.log(`   Super Admin already exists: ${adminEmail}`);
  }

  // Promote adminUser to super_admin
  await client.query(
    `
    INSERT INTO public.user_roles (user_id, role_id)
    SELECT $1, id FROM public.roles WHERE name = 'super_admin'
    ON CONFLICT (user_id, role_id) DO NOTHING;
    `,
    [adminUser.id]
  );

  console.log('6. Seeding Categories, Brands & Initial Footwear Catalog...');
  const categories = [
    { name: 'Tênis', slug: 'tenis', description: 'Tênis casuais, urbanos, corrida e lifestyle', sort: 1 },
    { name: 'Sapato', slug: 'sapato', description: 'Mocassins, loafers e sapatos sociais em couro', sort: 2 },
    { name: 'Salto', slug: 'salto', description: 'Scarpins e saltos elegantes para todas as ocasiões', sort: 3 },
    { name: 'Sandália', slug: 'sandalia', description: 'Sandálias leves, confortáveis e cheias de estilo', sort: 4 },
    { name: 'Esportivo', slug: 'esportivo', description: 'Alta performance para corrida, treino e academia', sort: 5 },
  ];

  const catMap = {};
  for (const c of categories) {
    const res = await client.query(
      `INSERT INTO public.categories (name, slug, description, sort_order)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
       RETURNING id`,
      [c.name, c.slug, c.description, c.sort]
    );
    catMap[c.slug] = res.rows[0].id;
  }

  const brands = [
    { name: 'Tênis Club Atelier', slug: 'tenis-club' },
    { name: 'Nike', slug: 'nike' },
    { name: 'Adidas', slug: 'adidas' },
    { name: 'New Balance', slug: 'new-balance' },
    { name: 'Puma', slug: 'puma' },
    { name: 'Vans', slug: 'vans' },
    { name: 'Converse', slug: 'converse' },
  ];

  const brandMap = {};
  for (const b of brands) {
    const res = await client.query(
// etapa 2/6
