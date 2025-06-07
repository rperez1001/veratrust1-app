-- Add role column to profiles
ALTER TABLE profiles
ADD COLUMN role TEXT NOT NULL DEFAULT 'user'
CHECK (role IN ('user', 'admin'));

-- Create reports table
CREATE TABLE reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Add indexes
CREATE INDEX reports_reporter_id_idx ON reports(reporter_id);
CREATE INDEX reports_reported_user_id_idx ON reports(reported_user_id);
CREATE INDEX reports_status_idx ON reports(status);

-- Add verification status columns to profiles
ALTER TABLE profiles
ADD COLUMN id_verified BOOLEAN DEFAULT false,
ADD COLUMN video_verified BOOLEAN DEFAULT false,
ADD COLUMN account_status TEXT NOT NULL DEFAULT 'active'
CHECK (account_status IN ('active', 'suspended', 'deleted'));

-- Enable RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Create policies for reports
CREATE POLICY "Users can create reports"
ON reports FOR INSERT
TO authenticated
WITH CHECK (
    reporter_id = auth.uid()
    AND reporter_id != reported_user_id
);

CREATE POLICY "Users can view their own reports"
ON reports FOR SELECT
TO authenticated
USING (reporter_id = auth.uid());

CREATE POLICY "Admins can view all reports"
ON reports FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    )
);

-- Create admin-only policies for profiles
CREATE POLICY "Admins can update verification status"
ON profiles FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    )
);

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE reports IS 'User reports for suspicious accounts';
COMMENT ON COLUMN reports.reporter_id IS 'User who created the report';
COMMENT ON COLUMN reports.reported_user_id IS 'User being reported';
COMMENT ON COLUMN reports.reason IS 'Main reason for the report';
COMMENT ON COLUMN reports.details IS 'Additional details about the report';
COMMENT ON COLUMN reports.status IS 'Current status of the report';
COMMENT ON COLUMN reports.reviewed_at IS 'When the report was reviewed by admin';
COMMENT ON COLUMN reports.reviewed_by IS 'Admin who reviewed the report';

COMMENT ON COLUMN profiles.role IS 'User role (user or admin)';
COMMENT ON COLUMN profiles.id_verified IS 'Whether ID has been verified by admin';
COMMENT ON COLUMN profiles.video_verified IS 'Whether intro video has been verified by admin';
COMMENT ON COLUMN profiles.account_status IS 'Current status of the account'; 