-- Create swipes table
CREATE TABLE swipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    swiper_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    swiped_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('like', 'skip')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT different_users CHECK (swiper_id != swiped_id),
    CONSTRAINT unique_swipe UNIQUE (swiper_id, swiped_id)
);

-- Create indexes
CREATE INDEX swipes_swiper_id_idx ON swipes(swiper_id);
CREATE INDEX swipes_swiped_id_idx ON swipes(swiped_id);
CREATE INDEX swipes_action_idx ON swipes(action);

-- Enable RLS
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own swipes"
ON swipes FOR SELECT
TO authenticated
USING (auth.uid() = swiper_id);

CREATE POLICY "Users can create their own swipes"
ON swipes FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = swiper_id AND
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = swiped_id AND 
        id != auth.uid()
    )
);

-- Function to check if there's a mutual like
CREATE OR REPLACE FUNCTION check_mutual_like(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM swipes s1
        JOIN swipes s2 ON s1.swiper_id = s2.swiped_id AND s1.swiped_id = s2.swiper_id
        WHERE 
            s1.swiper_id = user1_id AND 
            s1.swiped_id = user2_id AND
            s1.action = 'like' AND 
            s2.action = 'like'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a match if there's a mutual like
CREATE OR REPLACE FUNCTION create_match_on_mutual_like()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if there's a mutual like
    IF NEW.action = 'like' AND EXISTS (
        SELECT 1 FROM swipes
        WHERE swiper_id = NEW.swiped_id
        AND swiped_id = NEW.swiper_id
        AND action = 'like'
    ) THEN
        -- Create a new match
        INSERT INTO matches (user1_id, user2_id)
        VALUES (
            LEAST(NEW.swiper_id, NEW.swiped_id),
            GREATEST(NEW.swiper_id, NEW.swiped_id)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic match creation
CREATE TRIGGER create_match_trigger
AFTER INSERT ON swipes
FOR EACH ROW
EXECUTE FUNCTION create_match_on_mutual_like(); 