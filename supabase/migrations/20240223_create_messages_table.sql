-- Create messages table
CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for better query performance
CREATE INDEX messages_match_id_idx ON messages(match_id);
CREATE INDEX messages_sender_id_idx ON messages(sender_id);
CREATE INDEX messages_receiver_id_idx ON messages(receiver_id);
CREATE INDEX messages_created_at_idx ON messages(created_at);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can only view messages if they are part of the match
CREATE POLICY "Users can view messages if they are part of the match" ON messages
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM matches
        WHERE id = messages.match_id
        AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
);

-- Users can only insert messages if they are part of the match and are the sender
CREATE POLICY "Users can insert messages if they are part of the match" ON messages
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM matches
        WHERE id = match_id
        AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
    AND sender_id = auth.uid()
);

-- Add function to validate message insertion
CREATE OR REPLACE FUNCTION validate_message_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Verify that sender and receiver are part of the match
    IF NOT EXISTS (
        SELECT 1 FROM matches
        WHERE id = NEW.match_id
        AND (
            (user1_id = NEW.sender_id AND user2_id = NEW.receiver_id)
            OR
            (user1_id = NEW.receiver_id AND user2_id = NEW.sender_id)
        )
    ) THEN
        RAISE EXCEPTION 'Invalid sender or receiver for this match';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for message validation
CREATE TRIGGER validate_message_trigger
BEFORE INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION validate_message_insert();

-- Comments for documentation
COMMENT ON TABLE messages IS 'Stores chat messages between matched users';
COMMENT ON COLUMN messages.match_id IS 'Reference to the match between users';
COMMENT ON COLUMN messages.sender_id IS 'User who sent the message';
COMMENT ON COLUMN messages.receiver_id IS 'User who receives the message';
COMMENT ON COLUMN messages.content IS 'Message content';
COMMENT ON COLUMN messages.created_at IS 'When the message was sent';
COMMENT ON COLUMN messages.read_at IS 'When the message was read by the receiver'; 