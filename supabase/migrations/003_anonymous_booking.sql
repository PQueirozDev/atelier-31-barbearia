create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nome, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', 'Cliente'), coalesce(new.email, 'anonimo-' || new.id || '@atelier31.local'))
  on conflict (id) do nothing;
  return new;
end;
$$;
