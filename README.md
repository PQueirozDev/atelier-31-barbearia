# Atelier 31

Site de uma barbearia fictícia com **agendamento online real**: o cliente escolhe serviço, barbeiro, dia e horário, e a reserva é gravada no Supabase. O controle de acesso e o bloqueio de horários duplicados são garantidos pelo próprio banco.

**Demo:** [atelier-31-barbearia.vercel.app](https://atelier-31-barbearia.vercel.app/) · **Estudo de caso:** [pqueiroz.vercel.app/projetos/atelier-31.html](https://pqueiroz.vercel.app/projetos/atelier-31.html)

![Página inicial do Atelier 31](docs/home.webp)

> A barbearia, os barbeiros e o telefone são fictícios. É um projeto de portfólio.

## Funcionalidades

- **Agendamento sem cadastro:** serviço, barbeiro (ou qualquer um disponível), dia e horário, com nome e WhatsApp do cliente.
- **Dias e horários:** mostra os próximos dias de funcionamento (fechado domingo e segunda) e esconde horários do dia que já passaram, com margem de 30 minutos.
- **Sem conflito de horário:** o banco recusa uma segunda reserva para o mesmo barbeiro, dia e horário, e a interface mostra “Esse horário já foi reservado”.
- **Área da equipe:** login pelo Supabase Auth, liberado só para perfis de administrador, com a lista de agendamentos.
- **Site institucional:** serviços com preço e duração, barbeiros, galeria, depoimentos e localização.

## Tecnologias

React 18 · TypeScript · Vite · Supabase (PostgreSQL, Auth, Row Level Security) · PL/pgSQL · lucide-react

## Arquitetura

```
React + TypeScript (Vite)
   │  supabase-js com a chave publicável
   ├─ leitura pública ── services · barbers · schedules     (RLS: só registros ativos)
   ├─ reserva ──────── rpc create_guest_appointment()    (security definer)
   │                      valida nome, WhatsApp, data, serviço e barbeiro
   │                      índice único (barbeiro, data, horário) sem cancelados
   └─ área da equipe ── Supabase Auth + is_admin()       (RLS por perfil)
```

- `src/main.tsx`: interface completa (site, fluxo de agendamento e área da equipe).
- `src/lib/supabase.ts`: cria o cliente só quando URL e chave são válidas; sem elas, o site abre e o agendamento mostra um aviso.
- `supabase/migrations/`: esquema, dados iniciais, políticas e funções, aplicados em ordem.

## Requisitos

- Node.js 20 ou mais recente
- Um projeto no [Supabase](https://supabase.com/)

## Instalação e execução

```sh
npm install
cp .env.example .env.local   # preencha com a URL e a chave publicável do seu projeto
npm run dev                  # http://localhost:5173
```

### Banco de dados

No SQL Editor do Supabase, execute as migrações em ordem:

1. `supabase/migrations/001_atelier31_schema.sql`: tabelas, tipos, índice único, RLS, `is_admin()` e serviços/barbeiros iniciais.
2. `supabase/migrations/002_seed_atelier31.sql`: dados iniciais idempotentes.
3. `supabase/migrations/003_anonymous_booking.sql`: ajuste do gatilho de perfis para usuários anônimos.
4. `supabase/migrations/004_guest_booking.sql`: campos do cliente convidado e a função `create_guest_appointment`.

Para liberar a área da equipe, crie um usuário em **Authentication** e marque o perfil como administrador:

```sql
update public.profiles set tipo_usuario = 'admin' where email = 'equipe@exemplo.com';
```

### Build de produção

```sh
npm run build     # typecheck (tsc -b) + build do Vite em dist/
npm run preview
```

Na Vercel, configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` nas variáveis de ambiente do projeto.

## Testes

Ainda não há testes automatizados. A verificação atual é o typecheck do `npm run build` e o teste manual do fluxo de agendamento na demo.

## Limitações conhecidas

- A função de reserva não confere se o horário pertence à agenda do barbeiro (`schedules`) nem bloqueia horários já passados no servidor; isso é feito só na interface.
- A área da equipe lista os agendamentos, mas ainda não permite confirmar, concluir ou cancelar.
- Toda a interface está em um único componente (`src/main.tsx`).

## Próximas melhorias

- Validar no banco a agenda do barbeiro e os horários passados.
- Ações da equipe sobre cada agendamento.
- Separar a interface em componentes e adicionar testes.
