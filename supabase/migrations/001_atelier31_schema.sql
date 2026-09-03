create extension if not exists "uuid-ossp";

create type public.user_role as enum ('cliente', 'admin');
create type public.appointment_status as enum ('pendente', 'confirmado', 'concluido', 'cancelado');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  email text not null,
  telefone text,
  tipo_usuario public.user_role not null default 'cliente',
  created_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default uuid_generate_v4(), nome text not null, descricao text,
  preco numeric(10,2) not null default 0, duracao integer not null default 30,
  imagem text, ativo boolean not null default true, created_at timestamptz not null default now()
);

create table public.barbers (
  id uuid primary key default uuid_generate_v4(), nome text not null, descricao text,
  especialidade text, foto text, ativo boolean not null default true, created_at timestamptz not null default now()
);

create table public.schedules (
  id uuid primary key default uuid_generate_v4(), barbeiro_id uuid references public.barbers(id) on delete cascade,
  dia_semana smallint not null check (dia_semana between 0 and 6), horario_inicial time not null,
  horario_final time not null, intervalo integer not null default 15, disponibilidade boolean not null default true
);

create table public.appointments (
  id uuid primary key default uuid_generate_v4(), cliente_id uuid not null references public.profiles(id) on delete cascade,
  barbeiro_id uuid not null references public.barbers(id), servico_id uuid not null references public.services(id),
  data date not null, horario time not null, status public.appointment_status not null default 'pendente',
  observacoes text, created_at timestamptz not null default now()
);

create unique index one_active_appointment_per_slot on public.appointments (barbeiro_id, data, horario)
where status <> 'cancelado';

alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.barbers enable row level security;
alter table public.schedules enable row level security;
alter table public.appointments enable row level security;

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and tipo_usuario = 'admin');
$$;

create policy "public read active services" on public.services for select using (ativo = true or public.is_admin());
create policy "public read active barbers" on public.barbers for select using (ativo = true or public.is_admin());
create policy "public read schedules" on public.schedules for select using (disponibilidade = true or public.is_admin());
create policy "users read own profile" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "users update own profile" on public.profiles for update using (id = auth.uid() or public.is_admin());
create policy "users read own appointments" on public.appointments for select using (cliente_id = auth.uid() or public.is_admin());
create policy "users create own appointments" on public.appointments for insert with check (cliente_id = auth.uid());
create policy "users cancel own appointments" on public.appointments for update using (cliente_id = auth.uid() or public.is_admin());
create policy "admins manage services" on public.services for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage barbers" on public.barbers for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage schedules" on public.schedules for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage appointments" on public.appointments for all using (public.is_admin()) with check (public.is_admin());

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nome, email) values (new.id, coalesce(new.raw_user_meta_data->>'nome', ''), new.email);
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

insert into public.services (nome, descricao, preco, duracao) values
  ('Corte clássico', 'Tesoura e máquina, acabamento preciso e finalização.', 75, 45),
  ('Corte + barba', 'O ritual completo para sair renovado da cadeira.', 125, 75),
  ('Barba premium', 'Toalha quente, desenho e produtos de alta performance.', 65, 35),
  ('Combo Atelier', 'Corte, barba e tratamento facial em uma experiência só.', 165, 100);

insert into public.barbers (nome, descricao, especialidade) values
  ('Caio Martins', 'Precisão e leitura de estilo em cada atendimento.', 'Especialista em tesoura'),
  ('Rafael Nunes', 'Barbas desenhadas para valorizar cada rosto.', 'Barbas e visagismo'),
  ('Léo Sampaio', 'Cortes atuais com acabamento limpo e autoral.', 'Cortes contemporâneos');
