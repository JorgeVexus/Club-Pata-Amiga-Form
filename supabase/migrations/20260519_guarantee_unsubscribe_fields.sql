-- ============================================
-- Migración: Campos de baja de mascotas + RLS
-- Fecha: 2025-05-19
-- Propósito: Crear tabla pet_unsubscriptions,
--            agregar campos a pets, y habilitar RLS
-- ============================================

-- 1. Crear tabla pet_unsubscriptions (si no existe)
CREATE TABLE IF NOT EXISTS public.pet_unsubscriptions (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    memberstack_id    text NOT NULL,
    pet_id            uuid REFERENCES public.pets(id) ON DELETE SET NULL,
    pet_index         integer NOT NULL,
    pet_name          text NOT NULL,
    reason            text NOT NULL,
    description       text,
    unsubscribed_by   text DEFAULT 'Usuario',
    unsubscribed_by_id text,
    created_at        timestamptz DEFAULT now(),
    updated_at        timestamptz DEFAULT now()
);

-- 2. Agregar campos faltantes a tabla pets
ALTER TABLE public.pets 
    ADD COLUMN IF NOT EXISTS unsubscribed_at timestamptz,
    ADD COLUMN IF NOT EXISTS unsubscribed_reason text,
    ADD COLUMN IF NOT EXISTS unsubscribed_description text;

-- 3. Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_pet_unsubscriptions_memberstack_id 
    ON public.pet_unsubscriptions(memberstack_id);

CREATE INDEX IF NOT EXISTS idx_pet_unsubscriptions_pet_id 
    ON public.pet_unsubscriptions(pet_id);

CREATE INDEX IF NOT EXISTS idx_pet_unsubscriptions_created_at 
    ON public.pet_unsubscriptions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pets_unsubscribed_at 
    ON public.pets(unsubscribed_at);

CREATE INDEX IF NOT EXISTS idx_pets_is_active 
    ON public.pets(is_active);

-- 4. Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_pet_unsubscriptions_updated_at 
    ON public.pet_unsubscriptions;
CREATE TRIGGER update_pet_unsubscriptions_updated_at
    BEFORE UPDATE ON public.pet_unsubscriptions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 5. HABILITAR RLS
-- ============================================

-- pet_unsubscriptions: tabla de auditoría de bajas
ALTER TABLE public.pet_unsubscriptions ENABLE ROW LEVEL SECURITY;

-- Service role (backend) puede hacer todo
CREATE POLICY IF NOT EXISTS "Service role full access pet_unsubscriptions"
    ON public.pet_unsubscriptions FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- Usuarios autenticados pueden ver sus propias bajas
CREATE POLICY IF NOT EXISTS "Users can view own unsubscriptions"
    ON public.pet_unsubscriptions FOR SELECT TO authenticated
    USING (memberstack_id = (SELECT raw_user_meta_data->>'memberstack_id' FROM auth.Users WHERE id = auth.uid()));

-- Adicionalmente, permitir INSERT por service_role y por usuarios autenticados
-- (aunque en práctica el endpoint de backend es quien inserta)
CREATE POLICY IF NOT EXISTS "Service role can insert unsubscriptions"
    ON public.pet_unsubscriptions FOR INSERT TO service_role
    WITH CHECK (true);

-- Tabla pets: mantener RLS existente y agregar índice
CREATE INDEX IF NOT EXISTS idx_pets_owner_active 
    ON public.pets(owner_id, is_active);

-- ============================================
-- 6. COMENTARIOS DE DOCUMENTACIÓN
-- ============================================

COMMENT ON TABLE public.pet_unsubscriptions IS 
    'Registro histórico de bajas de mascotas (auditoría). No se eliminan registros.';

COMMENT ON COLUMN public.pets.unsubscribed_at IS 
    'Fecha y hora en que la mascota fue dada de baja (timestamp con timezone)';

COMMENT ON COLUMN public.pets.unsubscribed_reason IS 
    'Motivo de la baja (copia para acceso rápido sin necesidad de JOIN)';

COMMENT ON COLUMN public.pets.unsubscribed_description IS 
    'Descripción adicional de la baja (opcional, capturada en el formulario)';

COMMENT ON COLUMN public.pet_unsubscriptions.pet_index IS 
    'Índice de la mascota en el array de Memberstack (1-based: 1, 2 o 3)';

COMMENT ON COLUMN public.pet_unsubscriptions.reason IS 
    'Motivo de la baja (código predefinido o texto libre)';

COMMENT ON COLUMN public.pet_unsubscriptions.unsubscribed_by IS 
    'Quién realizó la baja: Usuario, Admin, Comité (Solidaridad)';
