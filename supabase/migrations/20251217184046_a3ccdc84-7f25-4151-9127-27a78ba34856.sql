-- Create a function to get entry count that's accessible to everyone
CREATE OR REPLACE FUNCTION public.get_raffle_entry_count(raffle_uuid uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer FROM entries WHERE raffle_id = raffle_uuid;
$$;