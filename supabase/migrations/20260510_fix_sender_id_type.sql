-- ============================================================
-- MIGRACIÓN: Corregir tipo de dato de sender_id
-- Fecha: 10 de Mayo, 2026
-- Objetivo: Permitir IDs de Memberstack (text) como sender_id
-- ============================================================

-- 1. CAMBIAR TIPO DE COLUMNA
ALTER TABLE solidarity_messages 
ALTER COLUMN sender_id TYPE TEXT;

-- 2. COMENTARIO EXPLICATIVO
COMMENT ON COLUMN solidarity_messages.sender_role IS 'Rol de quien envía (admin o user)';
COMMENT ON COLUMN solidarity_messages.sender_id IS 'ID de Memberstack del remitente (formato texto para soportar mem_...)';
