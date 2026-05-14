-- Sistema de cancelacion de membresias Pata Amiga
-- Ejecutar en Supabase SQL editor antes de activar el dashboard de cancelaciones.

CREATE TABLE IF NOT EXISTS membership_cancellations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    memberstack_id VARCHAR(255) NOT NULL,
    cancellation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    membership_end_date DATE NOT NULL,
    days_remaining_at_cancellation INTEGER NOT NULL DEFAULT 0,
    cancellation_reason VARCHAR(100) NOT NULL CHECK (
        cancellation_reason IN (
            'no_longer_needed',
            'price_too_high',
            'found_alternative',
            'service_issues',
            'other'
        )
    ),
    reason_other_text TEXT,
    comments TEXT,
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    subscription_interval VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cancellations_memberstack_id
    ON membership_cancellations(memberstack_id);

CREATE INDEX IF NOT EXISTS idx_cancellations_user_id
    ON membership_cancellations(user_id);

CREATE INDEX IF NOT EXISTS idx_cancellations_cancellation_date
    ON membership_cancellations(cancellation_date DESC);

CREATE INDEX IF NOT EXISTS idx_cancellations_reason
    ON membership_cancellations(cancellation_reason);

ALTER TABLE membership_cancellations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access" ON membership_cancellations;
CREATE POLICY "Service role full access" ON membership_cancellations
    FOR ALL USING (auth.role() = 'service_role');
