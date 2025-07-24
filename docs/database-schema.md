# Blueprint Database Schema

## Overview
This document defines the database schema for the Blueprint application using PostgreSQL with Supabase. The schema is designed to support multi-tenancy, flexible data modeling, and comprehensive audit trails while maintaining performance and data integrity.

## Design Principles

1. **Multi-Tenancy**: Complete data isolation at the project level
2. **Soft Deletes**: No data is permanently deleted, enabling recovery and audit trails
3. **Audit Trail**: Track who created/modified each record and when
4. **Normalized Design**: Separate tables for instances and properties to handle sparse data efficiently
5. **Flexibility**: JSONB fields for component configurations and query structures
6. **Performance**: Strategic indexes on commonly queried fields
7. **Security**: Row-level security policies based on user roles

## Core Tables

### users
Managed by Supabase Auth - stores user authentication data
```sql
-- Provided by Supabase Auth
id: uuid (primary key)
email: text
created_at: timestamp
```

### projects
```sql
CREATE TABLE projects (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    is_deleted boolean DEFAULT false
);
```

### user_project_roles
```sql
CREATE TABLE user_project_roles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    project_id uuid REFERENCES projects(id),
    role text NOT NULL CHECK (role IN ('default', 'content_manager', 'administrator')),
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    UNIQUE(user_id, project_id)
);
```

### entities
```sql
CREATE TABLE entities (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid REFERENCES projects(id),
    name text NOT NULL,
    display_string text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    last_modified_by uuid REFERENCES auth.users(id),
    is_deleted boolean DEFAULT false,
    UNIQUE(project_id, name)
);
```

### properties
```sql
CREATE TABLE properties (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_id uuid REFERENCES entities(id),
    name text NOT NULL,
    property_name text NOT NULL, -- camelCase version
    property_type text NOT NULL CHECK (property_type IN ('string', 'number', 'date', 'datetime', 'time', 'boolean', 'entity')),
    is_list boolean DEFAULT false,
    is_required boolean DEFAULT false,
    default_value text,
    referenced_entity_id uuid REFERENCES entities(id), -- for entity type properties
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    last_modified_by uuid REFERENCES auth.users(id),
    is_deleted boolean DEFAULT false,
    UNIQUE(entity_id, property_name)
);
```

### entity_instances
```sql
CREATE TABLE entity_instances (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_id uuid REFERENCES entities(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    last_modified_by uuid REFERENCES auth.users(id),
    is_deleted boolean DEFAULT false
);
```

### property_instances
```sql
CREATE TABLE property_instances (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_instance_id uuid REFERENCES entity_instances(id),
    property_id uuid REFERENCES properties(id),
    value text, -- all values stored as text, cast on retrieval
    sort_order integer DEFAULT 0, -- for list properties
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    last_modified_by uuid REFERENCES auth.users(id),
    is_deleted boolean DEFAULT false,
    UNIQUE(entity_instance_id, property_id, sort_order)
);
```

### pages
```sql
CREATE TABLE pages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid REFERENCES projects(id),
    parent_page_id uuid REFERENCES pages(id),
    name text NOT NULL,
    breadcrumb_template text,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    last_modified_by uuid REFERENCES auth.users(id),
    is_deleted boolean DEFAULT false
);
```

### page_parameters
```sql
CREATE TABLE page_parameters (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    page_id uuid REFERENCES pages(id) ON DELETE CASCADE,
    name text NOT NULL,
    data_type text NOT NULL CHECK (data_type IN ('string', 'number', 'boolean')),
    is_required boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    last_modified_by uuid REFERENCES auth.users(id),
    UNIQUE(page_id, name)
);
```

### containers
```sql
CREATE TABLE containers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    page_id uuid REFERENCES pages(id) ON DELETE CASCADE,
    parent_container_id uuid REFERENCES containers(id) ON DELETE CASCADE,
    layout_type text NOT NULL CHECK (layout_type IN ('flex', 'grid')),
    flex_direction text CHECK (flex_direction IN ('row', 'column')),
    flex_justify text CHECK (flex_justify IN ('start', 'end', 'center', 'space-between', 'space-around', 'space-evenly')),
    flex_align text CHECK (flex_align IN ('start', 'end', 'center', 'stretch')),
    grid_columns integer,
    spacing integer DEFAULT 16, -- pixels
    padding integer DEFAULT 0, -- pixels
    background_color text,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    last_modified_by uuid REFERENCES auth.users(id)
);
```

