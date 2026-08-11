-- ═══════════════════════════════════════════════════════════════════
-- supabase_universo_modelo.sql — IM-M06 · M07 · M08 · M09
--
-- MODELO DE DATOS. Non hai cambios de interface nesta entrega.
-- Tras executalo, a app segue funcionando exactamente igual: a columna
-- `verificado` mantense como columna XERADA a partir de `estado`, así que
-- `universo.js` non precisa tocarse ata que construamos a UI nova.
--
-- Executar no SQL Editor. Idempotente.
-- Requisitos previos: supabase_universo.sql + _patch.sql + _seed.sql
-- ═══════════════════════════════════════════════════════════════════


-- ═══ 1. CATEGORÍAS XESTIONABLES (M07) ══════════════════════════════
-- Antes `universo.tipo` era texto libre cos valores fixos no código.
-- Agora é unha táboa que o admin pode editar.
--
-- `plantilla` di QUE FORMA ten a ficha; `id` di QUE É. Separalos permite
-- ter «Compañía» e «Colectivo» compartindo a forma de Entidade sen
-- duplicar a definición de campos.

create table if not exists public.universo_categorias (
  id            text primary key,          -- slug: 'compañia', 'festival'…
  nome          text not null,
  emoji         text not null default '🎭',
  descricion    text default '',
  plantilla     text not null default 'entidade',
  orde          integer not null default 100,
  activa        boolean not null default true,
  -- Que campos opcionais da plantilla se amosan nesta categoría.
  -- null = todos os da plantilla. Array = só eses.
  campos_activos jsonb default null,
  created_at    timestamptz default now(),
  constraint universo_categorias_plantilla_ok
    check (plantilla in ('entidade','proxecto','evento','lugar'))
);

-- ⚠️ Os `id` teñen que coincidir EXACTAMENTE cos valores que xa hai en
-- `universo.tipo` e en UNIVERSO_TIPOS do frontend, tildes incluídas.
-- Sementar 'compañia' sen til creaba unha categoría duplicada: as filas
-- existentes din 'compañía' e o migrador de máis abaixo dábaas por
-- descoñecidas. Detectado ao executar a migración contra datos reais.
insert into public.universo_categorias (id,nome,emoji,plantilla,orde,descricion) values
  ('compañía','Compañía',  '🎭','entidade', 10,'Grupos estables que producen e representan.'),
  ('escola',  'Escola',    '🏫','entidade', 20,'Centros de formación en improvisación.'),
  ('colectivo','Colectivo','👥','entidade', 30,'Redes e asociacións sen estrutura de compañía.'),
  ('festival','Festival',  '🎪','evento',   40,'Encontros periódicos con programación.'),
  ('proxecto','Proxecto',  '🚀','proxecto', 50,'Iniciativas, formatos e espectáculos concretos.'),
  ('espazo',  'Espazo',    '📍','lugar',    60,'Salas e sedes con actividade de impro.'),
  ('persoa',  'Persoa',    '👤','entidade', 70,'Referentes individuais.')
on conflict (id) do nothing;

-- Migrar os tipos que xa existen e que non estean na lista de arriba,
-- para non perder ningunha entrada por unha categoría descoñecida.
insert into public.universo_categorias (id,nome,emoji,plantilla,orde)
select distinct u.tipo, initcap(u.tipo), '🎭', 'entidade', 900
  from public.universo u
 where u.tipo is not null
   and not exists (select 1 from public.universo_categorias c where c.id = u.tipo)
on conflict (id) do nothing;


-- ═══ 2. ESTADO E CICLO DE VIDA (M08) ═══════════════════════════════
-- Decisión: as propostas NON van a unha táboa aparte. Viven na mesma
-- táboa cun `estado`. Aprobar é cambiar un valor, non copiar filas entre
-- táboas — así non hai risco de duplicados nin de perder edicións, e o
-- admin pode editar unha proposta ANTES de publicala.

alter table public.universo
  add column if not exists estado text,
  add column if not exists proposta_nome    text,   -- quen propón, sen conta
  add column if not exists proposta_email   text,
  add column if not exists revisado_por     uuid references auth.users(id) on delete set null,
  add column if not exists revisado_en      timestamptz,
  add column if not exists nota_revision    text,
  add column if not exists actualizado_en   timestamptz default now();

-- Backfill desde o `verificado` actual antes de substituílo
update public.universo
   set estado = case when verificado then 'publicada' else 'pendente' end
 where estado is null;

