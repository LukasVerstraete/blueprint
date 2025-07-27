# Blueprint Implementation Plan

## Overview
This document outlines the implementation phases for Blueprint, organized by dependencies and logical progression. Each phase builds upon the previous ones to create a complete application.

## Implementation Phases

### Phase 1: Foundation & Core Infrastructure ✅
**Status:** Completed
- Next.js setup with TypeScript, Tailwind CSS, shadcn/ui
- Supabase integration for authentication
- Basic authentication system (login/signup)
- Project structure and development environment

### Phase 2: Application Layout & Navigation Shell
**Dependencies:** Phase 1  
**Priority:** Critical - UI foundation  
**Estimated Time:** 3-4 days

1. **Basic Layout Structure**
   - Fixed left sidebar (240px/16rem width)
   - Scrollable content area (remaining width)
   - Responsive considerations
   - Layout components using Tailwind CSS

2. **Navigation Components**
   - Sidebar navigation component
   - Project switcher in header
   - User menu dropdown
   - Breadcrumb component structure


### Phase 3: Database Schema & Multi-tenancy
**Dependencies:** Phase 1  
**Priority:** Critical - Everything depends on this  
**Estimated Time:** 1-2 weeks

1. **Database Schema Implementation**
   - Create all tables from database-schema.md
   - Set up foreign key relationships
   - Implement audit columns (created_at, updated_at, created_by, last_modified_by)
   - Add indexes for performance

2. **Row-Level Security (RLS)**
   - Project isolation policies
   - Role-based access policies
   - Test security boundaries

3. **Database Functions & Triggers**
   - update_updated_at() trigger
   - validate_property_instance() trigger
   - Helper functions for common operations

### Phase 4: User & Project Management
**Dependencies:** Phase 2, 3  
**Priority:** High - Required for all user interactions  
**Estimated Time:** 1-2 weeks

1. **Project Management**
   - Project creation UI
   - Project listing/cards on main page with user's role displayed
   - Project switcher component
   - Recent projects list
   - Remember last active project per user
   - Archive/restore functionality (soft delete)
   - Project duplication feature
   - Transfer ownership functionality
   - Project context provider

2. **User Role Management**
   - Role assignment interface (admin only)
   - User invitation system:
     - Invitation links expire after 7 days
     - One-time use only
     - Audit trail of invitations
   - Three roles: Default, ContentManager, Administrator
   - Permission checking hooks/utilities
   - Role-based component visibility


### Phase 5: Entity Management System
**Dependencies:** Phase 3  
**Priority:** Critical - Core data modeling  
**Estimated Time:** 2-3 weeks

1. **Entity CRUD**
   - Entity creation form
   - Entity listing page
   - Edit/delete functionality
   - Display string builder UI

2. **Property Management**
   - Add properties to entities
   - Property type selection
   - Sort order management
   - Required field configuration
   - Default values

3. **Entity Relationships**
   - Entity reference properties
   - Cycle detection algorithm
   - Relationship validation

### Phase 6: Entity Instance Storage
**Dependencies:** Phase 5  
**Priority:** High - Enables data storage  
**Estimated Time:** 1-2 weeks

1. **Instance Management**
   - Create entity instances
   - Property instance storage
   - Value type casting system
   - Soft delete handling

2. **Display String System**
   - Template parser
   - Property value resolution
   - Display string rendering

### Phase 7: Query Builder
**Dependencies:** Phase 6  
**Priority:** High - Required for data retrieval  
**Estimated Time:** 2-3 weeks

1. **Query Structure**
   - Query groups (AND/OR) with separate tables
   - Query rules with all operators per property type:
     - String: equals, not_equals, contains, not_contains, starts_with, ends_with, is_empty, is_not_empty, matches_regex
     - Number: equals, not_equals, greater_than, less_than, greater_than_or_equal, less_than_or_equal, is_null, is_not_null
     - Date/DateTime: equals, not_equals, before, after, in_last_days, in_last_months, is_today, is_this_week, is_this_month
     - Boolean: is_true, is_false, is_null
     - Time: equals, not_equals, before, after, is_null, is_not_null
   - Nested group support
   - Query validation

