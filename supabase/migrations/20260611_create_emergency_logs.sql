-- ============================================================
-- MIGRACIÓN: Tabla de logs de botón de emergencia
-- Fecha: Junio 2026
-- Objetivo: Registrar cada vez que un usuario presiona el botón de emergencia
-- ============================================================

CREATE TABLE IF NOT EXISTS emergency_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relación con usuario
    memberstack_id VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_email VARCHAR(255) NOT NULL,
    
    -- Información de la emergencia
    phone_number VARCHAR(50) NOT NULL,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Metadatos opcionales para debugging
    user_agent TEXT,
    ip_address VARCHAR(45)
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_emergency_logs_memberstack_id ON emergency_logs(memberstack_id);
CREATE INDEX IF NOT EXISTS idx_emergency_logs_user_id ON emergency_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_logs_triggered_at ON emergency_logs(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_emergency_logs_memberstack_triggered ON emergency_logs(memberstack_id, triggered_at DESC);

-- Habilitar RLS
ALTER TABLE emergency_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
-- Los usuarios pueden ver sus propios logs
CREATE POLICY "Users can view own emergency logs" ON emergency_logs
    FOR SELECT TO authenticated USING (
        memberstack_id = auth.uid()::text
    );

-- Service Role tiene acceso total (para backend operations)
CREATE POLICY "Service role full access emergency_logs" ON emergency_logs 
    FOR ALL TO service_role USING (true);

-- Trigger para updated_at (no aplica ya que es solo insert, pero por consistencia)
-- No se necesita trigger updated_at ya que es tabla de solo append