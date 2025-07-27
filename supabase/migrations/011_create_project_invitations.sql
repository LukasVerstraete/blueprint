-- Create project_invitations table for user invitations
CREATE TABLE project_invitations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid REFERENCES projects(id),
    email text NOT NULL,
    role text NOT NULL CHECK (role IN ('default', 'content_manager', 'administrator')),
    token text NOT NULL UNIQUE,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX idx_project_invitations_project_id ON project_invitations(project_id);
CREATE INDEX idx_project_invitations_token ON project_invitations(token);
CREATE INDEX idx_project_invitations_email ON project_invitations(email);
CREATE INDEX idx_project_invitations_expires_at ON project_invitations(expires_at) WHERE used_at IS NULL;

-- Enable RLS
ALTER TABLE project_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Administrators can view invitations for their projects
CREATE POLICY "admin_view_invitations" ON project_invitations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_project_roles
            WHERE user_project_roles.project_id = project_invitations.project_id
            AND user_project_roles.user_id = auth.uid()
            AND user_project_roles.role = 'administrator'
        )
    );

-- Administrators can create invitations
CREATE POLICY "admin_create_invitations" ON project_invitations
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_project_roles
            WHERE user_project_roles.project_id = project_invitations.project_id
            AND user_project_roles.user_id = auth.uid()
            AND user_project_roles.role = 'administrator'
        )
    );

-- Administrators can delete invitations (revoke)
CREATE POLICY "admin_delete_invitations" ON project_invitations
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM user_project_roles
            WHERE user_project_roles.project_id = project_invitations.project_id
            AND user_project_roles.user_id = auth.uid()
            AND user_project_roles.role = 'administrator'
        )
    );

-- Anyone with a valid token can view the invitation
CREATE POLICY "public_view_invitation_by_token" ON project_invitations
    FOR SELECT
    USING (true);  -- Token validation happens in application layer

-- Function to clean up expired invitations
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS void AS $$
BEGIN
    DELETE FROM project_invitations
    WHERE expires_at < now() AND used_at IS NULL;
END;
$$ LANGUAGE plpgsql;