alter table public.universo alter column estado set default 'pendente';
alter table public.universo alter column estado set not null;

do $$ begin
  alter table public.universo add constraint universo_estado_ok
    check (estado in ('pendente','publicada','rexeitada','borrador'));
exception when duplicate_object then null; end $$;

-- `verificado` pasa a ser XERADA. Todo o código actual que le ou filtra
-- por `verificado` segue funcionando sen cambios. O que NON funciona xa é
-- escribir nela: hai que escribir en `estado`.
--
-- ⚠️ As políticas RLS que mencionan `verificado` dependen da columna e
-- impiden borrala (ERROR 2BP01). Hai que tiralas ANTES. Recréanse todas
-- na sección 5, así que non queda nada colgando.
-- O índice parcial `universo_tipo_idx ... where verificado` non fai falta
-- tiralo á man: Postgres elimina só os índices que usan a columna.
drop policy if exists universo_select on public.universo;
drop policy if exists universo_insert on public.universo;
drop policy if exists universo_update on public.universo;
drop policy if exists universo_delete on public.universo;

do $$ begin
  if exists (select 1 from information_schema.columns
              where table_schema='public' and table_name='universo'
                and column_name='verificado' and is_generated='NEVER') then
    alter table public.universo drop column verificado;
    alter table public.universo add column verificado boolean
      generated always as (estado = 'publicada') stored;
  end if;
end $$;

-- Restaurar o índice parcial, que caeu coa columna
create index if not exists universo_tipo_idx
  on public.universo(tipo) where verificado;


-- ═══ 3. FICHA RICA (M06) ═══════════════════════════════════════════
-- Modelo híbrido, deliberadamente:
--   · columnas para o que se consulta, filtra ou ordena
--   · jsonb para o que varía segundo a categoría
-- Un jsonb único para todo faría imposible indexar; unha columna por
-- campo daría unha táboa con 30 columnas nulas.

alter table public.universo
  add column if not exists logo_url    text,           -- imaxe; se falta, úsase `logo` (emoji)
  add column if not exists ligazons    jsonb not null default '{}'::jsonb,
  add column if not exists datos       jsonb not null default '{}'::jsonb,
  add column if not exists data_inicio date,
  add column if not exists data_fin    date,
  add column if not exists activo      boolean default true;

-- `ligazons`: forma pechada e coñecida.
--   {"web":"…","instagram":"…","youtube":"…","outras":[{"etiqueta":"…","url":"…"}]}
--
-- `datos`: campos opcionais da plantilla. Só se gardan os que teñan
-- contido, así que a regra «só se amosan os campos con contido» sae soa
-- do modelo en vez de ser lóxica de pintado.
--   entidade → fundadores[], membros[], responsables[]
--   proxecto → autoria, direccion, elenco[], produccion, estrea
--   evento   → edicions, periodicidade, organiza, sede
--   lugar    → enderezo, aforo, xestiona

-- Migrar a `web` existente á estrutura nova sen perder nada
update public.universo
   set ligazons = jsonb_build_object('web', web)
 where coalesce(web,'') <> ''
   and not (ligazons ? 'web');

create index if not exists universo_estado_idx on public.universo(estado);
create index if not exists universo_tipo_estado_idx on public.universo(tipo, estado);
create index if not exists universo_datos_gin on public.universo using gin (datos);

-- Marca de tempo de modificación
create or replace function public.universo_touch()
returns trigger language plpgsql as $$
begin new.actualizado_en = now(); return new; end; $$;

drop trigger if exists universo_touch_trg on public.universo;
create trigger universo_touch_trg before update on public.universo
  for each row execute function public.universo_touch();


-- ═══ 4. LÍMITE DE PROPOSTAS (M08) ══════════════════════════════════
-- ⚠️ LÍMITE HONESTO DO QUE SE PODE FACER AQUÍ.
--
-- Pediches CAPTCHA e rate limiting por IP. O CAPTCHA precisa un servizo
-- externo e verificación no servidor: NON se pode facer desde o frontend
-- nin desde unha política RLS. Queda fóra desta entrega.
--
-- O rate limiting por IP SI se pode aproximar: PostgREST expón as
-- cabeceiras da petición, e de aí sáese o x-forwarded-for. Advertencia:
-- esa cabeceira é falsificable e detrás dun NAT moitas persoas comparten
-- IP. Serve para frear un bot torpe, non a alguén decidido.

