-- Trigger functions for database automation

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update_updated_at trigger to all tables with updated_at column
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_entities_updated_at BEFORE UPDATE ON entities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_entity_instances_updated_at BEFORE UPDATE ON entity_instances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_property_instances_updated_at BEFORE UPDATE ON property_instances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_page_parameters_updated_at BEFORE UPDATE ON page_parameters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_containers_updated_at BEFORE UPDATE ON containers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_components_updated_at BEFORE UPDATE ON components
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_component_config_updated_at BEFORE UPDATE ON component_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_queries_updated_at BEFORE UPDATE ON queries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_query_groups_updated_at BEFORE UPDATE ON query_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_query_rules_updated_at BEFORE UPDATE ON query_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_form_properties_updated_at BEFORE UPDATE ON form_properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_table_columns_updated_at BEFORE UPDATE ON table_columns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to validate property instances belong to correct entity
CREATE OR REPLACE FUNCTION validate_property_instance()
RETURNS TRIGGER AS $$
DECLARE
    v_entity_id uuid;
    v_property_entity_id uuid;
BEGIN
    -- Get entity IDs
    SELECT entity_id INTO v_entity_id 
    FROM entity_instances 
    WHERE id = NEW.entity_instance_id;
    
    SELECT entity_id INTO v_property_entity_id 
    FROM properties 
    WHERE id = NEW.property_id;
    
    -- Validate property belongs to same entity
    IF v_entity_id != v_property_entity_id THEN
        RAISE EXCEPTION 'Property does not belong to entity';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply validation trigger to property_instances
CREATE TRIGGER validate_property_instance_insert 
    BEFORE INSERT ON property_instances
    FOR EACH ROW EXECUTE FUNCTION validate_property_instance();

CREATE TRIGGER validate_property_instance_update
    BEFORE UPDATE ON property_instances
    FOR EACH ROW EXECUTE FUNCTION validate_property_instance();