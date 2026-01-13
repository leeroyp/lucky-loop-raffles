-- Add policy to allow all authenticated users to view LIVE and CLOSED raffles
-- This is needed because the public_raffles view uses security_invoker=true
-- which respects the RLS policies of the underlying raffles table

CREATE POLICY "Authenticated users can view live and closed raffles"
ON public.raffles
FOR SELECT
TO authenticated
USING (status IN ('LIVE', 'CLOSED'));