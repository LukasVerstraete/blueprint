-- Core tables for Blueprint application

-- Projects table
CREATE TABLE projects (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    is_deleted boolean DEFAULT false
);

-- User project roles table
CREATE TABLE user_project_roles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    project_id uuid REFERENCES projects(id),
    role text NOT NULL CHECK (role IN ('default', 'content_manager', 'administrator')),
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    UNIQUE(user_id, project_id)
);

-- Entities table
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

-- Properties table
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