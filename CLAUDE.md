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
- Currently using default configuration

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

#### Tailwind Integration
- All Tailwind layers imported (@base, @components, @utilities)
- Custom base styles applying CSS variables
- Dark mode support through `.dark` class

### Supabase Integration
- Client-side: `utils/supabase/client.ts` - Uses `createBrowserClient`
- Server-side: `utils/supabase/server.ts` - Uses `createServerClient` with Next.js cookies
- Middleware: `middleware.ts` - Updates session on every request
- Middleware matcher configured to exclude static assets

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