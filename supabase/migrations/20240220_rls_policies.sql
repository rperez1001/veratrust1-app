-- Enable RLS on the profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for the profiles table
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile"
ON profiles FOR DELETE
USING (auth.uid() = user_id);

-- Enable RLS on storage buckets
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ID Documents bucket policies
CREATE POLICY "Users can upload their own ID documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'id-documents' AND
  (storage.foldername(name))[1] = auth.uid()
);

CREATE POLICY "Users can view their own ID documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'id-documents' AND
  (storage.foldername(name))[1] = auth.uid()
);

CREATE POLICY "Users can update their own ID documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'id-documents' AND
  (storage.foldername(name))[1] = auth.uid()
);

CREATE POLICY "Users can delete their own ID documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'id-documents' AND
  (storage.foldername(name))[1] = auth.uid()
);

-- Profile Photos bucket policies
CREATE POLICY "Users can upload their own profile photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = auth.uid()
);

CREATE POLICY "Anyone can view profile photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can update their own profile photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = auth.uid()
);

CREATE POLICY "Users can delete their own profile photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = auth.uid()
);

-- Intro Videos bucket policies
CREATE POLICY "Users can upload their own intro videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'intro-videos' AND
  (storage.foldername(name))[1] = auth.uid()
);

CREATE POLICY "Anyone can view intro videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'intro-videos');

CREATE POLICY "Users can update their own intro videos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'intro-videos' AND
  (storage.foldername(name))[1] = auth.uid()
);

CREATE POLICY "Users can delete their own intro videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'intro-videos' AND
  (storage.foldername(name))[1] = auth.uid()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON profiles(user_id);
CREATE INDEX IF NOT EXISTS storage_objects_bucket_name_idx ON storage.objects(bucket_id, name); 