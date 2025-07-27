# Blueprint Database Migrations

## Overview
This directory contains all database migrations for the Blueprint application's Phase 3 implementation: Database Schema & Multi-tenancy.

## Migration Files

1. **001_create_core_tables.sql**
   - Creates: projects, user_project_roles, entities, properties
   - Establishes the foundation for multi-tenant data modeling

2. **002_create_instance_tables.sql**
   - Creates: entity_instances, property_instances
   - Implements the flexible property-value storage system

3. **003_create_page_structure_tables.sql**
   - Creates: pages, page_parameters, containers, components, component_config
   - Sets up the page builder infrastructure

4. **004_create_query_tables.sql**
   - Creates: queries, query_groups, query_rules
   - Implements the visual query builder structure

5. **005_create_component_config_tables.sql**
   - Creates: form_properties, table_columns
   - Adds specialized configuration for form and table components

6. **006_create_indexes.sql**
   - Adds performance indexes on all foreign keys and commonly queried fields
   - Excludes soft-deleted records from indexes where appropriate

7. **007_create_triggers.sql**
   - Creates update_updated_at() trigger for automatic timestamp management
   - Creates validate_property_instance() trigger for data integrity

8. **008_enable_rls.sql**
   - Enables Row Level Security on all tables

9. **009_create_rls_policies.sql**
   - Implements comprehensive RLS policies for:
     - Project isolation (users only see their project's data)
     - Role-based access (default, content_manager, administrator)

10. **010_create_helper_functions.sql**
    - undelete_property(): Restore soft-deleted properties
    - get_entity_instances(): Retrieve instances with all properties
    - resolve_display_string(): Format entity display strings
    - check_entity_reference_cycle(): Prevent circular entity references

11. **011_test_plan.md**
    - Comprehensive test scenarios for schema validation
    - RLS policy verification tests
    - Helper function tests
    - Performance benchmarks

## Running Migrations

### Local Development
```bash
# Initialize Supabase (if not already done)
supabase init

# Start Supabase locally
supabase start

# Run all migrations
supabase db push

# Or run specific migration
supabase db push --include 001_create_core_tables.sql
```

### Production Deployment
```bash
# Link to your Supabase project
supabase link --project-ref your-project-ref

# Run migrations on production
supabase db push --linked
```

## Important Notes

1. **Migration Order**: Files are numbered to ensure correct execution order. Never skip migrations.

2. **Soft Deletes**: Most tables use soft deletes (is_deleted flag) to preserve data history.

3. **Audit Fields**: All tables include created_at, updated_at, created_by, and last_modified_by fields.

4. **RLS Policies**: Row Level Security is enforced on all tables. Always test with different user roles.

5. **Performance**: Indexes are created for all foreign keys and commonly queried fields.

## Testing

Before deploying to production:

1. Run all migrations on a test database
2. Execute the test plan in 011_test_plan.md
3. Verify RLS policies work correctly for all roles
4. Test performance with realistic data volumes

## Rollback Strategy

If a migration fails:

1. Identify the failing migration
2. Create a rollback script if needed
3. Fix the issue in a new migration file
4. Never modify existing migration files that have been deployed

## Next Steps

After Phase 3 is complete, the next phases will build upon this schema:
- Phase 4: User & Project Management
- Phase 5: Entity Management System
- Phase 6: Entity Instance Storage
- Phase 7: Query Builder
- Phase 8: Page Builder - Structure
- Phase 9: Page Builder - Components