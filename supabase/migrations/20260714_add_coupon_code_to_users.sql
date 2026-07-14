-- Migration: Add coupon_code to users table
-- Target: public.users
ALTER TABLE users ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50);
