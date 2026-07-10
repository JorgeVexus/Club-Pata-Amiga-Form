-- Migración: Chat en tiempo real entre embajador y administrador
-- Fecha: 2026-07-09
-- Motivo: Permitir a embajadores aprobados resolver dudas directamente con el admin.

CREATE TABLE IF NOT EXISTS public.ambassador_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ambassador_id UUID NOT NULL REFERENCES public.ambassadors(id) ON DELETE CASCADE,
    sender_role TEXT NOT NULL CHECK (sender_role IN ('ambassador', 'admin')),
    sender_name TEXT,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ambassador_messages_ambassador_id
    ON public.ambassador_messages(ambassador_id, created_at);

ALTER PUBLICATION supabase_realtime ADD TABLE public.ambassador_messages;