### components
```sql
CREATE TABLE components (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    container_id uuid REFERENCES containers(id) ON DELETE CASCADE,
    component_type text NOT NULL CHECK (component_type IN ('label', 'property', 'form', 'list', 'table')),
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    last_modified_by uuid REFERENCES auth.users(id)
);
```

### component_config
```sql
CREATE TABLE component_config (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    component_id uuid REFERENCES components(id) ON DELETE CASCADE,
    key text NOT NULL,
    value text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    last_modified_by uuid REFERENCES auth.users(id),
    UNIQUE(component_id, key)
);
```

### queries
```sql
CREATE TABLE queries (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid REFERENCES projects(id),
    entity_id uuid REFERENCES entities(id),
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    last_modified_by uuid REFERENCES auth.users(id),
    is_deleted boolean DEFAULT false,
    UNIQUE(project_id, name)
);
```

### query_groups
```sql
CREATE TABLE query_groups (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    query_id uuid REFERENCES queries(id) ON DELETE CASCADE,
    parent_group_id uuid REFERENCES query_groups(id) ON DELETE CASCADE,
    operator text NOT NULL CHECK (operator IN ('AND', 'OR')),
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    last_modified_by uuid REFERENCES auth.users(id)
);
```

### query_rules
```sql
CREATE TABLE query_rules (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    query_group_id uuid REFERENCES query_groups(id) ON DELETE CASCADE,
    property_id uuid REFERENCES properties(id),
    operator text NOT NULL CHECK (operator IN (
        'equals', 'not_equals', 'contains', 'not_contains',
        'starts_with', 'ends_with', 'is_empty', 'is_not_empty',
        'greater_than', 'less_than', 'greater_than_or_equal', 'less_than_or_equal',
        'is_null', 'is_not_null', 'before', 'after',
        'in_last_days', 'in_last_months', 'is_today', 'is_this_week', 'is_this_month',
        'is_true', 'is_false', 'matches_regex'
    )),
    value text, -- can be null for operators like is_empty, is_null
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    last_modified_by uuid REFERENCES auth.users(id)
);
```

## Component Configuration as Key-Value Pairs

With the new normalized structure, component configurations are stored as key-value pairs in the `component_config` table. Here are examples:

### Label Component Configuration
```
key: "type", value: "static|entity|property|query"
key: "text", value: "Welcome to Dashboard"
key: "entityInstanceId", value: "uuid" (when type=entity)
key: "propertyId", value: "uuid" (when type=property)
key: "queryId", value: "uuid" (when type=query)
```

### Property Component Configuration
```
key: "propertyId", value: "uuid"
key: "entityInstanceId", value: "uuid" (or could reference page parameter)
```

### Form Component Configuration
```
key: "formType", value: "create|update"
key: "entityId", value: "uuid"
key: "queryId", value: "uuid" (for update forms)
key: "columns", value: "2"
```

For form properties, we might need a separate table:
```sql
CREATE TABLE form_properties (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    component_id uuid REFERENCES components(id) ON DELETE CASCADE,
    property_id uuid REFERENCES properties(id),
    visible boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    last_modified_by uuid REFERENCES auth.users(id)
);
```

### List Component Configuration
```
key: "queryId", value: "uuid"
key: "pageSize", value: "50"
```

### Table Component Configuration
```
key: "queryId", value: "uuid"
key: "pageSize", value: "50"
```

For table columns, similar to form properties:
```sql
CREATE TABLE table_columns (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    component_id uuid REFERENCES components(id) ON DELETE CASCADE,
    property_id uuid REFERENCES properties(id),
    visible boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    last_modified_by uuid REFERENCES auth.users(id)
);
```

## Query Structure Example

With the normalized structure, a query is built from groups and rules:

