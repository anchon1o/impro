-- ═══════════════════════════════════════════════════════════════════
-- PLANOS
-- ═══════════════════════════════════════════════════════════════════
-- Un plano é o debuxo dun escenario: quen está onde, mirando a onde, e
-- como se move dun momento ao seguinte.
--
-- ⚠️ O DOCUMENTO VAI ENTEIRO EN JSONB, non en táboas fillas. Un plano
-- lese e escríbese sempre completo: non hai ningunha consulta do tipo
-- «dáme todos os actores de todos os planos». Con táboas fillas
-- habería que reconciliar altas, baixas e reordenacións en cada
-- gardado, que é onde aparecen os ocos. Mesma decisión que `escaletas`.
--
-- ⚠️ `modo` é columna E vai tamén dentro do documento (`modoUltimo`).
-- Non é redundancia por descoido: o modo é estado da INTERFACE, non un
-- dato do plano —un plano ten sempre as dúas capas—, pero facía falta
-- fóra para poder filtrar a lista sen abrir o JSON de cada fila.
--
-- ⚠️ RLS ≠ GRANT. Postgres comproba o permiso da táboa ANTES de mirar a
-- política. Sen o `grant`, a política correcta segue dando 42501.
--
-- Idempotente: pódese executar as veces que faga falta.
-- ═══════════════════════════════════════════════════════════════════

create table if not exists public.planos (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null default 'Plano novo',
  notas       text,
  modo        text not null default 'escenico',
  documento   jsonb not null default '{}'::jsonb,
  version     int not null default 1,
  -- Cantos momentos ten. Calcúlase no cliente e gárdase para poder
  -- amosar «estático» ou «4 momentos» na lista sen abrir o documento.
  momentos    int not null default 1,
  grupo_id    uuid,
  user_id     uuid references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ⚠️ TODAS as columnas, por se a táboa xa existise dunha proba anterior
-- cun esquema máis curto. Non supoñer que existe unha columna é a
-- trampa nº 4 do PROJECT_CONTEXT, e é a que causou B37.
alter table public.planos add column if not exists nome       text;
alter table public.planos add column if not exists notas      text;
alter table public.planos add column if not exists modo       text default 'escenico';
alter table public.planos add column if not exists documento  jsonb default '{}'::jsonb;
alter table public.planos add column if not exists version    int default 1;
alter table public.planos add column if not exists momentos   int default 1;
alter table public.planos add column if not exists grupo_id   uuid;
alter table public.planos add column if not exists user_id    uuid;
alter table public.planos add column if not exists created_at timestamptz default now();
alter table public.planos add column if not exists updated_at timestamptz default now();

do $$ begin
  alter table public.planos add constraint planos_modo_chk
    check (modo in ('escenico', 'tecnico'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.planos add constraint planos_momentos_chk
    check (momentos >= 1);
exception when duplicate_object then null; end $$;

create index if not exists planos_user_idx    on public.planos (user_id);
create index if not exists planos_grupo_idx   on public.planos (grupo_id);
create index if not exists planos_updated_idx on public.planos (updated_at desc);

-- ═══════════════════════════════════════════════════════════════════
-- PERMISOS
-- ═══════════════════════════════════════════════════════════════════
-- ⚠️ Primeiro o GRANT. Sen el a política non chega a avaliarse.

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.planos to authenticated;

alter table public.planos enable row level security;

-- ⚠️ Un plano é PRIVADO do seu dono, tamén dentro dun grupo. Hoxe o
-- grupo é unha etiqueta de organización persoal, non un espazo
-- compartido; compartir de verdade require o sistema de pertenza e
-- cambiar isto (S08). Mesmo criterio que escaletas e mesas.

do $$ begin
  create policy planos_ler on public.planos
    for select to authenticated using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy planos_inserir on public.planos
    for insert to authenticated with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy planos_actualizar on public.planos
    for update to authenticated using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy planos_borrar on public.planos
    for delete to authenticated using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- `updated_at` ao día sen depender do cliente: un reloxo mal posto nun
-- iPad desordenaría a lista.
create or replace function public.planos_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists planos_touch_trg on public.planos;
create trigger planos_touch_trg before update on public.planos
  for each row execute function public.planos_touch();
