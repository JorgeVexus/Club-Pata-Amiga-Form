-- ============================================================
-- MIGRACIÓN: Sistema de Interacción y Mensajería de Solidaridad
-- Fecha: 9 de Mayo, 2026
-- Objetivo: Habilitar el canal de comunicación entre admin y usuario
-- ============================================================

-- 1. TABLA DE MENSAJES (CHAT)
CREATE TABLE IF NOT EXISTS solidarity_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID REFERENCES solidarity_requests(id) ON DELETE CASCADE,
    sender_role VARCHAR(20) NOT NULL CHECK (sender_role IN ('admin', 'user')),
    sender_id UUID, -- Puede ser el ID del admin o del usuario
    message TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb, -- Array de {name, url, type}
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexar para búsquedas por solicitud
CREATE INDEX IF NOT EXISTS idx_solidarity_messages_request ON solidarity_messages(request_id);

-- 2. SEGURIDAD (RLS)
ALTER TABLE solidarity_messages ENABLE ROW LEVEL SECURITY;

-- Usuarios pueden ver mensajes de sus propias solicitudes
CREATE POLICY "Users can view messages for own requests" ON solidarity_messages
    FOR SELECT TO authenticated USING (
        request_id IN (
            SELECT id FROM solidarity_requests 
            WHERE user_id IN (SELECT id FROM users WHERE memberstack_id = auth.uid()::text)
        )
    );

-- Usuarios pueden enviar mensajes a sus propias solicitudes
CREATE POLICY "Users can send messages to own requests" ON solidarity_messages
    FOR INSERT TO authenticated WITH CHECK (
        request_id IN (
            SELECT id FROM solidarity_requests 
            WHERE user_id IN (SELECT id FROM users WHERE memberstack_id = auth.uid()::text)
        )
        AND sender_role = 'user'
    );

-- Service Role tiene acceso total (Admin Dashboard)
CREATE POLICY "Service role full access solidarity_messages" ON solidarity_messages
    FOR ALL TO service_role USING (true);

-- 3. ACTUALIZAR ESTADOS DE SOLICITUD (Opcional, asegurar consistencia)
-- Los estados válidos definidos previamente son: 'new', 'in_review', 'needs_info', 'approved', 'rejected', 'completed'

-- 4. COMENTARIOS
COMMENT ON TABLE solidarity_messages IS 'Historial de comunicación entre administradores y usuarios para casos de solidaridad';
COMMENT ON COLUMN solidarity_messages.sender_role IS 'Rol de quien envía el mensaje (admin o user)';
COMMENT ON COLUMN solidarity_messages.attachments IS 'Metadatos de archivos adjuntos en el mensaje';
