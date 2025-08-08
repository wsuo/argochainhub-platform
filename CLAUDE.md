# CLAUDE.md

本文件提供Claude Code (claude.ai/code)在处理本项目代码时的指导。

本项目是热启动的，修改自动重启，测试之前不用启动。

本系统是面向C端用户的，请你永远都要将用户体验放在第一位。界面UI、组件设计语言都要统一。

项目的架构模式。所有业务页面都应该在Layout中渲染。

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


#### Standard Background Pattern
All new pages should use the following background pattern for consistency:

```jsx
<main className="flex-1 p-6 bg-gradient-to-br from-slate-50 via-agro-green-light/30 to-agro-blue-light/40 relative overflow-hidden">
  {/* 装饰性渐变叠层 */}
  <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-agro-blue/8 pointer-events-none" />
  <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-radial from-primary/10 via-primary/5 to-transparent rounded-full blur-3xl pointer-events-none" />
  <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-radial from-agro-blue/8 via-agro-blue/4 to-transparent rounded-full blur-3xl pointer-events-none" />
  
  {/* 内容区域 */}
  <div className="relative z-10">
    {/* Page content here */}
  </div>
</main>
```

**Background Components:**
- **Main gradient**: `bg-gradient-to-br from-slate-50 via-agro-green-light/30 to-agro-blue-light/40`
- **Decorative overlays**: Multiple gradient layers for visual depth
- **Radial highlights**: Subtle glowing effects using system colors
- **Content isolation**: Content wrapped in `relative z-10` container

**Required CSS Utility:**
Ensure `bg-gradient-radial` is available in your CSS:
```css
.bg-gradient-radial {
  background-image: radial-gradient(circle, var(--tw-gradient-stops));
}
```

## Internationalization (i18n) Guidelines

### Overview
项目使用 i18next + react-i18next 实现完整的国际化支持，应用启动时通过 Suspense 确保翻译资源完全加载。

### Supported Languages
- **Chinese (zh)**: Default language
- **English (en)**: Primary international language  
- **Spanish (es)**: Secondary international language

### Core Files
- **Config**: `@/i18n/config.ts` - i18next 配置和语言检测
- **Hook**: `@/hooks/useLanguage.tsx` - 语言切换逻辑
- **Translations**: `@/i18n/locales/{lang}.json` - 分语言翻译文件

### Usage Examples

```typescript
// 1. 基本使用
import { useTranslation } from 'react-i18next';

const Component = () => {
  const { t } = useTranslation();
  return <h1>{t('common.welcome')}</h1>;
};

// 2. 语言切换
import { useLanguage } from '@/hooks/useLanguage';

const { currentLanguage, changeLanguage } = useLanguage();
// changeLanguage('en') 切换到英语

// 3. 多语言文本对象处理
const getLocalizedText = (text: MultiLanguageText): string => {
  const langKey = currentLanguage as keyof MultiLanguageText;
  return text[langKey] || text['zh-CN'];
};
```

### Translation Structure
```json
{
  "common": { /* 公共翻译 */ },
  "navigation": { /* 导航菜单 */ },
  "errors": { /* 错误处理 */ },
  "features": { /* 功能模块 */ }
}
```

### Best Practices
- 永远使用翻译键，禁止硬编码文本
- 所有新功能必须同时添加三种语言的翻译
- 使用层级结构组织翻译键 (`module.section.item`)
- 通过 App.tsx 中的 Suspense 确保翻译资源加载完成

## Dictionary Service (字典服务)

### Usage
The project includes a unified dictionary service for fetching standardized data from backend dictionary APIs.

```typescript
import { dictionaryService } from '@/services/dictionaryService';

// Get dictionary data by type
const categories = await dictionaryService.getDictionary('product_category');

// Shorthand for product categories
const productCategories = await dictionaryService.getProductCategories();
```

### Integration with TanStack Query
```typescript
const { data: categoryDict = [] } = useQuery({
  queryKey: ['product-categories-dict'],
  queryFn: () => dictionaryService.getProductCategories(),
  staleTime: 10 * 60 * 1000, // 10min cache for dictionary data
});
```

### API Convention
- **Endpoint**: `GET /api/v1/dictionaries/{dictType}`
- **Dictionary types**: `product_category`, etc.
- **Usage**: Use `key` for API queries, `label` for display text

See implementation in `ProductsPage.tsx` for complete usage example.

## Error Handling System (错误处理系统)

### Overview
项目实现了统一的错误处理架构，包含智能错误解析、用户友好提示和多语言支持。

### Core Components
- **ErrorBoundary** (`@/components/common/ErrorBoundary.tsx`): 通用错误显示容器
- **PermissionError** (`@/components/common/PermissionError.tsx`): 权限错误专用组件  
- **ErrorParser** (`@/utils/errorParser.ts`): 错误解析和分类工具
- **useErrorHandler** (`@/hooks/useErrorHandler.ts`): 统一错误处理Hook

### Usage Examples

```typescript
// 1. React Query错误处理
const errorHandler = useQueryErrorHandler({
  module: 'inquiry',
  action: 'read', 
  resourceType: 'list'
});

const { data, error } = useQuery({
  queryKey: ['inquiries'],
  queryFn: () => InquiryService.getInquiries(),
  retry: false // 建议禁用重试避免重复请求
});

// 手动处理错误
useEffect(() => {
  if (error && !errorHandler.hasError) {
    errorHandler.handleError(error);
  }
}, [error, errorHandler]);

// 2. 条件渲染错误组件
if (errorHandler.isPermissionError) {
  return (
    <PermissionError
      error={errorHandler.parsedError}
      businessContext="inquiry"
      onRetry={() => errorHandler.retry(refetch)}
      onNavigateBack={() => errorHandler.navigateBack('/')}
    />
  );
}

if (errorHandler.hasError) {
  return (
    <ErrorBoundary
      error={errorHandler.parsedError}
      loading={isLoading}
      onRetry={() => errorHandler.retry(refetch)}
      onNavigateBack={() => errorHandler.navigateBack('/')}
    />
  );
}
```

### Error Types
- **Permission**: 权限相关错误 (403)
- **Auth**: 认证相关错误 (401) 
- **Network**: 网络连接错误
- **Data**: 数据不存在错误 (404)
- **Business**: 业务逻辑错误 (400)

### Translation Keys
错误信息支持多语言，相关翻译键位于 `errors.*` 命名空间下。详见翻译文件结构。