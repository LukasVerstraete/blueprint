-- Row Level Security Policies for project isolation and role-based access

-- Helper function to check if user has role in project
CREATE OR REPLACE FUNCTION auth_has_role_in_project(project_id uuid, allowed_roles text[])
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_project_roles
        WHERE user_project_roles.project_id = auth_has_role_in_project.project_id
        AND user_project_roles.user_id = auth.uid()
        AND user_project_roles.role = ANY(allowed_roles)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Projects policies
CREATE POLICY "Users can view projects they belong to" ON projects
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_project_roles
            WHERE user_project_roles.project_id = projects.id
            AND user_project_roles.user_id = auth.uid()
        )
        OR projects.created_by = auth.uid()
    );

CREATE POLICY "Users can create projects" ON projects
    FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Administrators can update their projects" ON projects
    FOR UPDATE
    USING (auth_has_role_in_project(id, ARRAY['administrator']));

CREATE POLICY "Administrators can soft delete their projects" ON projects
    FOR DELETE
    USING (auth_has_role_in_project(id, ARRAY['administrator']));

-- User project roles policies
CREATE POLICY "Users can view their own roles" ON user_project_roles
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Administrators can view all project roles" ON user_project_roles
    FOR SELECT
    USING (auth_has_role_in_project(project_id, ARRAY['administrator']));

CREATE POLICY "Project creators can assign themselves as admin" ON user_project_roles
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND role = 'administrator'
        AND EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = user_project_roles.project_id
            AND projects.created_by = auth.uid()
        )
    );

CREATE POLICY "Administrators can update project roles" ON user_project_roles
    FOR UPDATE
    USING (auth_has_role_in_project(project_id, ARRAY['administrator']));

CREATE POLICY "Administrators can delete project roles" ON user_project_roles
    FOR DELETE
    USING (auth_has_role_in_project(project_id, ARRAY['administrator']));

-- Entities policies
CREATE POLICY "All project users can view entities" ON entities
    FOR SELECT
    USING (auth_has_role_in_project(project_id, ARRAY['default', 'content_manager', 'administrator']));

CREATE POLICY "Administrators can manage entities" ON entities
    FOR INSERT
    WITH CHECK (auth_has_role_in_project(project_id, ARRAY['administrator']));

CREATE POLICY "Administrators can update entities" ON entities
    FOR UPDATE
    USING (auth_has_role_in_project(project_id, ARRAY['administrator']));

CREATE POLICY "Administrators can delete entities" ON entities
    FOR DELETE
    USING (auth_has_role_in_project(project_id, ARRAY['administrator']));

-- Properties policies
CREATE POLICY "All project users can view properties" ON properties
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM entities e
            JOIN user_project_roles upr ON upr.project_id = e.project_id
            WHERE e.id = properties.entity_id
            AND upr.user_id = auth.uid()
        )
    );

CREATE POLICY "Administrators can manage properties" ON properties
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM entities e
            JOIN user_project_roles upr ON upr.project_id = e.project_id
            WHERE e.id = properties.entity_id
            AND upr.user_id = auth.uid()
            AND upr.role = 'administrator'
        )
    );

-- Entity instances policies
CREATE POLICY "All project users can view entity instances" ON entity_instances
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM entities e
            JOIN user_project_roles upr ON upr.project_id = e.project_id
            WHERE e.id = entity_instances.entity_id
            AND upr.user_id = auth.uid()
        )
    );

CREATE POLICY "All project users can create entity instances" ON entity_instances
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM entities e
            JOIN user_project_roles upr ON upr.project_id = e.project_id
            WHERE e.id = entity_instances.entity_id
            AND upr.user_id = auth.uid()
        )
    );

CREATE POLICY "All project users can update entity instances" ON entity_instances
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM entities e
            JOIN user_project_roles upr ON upr.project_id = e.project_id
            WHERE e.id = entity_instances.entity_id
            AND upr.user_id = auth.uid()
        )
    );

CREATE POLICY "All project users can soft delete entity instances" ON entity_instances
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM entities e
            JOIN user_project_roles upr ON upr.project_id = e.project_id
            WHERE e.id = entity_instances.entity_id
            AND upr.user_id = auth.uid()
        )
    );

-- Property instances policies (same as entity instances)
CREATE POLICY "All project users can view property instances" ON property_instances
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM entity_instances ei
            JOIN entities e ON e.id = ei.entity_id
            JOIN user_project_roles upr ON upr.project_id = e.project_id
            WHERE ei.id = property_instances.entity_instance_id
            AND upr.user_id = auth.uid()
        )
    );

CREATE POLICY "All project users can manage property instances" ON property_instances
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM entity_instances ei
            JOIN entities e ON e.id = ei.entity_id
            JOIN user_project_roles upr ON upr.project_id = e.project_id
            WHERE ei.id = property_instances.entity_instance_id
            AND upr.user_id = auth.uid()
        )
    );

-- Pages policies
CREATE POLICY "All project users can view pages" ON pages
    FOR SELECT
    USING (auth_has_role_in_project(project_id, ARRAY['default', 'content_manager', 'administrator']));

CREATE POLICY "Content managers can manage pages" ON pages
    FOR ALL
    USING (auth_has_role_in_project(project_id, ARRAY['content_manager', 'administrator']));

-- Page parameters policies
CREATE POLICY "All project users can view page parameters" ON page_parameters
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM pages p
            JOIN user_project_roles upr ON upr.project_id = p.project_id
            WHERE p.id = page_parameters.page_id
            AND upr.user_id = auth.uid()
        )
    );

