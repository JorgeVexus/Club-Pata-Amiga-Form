-- ⚖️ Phase 3: Appeals & Per-Pet Approval System - Database Schema

-- 1. Actualizar Tabla de Mascotas (public.pets)
-- Añadimos granularidad para aprobar/rechazar cada mascota individualmente
ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'action_required', 'rejected'));
ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS admin_notes TEXT; -- Razón específica para esta mascota

-- 2. Actualizar Tabla de Usuarios (public.users)
-- Añadimos seguimiento global de apelación
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_appeal_message TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS action_required_fields JSONB DEFAULT '[]'; -- Ej: ["ine_frontal", "pet_1_photo"]

-- 3. Tabla de Logs de Apelación (public.appeal_logs)
-- Lleva el registro de la "conversación" o solicitudes de información
CREATE TABLE IF NOT EXISTS public.appeal_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL, -- Memberstack ID
    admin_id VARCHAR(255), -- ID del administrador
    type TEXT NOT NULL CHECK (type IN ('user_appeal', 'admin_request', 'user_update', 'system')),
    message TEXT,
    metadata JSONB DEFAULT '{}', -- Para listar qué campos se pidieron o qué archivos se subieron
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Habilitar RLS en appeal_logs
ALTER TABLE public.appeal_logs ENABLE ROW LEVEL SECURITY;

-- 5. Políticas para appeal_logs
-- Usuario puede ver sus propios logs y crear 'user_appeal'/'user_update'
CREATE POLICY "Users can view their own appeal logs" 
ON public.appeal_logs FOR SELECT 
TO authenticated 
USING (user_id = auth.uid()::text);

CREATE POLICY "Users can create their own appeal logs" 
ON public.appeal_logs FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid()::text AND type IN ('user_appeal', 'user_update'));

-- Admins pueden hacer todo
CREATE POLICY "Admins can manage appeal logs" 
ON public.appeal_logs FOR ALL 
TO authenticated 
USING (EXISTS (SELECT 1 FROM public.users WHERE memberstack_id = auth.uid()::text AND (role = 'admin' OR role = 'super_admin')));
