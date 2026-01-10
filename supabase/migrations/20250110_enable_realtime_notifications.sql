-- =====================================================
-- Habilitar Supabase Realtime para notificaciones
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. Habilitar replicación para la tabla notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 2. Asegurar que la tabla tiene las políticas RLS correctas
-- (Si ya tienes RLS habilitado, estas políticas permiten leer notificaciones)

-- Política para que los admins puedan leer notificaciones de admin
CREATE POLICY IF NOT EXISTS "Admins can read admin notifications"
ON notifications FOR SELECT
USING (user_id = 'admin' OR auth.uid()::text = user_id);

-- Política para insertar notificaciones (sistema)
CREATE POLICY IF NOT EXISTS "System can insert notifications"
ON notifications FOR INSERT
WITH CHECK (true);

-- Política para actualizar notificaciones (marcar como leídas)
CREATE POLICY IF NOT EXISTS "Users can update own notifications"
ON notifications FOR UPDATE
USING (user_id = 'admin' OR auth.uid()::text = user_id);

-- Verificar que Realtime está habilitado
-- Puedes verificar en: Database > Replication > supabase_realtime
-- La tabla 'notifications' debería aparecer listada

-- =====================================================
-- NOTA: Si recibes error "relation already exists", es normal.
-- Significa que la tabla ya está en la publicación.
-- =====================================================