CREATE POLICY "Content managers can manage page parameters" ON page_parameters
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM pages p
            JOIN user_project_roles upr ON upr.project_id = p.project_id
            WHERE p.id = page_parameters.page_id
            AND upr.user_id = auth.uid()
            AND upr.role IN ('content_manager', 'administrator')
        )
    );

-- Containers policies
CREATE POLICY "All project users can view containers" ON containers
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM pages p
            JOIN user_project_roles upr ON upr.project_id = p.project_id
            WHERE p.id = containers.page_id
            AND upr.user_id = auth.uid()
        )
    );

CREATE POLICY "Content managers can manage containers" ON containers
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM pages p
            JOIN user_project_roles upr ON upr.project_id = p.project_id
            WHERE p.id = containers.page_id
            AND upr.user_id = auth.uid()
            AND upr.role IN ('content_manager', 'administrator')
        )
    );

-- Components policies
CREATE POLICY "All project users can view components" ON components
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM containers c
            JOIN pages p ON p.id = c.page_id
            JOIN user_project_roles upr ON upr.project_id = p.project_id
            WHERE c.id = components.container_id
            AND upr.user_id = auth.uid()
        )
    );

CREATE POLICY "Content managers can manage components" ON components
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM containers c
            JOIN pages p ON p.id = c.page_id
            JOIN user_project_roles upr ON upr.project_id = p.project_id
            WHERE c.id = components.container_id
            AND upr.user_id = auth.uid()
            AND upr.role IN ('content_manager', 'administrator')
        )
    );

-- Component config policies
CREATE POLICY "All project users can view component config" ON component_config
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM components comp
            JOIN containers c ON c.id = comp.container_id
            JOIN pages p ON p.id = c.page_id
            JOIN user_project_roles upr ON upr.project_id = p.project_id
            WHERE comp.id = component_config.component_id
            AND upr.user_id = auth.uid()
        )
    );

CREATE POLICY "Content managers can manage component config" ON component_config
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM components comp
            JOIN containers c ON c.id = comp.container_id
            JOIN pages p ON p.id = c.page_id
            JOIN user_project_roles upr ON upr.project_id = p.project_id
            WHERE comp.id = component_config.component_id
            AND upr.user_id = auth.uid()
            AND upr.role IN ('content_manager', 'administrator')
        )
    );

-- Queries policies
CREATE POLICY "All project users can view queries" ON queries
    FOR SELECT
    USING (auth_has_role_in_project(project_id, ARRAY['default', 'content_manager', 'administrator']));

CREATE POLICY "Content managers can manage queries" ON queries
    FOR ALL
    USING (auth_has_role_in_project(project_id, ARRAY['content_manager', 'administrator']));

-- Query groups policies
CREATE POLICY "All project users can view query groups" ON query_groups
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM queries q
            JOIN user_project_roles upr ON upr.project_id = q.project_id
            WHERE q.id = query_groups.query_id
            AND upr.user_id = auth.uid()
        )
    );

CREATE POLICY "Content managers can manage query groups" ON query_groups
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM queries q
            JOIN user_project_roles upr ON upr.project_id = q.project_id
            WHERE q.id = query_groups.query_id
            AND upr.user_id = auth.uid()
            AND upr.role IN ('content_manager', 'administrator')
        )
    );

-- Query rules policies
CREATE POLICY "All project users can view query rules" ON query_rules
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM query_groups qg
            JOIN queries q ON q.id = qg.query_id
            JOIN user_project_roles upr ON upr.project_id = q.project_id
            WHERE qg.id = query_rules.query_group_id
            AND upr.user_id = auth.uid()
        )
    );

CREATE POLICY "Content managers can manage query rules" ON query_rules
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM query_groups qg
            JOIN queries q ON q.id = qg.query_id
            JOIN user_project_roles upr ON upr.project_id = q.project_id
            WHERE qg.id = query_rules.query_group_id
            AND upr.user_id = auth.uid()
            AND upr.role IN ('content_manager', 'administrator')
        )
    );

-- Form properties policies
CREATE POLICY "All project users can view form properties" ON form_properties
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM components comp
            JOIN containers c ON c.id = comp.container_id
            JOIN pages p ON p.id = c.page_id
            JOIN user_project_roles upr ON upr.project_id = p.project_id
            WHERE comp.id = form_properties.component_id
            AND upr.user_id = auth.uid()
        )
    );

CREATE POLICY "Content managers can manage form properties" ON form_properties
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM components comp
            JOIN containers c ON c.id = comp.container_id
            JOIN pages p ON p.id = c.page_id
            JOIN user_project_roles upr ON upr.project_id = p.project_id
            WHERE comp.id = form_properties.component_id
            AND upr.user_id = auth.uid()
            AND upr.role IN ('content_manager', 'administrator')
        )
    );

-- Table columns policies
CREATE POLICY "All project users can view table columns" ON table_columns
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM components comp
            JOIN containers c ON c.id = comp.container_id
            JOIN pages p ON p.id = c.page_id
            JOIN user_project_roles upr ON upr.project_id = p.project_id
            WHERE comp.id = table_columns.component_id
            AND upr.user_id = auth.uid()
        )
    );

CREATE POLICY "Content managers can manage table columns" ON table_columns
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM components comp
            JOIN containers c ON c.id = comp.container_id
            JOIN pages p ON p.id = c.page_id
            JOIN user_project_roles upr ON upr.project_id = p.project_id
            WHERE comp.id = table_columns.component_id
            AND upr.user_id = auth.uid()
            AND upr.role IN ('content_manager', 'administrator')
        )
    );