```
Query: Find customers where (firstName contains "John" AND age > 18) OR (city = "New York")

queries table:
- id: query1
- name: "Active Adult Johns in NY"
- entity_id: customer_entity_id

query_groups table:
- id: group1, query_id: query1, parent_group_id: null, operator: "OR", sort_order: 0
- id: group2, query_id: query1, parent_group_id: group1, operator: "AND", sort_order: 0
- id: group3, query_id: query1, parent_group_id: group1, operator: "AND", sort_order: 1

query_rules table:
- group_id: group2, property_id: firstName_id, operator: "contains", value: "John", sort_order: 0
- group_id: group2, property_id: age_id, operator: "greater_than", value: "18", sort_order: 1
- group_id: group3, property_id: city_id, operator: "equals", value: "New York", sort_order: 0
```

## Indexes

```sql
-- Performance indexes
CREATE INDEX idx_entities_project_id ON entities(project_id) WHERE is_deleted = false;
CREATE INDEX idx_properties_entity_id ON properties(entity_id) WHERE is_deleted = false;
CREATE INDEX idx_entity_instances_entity_id ON entity_instances(entity_id) WHERE is_deleted = false;
CREATE INDEX idx_property_instances_entity_instance_id ON property_instances(entity_instance_id) WHERE is_deleted = false;
CREATE INDEX idx_property_instances_property_id ON property_instances(property_id) WHERE is_deleted = false;
CREATE INDEX idx_pages_project_id ON pages(project_id) WHERE is_deleted = false;
CREATE INDEX idx_containers_page_id ON containers(page_id);
CREATE INDEX idx_components_container_id ON components(container_id);
CREATE INDEX idx_queries_project_id ON queries(project_id) WHERE is_deleted = false;
CREATE INDEX idx_user_project_roles_user_id ON user_project_roles(user_id);
CREATE INDEX idx_user_project_roles_project_id ON user_project_roles(project_id);
CREATE INDEX idx_page_parameters_page_id ON page_parameters(page_id);
CREATE INDEX idx_component_config_component_id ON component_config(component_id);
CREATE INDEX idx_query_groups_query_id ON query_groups(query_id);
CREATE INDEX idx_query_groups_parent_group_id ON query_groups(parent_group_id);
CREATE INDEX idx_query_rules_group_id ON query_rules(query_group_id);
CREATE INDEX idx_query_rules_property_id ON query_rules(property_id);
CREATE INDEX idx_form_properties_component_id ON form_properties(component_id);
CREATE INDEX idx_table_columns_component_id ON table_columns(component_id);
```

## Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_project_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE containers ENABLE ROW LEVEL SECURITY;
ALTER TABLE components ENABLE ROW LEVEL SECURITY;
ALTER TABLE queries ENABLE ROW LEVEL SECURITY;

-- Example RLS policy for projects (users can only see projects they belong to)
CREATE POLICY "Users can view projects they belong to" ON projects
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_project_roles
            WHERE user_project_roles.project_id = projects.id
            AND user_project_roles.user_id = auth.uid()
        )
    );

-- Additional RLS policies would be created for each table based on role permissions
```

## Detailed Table Relationships

### Project Hierarchy
```
projects
    ├── entities
    │   └── properties
    │       └── property_instances
    ├── entity_instances
    │   └── property_instances
    ├── pages
    │   └── containers
    │       └── components
    └── queries
```

### Data Flow Examples

#### Creating an Entity Instance
1. User creates new instance through form component
2. Insert into `entity_instances` table
3. For each property value, insert into `property_instances`
4. Audit fields track user and timestamp

#### Querying Data
1. Query definition stored in `queries` table as JSONB
2. Query parsed to generate SQL with JOINs across:
   - `entity_instances`
   - `property_instances`
   - `properties` (for metadata)
3. Results filtered by `is_deleted = false`
4. RLS policies ensure user can only see their project's data

## Advanced Considerations

### Handling Entity Relationships
When a property has `property_type = 'entity'`:
- `referenced_entity_id` points to the related entity
- `property_instances.value` stores the UUID of the related entity instance
- For list properties (`is_list = true`), multiple rows with different `sort_order`

### Display String Resolution
```sql
-- Example query to resolve display strings for a Person entity
-- with display_string = "{firstName} {lastName}"
SELECT 
    ei.id,
    STRING_AGG(
        CASE 
            WHEN p.property_name = 'firstName' THEN pi.value
            WHEN p.property_name = 'lastName' THEN pi.value
        END, 
        ' ' ORDER BY p.property_name
    ) as display_value
