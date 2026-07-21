-- =====================================================================
-- member_edits: Tabla para registrar ediciones de admin a datos de usuario/mascota
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.member_edits (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id     text NOT NULL,          -- memberstack_id del usuario editado
  member_name   text,                   -- nombre display del usuario
  pet_id        uuid,                   -- NULL si es edición de datos de usuario
  pet_name      text,                   -- NULL si es edición de datos de usuario
  edited_by_id  text NOT NULL,          -- memberstack_id del admin que editó
  edited_by_name text NOT NULL,         -- nombre display del admin
  changes       jsonb NOT NULL,         -- { fieldKey: { old: '...', new: '...' } }
  edit_type     text NOT NULL CHECK (edit_type IN ('user_data', 'pet_data')),
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Índices para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_member_edits_member_id  ON public.member_edits (member_id);
CREATE INDEX IF NOT EXISTS idx_member_edits_edited_by  ON public.member_edits (edited_by_id);
CREATE INDEX IF NOT EXISTS idx_member_edits_created_at ON public.member_edits (created_at DESC);

-- RLS (deshabilitado — auth manejado en capa de API)
ALTER TABLE public.member_edits DISABLE ROW LEVEL SECURITY;
