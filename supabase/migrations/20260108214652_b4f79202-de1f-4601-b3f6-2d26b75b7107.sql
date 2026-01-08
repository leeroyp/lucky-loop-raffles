-- Create storage bucket for raffle images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('raffle-images', 'raffle-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

-- Allow anyone to view raffle images (public bucket)
CREATE POLICY "Anyone can view raffle images"
ON storage.objects FOR SELECT
USING (bucket_id = 'raffle-images');

-- Only admins can upload raffle images
CREATE POLICY "Admins can upload raffle images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'raffle-images' AND has_role(auth.uid(), 'ADMIN'::app_role));

-- Only admins can update raffle images
CREATE POLICY "Admins can update raffle images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'raffle-images' AND has_role(auth.uid(), 'ADMIN'::app_role));

-- Only admins can delete raffle images
CREATE POLICY "Admins can delete raffle images"
ON storage.objects FOR DELETE
USING (bucket_id = 'raffle-images' AND has_role(auth.uid(), 'ADMIN'::app_role));