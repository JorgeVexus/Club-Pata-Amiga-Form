-- Solicitudes revisables de baja de mascotas y aniversario del Fondo Solidario.

ALTER TABLE public.pet_unsubscriptions
    ADD COLUMN IF NOT EXISTS status text,
    ADD COLUMN IF NOT EXISTS requested_at timestamptz,
    ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
    ADD COLUMN IF NOT EXISTS reviewed_by text,
    ADD COLUMN IF NOT EXISTS review_notes text;

-- Todos los registros anteriores representan bajas que ya se ejecutaron.
UPDATE public.pet_unsubscriptions
SET status = 'approved',
    requested_at = COALESCE(requested_at, created_at),
    reviewed_at = COALESCE(reviewed_at, created_at)
WHERE status IS NULL;

ALTER TABLE public.pet_unsubscriptions
    ALTER COLUMN status SET DEFAULT 'pending',
    ALTER COLUMN status SET NOT NULL,
    ALTER COLUMN requested_at SET DEFAULT now();

ALTER TABLE public.pet_unsubscriptions
    ADD CONSTRAINT pet_unsubscriptions_status_check
    CHECK (status IN ('pending', 'approved', 'rejected'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_pet_unsubscriptions_one_pending_pet
    ON public.pet_unsubscriptions(pet_id)
    WHERE status = 'pending' AND pet_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pet_unsubscriptions_status_requested
    ON public.pet_unsubscriptions(status, requested_at DESC);

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS first_payment_at timestamptz;

-- payment_completed_at contiene el mejor dato disponible para miembros actuales.
-- A partir de esta migración first_payment_at no se vuelve a sobrescribir.
UPDATE public.users
SET first_payment_at = COALESCE(payment_completed_at, created_at)
WHERE first_payment_at IS NULL;

COMMENT ON COLUMN public.pet_unsubscriptions.status IS
    'Flujo de revisión: pending, approved o rejected. Registros históricos se consideran approved.';

COMMENT ON COLUMN public.users.first_payment_at IS
    'Fecha inmutable del primer pago; ancla del ciclo anual de beneficios solidarios.';
