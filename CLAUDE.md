# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Blueprint is a Next.js application built with TypeScript, Tailwind CSS, shadcn/ui components, and Supabase for the database. It's configured for deployment on Vercel.

## Development Environment

The project uses a VS Code Dev Container with:
- .NET 9.0 SDK (Debian Bookworm base)
- Node.js LTS with npm, yarn, pnpm, and nvm
- TypeScript (latest)
- GitHub CLI

## Commands

- **Development**: `pnpm dev` - Start the development server on http://localhost:3000
- **Build**: `pnpm build` - Build the application for production
- **Start**: `pnpm start` - Start the production server
- **Lint**: `pnpm lint` - Run ESLint to check code quality
- **Type Check**: TypeScript checking happens automatically during build
- **Install shadcn/ui component**: `pnpm dlx shadcn@latest add [component-name]`

## Architecture

### Project Structure
- `/app` - Next.js App Router pages and layouts
  - `layout.tsx` - Root layout with metadata and global CSS import
  - `page.tsx` - Home page component
  - `globals.css` - Global styles with Tailwind directives and CSS variables
- `/components` - Reusable React components (shadcn/ui components)
- `/lib` - Utility functions and shared code
  - `utils.ts` - Contains `cn()` helper for className merging
- `/utils` - Helper utilities
  - `/utils/supabase` - Supabase client configurations
    - `client.ts` - Browser client configuration
    - `server.ts` - Server client configuration with cookie handling
    - `middleware.ts` - Session update logic for middleware
- `/public` - Static assets

### Key Technologies
- **Next.js 15.4** - React framework with App Router
- **React 19.1.0** - UI library
- **TypeScript 5.8.3** - Type-safe JavaScript with strict mode enabled
- **Tailwind CSS 4.1** - Utility-first CSS framework with dark mode support
- **shadcn/ui** - Component library built on Radix UI
- **Supabase** - Backend as a Service for authentication and database
- **pnpm** - Fast, disk space efficient package manager

### Configuration Files

#### TypeScript Configuration (`tsconfig.json`)
- Target: ES2017
- Strict mode enabled
- Path alias: `@/*` maps to root directory
- Next.js plugin configured

#### Tailwind Configuration (`tailwind.config.ts`)
- Dark mode: class-based (`darkMode: ["class"]`)
- Custom CSS variables for theming
- Extended color palette using CSS variables
- Container configuration with centered layout
- Custom animations for accordion components

#### PostCSS Configuration (`postcss.config.mjs`)
- Tailwind CSS v4 PostCSS plugin (@tailwindcss/postcss) and Autoprefixer configured

#### Next.js Configuration (`next.config.mjs`)
- ESLint errors ignored during builds (temporary workaround)
- TypeScript errors ignored during builds (temporary workaround)
- Note: These settings should be removed once all linting/type issues are resolved

#### ESLint Configuration (`.eslintrc.json`)
- Extends: `next/core-web-vitals` and `next/typescript`
- Custom rules:
  - `@typescript-eslint/no-unused-vars`: Error with underscore exceptions
  - `@typescript-eslint/no-explicit-any`: Warning
  - Console warnings except for warn/error
  - React in JSX scope disabled (Next.js handles this)

#### shadcn/ui Configuration (`components.json`)
- Style: default
- RSC: true
- TypeScript: true
- Tailwind config path specified
- CSS variables enabled
- Component aliases configured

### Styling System

#### CSS Variables (in `app/globals.css`)
- Light and dark theme variables defined
- Colors: background, foreground, primary, secondary, muted, accent, destructive
- UI elements: card, popover, border, input, ring
- Radius variable for consistent border radius
- Note: Direct CSS properties used instead of Tailwind utilities for CSS variables due to Tailwind v4 compatibility

#### Tailwind Integration
- All Tailwind layers imported (@base, @components, @utilities)
- Custom base styles applying CSS variables
- Dark mode support through `.dark` class

### Supabase Integration

**IMPORTANT:** When creating a Supabase client in server-side code (API routes, server components), always use:
```typescript
import { createClient } from '@/utils/supabase/server'
const supabase = await createClient()
```
Do NOT import `createServerClient` directly - use the `createClient` function from the utils.

- Client-side: `utils/supabase/client.ts` - Uses `createBrowserClient`
- Server-side: `utils/supabase/server.ts` - Exports `createClient` function (internally uses `createServerClient` with Next.js cookies)
- Middleware: `middleware.ts` - Currently disabled due to Edge Runtime compatibility issues with Supabase
- Middleware matcher configured to exclude static assets

Note: Supabase middleware is temporarily disabled in production builds due to Edge Runtime compatibility. The Supabase SDK uses Node.js APIs (process.version) which are not available in Edge Runtime.

### Environment Variables
- **Local Development**: `.env.local` (gitignored)
- **Production**: Set directly in Vercel dashboard

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Note: No `.env` file is used since Vercel manages production environment variables through its dashboard.

## Development Guidelines

### Code Style
- ESLint configured with Next.js best practices
- TypeScript strict mode enabled
- Prefer `const` over `let`, never use `var`
- Unused variables/parameters should be prefixed with underscore
- Avoid `console.log` in production code

### Date Formatting
- All dates displayed to users use dd/MM/yyyy format (e.g., 31/07/2025)
- All datetimes displayed to users use dd/MM/yyyy HH:mm format (e.g., 31/07/2025 14:30)
- Date formatting utilities are in `/lib/date-utils.ts`:
  - `formatDate(dateString)` - Formats dates as dd/MM/yyyy
  - `formatDateTime(dateTimeString)` - Formats datetimes as dd/MM/yyyy HH:mm
  - `formatTime(timeString)` - Formats times as HH:mm
  - `parseDate(displayDate)` - Converts dd/MM/yyyy back to ISO format for storage
  - `parseDateTime(displayDateTime)` - Converts dd/MM/yyyy HH:mm back to ISO format
  - `parseTime(displayTime)` - Converts HH:mm back to storage format