FROM entity_instances ei
JOIN property_instances pi ON pi.entity_instance_id = ei.id
JOIN properties p ON p.id = pi.property_id
WHERE ei.entity_id = 'person-entity-uuid'
AND pi.is_deleted = false
GROUP BY ei.id;
```

### Query Builder Translation
The JSONB query structure translates to SQL:
```json
{
    "type": "AND",
    "children": [
        {
            "type": "rule",
            "propertyId": "uuid1",
            "operator": "contains",
            "value": "John"
        },
        {
            "type": "group",
            "operator": "OR",
            "children": [
                {
                    "type": "rule",
                    "propertyId": "uuid2",
                    "operator": "equals",
                    "value": "18"
                },
                {
                    "type": "rule",
                    "propertyId": "uuid2",
                    "operator": "equals",
                    "value": "19"
                }
            ]
        }
    ]
}
```

Becomes:
```sql
WHERE 
    pi1.value ILIKE '%John%' 
    AND (pi2.value = '18' OR pi2.value = '19')
```

### Performance Optimizations

#### Materialized Views for Common Queries
```sql
-- Materialized view for entity instances with all properties
CREATE MATERIALIZED VIEW entity_instance_properties AS
SELECT 
    ei.id as instance_id,
    ei.entity_id,
    ei.created_at,
    ei.updated_at,
    jsonb_object_agg(p.property_name, pi.value) as properties
FROM entity_instances ei
LEFT JOIN property_instances pi ON pi.entity_instance_id = ei.id
LEFT JOIN properties p ON p.id = pi.property_id
WHERE ei.is_deleted = false 
AND pi.is_deleted = false
GROUP BY ei.id, ei.entity_id, ei.created_at, ei.updated_at;

-- Refresh strategy
CREATE INDEX idx_mv_entity_instance_properties ON entity_instance_properties(entity_id, instance_id);
```

#### Partitioning Strategy (Future)
For very large projects, consider partitioning:
```sql
-- Partition property_instances by entity_instance_id range
CREATE TABLE property_instances_partition 
PARTITION BY RANGE (entity_instance_id);
```

### Security Deep Dive

#### Role-Based RLS Policies
```sql
-- Default users can only read data
CREATE POLICY "default_read_entity_instances" ON entity_instances
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_project_roles upr
            JOIN entities e ON e.project_id = upr.project_id
            WHERE upr.user_id = auth.uid()
            AND upr.role IN ('default', 'content_manager', 'administrator')
            AND e.id = entity_instances.entity_id
        )
    );

-- Default users can create/update through forms
CREATE POLICY "default_write_entity_instances" ON entity_instances
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_project_roles upr
            JOIN entities e ON e.project_id = upr.project_id
            WHERE upr.user_id = auth.uid()
            AND upr.role IN ('default', 'content_manager', 'administrator')
            AND e.id = entity_instances.entity_id
        )
    );

-- Content managers can manage pages
CREATE POLICY "content_manager_pages" ON pages
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_project_roles
            WHERE user_project_roles.project_id = pages.project_id
            AND user_project_roles.user_id = auth.uid()
            AND user_project_roles.role IN ('content_manager', 'administrator')
        )
    );

-- Only administrators can manage entities
CREATE POLICY "admin_entities" ON entities
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_project_roles
            WHERE user_project_roles.project_id = entities.project_id
            AND user_project_roles.user_id = auth.uid()
            AND user_project_roles.role = 'administrator'
        )
    );
