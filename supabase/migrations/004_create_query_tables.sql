-- Query builder tables for data retrieval

-- Queries table
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

-- Query groups table
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

-- Query rules table
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