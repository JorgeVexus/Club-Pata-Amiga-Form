-- 📡 Add last_admin_response to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_admin_response TEXT;
