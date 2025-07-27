-- Performance indexes for all tables

-- Projects indexes
CREATE INDEX idx_projects_created_by ON projects(created_by) WHERE is_deleted = false;

-- User project roles indexes
CREATE INDEX idx_user_project_roles_user_id ON user_project_roles(user_id);
CREATE INDEX idx_user_project_roles_project_id ON user_project_roles(project_id);

-- Entities indexes
CREATE INDEX idx_entities_project_id ON entities(project_id) WHERE is_deleted = false;

-- Properties indexes
CREATE INDEX idx_properties_entity_id ON properties(entity_id) WHERE is_deleted = false;
CREATE INDEX idx_properties_referenced_entity_id ON properties(referenced_entity_id) WHERE is_deleted = false;

-- Entity instances indexes
CREATE INDEX idx_entity_instances_entity_id ON entity_instances(entity_id) WHERE is_deleted = false;

-- Property instances indexes
CREATE INDEX idx_property_instances_entity_instance_id ON property_instances(entity_instance_id) WHERE is_deleted = false;
CREATE INDEX idx_property_instances_property_id ON property_instances(property_id) WHERE is_deleted = false;

-- Pages indexes
CREATE INDEX idx_pages_project_id ON pages(project_id) WHERE is_deleted = false;
CREATE INDEX idx_pages_parent_page_id ON pages(parent_page_id) WHERE is_deleted = false;

-- Page parameters indexes
CREATE INDEX idx_page_parameters_page_id ON page_parameters(page_id);

-- Containers indexes
CREATE INDEX idx_containers_page_id ON containers(page_id);
CREATE INDEX idx_containers_parent_container_id ON containers(parent_container_id);

-- Components indexes
CREATE INDEX idx_components_container_id ON components(container_id);

-- Component config indexes
CREATE INDEX idx_component_config_component_id ON component_config(component_id);

-- Queries indexes
CREATE INDEX idx_queries_project_id ON queries(project_id) WHERE is_deleted = false;
CREATE INDEX idx_queries_entity_id ON queries(entity_id) WHERE is_deleted = false;

-- Query groups indexes
CREATE INDEX idx_query_groups_query_id ON query_groups(query_id);
CREATE INDEX idx_query_groups_parent_group_id ON query_groups(parent_group_id);

-- Query rules indexes
CREATE INDEX idx_query_rules_group_id ON query_rules(query_group_id);
CREATE INDEX idx_query_rules_property_id ON query_rules(property_id);

-- Form properties indexes
CREATE INDEX idx_form_properties_component_id ON form_properties(component_id);
CREATE INDEX idx_form_properties_property_id ON form_properties(property_id);

-- Table columns indexes
CREATE INDEX idx_table_columns_component_id ON table_columns(component_id);
CREATE INDEX idx_table_columns_property_id ON table_columns(property_id);