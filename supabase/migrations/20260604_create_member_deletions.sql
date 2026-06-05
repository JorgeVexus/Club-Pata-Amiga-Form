-- Create member_deletions table
CREATE TABLE IF NOT EXISTS member_deletions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id TEXT NOT NULL,
    member_name TEXT NOT NULL,
    member_email TEXT NOT NULL,
    deleted_by_name TEXT NOT NULL,
    deleted_by_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_member_deletions_created_at ON member_deletions(created_at);

-- Add comment for documentation
COMMENT ON TABLE member_deletions IS 'Logs for member deletions by admins.';

-- Enable RLS
ALTER TABLE member_deletions ENABLE ROW LEVEL SECURITY;

-- Policy for full service_role access
CREATE POLICY "Service role full access member_deletions" 
ON member_deletions 
FOR ALL 
TO service_role 
USING (true);
