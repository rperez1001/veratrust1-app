-- Add premium-related columns to profiles
ALTER TABLE profiles
ADD COLUMN subscription_tier TEXT NOT NULL DEFAULT 'free'
CHECK (subscription_tier IN ('free', 'premium', 'premium_plus')),
ADD COLUMN subscription_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN subscription_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN location_country TEXT,
ADD COLUMN location_city TEXT,
ADD COLUMN relationship_type TEXT[]
CHECK (relationship_type <@ ARRAY['monogamy', 'polyamory', 'open', 'other']),
ADD COLUMN relationship_intentions TEXT[]
CHECK (relationship_intentions <@ ARRAY['marriage', 'long_term', 'casual', 'friendship', 'undecided']),
ADD COLUMN values_and_interests TEXT[],
ADD COLUMN latitude DOUBLE PRECISION,
ADD COLUMN longitude DOUBLE PRECISION;

-- Create subscription plans table
CREATE TABLE subscription_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    price_monthly DECIMAL(10,2) NOT NULL,
    price_yearly DECIMAL(10,2) NOT NULL,
    features JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create video calls table
CREATE TABLE video_calls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    caller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'missed')),
    scheduled_for TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    room_id TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create AI matching scores table
CREATE TABLE matching_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    compatibility_score INTEGER NOT NULL
    CHECK (compatibility_score BETWEEN 0 AND 100),
    shared_values TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user1_id, user2_id)
);

-- Add indexes
CREATE INDEX profiles_subscription_tier_idx ON profiles(subscription_tier);
CREATE INDEX profiles_location_country_idx ON profiles(location_country);
CREATE INDEX profiles_location_city_idx ON profiles(location_city);
CREATE INDEX video_calls_status_idx ON video_calls(status);
CREATE INDEX video_calls_scheduled_for_idx ON video_calls(scheduled_for);
CREATE INDEX matching_scores_compatibility_idx ON matching_scores(compatibility_score);

-- Add spatial index for location-based queries
CREATE EXTENSION IF NOT EXISTS postgis;
ALTER TABLE profiles ADD COLUMN location_geom geometry(Point, 4326);
CREATE INDEX profiles_location_geom_idx ON profiles USING GIST(location_geom);

-- Function to update location geometry
CREATE OR REPLACE FUNCTION update_location_geom()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location_geom = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update geometry when lat/long changes
CREATE TRIGGER update_profile_location
    BEFORE INSERT OR UPDATE OF latitude, longitude ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_location_geom();

-- Insert default subscription plans
INSERT INTO subscription_plans (name, price_monthly, price_yearly, features) VALUES
('free', 0, 0, '{
    "swipes_per_day": 10,
    "can_see_likes": false,
    "global_search": false,
    "video_calls": false,
    "hide_ads": false
}'::jsonb),
('premium', 9.99, 99.99, '{
    "swipes_per_day": 100,
    "can_see_likes": true,
    "global_search": true,
    "video_calls": true,
    "hide_ads": true
}'::jsonb),
('premium_plus', 19.99, 199.99, '{
    "swipes_per_day": -1,
    "can_see_likes": true,
    "global_search": true,
    "video_calls": true,
    "hide_ads": true,
    "priority_matches": true,
    "incognito_mode": true
}'::jsonb);

-- Add RLS policies
ALTER TABLE video_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE matching_scores ENABLE ROW LEVEL SECURITY;

-- Video calls policies
CREATE POLICY "Users can view their own video calls"
ON video_calls FOR SELECT
TO authenticated
USING (auth.uid() IN (caller_id, receiver_id));

CREATE POLICY "Users can create video calls"
ON video_calls FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = caller_id);

CREATE POLICY "Users can update their own video calls"
ON video_calls FOR UPDATE
TO authenticated
USING (auth.uid() IN (caller_id, receiver_id));

-- Matching scores policies
CREATE POLICY "Users can view their own matching scores"
ON matching_scores FOR SELECT
TO authenticated
USING (auth.uid() IN (user1_id, user2_id));

-- Function to calculate distance between users
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DOUBLE PRECISION,
    lon1 DOUBLE PRECISION,
    lat2 DOUBLE PRECISION,
    lon2 DOUBLE PRECISION
) RETURNS DOUBLE PRECISION AS $$
BEGIN
    RETURN ST_DistanceSphere(
        ST_MakePoint(lon1, lat1),
        ST_MakePoint(lon2, lat2)
    ) / 1000; -- Convert to kilometers
END;
$$ LANGUAGE plpgsql; 