```

### Data Migration Helpers

#### Undelete Function
```sql
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
```

#### Bulk Update Property Type
```sql
CREATE OR REPLACE FUNCTION change_property_type(
    property_uuid uuid, 
    new_type text,
    conversion_rules jsonb DEFAULT '{}'::jsonb
)
RETURNS void AS $$
BEGIN
    -- Update property type
    UPDATE properties 
    SET property_type = new_type,
        updated_at = now(),
        last_modified_by = auth.uid()
    WHERE id = property_uuid;
    
    -- Log failed conversions for manual review
    INSERT INTO property_type_migrations (
        property_id,
        old_value,
        new_value,
        success,
        error_message
    )
    SELECT 
        property_id,
        value as old_value,
        CASE 
            WHEN new_type = 'number' THEN 
                CASE WHEN value ~ '^[0-9]+\.?[0-9]*$' THEN value ELSE NULL END
            WHEN new_type = 'boolean' THEN 
                CASE WHEN lower(value) IN ('true', 'false', '1', '0') THEN value ELSE NULL END
            ELSE value
        END as new_value,
        CASE 
            WHEN new_type = 'number' AND NOT (value ~ '^[0-9]+\.?[0-9]*$') THEN false
            WHEN new_type = 'boolean' AND lower(value) NOT IN ('true', 'false', '1', '0') THEN false
            ELSE true
        END as success,
        CASE 
            WHEN new_type = 'number' AND NOT (value ~ '^[0-9]+\.?[0-9]*$') THEN 'Cannot convert to number'
            WHEN new_type = 'boolean' AND lower(value) NOT IN ('true', 'false', '1', '0') THEN 'Cannot convert to boolean'
            ELSE NULL
        END as error_message
    FROM property_instances
    WHERE property_id = property_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Common Query Patterns

#### Get All Entity Instances with Properties
```sql
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
        ) as properties
    FROM entity_instances ei
    LEFT JOIN property_instances pi ON pi.entity_instance_id = ei.id AND pi.is_deleted = false
    LEFT JOIN properties p ON p.id = pi.property_id AND p.is_deleted = false
    WHERE ei.entity_id = p_entity_id
    AND ei.is_deleted = false
    GROUP BY ei.id
    ORDER BY ei.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;
```

#### Resolve Display String
```sql
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
        LIMIT 1;
        
        v_result := replace(v_result, '{' || v_property_name || '}', COALESCE(v_property_value, ''));
    END LOOP;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE;
```

### Database Triggers

#### Auto-update timestamps
```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_entities_updated_at BEFORE UPDATE ON entities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
-- ... repeat for all tables
```

#### Validate property references
```sql
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

CREATE TRIGGER validate_property_instance_insert 
    BEFORE INSERT ON property_instances
    FOR EACH ROW EXECUTE FUNCTION validate_property_instance();
```

### Backup and Recovery

#### Export Project Data
```sql
CREATE OR REPLACE FUNCTION export_project_data(p_project_id uuid)
RETURNS jsonb AS $$
DECLARE
    v_result jsonb;
BEGIN
    v_result := jsonb_build_object(
        'project', (SELECT row_to_json(p) FROM projects p WHERE id = p_project_id),
        'entities', (SELECT jsonb_agg(row_to_json(e)) FROM entities e WHERE project_id = p_project_id),
        'properties', (SELECT jsonb_agg(row_to_json(p)) FROM properties p 
                      JOIN entities e ON e.id = p.entity_id 
                      WHERE e.project_id = p_project_id),
        'pages', (SELECT jsonb_agg(row_to_json(p)) FROM pages p WHERE project_id = p_project_id),
        'queries', (SELECT jsonb_agg(row_to_json(q)) FROM queries q WHERE project_id = p_project_id)
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE;
```

## Database Maintenance

### Regular Tasks
1. **VACUUM ANALYZE** - Run weekly to update statistics
2. **Reindex** - Monthly for heavily used tables
3. **Refresh materialized views** - Based on data change frequency
4. **Archive old soft-deleted records** - After 90 days

### Monitoring Queries
```sql
-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Find slow queries
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements
WHERE mean_time > 100
ORDER BY mean_time DESC;
```

## Notes

1. All timestamps use `timestamp with time zone` for proper timezone handling
2. Soft deletes (`is_deleted`) are used throughout for data recovery
3. Audit fields (`created_by`, `last_modified_by`) track all changes
4. JSONB is used for flexible component configurations and query structures
5. Unique constraints prevent duplicate names within projects
6. Foreign key constraints maintain referential integrity
7. Check constraints validate enum-like fields
8. Indexes optimize common query patterns while excluding soft-deleted records