2. **Query UI**
   - Visual query builder
   - Drag-and-drop interface
   - Property/operator selection (excluding entity properties)
   - Value input by type (including number input for "in last X days/months")

3. **Query Execution**
   - SQL generation
   - Result pagination
   - Query caching with TanStack Query

### Phase 8: Page Builder - Structure
**Dependencies:** Phase 7  
**Priority:** High - Core UI system  
**Estimated Time:** 2 weeks

1. **Page Management**
   - Page creation/editing
   - Page hierarchy (unlimited subpages)
   - Page parameters with separate table:
     - Parameter name, data type (string, number, boolean)
     - Required/optional flags
     - Value validation against types
   - URL structure (ID-based: /{pageId}/{subpageId}?params)
   - Breadcrumb template support

2. **Container System**
   - Container CRUD with both page_id and parent_container_id
   - Flex/Grid layouts with configuration:
     - Default spacing between elements (16px)
     - Internal padding
     - Optional background color
   - Nested containers (unlimited depth)
   - Visual layout editor

### Phase 9: Page Builder - Components
**Dependencies:** Phase 8  
**Priority:** High - User-facing features  
**Estimated Time:** 3-4 weeks

1. **Component Implementation Order:**
   - Label Component:
     - Static text, entity display, property value, query result modes
   - Property Component:
     - Shows property name and value below
   - List Component:
     - Query-based with pagination
   - Table Component:
     - Separate table_columns configuration table
     - Column visibility and ordering
   - Form Component:
     - Separate form_properties configuration table
     - Create/Update modes
     - Column layout (1-4 columns)
     - Property visibility and ordering

2. **Component Features**
   - Configuration storage as key-value pairs
   - Query parameter binding from URL
   - Entity instance resolution
   - Error states with graceful degradation

3. **Form Component Specifics**
   - Create/Update modes
   - Field validation:
     - Required field enforcement
     - Inline error messages below fields
     - "This field is required" message
     - Red border indicators
     - "Please select an option" for empty entity dropdowns
   - Property selection (required fields always show in create forms)
   - Column layout configuration
   - Submission handling

### Phase 10: Navigation & Routing
**Dependencies:** Phase 9  
**Priority:** Medium - UX enhancement  
**Estimated Time:** 1 week

1. **Navigation System**
   - Auto-generated menus (top-level pages only in sidebar)
   - Breadcrumb rendering with template support
   - Context passing via URL query parameters
   - Deep linking support
   - Navigation updates when entering project context

### Phase 11: Data Integrity & Robustness
**Dependencies:** Phase 10  
**Priority:** Medium - System stability  
**Estimated Time:** 1-2 weeks

1. **Breaking Changes**
   - Impact analysis ("This property is used in 3 pages and 2 queries")
   - Graceful degradation:
     - "This property has been deleted" warnings
     - DisplayStrings show remaining properties only
     - Forms skip deleted properties automatically
     - Queries exclude deleted properties
   - Different deletion strategies:
     - Soft deletes: Projects, Entities, Properties, Pages, Queries
     - Hard deletes with CASCADE: Containers, Components, Config tables
   - Recovery tools (undelete for soft-deleted items)

2. **Data Validation**
   - Type conversion
   - Required field enforcement
   - Error handling

### Phase 12: Performance Optimization
**Dependencies:** Phase 11  
**Priority:** Low - Enhancement  
**Estimated Time:** 1-2 weeks

1. **Performance Features**
   - Virtual scrolling
   - Lazy loading
   - Debounced inputs
   - Query optimization

2. **Caching Strategy**
   - TanStack Query setup
   - Optimistic updates
   - Background refetching

### Phase 13: Advanced Features
**Dependencies:** Phase 12  
**Priority:** Low - Nice to have  
**Estimated Time:** 1 week

1. **Data Export**
   - Excel export (administrator only):
     - All entity instances from project
     - One sheet per entity type
     - Not filtered by queries
     - Low priority feature

