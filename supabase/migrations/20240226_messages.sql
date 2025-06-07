-- Create messages table
CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    -- Add constraint to ensure sender is part of the match
    CONSTRAINT sender_in_match CHECK (
        sender_id IN (
            SELECT user1_id FROM matches WHERE id = match_id
            UNION
            SELECT user2_id FROM matches WHERE id = match_id
        )
    )
);

-- Create indexes for better performance
CREATE INDEX messages_match_id_idx ON messages(match_id);
CREATE INDEX messages_sender_id_idx ON messages(sender_id);
CREATE INDEX messages_created_at_idx ON messages(created_at);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view messages in their matches
CREATE POLICY "Users can view messages in their matches"
ON messages FOR SELECT
TO authenticated
USING (
    auth.uid() IN (
        SELECT user1_id FROM matches WHERE id = match_id
        UNION
        SELECT user2_id FROM matches WHERE id = match_id
    )
);

-- Create policy to allow users to send messages in their matches
CREATE POLICY "Users can send messages in their matches"
ON messages FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = sender_id AND
    auth.uid() IN (
        SELECT user1_id FROM matches WHERE id = match_id AND match_status = 'active'
        UNION
        SELECT user2_id FROM matches WHERE id = match_id AND match_status = 'active'
    )
);

-- Create policy to allow users to delete their own messages
CREATE POLICY "Users can delete their own messages"
ON messages FOR DELETE
TO authenticated
USING (
    auth.uid() = sender_id
);

-- Create function to get messages for a match
CREATE OR REPLACE FUNCTION get_match_messages(
    match_id_param UUID,
    limit_val INTEGER DEFAULT 50,
    before_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    match_id UUID,
    sender_id UUID,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT m.*
    FROM messages m
    WHERE 
        m.match_id = match_id_param AND
        (before_timestamp IS NULL OR m.created_at < before_timestamp) AND
        -- Verify user is part of the match
        auth.uid() IN (
            SELECT user1_id FROM matches WHERE id = match_id_param
            UNION
            SELECT user2_id FROM matches WHERE id = match_id_param
        )
    ORDER BY m.created_at DESC
    LIMIT limit_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get latest message for each match
CREATE OR REPLACE FUNCTION get_latest_messages_by_matches(
    user_id_param UUID,
    limit_val INTEGER DEFAULT 20
)
RETURNS TABLE (
    match_id UUID,
    last_message_id UUID,
    last_message_content TEXT,
    last_message_sender_id UUID,
    last_message_created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    WITH RankedMessages AS (
        SELECT 
            m.match_id,
            m.id as message_id,
            m.content,
            m.sender_id,
            m.created_at,
            ROW_NUMBER() OVER (PARTITION BY m.match_id ORDER BY m.created_at DESC) as rn
        FROM messages m
        JOIN matches mt ON m.match_id = mt.id
        WHERE 
            (mt.user1_id = user_id_param OR mt.user2_id = user_id_param) AND
            mt.match_status = 'active'
    )
    SELECT 
        match_id,
        message_id,
        content,
        sender_id,
        created_at
    FROM RankedMessages
    WHERE rn = 1
    ORDER BY created_at DESC
    LIMIT limit_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 