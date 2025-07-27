-- Page structure tables for building user interfaces

-- Pages table
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

-- Page parameters table
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

-- Containers table
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

-- Components table
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

-- Component config table
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