- The `formatDisplayValue` function in `/lib/entity-instance-utils.ts` automatically uses these formatters for date/time property types
- Always use these utilities instead of `toLocaleDateString()` or `date-fns` for consistency

#### Date Input Components
- **FormattedDateInput** (`/components/properties/formatted-date-input.tsx`):
  - Handles user input for dates, datetimes, and times
  - Shows dates in dd/MM/yyyy format while editing
  - Automatically converts between display format and ISO storage format
  - Shows appropriate placeholders (dd/MM/yyyy, dd/MM/yyyy HH:mm, HH:mm)
- **PropertyInput** (`/components/entity-instances/property-input.tsx`):
  - Uses FormattedDateInput for all date/time property types
  - Do NOT use native HTML5 date inputs (`<input type="date">`) as they show dates in browser's locale format
- **Important**: All date values are stored in ISO format in the database but displayed in dd/MM/yyyy format to users

### Database Migrations

**IMPORTANT**: All database migrations must be idempotent (safe to run multiple times). Use dynamic SQL with existence checks:
- Use `DROP ... IF EXISTS` for dropping objects
- Check if objects exist before creating them using `DO $$ BEGIN ... EXCEPTION WHEN ... END $$` blocks
- Use `CREATE OR REPLACE` for functions
- This ensures migrations can be re-run safely if they fail partway through

### Component Development
- Use shadcn/ui components when available
- Install new components with: `pnpm dlx shadcn@latest add [component-name]`
- Create new components in `/components` directory
- Use the `cn()` utility from `/lib/utils` for className merging
- Follow shadcn/ui naming conventions

### Styling Guidelines
- Use Tailwind utility classes
- Leverage CSS variables for consistent theming
- Support both light and dark modes
- Use `cn()` helper for conditional classes

### Git Ignore Configuration
The `.gitignore` includes:
- Node modules and pnpm store
- Next.js build outputs (.next/, out/)
- Local environment files (.env.local, .env*.local)
- IDE files (except .vscode/extensions.json)
- OS files (.DS_Store, Thumbs.db)
- TypeScript build info

## Helper Scripts

- `cc.sh`: Wrapper for Claude CLI that runs with `--dangerously-skip-permissions` flag

## Documentation

For detailed information about Blueprint, refer to these documentation files:

- **`/docs/features.md`** - Comprehensive feature documentation covering all aspects of Blueprint including entity management, page builder, query builder, user roles, and more
- **`/docs/database-schema.md`** - Complete database schema with all tables, relationships, indexes, and examples

## Blueprint Application Requirements

### Overview
Blueprint is a multi-tenant application where administrators can manage projects. Within each project, administrators can:
1. Define data types/entities with properties
2. Build pages using predefined components
3. Create queries to fetch and display data
4. Manage user access with role-based permissions

### Core Concepts

#### Entities
Entities are data type definitions (schemas, not instances) with:
- `id` - Unique identifier
- `name` - Display name
- `displayString` - Template string for displaying instances (e.g., `"{firstname} {lastname}"`)

#### Properties
Properties define the fields of an entity:
- `id` - Unique identifier
- `name` - Display name
- `propertyName` - camelCase version for JavaScript objects
- `propertyType` - One of: string, number, date, datetime, time, boolean, entity
- `isList` - Boolean indicating if property holds multiple values
- `value` (optional) - Default value, always stored as string and cast to propertyType
- `entityInstanceId` (optional) - Used when propertyType is "entity"
- `required` (future) - Boolean indicating if field is required in create forms

Note: Entity-type properties should implement cycle detection to prevent circular references.

### Page Builder Components

#### Label Component
Displays text from:
- Static predefined text
- Linked entity (shows displayString)
- Property value
- Query result (single output only)

#### Property Component
- Shows property name
- Shows property value below

#### Form Component
Configuration options:
- Entity type (for create forms) OR query for specific instance (update forms)
- Select which properties to show/hide
- Set as "create" or "update" mode
- Number of columns for layout
- Property order (drag to reorder)
- Required properties always show in create forms

#### List Component
- Linked to a query
- Displays entity instances as a list

#### Table Component
- Linked to a query
- Displays entity instances in table format

### Query Builder
Creates queries specific to one entity type using a tree structure:

#### Query Groups
- Type: AND or OR
- Can contain:
  - Rules (conditions on properties)
  - Nested groups

Example:
```
Root Group (AND)
├── Rule: firstname starts with "J"
├── Rule: lastname starts with "S"
└── Group (OR)
    ├── Rule: age = 18
    └── Rule: age = 19
```

### User Roles

Three hierarchical roles with cumulative permissions:

1. **Default**
   - Full access to use created pages
   - Can perform all CRUD operations through forms
   - Cannot build pages or manage entities

2. **ContentManager** (includes Default permissions)
   - Can create and edit pages
   - Can use page builder components
   - Cannot manage entities or users

3. **Administrator** (includes all permissions)
   - Can manage entities and properties
   - Can manage users and assign roles
   - Full project access

### DisplayString Builder
- Form-based interface
- Dropdown to select available properties
- Mix static text with property placeholders
- Entity-type properties excluded for now (prevents complexity)

### Future Considerations
- Breaking changes when entities/properties are modified (currently unresolved)
- Navigation/menu system between pages
- Parameterized queries
- Bulk operations on entity instances
- Property validation beyond required fields