create table if not exists public.universo_rate (
  ip          text not null,
  xanela      timestamptz not null,
  n           integer not null default 0,
  primary key (ip, xanela)
);

create or replace function public.universo_limite_propostas()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_ip text;
  v_xanela timestamptz;
  v_n integer;
  LIMITE constant integer := 5;   -- propostas por IP e hora
begin
  -- Só se limitan as propostas anónimas; as de usuario con conta xa teñen
  -- identidade e poden moderarse por persoa.
  if new.user_id is not null or new.estado <> 'pendente' then
    return new;
  end if;

  begin
    v_ip := split_part(
      coalesce(current_setting('request.headers', true)::json ->> 'x-forwarded-for',
               'descoñecida'), ',', 1);
  exception when others then v_ip := 'descoñecida';
  end;

  v_xanela := date_trunc('hour', now());

  insert into public.universo_rate (ip, xanela, n) values (v_ip, v_xanela, 1)
    on conflict (ip, xanela) do update set n = public.universo_rate.n + 1
    returning n into v_n;

  if v_n > LIMITE then
    raise exception 'Demasiadas propostas desde esta conexión. Téntao dentro dunha hora.'
      using errcode = 'check_violation';
  end if;

  return new;
end; $$;

drop trigger if exists universo_limite_trg on public.universo;
create trigger universo_limite_trg before insert on public.universo
  for each row execute function public.universo_limite_propostas();

-- Limpeza de xanelas vellas
create or replace function public.universo_limpar_rate()
returns void language sql security definer set search_path = public as $$
  delete from public.universo_rate where xanela < now() - interval '2 days';
$$;


-- ═══ 5. RLS ════════════════════════════════════════════════════════
-- ⚠️ AQUÍ ESTABA O PROBLEMA ANUNCIADO.
--
-- A política actual é:
--   with_check ((user_id = auth.uid()) OR (user_id IS NULL AND is_admin()))
--
-- Para alguén sen conta, auth.uid() é NULL, logo `user_id = auth.uid()`
-- avalía a NULL → non é true → rexeitado. É exactamente o mesmo fallo que
-- B12. Sen tocar isto, M08 («persoas sen conta poden propoñer») é
-- imposible por moito formulario que se faga.

alter table public.universo enable row level security;

drop policy if exists universo_select on public.universo;
create policy universo_select on public.universo for select
  using (
    estado = 'publicada'
    or user_id = auth.uid()
    or public.is_admin()
  );

drop policy if exists universo_insert on public.universo;
create policy universo_insert on public.universo for insert
  with check (
    -- admin: pode crear xa publicada
    public.is_admin()
    -- usuaria con conta: proposta a nome seu, sempre pendente
    or (auth.uid() is not null and user_id = auth.uid() and estado = 'pendente')
    -- visitante sen conta: proposta orfa, sempre pendente
    or (auth.uid() is null and user_id is null and estado = 'pendente')
  );

drop policy if exists universo_update on public.universo;
create policy universo_update on public.universo for update
  using (
    public.is_admin()
    -- a autora pode editar a súa proposta mentres siga pendente
    or (user_id = auth.uid() and estado = 'pendente')
  )
  with check (
    public.is_admin()
    -- pero non pode auto-publicarse
    or (user_id = auth.uid() and estado = 'pendente')
  );

drop policy if exists universo_delete on public.universo;
create policy universo_delete on public.universo for delete
  using (public.is_admin() or (user_id = auth.uid() and estado = 'pendente'));

-- Categorías: lectura para todos, escritura só admin
alter table public.universo_categorias enable row level security;

drop policy if exists universo_categorias_select on public.universo_categorias;
create policy universo_categorias_select on public.universo_categorias
  for select using (true);

drop policy if exists universo_categorias_write on public.universo_categorias;
create policy universo_categorias_write on public.universo_categorias
  for all using (public.is_admin()) with check (public.is_admin());

-- A táboa de rate non a le ninguén desde o cliente: só o trigger, que é
-- security definer.
alter table public.universo_rate enable row level security;


-- ═══ COMPROBACIÓN ══════════════════════════════════════════════════
-- select estado, count(*) from public.universo group by estado;
-- select id, nome, emoji, plantilla, orde from public.universo_categorias order by orde;
-- select tablename, policyname, cmd, qual, with_check from pg_policies
--   where tablename like 'universo%' order by tablename, policyname;
