-- Entity instance tables for storing actual data

-- Entity instances table
CREATE TABLE entity_instances (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_id uuid REFERENCES entities(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    last_modified_by uuid REFERENCES auth.users(id),
    is_deleted boolean DEFAULT false
);

-- Property instances table
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