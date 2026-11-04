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
      `INSERT INTO public.brands (name, slug)
       VALUES ($1, $2)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [b.name, b.slug]
    );
    brandMap[b.slug] = res.rows[0].id;
  }

  // Check if products already seeded
  const { rows: existingProds } = await client.query('SELECT COUNT(*)::int AS cnt FROM public.products');
  if (existingProds[0].cnt === 0) {
    const seedProducts = [
      {
        name: 'Mocassim Couro Caramelo',
        slug: 'mocassim-couro-caramelo',
        sku: 'REF. 003',
        brand: 'tenis-club',
        category: 'sapato',
        gender: 'masculino',
        short_description: 'Mocassim clássico em couro legítimo acabamento caramelo acetinado.',
        description: 'Desenvolvido para homens que valorizam elegância sem abrir mão do conforto. O Mocassim Couro Caramelo possui acabamento artesanal escovado, palmilha anatômica macia e solado blaqueado antiderrapante.',
        cost_price: 115.00,
        base_price: 229.90,
        promo_price: null,
        is_featured: true,
        is_new_release: true,
        sold_count: 42,
        images: [
          'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=1000&q=85',
          'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=1000&q=85',
        ],
        color: 'Caramelo',
        color_hex: '#8B4513',
        sizes: [
          ['37', 3], ['38', 5], ['39', 6], ['40', 8], ['41', 6], ['42', 4], ['43', 3], ['44', 2],
        ],
        specs: { Material: 'Couro Bovino Legítimo', Solado: 'Borracha Gel Costurada', Forro: 'Couro Macio Respirável', Garantia: '90 dias contra defeitos' },
      },
      {
        name: 'Loafer Social Marrom',
        slug: 'loafer-social-marrom',
        sku: 'REF. 007',
        brand: 'tenis-club',
        category: 'sapato',
        gender: 'masculino',
        short_description: 'Loafer penny social em couro nobre marrom café com corte italiano.',
        description: 'O Loafer Social Marrom traz design italiano atemporal com tira penny clássica no cabedal. Ideal para alfaiataria, eventos sociais ou composições smart casual com jeans escuro e camisa.',
        cost_price: 120.00,
        base_price: 239.90,
        promo_price: null,
        is_featured: true,
        is_new_release: true,
        sold_count: 38,
        images: [
          'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=1000&q=85',
          'https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=1000&q=85',
        ],
        color: 'Marrom Café',
        color_hex: '#4A2511',
        sizes: [
          ['37', 2], ['38', 4], ['39', 7], ['40', 6], ['41', 5], ['42', 4], ['43', 2], ['44', 2],
        ],
        specs: { Material: 'Couro Premium', Solado: ' Salto Baixo Social Antiderrapante', Palmilha: 'Espuma de Alta Densidade' },
      },
      {
        name: 'Nike Air Max Pulse Street',
        slug: 'nike-air-max-pulse-street',
        sku: 'REF. 001',
        brand: 'nike',
        category: 'tenis',
        gender: 'masculino',
        short_description: 'Amortecimento Air encapsulado com visual urbano e detalhes de alta resposta.',
        description: 'Inspirado na cena musical underground de Londres, o Air Max Pulse traz atitude urbana para a icônica linha Air Max. Sua entressola envolta em tecido e detalhes selados a vácuo elevam a durabilidade e o conforto para uso diário.',
        cost_price: 360.00,
        base_price: 799.90,
        promo_price: 649.90,
        is_featured: true,
        is_new_release: true,
        sold_count: 64,
        images: [
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=85',
          'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=1000&q=85',
        ],
        color: 'Vermelho / Preto',
        color_hex: '#DC2626',
        sizes: [
          ['38', 4], ['39', 6], ['40', 8], ['41', 5], ['42', 3], ['43', 2], ['44', 0],
        ],
        specs: { Amortecimento: ' Cápsula Air Point-Loaded', Cabedal: 'Mesh Respirável + Sintético', Indicado: 'Dia a dia / Lifestyle' },
      },
      {
        name: 'Nike Air Force Volt Edition',
        slug: 'nike-air-force-volt-edition',
        sku: 'REF. 002',
        brand: 'nike',
        category: 'tenis',
        gender: 'unissex',
        short_description: 'Silhueta lendária em verde neon vibrante com assinatura streetwear Tênis Club.',
        description: 'Destaque absoluto por onde passa. O Air Force Volt combina linhas clássicas do basquete anos 80 com acabamento ousado em verde neon, colarinho acolchoado e entressola robusta de longa duração.',
        cost_price: 310.00,
        base_price: 699.90,
        promo_price: 579.90,
        is_featured: true,
        is_new_release: true,
        sold_count: 55,
        images: [
          'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=1000&q=85',
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=85',
        ],
        color: 'Verde Volt',
        color_hex: '#BEFA46',
        sizes: [
          ['35', 3], ['36', 4], ['37', 5], ['38', 6], ['39', 5], ['40', 4], ['41', 3], ['42', 2],
        ],
        specs: { Cabedal: 'Couro Sintético Premium', Solado: 'Cupsole Borracha Non-Marking', Estilo: 'Streetwear Unissex' },
      },
      {
        name: 'New Balance 550 Retro Court',
        slug: 'new-balance-550-retro-court',
        sku: 'REF. 004',
        brand: 'new-balance',
        category: 'tenis',
        gender: 'unissex',
        short_description: 'Ícone retrô das quadras de 1989 em couro branco perfurado.',
        description: 'Simples, limpo e autêntico. O New Balance 550 presta homenagem aos jogadores originais de basquete dos anos 80 com cabedal estruturado em couro branco liso e detalhes minimalistas que combinam com tudo.',
        cost_price: 340.00,
        base_price: 749.90,
        promo_price: null,
        is_featured: true,
        is_new_release: false,
        sold_count: 79,
        images: [
          'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=1000&q=85',
          'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1000&q=85',
        ],
        color: 'Off-White / Cinza',
        color_hex: '#F4F4F5',
        sizes: [
          ['35', 2], ['36', 5], ['37', 6], ['38', 4], ['39', 7], ['40', 5], ['41', 4], ['42', 2], ['43', 1],
        ],
        specs: { Cabedal: 'Couro Perfurado + Camurça', Fechamento: 'Cadarço Tradicional', Origem: 'Importado' },
      },
      {
        name: 'Adidas Ultraboost Light Feminino',
        slug: 'adidas-ultraboost-light-feminino',
        sku: 'REF. 005',
        brand: 'adidas',
        category: 'esportivo',
        gender: 'feminino',
        short_description: 'Retorno de energia máximo com a entressola BOOST mais leve já criada.',
        description: 'Experimente energia épica a cada passada. O Ultraboost Light Feminino envolve os pés com cabedal PRIMEKNIT+ respirável e solado Continental™ para aderência superior na rua ou na esteira.',
        cost_price: 390.00,
        base_price: 899.90,
        promo_price: 729.90,
        is_featured: false,
        is_new_release: true,
        sold_count: 47,
        images: [
          'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1000&q=85',
          'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=1000&q=85',
        ],
        color: 'Rosa Pastel / Branco',
        color_hex: '#F472B6',
        sizes: [
          ['34', 4], ['35', 6], ['36', 8], ['37', 7], ['38', 5], ['39', 3],
        ],
        specs: { Pisada: 'Neutra', Drop: '10 mm', Tecnologia: 'Light BOOST + Primeknit' },
      },
      {
        name: 'Puma RS-X Efekt Colorblock',
        slug: 'puma-rs-x-efekt-colorblock',
        sku: 'REF. 006',
        brand: 'puma',
        category: 'tenis',
        gender: 'feminino',
        short_description: 'Design futurista chunky com tecnologia Running System de amortecimento macio.',
        description: 'A linha RS-X volta ainda mais expressiva. Com sobreposições em camurça e nubuck sobre base em mesh estruturado, entrega conforto imediato e visual marcante para produções modernas.',
        cost_price: 230.00,
        base_price: 549.90,
        promo_price: 429.90,
        is_featured: false,
        is_new_release: false,
        sold_count: 34,
        images: [
          'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=1000&q=85',
          'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1000&q=85',
        ],
        color: 'Multicolor',
        color_hex: '#EC4899',
        sizes: [
          ['34', 3], ['35', 5], ['36', 6], ['37', 4], ['38', 4], ['39', 2],
        ],
        specs: { Entressola: 'PU Leve RS', Solado: 'Borracha Tratorada', Estilo: 'Chunky Urbano' },
      },
      {
        name: 'Vans Old Skool Kids',
        slug: 'vans-old-skool-kids',
        sku: 'REF. 008',
        brand: 'vans',
        category: 'tenis',
        gender: 'infantil',
        short_description: 'Clássico skate infantil resistente com biqueira reforçada e solado Waffle.',
        description: 'Feito para acompanhar a energia das crianças na escola e no lazer. O Vans Old Skool Kids mantém a icônica Sidestripe lateral, colarinho acolchoado para suporte no tornozelo e borracha vulcanizada super resistente.',
        cost_price: 145.00,
        base_price: 329.90,
        promo_price: 269.90,
        is_featured: false,
        is_new_release: true,
        sold_count: 51,
        images: [
          'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=1000&q=85',
          'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?auto=format&fit=crop&w=1000&q=85',
        ],
        color: 'Bordô / Branco',
        color_hex: '#881337',
        sizes: [
          ['33', 6], ['34', 7], ['35', 5], ['36', 4],
        ],
        specs: { Cabedal: 'Lona e Camurça Reforçada', Solado: 'Borracha Waffle Original', Público: 'Infantil / Juvenil' },
      },
      {
        name: 'Scarpin Salto Fino Elegance',
        slug: 'scarpin-salto-fino-elegance',
        sku: 'REF. 009',
        brand: 'tenis-club',
        category: 'salto',
        gender: 'feminino',
        short_description: 'Scarpin bico fino com palmilha confort e acabamento impecável.',
        description: 'Sofisticação instantânea para festas, formaturas e ambiente executivo. Possui protetor interno de calcanhar macio e equilíbrio perfeito na inclinação do salto de 8,5 cm.',
        cost_price: 110.00,
        base_price: 259.90,
        promo_price: 219.90,
        is_featured: false,
        is_new_release: true,
        sold_count: 29,
        images: [
          'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1000&q=85',
        ],
        color: 'Azul Royal',
        color_hex: '#1D4ED8',
        sizes: [
          ['34', 3], ['35', 5], ['36', 6], ['37', 5], ['38', 3], ['39', 2],
        ],
        specs: { Altura_do_Salto: '8,5 cm', Bico: 'Fino Clássico', Palmilha: 'Gel Comfort' },
      },
      {
        name: 'Sandália Minimal Tiras Couro',
        slug: 'sandalia-minimal-tiras-couro',
        sku: 'REF. 010',
        brand: 'tenis-club',
        category: 'sandalia',
        gender: 'feminino',
        short_description: 'Sandália leve de tiras delicadas com salto bloco baixo super estável.',
        description: 'Versátil para dias quentes e noites especiais. As tiras macias abraçam o pé sem apertar, enquanto o salto bloco de 4 cm garante conforto o dia inteiro.',
        cost_price: 85.00,
        base_price: 199.90,
        promo_price: 169.90,
        is_featured: false,
        is_new_release: false,
        sold_count: 33,
        images: [
          'https://images.unsplash.com/photo-1562273138-f46be4ebdf33?auto=format&fit=crop&w=1000&q=85',
        ],
        color: 'Nude / Caramelo',
        color_hex: '#D6B89C',
        sizes: [
          ['34', 4], ['35', 6], ['36', 6], ['37', 5], ['38', 4], ['39', 2],
        ],
        specs: { Altura_do_Salto: '4 cm Bloco', Fechamento: 'Fivela Ajustável', Material: 'Couro Eco Premium' },
      },
      {
        name: 'Converse Chuck 70 Hi Vintage',
        slug: 'converse-chuck-70-hi-vintage',
        sku: 'REF. 011',
        brand: 'converse',
        category: 'tenis',
        gender: 'unissex',
        short_description: 'Cano alto em lona encorpada premium com vira envernizada off-white.',
        description: 'O Chuck 70 celebra a herança dos anos 1970 com lona de gramatura superior, costuras reforçadas na língua e palmilha OrthoLite para amortecimento prolongado.',
        cost_price: 210.00,
        base_price: 489.90,
        promo_price: null,
        is_featured: true,
        is_new_release: false,
        sold_count: 68,
        images: [
          'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?auto=format&fit=crop&w=1000&q=85',
          'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=1000&q=85',
        ],
        color: 'Preto / Off-White',
        color_hex: '#18181B',
        sizes: [
          ['35', 4], ['36', 5], ['37', 6], ['38', 5], ['39', 6], ['40', 5], ['41', 4], ['42', 3], ['43', 2],
        ],
        specs: { Cano: 'Alto (Hi)', Palmilha: 'OrthoLite', Cabedal: 'Lona Algodão 12oz' },
      },
      {
        name: 'Tênis Runner Kids Ultra Leve',
        slug: 'tenis-runner-kids-ultra-leve',
        sku: 'REF. 012',
        brand: 'adidas',
        category: 'esportivo',
        gender: 'infantil',
        short_description: 'Calce fácil, respirabilidade e amortecimento em EVA macio para os pequenos.',
        description: 'Projetado para brincadeiras sem limites. O cabedal sem costuras evita atritos e o solado flexível acompanha o movimento natural dos pés em crescimento.',
        cost_price: 120.00,
        base_price: 279.90,
        promo_price: 229.90,
        is_featured: false,
        is_new_release: true,
        sold_count: 27,
        images: [
          'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1000&q=85',
        ],
// etapa 5/6
