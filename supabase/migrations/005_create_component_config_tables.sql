-- Component configuration tables for forms and tables

-- Form properties table
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

-- Table columns table
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