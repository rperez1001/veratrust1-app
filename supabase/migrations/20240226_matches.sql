-- Create matches table
CREATE TABLE matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    match_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    match_status TEXT DEFAULT 'active'
    CHECK (match_status IN ('active', 'blocked', 'unmatched')),
    CONSTRAINT different_users CHECK (user1_id != user2_id),
    CONSTRAINT unique_match UNIQUE (user1_id, user2_id)
);

-- Create index for faster lookups
CREATE INDEX matches_user1_id_idx ON matches(user1_id);
CREATE INDEX matches_user2_id_idx ON matches(user2_id);
CREATE INDEX matches_match_date_idx ON matches(match_date);
CREATE INDEX matches_match_status_idx ON matches(match_status);

-- Enable Row Level Security
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own matches
CREATE POLICY "Users can view their own matches"
ON matches FOR SELECT
TO authenticated
USING (
    auth.uid() = user1_id OR 
    auth.uid() = user2_id
);

-- Create policy to allow users to create matches
CREATE POLICY "Users can create matches"
ON matches FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = user1_id AND
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user2_id AND 
        -- Add any additional checks here (e.g., not blocked, within age range, etc.)
        id != auth.uid()
    )
);

-- Create policy to allow users to update their own matches
CREATE POLICY "Users can update their own matches"
ON matches FOR UPDATE
TO authenticated
USING (
    auth.uid() IN (user1_id, user2_id)
)
WITH CHECK (
    auth.uid() IN (user1_id, user2_id) AND
    -- Prevent changing the users involved
    user1_id = OLD.user1_id AND
    user2_id = OLD.user2_id
);

-- Create policy to allow users to delete their own matches
CREATE POLICY "Users can delete their own matches"
ON matches FOR DELETE
TO authenticated
USING (
    auth.uid() IN (user1_id, user2_id)
);

-- Create function to check if users are matched
CREATE OR REPLACE FUNCTION are_users_matched(user_a UUID, user_b UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM matches
        WHERE (
            (user1_id = user_a AND user2_id = user_b) OR
            (user1_id = user_b AND user2_id = user_a)
        ) AND match_status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user's matches
CREATE OR REPLACE FUNCTION get_user_matches(
    user_id UUID,
    status TEXT DEFAULT 'active',
    limit_val INTEGER DEFAULT 50,
    offset_val INTEGER DEFAULT 0
)
RETURNS TABLE (
    match_id UUID,
    matched_user_id UUID,
    match_date TIMESTAMP WITH TIME ZONE,
    match_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id as match_id,
        CASE 
            WHEN m.user1_id = user_id THEN m.user2_id
            ELSE m.user1_id
        END as matched_user_id,
        m.match_date,
        m.match_status
    FROM matches m
    WHERE 
        (m.user1_id = user_id OR m.user2_id = user_id) AND
        (status IS NULL OR m.match_status = status)
    ORDER BY m.match_date DESC
    LIMIT limit_val
    OFFSET offset_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 