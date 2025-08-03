# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

本项目全局支持 中文/英语/西语 三种语言类型的切换，新开发内容需要考虑多语言 @/hooks/useLanguage。
单个文件的行数不要太长，尽量不要超过一千行代码，如果超出了，考虑拆分代码。
请你优先复用组件都在 src/components/ 目录下。

## Project Overview

AgroChainHub is an agricultural chemical procurement platform built with Vite, React, TypeScript, and shadcn/ui components. The application provides dual interfaces for buyers and suppliers in the agricultural chemicals market.

## Development Commands

### Core Development
- `npm run dev` - Start development server on port 3070
- `npm run build` - Production build
- `npm run build:dev` - Development build
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Package Management
The project uses npm as the primary package manager, with both `package-lock.json` and `bun.lockb` present.

## Architecture

### Application Structure
- **Vite + React + TypeScript**: Modern build tooling with SWC for fast compilation
- **React Router**: Client-side routing with a catch-all route pattern
- **TanStack Query**: Data fetching and state management
- **shadcn/ui**: Component library built on Radix UI primitives
- **i18next + react-i18next**: Internationalization support for zh/en/es languages

### Key Architecture Patterns

#### Layout System
The app uses a hierarchical layout structure:
- `Layout` component provides the main shell (Header + Sidebar + Content)
- Pages are rendered within the layout's main content area
- User type ("buyer" | "supplier") is passed down to customize UI/UX

#### User Type System
The application has dual-mode functionality:
- **Buyer mode**: Focused on procurement features
- **Supplier mode**: Focused on supply-side features
- User type state is managed at the top level and passed to relevant components

#### Component Organization
```
src/
├── components/
│   ├── home/           # Home page specific components
│   ├── layout/         # Layout components (Header, Sidebar, Layout)
│   └── ui/             # shadcn/ui components
├── pages/              # Page components
├── hooks/              # Custom React hooks (including useLanguage)
├── i18n/               # Internationalization config and translations
│   ├── config.ts       # i18n configuration
│   └── locales/        # Translation files
│       ├── zh.json     # Chinese translations
│       ├── en.json     # English translations
│       └── es.json     # Spanish translations
└── lib/                # Utilities
```

### Styling & Theming
- **Tailwind CSS**: Utility-first styling with custom design tokens
- **CSS Variables**: Theme customization via HSL color variables
- **Custom Color Palette**: Includes `agro-*` colors for brand consistency
- **Dark Mode**: Configured via class-based dark mode

### Path Resolution
Uses `@/` alias pointing to `src/` directory for clean imports.

## Key Dependencies

### UI & Styling
- `@radix-ui/*`: Headless UI primitives
- `tailwindcss`: Utility-first CSS
- `lucide-react`: Icon library
- `class-variance-authority`: Component variant management

### State & Data
- `@tanstack/react-query`: Server state management
- `react-hook-form`: Form handling
- `zod`: Schema validation

### Internationalization
- `i18next`: Core i18n framework
- `react-i18next`: React integration for i18next
- `i18next-browser-languagedetector`: Automatic language detection

### Development
- `lovable-tagger`: Development mode component tagging
- `typescript-eslint`: TypeScript linting

## Route Structure

Current routes are minimal:
- `/` - Main Index page
- `*` - NotFound catch-all (must remain last in route definitions)

When adding new routes, always place them above the catch-all `*` route.

## Component Conventions

- Use TypeScript interfaces for props
- Follow shadcn/ui patterns for new UI components
- Maintain user type props for mode-specific behavior
- Use the established folder structure for component organization

## Internationalization (i18n) Guidelines

### Supported Languages
- **Chinese (zh)**: Default language
- **English (en)**: Primary international language
- **Spanish (es)**: Secondary international language

### Development Guidelines

1. **Always use translation keys** - Never hardcode text in components
   ```typescript
   // ❌ Bad
   <h1>欢迎来到AgroChainHub</h1>
   
   // ✅ Good
   <h1>{t('common.welcome')}</h1>
   ```

2. **Import and use translations**
   ```typescript
   import { useTranslation } from 'react-i18next';
   
   const Component = () => {
     const { t } = useTranslation();
     return <div>{t('key.path')}</div>;
   };
   ```

3. **Translation file structure** - Organize keys by feature/context
   ```json
   {
     "common": { /* Shared translations */ },
     "navigation": { /* Menu and nav items */ },
     "features": { /* Feature-specific */ },
     "userType": { /* User type related */ }
   }
   ```

4. **Language switching** - Use the custom hook
   ```typescript
   import { useLanguage } from '@/hooks/useLanguage';
   
   const { currentLanguage, changeLanguage } = useLanguage();
   ```

5. **Adding new translations**
   - Add keys to all three language files (zh.json, en.json, es.json)
   - Keep the same structure across all files
   - Use descriptive, hierarchical key names

6. **Key naming conventions**
   - Use dot notation: `section.subsection.item`
   - Be descriptive: `navigation.aiQuery` not `nav.ai`
   - Group related translations together