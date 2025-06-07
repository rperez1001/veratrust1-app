-- Drop existing swipes table if it exists
DROP TABLE IF EXISTS swipes;

-- Create swipes table with updated schema
CREATE TABLE swipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    liked_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT CHECK (action IN ('like', 'skip')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user_id, liked_user_id)
);

-- Create matches table
CREATE TABLE matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    match_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user1_id, user2_id)
);

-- Add constraint to ensure user1_id < user2_id (to prevent duplicate matches)
ALTER TABLE matches
ADD CONSTRAINT user_order_check CHECK (user1_id < user2_id);

-- Set up Row Level Security (RLS)
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Swipes policies
CREATE POLICY "Users can view their own swipes"
ON swipes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own swipes"
ON swipes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Matches policies
CREATE POLICY "Users can view their own matches"
ON matches FOR SELECT
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Function to check for and create matches
CREATE OR REPLACE FUNCTION check_and_create_match()
RETURNS TRIGGER AS $$
DECLARE
    reverse_like_exists BOOLEAN;
    smaller_id UUID;
    larger_id UUID;
BEGIN
    -- Only proceed if this is a 'like' action
    IF NEW.action = 'like' THEN
        -- Check if there's a mutual like
        SELECT EXISTS (
            SELECT 1 FROM swipes
            WHERE user_id = NEW.liked_user_id
            AND liked_user_id = NEW.user_id
            AND action = 'like'
        ) INTO reverse_like_exists;

        -- If mutual like exists, create a match
        IF reverse_like_exists THEN
            -- Determine smaller and larger IDs to maintain consistent ordering
            IF NEW.user_id < NEW.liked_user_id THEN
                smaller_id := NEW.user_id;
                larger_id := NEW.liked_user_id;
            ELSE
                smaller_id := NEW.liked_user_id;
                larger_id := NEW.user_id;
            END IF;

            -- Insert match if it doesn't exist
            INSERT INTO matches (user1_id, user2_id)
            VALUES (smaller_id, larger_id)
            ON CONFLICT (user1_id, user2_id) DO NOTHING;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for match checking
CREATE TRIGGER check_match_trigger
AFTER INSERT ON swipes
FOR EACH ROW
EXECUTE FUNCTION check_and_create_match();

-- Create indexes for better performance
CREATE INDEX swipes_user_id_idx ON swipes(user_id);
CREATE INDEX swipes_liked_user_id_idx ON swipes(liked_user_id);
CREATE INDEX matches_user1_id_idx ON matches(user1_id);
CREATE INDEX matches_user2_id_idx ON matches(user2_id);

-- Comments for documentation
COMMENT ON TABLE swipes IS 'Records of user swipe actions (like/skip) on other profiles';
COMMENT ON TABLE matches IS 'Records of mutual matches between users';
COMMENT ON COLUMN swipes.user_id IS 'The user who performed the swipe action';
COMMENT ON COLUMN swipes.liked_user_id IS 'The profile that was swiped on';
COMMENT ON COLUMN swipes.action IS 'The type of swipe action (like or skip)';
COMMENT ON COLUMN matches.user1_id IS 'First user in the match (always the smaller ID)';
COMMENT ON COLUMN matches.user2_id IS 'Second user in the match (always the larger ID)';
COMMENT ON COLUMN matches.match_date IS 'When the match was created'; 