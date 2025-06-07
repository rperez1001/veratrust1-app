-- Create user preferences table
CREATE TABLE user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    min_age INTEGER CHECK (min_age >= 18),
    max_age INTEGER CHECK (max_age <= 100),
    relationship_goals TEXT[] CHECK (array_length(relationship_goals, 1) > 0),
    max_distance INTEGER,
    min_trust_score INTEGER DEFAULT 60 CHECK (min_trust_score >= 0 AND min_trust_score <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT valid_age_range CHECK (min_age <= max_age),
    CONSTRAINT one_preference_per_user UNIQUE (user_id)
);

-- Create index for faster lookups
CREATE INDEX user_preferences_user_id_idx ON user_preferences(user_id);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own preferences"
ON user_preferences FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
ON user_preferences FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
ON user_preferences FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences"
ON user_preferences FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default preferences for existing users
INSERT INTO user_preferences (user_id, min_age, max_age, relationship_goals, min_trust_score)
SELECT 
    id as user_id,
    18 as min_age,
    100 as max_age,
    ARRAY['dating', 'relationship', 'marriage'] as relationship_goals,
    60 as min_trust_score
FROM auth.users
ON CONFLICT (user_id) DO NOTHING; 