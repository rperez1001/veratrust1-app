-- Create swipes table
CREATE TABLE swipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    swiper_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    swiped_profile_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT CHECK (action IN ('like', 'skip')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(swiper_id, swiped_profile_id)
);

-- Set up Row Level Security (RLS)
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own swipes"
ON swipes FOR SELECT
USING (auth.uid() = swiper_id);

CREATE POLICY "Users can create their own swipes"
ON swipes FOR INSERT
WITH CHECK (auth.uid() = swiper_id);

-- Create indexes for better performance
CREATE INDEX swipes_swiper_id_idx ON swipes(swiper_id);
CREATE INDEX swipes_swiped_profile_id_idx ON swipes(swiped_profile_id);

-- Comments for documentation
COMMENT ON TABLE swipes IS 'Records of user swipe actions (like/skip) on other profiles';
COMMENT ON COLUMN swipes.swiper_id IS 'The user who performed the swipe action';
COMMENT ON COLUMN swipes.swiped_profile_id IS 'The profile that was swiped on';
COMMENT ON COLUMN swipes.action IS 'The type of swipe action (like or skip)';
COMMENT ON COLUMN swipes.created_at IS 'When the swipe action occurred'; 