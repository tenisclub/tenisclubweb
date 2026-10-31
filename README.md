# Tênis Club — Loja Virtual & Painel Administrativo

Plataforma completa de e-commerce de tênis e calçados desenvolvida com **Next.js (App Router)**, **TypeScript**, **Tailwind CSS** e **Supabase (PostgreSQL + Auth + Storage)**.

## Módulos Principais

- **Loja Virtual**: Home com filtro rápido por gênero, tipo e numeração (`33` ao `44`), catálogo com paginação, página individual do produto com controle de estoque por numeração, SEO dinâmico e integração com WhatsApp.
- **Autenticação & RBAC**: Cadastro e login por e-mail/senha e Google OAuth 2.0, recuperação de senha, separação estrita entre Cliente, Administrador Operacional e Administrador Principal.
- **Área do Cliente (`/minha-conta`)**: Dashboard pessoal, meus pedidos com linha do tempo, favoritos, endereços e dados cadastrais.
- **Carrinho & Checkout Simplificado**: Carrinho persistente na conta, validação transacional de preço e estoque na confirmação e atendimento pós-pedido via WhatsApp.
- **Painel Administrativo (`/admin`)**: Dashboard com KPIs e gráficos por período, cadastro de produtos com galeria de múltiplas fotos, controle auditado de estoque por numeração, histórico de movimentações, gestão de pedidos, clientes, promoções, relatórios, configurações da loja e administradores.

## Execução Local

1. Copie `.env.example` para `.env.local` e preencha as credenciais do projeto Supabase.
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Aplique o schema, triggers, políticas RLS e catálogo inicial:
   ```bash
   npm run db:setup
   ```
4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
