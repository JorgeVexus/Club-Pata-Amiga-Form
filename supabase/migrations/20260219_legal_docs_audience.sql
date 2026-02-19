-- Add target_audience column to legal_documents table
-- Values: 'members', 'ambassadors', 'both'

ALTER TABLE public.legal_documents 
ADD COLUMN IF NOT EXISTS target_audience text DEFAULT 'both';

-- Add check constraint for valid values
ALTER TABLE public.legal_documents 
DROP CONSTRAINT IF EXISTS legal_documents_target_audience_check;

ALTER TABLE public.legal_documents 
ADD CONSTRAINT legal_documents_target_audience_check 
CHECK (target_audience IN ('members', 'ambassadors', 'both'));

-- Update existing documents to 'both' for backwards compatibility
UPDATE public.legal_documents 
SET target_audience = 'both' 
WHERE target_audience IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.legal_documents.target_audience IS 'Target audience: members (solo miembros), ambassadors (solo embajadores), both (ambos)';
