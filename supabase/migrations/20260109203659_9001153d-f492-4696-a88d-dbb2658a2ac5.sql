-- Add referral_code column to profiles
ALTER TABLE public.profiles 
ADD COLUMN referral_code TEXT UNIQUE DEFAULT gen_random_uuid()::text;

-- Create referrals table to track referral relationships
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entries_credited BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  credited_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(referred_user_id)
);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Users can view their own referrals (as referrer)
CREATE POLICY "Users can view their referrals"
ON public.referrals
FOR SELECT
USING (auth.uid() = referrer_id);

-- Admins can view all referrals
CREATE POLICY "Admins can view all referrals"
ON public.referrals
FOR SELECT
USING (has_role(auth.uid(), 'ADMIN'));

-- System inserts referrals (via trigger)
CREATE POLICY "System can insert referrals"
ON public.referrals
FOR INSERT
WITH CHECK (auth.uid() = referred_user_id);

-- Function to process referral and credit entries
CREATE OR REPLACE FUNCTION public.process_referral(referral_code_input TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referrer_profile_id UUID;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- Don't allow self-referral
  SELECT id INTO referrer_profile_id 
  FROM profiles 
  WHERE referral_code = referral_code_input AND id != current_user_id;
  
  IF referrer_profile_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if referral already exists for this user
  IF EXISTS (SELECT 1 FROM referrals WHERE referred_user_id = current_user_id) THEN
    RETURN false;
  END IF;
  
  -- Create referral record
  INSERT INTO referrals (referrer_id, referred_user_id, entries_credited, credited_at)
  VALUES (referrer_profile_id, current_user_id, true, now());
  
  -- Credit 2 entries to referrer
  UPDATE profiles 
  SET entries_remaining = entries_remaining + 2 
  WHERE id = referrer_profile_id;
  
  RETURN true;
END;
$$;