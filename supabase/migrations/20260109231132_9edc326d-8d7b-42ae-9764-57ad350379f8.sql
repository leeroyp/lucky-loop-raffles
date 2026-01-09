-- Create atomic function to submit raffle entry
-- This prevents race conditions by doing check, insert, and decrement in one transaction
CREATE OR REPLACE FUNCTION public.submit_raffle_entry(
  raffle_uuid UUID,
  entry_type entry_source
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  raffle_status raffle_status;
  updated_rows INTEGER;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Check raffle exists and is LIVE
  SELECT status INTO raffle_status
  FROM raffles
  WHERE id = raffle_uuid;
  
  IF raffle_status IS NULL THEN
    RAISE EXCEPTION 'Raffle not found';
  END IF;
  
  IF raffle_status != 'LIVE' THEN
    RAISE EXCEPTION 'Raffle is not accepting entries';
  END IF;
  
  -- For NPN entries, check if user already has one for this raffle
  IF entry_type = 'NPN' THEN
    IF EXISTS (
      SELECT 1 FROM entries 
      WHERE raffle_id = raffle_uuid 
        AND user_id = current_user_id 
        AND source = 'NPN'
    ) THEN
      RAISE EXCEPTION 'Already used NPN entry for this raffle';
    END IF;
  END IF;
  
  -- For SUBSCRIPTION entries, atomically decrement entries_remaining
  IF entry_type = 'SUBSCRIPTION' THEN
    UPDATE profiles 
    SET entries_remaining = entries_remaining - 1
    WHERE id = current_user_id AND entries_remaining > 0;
    
    GET DIAGNOSTICS updated_rows = ROW_COUNT;
    
    IF updated_rows = 0 THEN
      RETURN FALSE; -- No entries remaining
    END IF;
  END IF;
  
  -- Insert the entry
  INSERT INTO entries (raffle_id, user_id, source)
  VALUES (raffle_uuid, current_user_id, entry_type);
  
  RETURN TRUE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.submit_raffle_entry(UUID, entry_source) TO authenticated;