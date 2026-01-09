-- Add minimum entries column to raffles table
ALTER TABLE public.raffles 
ADD COLUMN min_entries integer DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.raffles.min_entries IS 'Minimum number of entries required before draw. If not met, draw is extended by 1 day.';