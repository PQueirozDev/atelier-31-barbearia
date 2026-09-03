insert into public.services (nome, descricao, preco, duracao)
select * from (values
  ('Corte clássico', 'Tesoura e máquina, acabamento preciso e finalização.', 75::numeric, 45),
  ('Corte + barba', 'O ritual completo para sair renovado da cadeira.', 125::numeric, 75),
  ('Barba premium', 'Toalha quente, desenho e produtos de alta performance.', 65::numeric, 35),
  ('Combo Atelier', 'Corte, barba e tratamento facial em uma experiência só.', 165::numeric, 100)
) as seed(nome, descricao, preco, duracao)
where not exists (select 1 from public.services existing where existing.nome = seed.nome);

insert into public.barbers (nome, descricao, especialidade)
select * from (values
  ('Caio Martins', 'Precisão e leitura de estilo em cada atendimento.', 'Especialista em tesoura'),
  ('Rafael Nunes', 'Barbas desenhadas para valorizar cada rosto.', 'Barbas e visagismo'),
  ('Léo Sampaio', 'Cortes atuais com acabamento limpo e autoral.', 'Cortes contemporâneos')
) as seed(nome, descricao, especialidade)
where not exists (select 1 from public.barbers existing where existing.nome = seed.nome);
