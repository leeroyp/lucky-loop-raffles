-- Drop the existing user policy that only shows referrer's referrals
DROP POLICY IF EXISTS "Users can view their referrals" ON public.referrals;

-- Create a more comprehensive policy that allows users to see referrals where they are involved
-- Either as the referrer OR as the referred user
CREATE POLICY "Users can view their own referrals"
ON public.referrals
FOR SELECT
USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);