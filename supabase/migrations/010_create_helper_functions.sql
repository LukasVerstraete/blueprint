-- Helper functions for common operations

-- Function to undelete a property and its instances
CREATE OR REPLACE FUNCTION undelete_property(property_uuid uuid)
RETURNS void AS $$
BEGIN
    -- Undelete the property
    UPDATE properties 
    SET is_deleted = false, 
        updated_at = now(),
        last_modified_by = auth.uid()
    WHERE id = property_uuid;
    
    -- Undelete all property instances
    UPDATE property_instances 
    SET is_deleted = false,
        updated_at = now(),
        last_modified_by = auth.uid()
    WHERE property_id = property_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get entity instances with all properties
CREATE OR REPLACE FUNCTION get_entity_instances(
    p_entity_id uuid,
    p_limit int DEFAULT 50,
    p_offset int DEFAULT 0
)
RETURNS TABLE (
    instance_id uuid,
    created_at timestamptz,
    updated_at timestamptz,
    properties jsonb
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ei.id as instance_id,
        ei.created_at,
        ei.updated_at,
        COALESCE(
            jsonb_object_agg(
                p.property_name, 
                CASE 
                    WHEN p.is_list THEN 
                        (SELECT jsonb_agg(pi2.value ORDER BY pi2.sort_order)
                         FROM property_instances pi2
                         WHERE pi2.entity_instance_id = ei.id 
                         AND pi2.property_id = p.id
                         AND pi2.is_deleted = false)
                    ELSE pi.value
                END
            ) FILTER (WHERE p.property_name IS NOT NULL),
            '{}'::jsonb
        ) as properties
    FROM entity_instances ei
    LEFT JOIN property_instances pi ON pi.entity_instance_id = ei.id AND pi.is_deleted = false AND pi.sort_order = 0
    LEFT JOIN properties p ON p.id = pi.property_id AND p.is_deleted = false
    WHERE ei.entity_id = p_entity_id
    AND ei.is_deleted = false
    GROUP BY ei.id
    ORDER BY ei.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to resolve display string for an entity instance
CREATE OR REPLACE FUNCTION resolve_display_string(
    p_entity_instance_id uuid
)
RETURNS text AS $$
DECLARE
    v_display_string text;
    v_entity_id uuid;
    v_result text;
    v_property_name text;
    v_property_value text;
BEGIN
    -- Get entity and display string
    SELECT e.display_string, e.id INTO v_display_string, v_entity_id
    FROM entity_instances ei
    JOIN entities e ON e.id = ei.entity_id
    WHERE ei.id = p_entity_instance_id;
    
    v_result := v_display_string;
    
    -- Replace each property placeholder
    FOR v_property_name IN 
        SELECT DISTINCT regexp_replace(m[1], '[{}]', '', 'g')
        FROM regexp_matches(v_display_string, '\{([^}]+)\}', 'g') m
    LOOP
        SELECT pi.value INTO v_property_value
        FROM property_instances pi
        JOIN properties p ON p.id = pi.property_id
        WHERE pi.entity_instance_id = p_entity_instance_id
        AND p.property_name = v_property_name
        AND pi.is_deleted = false
        AND pi.sort_order = 0
        LIMIT 1;
        
        v_result := replace(v_result, '{' || v_property_name || '}', COALESCE(v_property_value, ''));
    END LOOP;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check for circular entity references
CREATE OR REPLACE FUNCTION check_entity_reference_cycle(
    source_entity_id uuid,
    target_entity_id uuid
)
RETURNS boolean AS $$
DECLARE
    has_cycle boolean;
BEGIN
    -- Check if target entity already has a reference back to source entity
    WITH RECURSIVE entity_refs AS (
        -- Start with the target entity's references
        SELECT referenced_entity_id
        FROM properties
        WHERE entity_id = target_entity_id
        AND property_type = 'entity'
        AND referenced_entity_id IS NOT NULL
        AND is_deleted = false
        
        UNION
        
        -- Recursively follow references
        SELECT p.referenced_entity_id
        FROM properties p
        JOIN entity_refs er ON p.entity_id = er.referenced_entity_id
        WHERE p.property_type = 'entity'
        AND p.referenced_entity_id IS NOT NULL
        AND p.is_deleted = false
    )
    SELECT EXISTS (
        SELECT 1 FROM entity_refs
        WHERE referenced_entity_id = source_entity_id
    ) INTO has_cycle;
    
    RETURN has_cycle;
END;
$$ LANGUAGE plpgsql STABLE;