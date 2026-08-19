-- Add active flag for Transporters (mirrors the original Zoho "Make Active / Make Inactive")
ALTER TABLE public.transporters ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;