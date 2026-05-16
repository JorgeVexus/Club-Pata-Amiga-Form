-- Create pet_unsubscriptions table
CREATE TABLE IF NOT EXISTS pet_unsubscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    memberstack_id TEXT NOT NULL,
    pet_index INTEGER NOT NULL, -- 1, 2, or 3
    pet_name TEXT NOT NULL,
    reason TEXT NOT NULL, -- 'fallecimiento', 'ya no vive conmigo', 'otra'
    description TEXT,
    unsubscribed_by TEXT NOT NULL, -- Admin name or 'Usuario'
    unsubscribed_by_id TEXT, -- Memberstack ID of admin if applicable
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_pet_unsubscriptions_memberstack_id ON pet_unsubscriptions(memberstack_id);
CREATE INDEX IF NOT EXISTS idx_pet_unsubscriptions_created_at ON pet_unsubscriptions(created_at);

-- Add comment for documentation
COMMENT ON TABLE pet_unsubscriptions IS 'Logs for pet removals from memberships.';
