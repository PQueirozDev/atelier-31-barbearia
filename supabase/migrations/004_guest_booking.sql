alter table public.appointments
  alter column cliente_id drop not null,
  add column if not exists cliente_nome text,
  add column if not exists cliente_telefone text;

create or replace function public.create_guest_appointment(
  p_nome text,
  p_telefone text,
  p_barbeiro_id uuid,
  p_servico_id uuid,
  p_data date,
  p_horario time
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if nullif(trim(p_nome), '') is null or nullif(trim(p_telefone), '') is null then
    raise exception 'Nome e WhatsApp são obrigatórios';
  end if;
  if p_data < current_date then
    raise exception 'A data precisa ser hoje ou futura';
  end if;
  if not exists (select 1 from public.services where id = p_servico_id and ativo = true) then
    raise exception 'Serviço indisponível';
  end if;
  if not exists (select 1 from public.barbers where id = p_barbeiro_id and ativo = true) then
    raise exception 'Barbeiro indisponível';
  end if;

  insert into public.appointments (cliente_id, cliente_nome, cliente_telefone, barbeiro_id, servico_id, data, horario, status)
  values (auth.uid(), trim(p_nome), trim(p_telefone), p_barbeiro_id, p_servico_id, p_data, p_horario, 'pendente')
  returning id into new_id;
  return new_id;
end;
$$;

grant execute on function public.create_guest_appointment(text, text, uuid, uuid, date, time) to anon, authenticated;
