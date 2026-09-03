# Atelier 31

Site e base de agendamento para uma barbearia premium, criado com React, TypeScript, Vite e Supabase.

## Rodar localmente

1. Instale Node.js 20+.
2. Execute `npm install`.
3. Copie `.env.example` para `.env` e preencha as credenciais públicas do Supabase.
4. Execute `npm run dev`.

Sem variáveis do Supabase, a vitrine e o fluxo demonstrativo continuam funcionando localmente. Para persistência, autenticação e área administrativa, aplique `supabase/migrations/001_atelier31_schema.sql` no SQL Editor do Supabase e conecte os handlers de autenticação/agendamento ao cliente em `src/lib/supabase.ts`.

A chave `anon` é a única permitida no frontend. Nunca exponha a `service_role`.
