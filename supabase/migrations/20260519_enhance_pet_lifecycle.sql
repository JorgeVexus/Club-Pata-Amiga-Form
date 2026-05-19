ALTER TABLE public.pets
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS memberstack_slot INTEGER,
ADD COLUMN IF NOT EXISTS unsubscribed_reason TEXT,
ADD COLUMN IF NOT EXISTS unsubscribed_description TEXT,
ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.pet_unsubscriptions
ADD COLUMN IF NOT EXISTS pet_id UUID;

CREATE INDEX IF NOT EXISTS idx_pets_owner_active ON public.pets(owner_id, is_active);
CREATE INDEX IF NOT EXISTS idx_pets_memberstack_slot ON public.pets(owner_id, memberstack_slot);
CREATE INDEX IF NOT EXISTS idx_pet_unsubscriptions_pet_id ON public.pet_unsubscriptions(pet_id);
