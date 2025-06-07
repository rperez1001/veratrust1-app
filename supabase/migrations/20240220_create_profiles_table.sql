-- Create profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    age INTEGER CHECK (age >= 18 AND age <= 120),
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    location TEXT,
    relationship_goal TEXT CHECK (relationship_goal IN (
        'long-term',
        'marriage',
        'poly',
        'casual',
        'friendship'
    )),
    values TEXT[] DEFAULT '{}',
    id_uploaded BOOLEAN DEFAULT false,
    photo_uploaded BOOLEAN DEFAULT false,
    video_uploaded BOOLEAN DEFAULT false,
    trust_score INTEGER DEFAULT 0 CHECK (trust_score >= 0 AND trust_score <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate trust score
CREATE OR REPLACE FUNCTION calculate_trust_score()
RETURNS TRIGGER AS $$
BEGIN
    NEW.trust_score := 
        (CASE WHEN NEW.id_uploaded THEN 20 ELSE 0 END) +
        (CASE WHEN NEW.photo_uploaded THEN 20 ELSE 0 END) +
        (CASE WHEN NEW.video_uploaded THEN 30 ELSE 0 END) +
        (CASE WHEN NEW.full_name IS NOT NULL 
              AND NEW.age IS NOT NULL 
              AND NEW.gender IS NOT NULL 
              AND NEW.location IS NOT NULL 
              AND NEW.relationship_goal IS NOT NULL 
              AND array_length(NEW.values, 1) > 0 
        THEN 30 ELSE 0 END);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically calculate trust score
CREATE TRIGGER calculate_profile_trust_score
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION calculate_trust_score();

-- Set up Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can create their own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can delete their own profile"
ON profiles FOR DELETE
USING (auth.uid() = id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id)
    VALUES (new.id)
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Comments for documentation
COMMENT ON TABLE profiles IS 'User profiles for the VeraTrust dating app';
COMMENT ON COLUMN profiles.id IS 'Primary key, matches auth.users.id';
COMMENT ON COLUMN profiles.full_name IS 'User''s full name';
COMMENT ON COLUMN profiles.email IS 'Email (optional, can fetch from auth)';
COMMENT ON COLUMN profiles.age IS 'User''s age (must be 18 or older)';
COMMENT ON COLUMN profiles.gender IS 'User''s gender identity';
COMMENT ON COLUMN profiles.location IS 'User''s location (city, country)';
COMMENT ON COLUMN profiles.relationship_goal IS 'What the user is looking for';
COMMENT ON COLUMN profiles.values IS 'Array of personal values';
COMMENT ON COLUMN profiles.id_uploaded IS 'True if ID document has been uploaded';
COMMENT ON COLUMN profiles.photo_uploaded IS 'True if profile photo has been uploaded';
COMMENT ON COLUMN profiles.video_uploaded IS 'True if intro video has been uploaded';
COMMENT ON COLUMN profiles.trust_score IS 'Calculated score from 0 to 100';
COMMENT ON COLUMN profiles.created_at IS 'When the profile was created';
COMMENT ON COLUMN profiles.updated_at IS 'Auto-updated timestamp'; 