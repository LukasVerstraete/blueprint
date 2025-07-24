# Blueprint Features Documentation

This document provides comprehensive documentation for all features of the Blueprint application. Blueprint is a multi-tenant application that enables administrators to create custom data management applications without coding.

## Table of Contents

1. [Entity Management](#entity-management)
   - [Entity Definition](#entity-definition)
   - [Property Configuration](#property-configuration)
   - [Display String Templates](#display-string-templates)
   - [Entity Relationships](#entity-relationships)
2. [Page Builder](#page-builder)
   - [Label Component](#label-component)
   - [Property Component](#property-component)
   - [Form Component](#form-component)
   - [List Component](#list-component)
   - [Table Component](#table-component)
3. [Query Builder](#query-builder)
   - [Query Structure](#query-structure)
   - [Query Groups](#query-groups)
   - [Query Rules](#query-rules)
   - [Complex Query Examples](#complex-query-examples)
4. [User Management](#user-management)
   - [Role Definitions](#role-definitions)
   - [Permission Hierarchy](#permission-hierarchy)
   - [User Invitation Process](#user-invitation-process)
5. [Technical Architecture](#technical-architecture)
   - [Data Model](#data-model)
   - [Security Considerations](#security-considerations)
   - [Future Enhancements](#future-enhancements)

## Entity Management

### Entity Definition

Entities are the core building blocks of Blueprint applications. They represent data types or schemas that define the structure of information your application will manage. Think of entities as templates for creating actual data records.

#### Entity Structure

Each entity contains three essential fields:

- **`id`**: A unique identifier for the entity, typically a UUID or auto-incremented integer
- **`name`**: The human-readable name of the entity (e.g., "Customer", "Product", "Order")
- **`displayString`**: A template that defines how instances of this entity should be displayed throughout the application

#### Entity vs Entity Instance

It's crucial to understand the distinction:
- **Entity**: The definition or schema (e.g., "Person" with properties like firstname, lastname, age)
- **Entity Instance**: An actual record of data (e.g., John Doe, age 30)

### Property Configuration

Properties define the fields that make up an entity. Each property represents a piece of information that can be stored for entity instances.

#### Property Structure

Properties contain the following fields:

- **`id`**: Unique identifier for the property
- **`name`**: Display name shown in forms and tables (e.g., "First Name")
- **`propertyName`**: camelCase version used for JavaScript objects (e.g., "firstName")
- **`propertyType`**: The data type of the property
- **`isList`**: Boolean indicating whether this property can hold multiple values
- **`value`** (optional): Default value for new instances
- **`referenced_entity_id`** (optional): When propertyType is "entity", this references which entity type can be selected
- **`is_required`**: Whether this field must be filled in create forms
- **`sort_order`**: Order in which properties appear by default

#### Property Types

Blueprint supports the following property types:

1. **`string`**: Text values of any length
2. **`number`**: Numeric values (integers or decimals)
3. **`date`**: Date without time (YYYY-MM-DD)
4. **`datetime`**: Date with time (YYYY-MM-DD HH:MM:SS)
5. **`time`**: Time without date (HH:MM:SS)
6. **`boolean`**: True/false values
7. **`entity`**: Reference to another entity instance

#### Property Storage

All property values are stored as strings in the database and cast to their appropriate type when needed. This provides flexibility for schema changes and simplifies data import/export operations.

### Display String Templates

Display strings are powerful templates that control how entity instances appear throughout the application.

#### Template Syntax

Display strings use a simple placeholder syntax with curly braces:
```
{propertyName}
```

#### Examples

For a Person entity with properties `firstName` and `lastName`:
- Display String: `"{firstName} {lastName}"` 
- Instance Display: "John Doe"

For a Product entity with properties `name` and `sku`:
- Display String: `"{name} (SKU: {sku})"`
- Instance Display: "Widget Pro (SKU: WP-001)"

#### Display String Builder

The display string is created through a form interface that:
- Provides a dropdown of all available properties for the entity
- Allows mixing static text with property placeholders
- Validates that only existing properties are referenced
- Currently excludes entity-type properties to avoid complexity

### Entity Relationships

When a property has type "entity", it creates a relationship between two entities.

#### Relationship Types

Currently, Blueprint supports:
- **One-to-One**: A property references a single entity instance
- **One-to-Many**: When `isList` is true, a property can reference multiple entity instances

#### Cycle Detection

The system implements cycle detection to prevent circular references. For example:
- Entity A cannot have a property that references Entity B if Entity B already has a property referencing Entity A
- This prevents infinite loops when displaying or querying data

#### Future Relationship Enhancements

Planned improvements include:
- Many-to-many relationships through junction tables
- Cascade delete options
- Relationship validation rules

## Page Builder

The Page Builder allows administrators and content managers to create user interfaces without coding. Pages are composed of predefined components that can be configured and arranged.

### Label Component

Labels are the simplest display components, used to show static or dynamic text.

#### Configuration Options

Labels can display:

1. **Static Text**: Hardcoded text that doesn't change
   - Example: "Welcome to the Customer Portal"

2. **Entity Display String**: Shows the formatted display string of a linked entity instance
   - Requires: Entity instance reference
   - Example: Shows "John Doe" for a Person entity

3. **Property Value**: Displays the value of a specific property
   - Requires: Property reference and entity instance
   - Example: Shows "john@example.com" for an email property

4. **Query Result**: Shows the result of a query that returns a single value
   - Requires: Query that returns exactly one result
   - Example: Shows count of active users

#### Use Cases

- Page titles and headings
- Displaying current user information
- Showing calculated values or statistics
- Instructions or help text

### Property Component

Property components display a property's name and value in a structured format.

#### Display Format

```
Property Name
─────────────
Property Value
```

#### Configuration

- **Property Selection**: Choose which property to display
- **Entity Instance**: Link to the entity instance to retrieve the value from

#### Use Cases

- Detailed views of entity data
- Read-only forms
- Property-by-property data comparison

### Form Component

Forms are the primary interface for data entry and editing in Blueprint applications.

#### Form Types

1. **Create Form**: For adding new entity instances
   - Linked to an entity type
   - Shows empty fields with default values

2. **Update Form**: For editing existing entity instances
   - Linked to a query that returns a specific instance
   - Pre-populates fields with current values

#### Configuration Options

1. **Property Selection**
   - Choose which properties to include
   - Required properties cannot be hidden in create forms
   - Required properties can be hidden in update forms (already have values)
   - Order properties by drag-and-drop

2. **Layout Configuration**
   - Number of columns (1-4 typically)
   - Responsive behavior for mobile devices
   - Property grouping (planned feature)

3. **Form Behavior**
   - Submit button text
   - Success/error message handling
   - Redirect after submission (planned)

#### Form Properties Storage

Form component property configuration is stored in a separate `form_properties` table:
- Links form components to specific properties
- Controls which properties are visible in the form
- Defines the display order of properties
- Allows hiding properties even if they exist on the entity

#### Field Rendering

Each property type renders as an appropriate input:
- `string`: Text input
- `number`: Number input with validation
- `date`: Date picker
- `datetime`: Date and time picker
- `time`: Time picker
- `boolean`: Checkbox or toggle switch
- `entity`: Dropdown or searchable select

#### Form Validation

**Validation Rules:**
- Properties can be marked as `required` (boolean)
- Create forms: Required fields must always be shown and filled
- Update forms: 
  - Required fields can be hidden (they already have values)
  - If shown, required fields cannot be emptied
- Only validation is "required" - no other validation rules for now

**Error Handling:**
- Inline error message below empty required fields: "This field is required"
- Form submission blocked if validation fails
- Clear visual indicator for fields with errors (red border)
- Entity dropdowns show "Please select an option" for empty required fields

### List Component

Lists display multiple entity instances in a vertical layout.

#### Configuration

1. **Query Selection**: Link to a query that returns entity instances
2. **Display Format**: Each item shows the entity's display string
3. **Interaction Options**:
   - Click to view details (planned)
   - Inline actions (edit, delete) (planned)

#### Use Cases

- Navigation menus
- Recent items
- Simple data browsing
- Mobile-friendly data display

### Table Component

Tables provide a structured view of multiple entity instances with their properties.

#### Configuration Options

1. **Query Selection**: Link to a query that returns entity instances
2. **Column Configuration**:
   - Select which properties to show as columns
   - Column order
   - Column width (planned)

#### Table Columns Storage

Table component column configuration is stored in a separate `table_columns` table:
- Links table components to specific properties
- Controls column visibility
- Defines column display order
- Allows showing only relevant properties from the entity
   
3. **Table Features** (planned):
   - Sorting by column
   - Pagination
   - Row selection
   - Inline editing

#### Use Cases

- Data management interfaces
- Reporting views
- Bulk operations (when implemented)
- Data export preparation

## Query Builder

The Query Builder is a powerful visual tool for creating complex data queries without writing SQL.

### Query Structure

Each query is specific to one entity type and consists of:
1. **Entity Selection**: The base entity type to query
2. **Query Groups**: Nested conditions with AND/OR logic
3. **Result Set**: What data to return

### Query Groups

Query groups form a tree structure that defines the logic of your query.

#### Group Properties

- **Type**: AND or OR
  - AND: All conditions in the group must be true
  - OR: At least one condition in the group must be true
- **Children**: Can contain:
  - Query rules (conditions)
  - Other query groups (for nesting)

#### Nesting Groups

Groups can be nested to create complex logic:
```
Root Group (AND)
├── Group A (OR)
│   ├── Rule 1
│   └── Rule 2
└── Group B (AND)
    ├── Rule 3
    └── Rule 4
```

This translates to: `(Rule1 OR Rule2) AND (Rule3 AND Rule4)`

### Query Rules

Rules are the actual conditions that filter your data.

#### Rule Components

1. **Property**: Which property to evaluate (entity properties excluded)
2. **Operator**: How to compare - varies by property type
3. **Value**: What to compare against

#### Operators by Property Type

**String Operators:**
- equals, not equals
- contains, not contains
- starts with, ends with
- is empty, is not empty
- matches regex

**Number Operators:**
- equals, not equals
- greater than, less than
- greater than or equal, less than or equal
- is null, is not null

**Date/DateTime Operators:**
- equals, not equals
- before, after
- in last X days/months (user inputs any number)
- is today, is this week, is this month

**Boolean Operators:**
- is true
- is false
- is null

**Time Operators:**
- equals, not equals
- before, after
- is null, is not null

Note: Entity-type properties cannot be used in queries to keep complexity manageable.

### Complex Query Examples

#### Example 1: Customer Segmentation

Find premium customers in specific regions:
```
Root Group (AND)
├── Rule: customerType equals "Premium"
├── Rule: totalPurchases greater than 10000
└── Group (OR)
    ├── Rule: region equals "North America"
    ├── Rule: region equals "Europe"
    └── Rule: region equals "Asia Pacific"
```

#### Example 2: Inventory Management

Find products that need restocking:
```
Root Group (AND)
├── Rule: currentStock less than minimumStock
├── Rule: isActive equals true
└── Group (OR)
    ├── Group (AND)
    │   ├── Rule: category equals "Electronics"
    │   └── Rule: supplier equals "TechCorp"
    └── Group (AND)
        ├── Rule: category equals "Accessories"
        └── Rule: lastRestockDate before "30 days ago"
```

## User Management

### Role Definitions

Blueprint implements a hierarchical role-based access control system with three roles:

#### 1. Default Role

The Default role is designed for end users who interact with the application but don't build or configure it.

**Permissions:**
- View all published pages
- Use all functionality on pages:
  - View data in lists and tables
  - Create new entity instances via forms
  - Update existing entity instances via forms
  - Delete entity instances (if enabled)
- Cannot access administrative interfaces
- Cannot modify page layouts or components
- Cannot view or modify entity definitions

**Use Cases:**
- Regular application users
- Data entry personnel
- Customers using a self-service portal

#### 2. ContentManager Role

Content Managers can build and modify the user interface without affecting the underlying data structure.

**Permissions (includes all Default permissions plus):**
- Access the Page Builder interface
- Create new pages
- Edit existing pages
- Add and configure components:
  - Labels
  - Property displays
  - Forms
  - Lists
  - Tables
- Create and modify queries in the Query Builder
- Preview pages before publishing
- Cannot modify entity definitions
- Cannot manage users or permissions

**Use Cases:**
- UI/UX designers
- Business analysts
- Department heads managing their team's interfaces

#### 3. Administrator Role

Administrators have complete control over the project.

**Permissions (includes all ContentManager permissions plus):**
- Full access to Entity Management:
  - Create new entities
  - Modify entity properties
  - Delete entities (with cascade considerations)
- User Management:
  - Invite new users
  - Assign/change user roles
  - Remove users from project
- Project Settings:
  - Configure project-wide settings
  - Manage integrations
  - Access audit logs (planned)

**Use Cases:**
- Project owners
- System administrators
- Technical leads

### Permission Hierarchy

The permission system is strictly hierarchical:

```
Administrator
    ↓ (includes all permissions)
ContentManager  
    ↓ (includes all permissions)
Default
```

This means:
- Each role automatically includes all permissions of lower roles
- There are no permission conflicts or overrides
- Role changes take effect immediately

### User Invitation Process

#### Invitation Flow

1. **Administrator initiates invitation**
   - Enters email address
   - Selects role
   - Optionally adds a welcome message

2. **System sends invitation email**
   - Secure invitation link
   - Project information
   - Role description

3. **User accepts invitation**
   - Creates account or signs in
   - Automatically added to project
   - Receives assigned role

#### Security Considerations

- Invitation links expire after 7 days
- One-time use only
- Require email verification
- Audit trail of all invitations

## Technical Architecture

### Data Model

#### Core Tables

1. **Projects**
   - `id`: UUID
   - `name`: String
   - `created_at`: Timestamp
   - `updated_at`: Timestamp
   - `created_by`: Foreign key to user
   - `is_deleted`: Boolean (soft delete)

2. **Entities**
   - `id`: UUID
   - `project_id`: Foreign key
   - `name`: String
   - `display_string`: Template string

3. **Properties**
   - `id`: UUID
   - `entity_id`: Foreign key
   - `name`: String
   - `property_name`: String (camelCase)
   - `property_type`: Enum
   - `is_list`: Boolean
   - `default_value`: String (nullable)
   - `is_required`: Boolean

4. **Entity Instances**
   - `id`: UUID
   - `entity_id`: Foreign key
   - `created_at`: Timestamp
   - `updated_at`: Timestamp
   - `created_by`: Foreign key to user
   - `last_modified_by`: Foreign key to user
   - `is_deleted`: Boolean

5. **Property Instances**
   - `id`: UUID
   - `entity_instance_id`: Foreign key
   - `property_id`: Foreign key
   - `value`: String (all values stored as strings, cast on retrieval)
   - `sort_order`: Integer (for list properties)
   - `created_at`: Timestamp
   - `updated_at`: Timestamp
   - `created_by`: Foreign key to user
   - `last_modified_by`: Foreign key to user
   - `is_deleted`: Boolean

#### Entity Instance Storage Approach

This normalized approach provides several benefits:
- **Property-level auditing**: Track who changed each field and when
- **Soft deletes**: Data is never truly deleted, just marked as deleted
- **Flexible schema**: Easy to add/remove properties without data migration
- **Efficient queries**: Can query and index individual properties
- **Sparse data handling**: Only stores properties that have values

#### Open Questions for Entity Storage

1. **Schema Change Handling**: When property types change (e.g., string to number), how should we handle existing values that can't be cast?
2. **Migration Strategy**: Should we implement a migration log table to track which schema migrations have been applied?
3. **Entity Definition Versioning**: Should we version the entity schemas themselves to track how they evolve over time?

6. **Pages**
   - `id`: UUID
   - `project_id`: Foreign key
   - `name`: String
   - `parent_page_id`: Foreign key (for subpages)
   - `breadcrumb_template`: String (optional)
   - `sort_order`: Integer

7. **Page Parameters**
   - `id`: UUID
   - `page_id`: Foreign key
   - `name`: String (parameter name)
   - `data_type`: String (string, number, boolean)
   - `is_required`: Boolean

8. **Containers**
   - `id`: UUID
   - `page_id`: Foreign key
   - `parent_container_id`: Foreign key (for nesting)
   - `layout_type`: String (flex or grid)
   - Layout configuration fields (flex_direction, grid_columns, etc.)

9. **Components**
   - `id`: UUID
   - `container_id`: Foreign key
   - `component_type`: String (label, property, form, list, table)
   - `sort_order`: Integer

10. **Component Config**
   - `id`: UUID
   - `component_id`: Foreign key
   - `key`: String
   - `value`: String

11. **Queries**
   - `id`: UUID
   - `project_id`: Foreign key
   - `entity_id`: Foreign key
   - `name`: String

12. **Query Groups**
   - `id`: UUID
   - `query_id`: Foreign key
   - `parent_group_id`: Foreign key (for nesting)
   - `operator`: String (AND or OR)

13. **Query Rules**
   - `id`: UUID
   - `query_group_id`: Foreign key
   - `property_id`: Foreign key
   - `operator`: String (equals, contains, etc.)
   - `value`: String

14. **User Roles**
   - `user_id`: Foreign key
   - `project_id`: Foreign key
   - `role`: Enum (Default, ContentManager, Administrator)

### Security Considerations

#### Data Isolation

- Strict project-level isolation
- Row-level security in Supabase
- No cross-project data access

#### Authentication & Authorization

- Supabase Auth for user management
- JWT tokens for session management
- Role checks on every API call

#### Data Validation

- Property type validation
- Required field enforcement
- Cycle detection for entity relationships
- Input sanitization for display strings

#### Audit Trail

Every table in the system includes comprehensive audit fields:
- **`created_at`**: Timestamp when the record was created
- **`updated_at`**: Timestamp of the last modification
- **`created_by`**: User ID who created the record
- **`last_modified_by`**: User ID who last modified the record

This provides complete visibility into who made changes and when, essential for compliance and debugging.

### Navigation System

#### Page Hierarchy
- Pages can have unlimited subpages
- Each page has `id`, `name`, and optionally `breadcrumbTemplate`
- URLs use IDs: `/{pageId}/{subpageId}/{subPageId}`
- Page parameters are defined in `page_parameters` table with name and data type
- Context passed via URL query parameters: `?entityInstanceId=123&view=edit`
- Parameter values are validated against their defined data types

#### Navigation Menu
- Auto-generated from page hierarchy
- Shows only top-level pages (pages without parent)
- Subpages are accessed through links/buttons on parent pages with appropriate context
- Pages requiring parameters are not shown in navigation since they need context

#### Breadcrumbs
- Uses page names by default
- Pages can define `breadcrumbTemplate` similar to entity displayString
- Template can reference query parameters: `"Customer: {customerName}"`
- Example: "Home > Customers > Customer: John Doe"

#### URL Structure
- Simple ID-based routing
- All dynamic data in query parameters
- Shareable deep links with full context
- Components read query params for their data

### Breaking Changes Management

The system uses different deletion strategies based on the type of data:
- **Soft deletes** (marked as `is_deleted = true`): Projects, Entities, Properties, Pages, Queries
- **Hard deletes** (with CASCADE): Containers, Components, Component Config, Page Parameters

This approach handles breaking changes gracefully:

#### Property Deletion
- Properties marked with `is_deleted = true` remain in database
- Existing property instance data is preserved
- Components referencing deleted properties show warning: "This property has been deleted"
- Forms automatically skip deleted properties
- Queries automatically exclude deleted properties from results

#### Impact Analysis
- Before deleting a property, system shows which pages and queries reference it
- Simple list format: "This property is used in 3 pages and 2 queries"
- Administrators can review impact before confirming deletion

#### Graceful Degradation
- **Deleted Properties**: Components show warning but page continues to function
- **Deleted Entities**: Larger warning displayed, administrator must update affected pages
- **DisplayStrings**: If referenced properties are deleted, shows remaining properties only
- **Forms**: Skip deleted properties, validation adjusts automatically
- **Queries**: Filter out deleted properties from conditions

#### Data Recovery
- Soft deletes allow data recovery if needed
- Administrator can "undelete" properties to restore functionality
- Historical data remains intact

### Multi-Project Management

#### Project Switching
- Project dropdown selector in application header
- Recent projects list for quick access
- Keyboard shortcut (Cmd/Ctrl + K) for project switcher
- System remembers last active project per user

#### User-Project Relationships
- Users can belong to unlimited projects
- Each user has a specific role per project
- Example: John can be Administrator in "Project A" but Default user in "Project B"
- Role assignments are independent across projects

#### Project Management Features
- **Create Project**: Start new project from scratch
- **Archive Project**: Soft delete projects (can be restored)
- **Duplicate Project**: Creates copy including:
  - All entity definitions
  - All properties
  - All pages and components
  - All queries
  - Does NOT copy entity instances (data)
- **Transfer Ownership**: Current admin can transfer project to another admin

#### Project Isolation
- Complete data isolation between projects
- No cross-project queries or references
- Each project has its own set of entities, pages, and users
- Switching projects completely changes context

### Component Layout System

#### Container-Based Architecture
Pages are built using containers that can hold components or other containers, allowing flexible layouts without complexity.

**Container Storage:**
- Containers are stored in the `containers` table
- Each container has both `page_id` and `parent_container_id` for hierarchical structure
- Components are stored in the `components` table with a `container_id` reference
- Component configurations are stored as key-value pairs in `component_config` table

#### Container Types and Properties

**Layout Modes:**
- **Grid Layout**: Define number of columns for child elements
- **Flex Layout**: Set direction (row/column), justify-content, and align-items

**Container Configuration:**
- Layout type selection (grid or flex)
- Default spacing between child elements (e.g., 16px)
- Internal padding
- Optional background color
- Unlimited nesting depth

#### Layout Examples

**Simple Page Structure:**
```
Page Root
├── Container (flex, row)
│   ├── Label Component
│   └── Form Component
└── Container (grid, 2 columns)
    ├── Table Component
    └── List Component
```

**Nested Layout:**
```
Page Root
└── Container (flex, column, 24px spacing)
    ├── Container (flex, row, space-between)
    │   ├── Label "Page Title"
    │   └── Label "User Info"
    └── Container (grid, 3 columns)
        ├── Form Component
        ├── List Component
        └── Property Component
```

#### Benefits
- Simple mental model for builders
- No breakpoint complexity
- Flexible nesting for complex layouts
- Consistent spacing with defaults
- Visual hierarchy through containers

### Performance & Optimization

#### Resource Philosophy
- No hard limits on entities, properties, or pages
- System scales based on actual usage
- Performance optimizations applied as needed

#### Query Pagination
All queries support pagination to handle large datasets efficiently:
- Default page size: 50 records
- Configurable page size per component
- Offset-based pagination
- Total count returned with results
- Components can implement virtual scrolling

#### Caching Strategy with TanStack Query
The application uses TanStack Query (React Query) for intelligent data fetching:
- **Automatic Caching**: Query results cached with configurable TTL
- **Background Refetching**: Keeps data fresh without blocking UI
- **Optimistic Updates**: Forms update UI immediately, rollback on error
- **Stale-While-Revalidate**: Show cached data while fetching fresh data
- **Smart Invalidation**: Related queries refresh when data changes

#### Performance Features
- **Virtual Scrolling**: Large lists/tables render only visible items
- **Lazy Loading**: Load related data only when needed
- **Debounced Inputs**: Search and filter inputs wait for typing to finish
- **Progressive Loading**: Load critical data first, enhance with details
- **Batch Operations**: Group multiple updates into single requests

#### Query Performance
- Indexed columns for frequently queried properties
- Query complexity analysis before execution
- Automatic query optimization suggestions
- Result streaming for large exports

### Data Export (Low Priority)

#### Full Project Data Export
- Export all entity instances from a project as Excel file
- One sheet per entity type
- Each row represents an entity instance
- Columns represent properties
- Includes all data (not filtered by queries)
- Administrators only feature
- Useful for backups and data analysis

### Future Enhancements

#### Short-term Roadmap

1. **Enhanced Query Builder**
   - More operators (in, not in, between)
   - Aggregate functions (count, sum, avg)
   - Sorting and pagination

2. **Advanced Form Features**
   - Conditional field visibility
   - Custom validation rules
   - Multi-step forms

3. **Component Library Expansion**
   - Chart components
   - File upload component
   - Rich text editor

#### Long-term Vision

1. **Workflow Engine**
   - Approval processes
   - Automated actions
   - Email notifications

2. **API Builder**
   - REST API generation
   - GraphQL support
   - Webhook integration

3. **Advanced Security**
   - Field-level permissions
   - Data encryption at rest
   - Audit logging

4. **Performance Optimization**
   - Query result caching
   - Lazy loading for large datasets
   - Background job processing

5. **Developer Features**
   - Custom component SDK
   - Plugin system
   - Import/export templates