-- ═══════════════════════════════════════════════════════════════════
-- supabase_dinamicas_tipos.sql
--
-- Tipos de dinámica xestionables desde Admin, igual cás categorías de
-- Universo. Ata agora eran unha constante no código: engadir un tipo
-- novo obrigaba a tocar tres ficheiros e despregar.
--
-- Executar no SQL Editor. Idempotente.
-- ═══════════════════════════════════════════════════════════════════

create table if not exists public.dinamicas_tipos (
  id          text primary key,          -- slug: 'calentamiento', 'juego'…
  nome        text not null,
  emoji       text not null default '🎯',
  descricion  text default '',
  -- Token de cor do tema, non un valor fixo: así os tipos repíntanse
  -- cando se cambia de tema, igual có resto da interface.
  cor         text not null default 'accent',
  orde        integer not null default 100,
  activo      boolean not null default true,
  created_at  timestamptz default now()
);

do $$ begin
  alter table public.dinamicas_tipos add constraint dinamicas_tipos_cor_ok
    check (cor in ('accent','ok','warn','info','danger','alt','muted'));
exception when duplicate_object then null; end $$;

-- Os sete tipos que xa existían, coas mesmas cores que tiñan
insert into public.dinamicas_tipos (id,nome,emoji,cor,orde,descricion) values
  ('calentamiento','Quecemento',   '🔥','warn',  10,'Para abrir a sesión e activar o grupo.'),
  ('entrenamiento','Adestramento', '💪','info',  20,'Traballo técnico sobre unha habilidade concreta.'),
  ('juego',        'Xogo',         '🎲','ok',    30,'Dinámicas lúdicas, tamén válidas para show.'),
  ('formato',      'Formato',      '🎬','accent',40,'Estruturas completas de espectáculo.'),
  ('musical',      'Musical',      '🎵','alt',   50,'Canto e ritmo improvisados.'),
  ('pausa',        'Pausa',        '☕','muted', 60,'Para baixar revolucións no medio da sesión.'),
  ('cierre',       'Peche',        '🌙','danger',70,'Para rematar e recoller o traballo feito.')
on conflict (id) do nothing;

-- Recoller calquera tipo que xa se usase e non estea na lista
insert into public.dinamicas_tipos (id,nome,emoji,cor,orde)
select distinct d.tipo, initcap(d.tipo), '🎯', 'accent', 900
  from public.dinamicas d
 where d.tipo is not null
   and not exists (select 1 from public.dinamicas_tipos t where t.id = d.tipo)
on conflict (id) do nothing;


-- ── RLS e permisos ─────────────────────────────────────────────────
alter table public.dinamicas_tipos enable row level security;

drop policy if exists dinamicas_tipos_select on public.dinamicas_tipos;
create policy dinamicas_tipos_select on public.dinamicas_tipos
  for select using (true);

drop policy if exists dinamicas_tipos_write on public.dinamicas_tipos;
create policy dinamicas_tipos_write on public.dinamicas_tipos
  for all using (public.is_admin()) with check (public.is_admin());

-- ⚠️ Sen GRANT a táboa non se le, por moi correcta que sexa a política.
grant select on public.dinamicas_tipos to anon, authenticated;
grant insert, update, delete on public.dinamicas_tipos to authenticated;


-- ═══ COMPROBACIÓN ══════════════════════════════════════════════════
-- select id, nome, emoji, cor, orde from public.dinamicas_tipos order by orde;
