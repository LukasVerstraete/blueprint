# Query Builder Setup Guide

The Query Builder feature requires database tables that may not exist in your Supabase instance yet. Follow these steps to set it up:

## Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard at https://supabase.com/dashboard
2. Navigate to the SQL Editor
3. Run each migration file in order from `/supabase/migrations/`:
   - First run `004_create_query_tables.sql` - Creates the queries, query_groups, and query_rules tables
   - Then run `008_enable_rls.sql` - Enables Row Level Security on all tables
   - Then run `009_create_rls_policies.sql` - Creates the RLS policies for queries
   - Finally run `012_create_query_execution_function.sql` - Creates the function for executing dynamic queries

## Option 2: Using Supabase CLI (If you have access)

If you have the service role key:

```bash
# Set up Supabase CLI authentication
supabase login

# Link to your project
supabase link --project-ref phxbechnazdwmjlpvsdu

# Push all migrations
supabase db push
```

## Verifying the Setup

After running the migrations, you can verify everything is set up correctly by:

1. Going to the Table Editor in Supabase Dashboard
2. Check that these tables exist:
   - `queries`
   - `query_groups`
   - `query_rules`

3. Check that RLS is enabled on these tables (you'll see a shield icon)

## Troubleshooting

If you're still getting errors:

1. Check the browser console and network tab for detailed error messages
2. Visit `/api/projects/[YOUR_PROJECT_ID]/queries/test` to run diagnostics
3. Ensure you're logged in and have the correct role in the project

## Common Issues

- **500 Error**: Usually means the tables don't exist or RLS policies are missing
- **401 Error**: You're not authenticated
- **403 Error**: You don't have the required role (need ContentManager or Administrator)
- **404 Error**: The project doesn't exist or you don't have access to it