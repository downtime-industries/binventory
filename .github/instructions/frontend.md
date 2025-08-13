---
applyTo: "frontend/**/*"
---

# Binventory Frontend Development Guide

## Stack Overview

The Binventory frontend uses:
- **React**: For UI components and state management
- **Vite**: For build tooling and development server
- **Tailwind CSS**: For utility-first styling
- **React Query**: For data fetching and cache management
- **React Router**: For client-side routing

## Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── main.tsx         # Entry point
│   ├── App.tsx          # Main application component
│   ├── api/             # API client and endpoints
│   ├── assets/          # Images, fonts, etc.
│   ├── components/      # Reusable UI components
│   │   ├── common/      # Common UI elements
│   │   ├── containers/  # Container-related components
│   │   ├── items/       # Item-related components
│   │   └── tags/        # Tag-related components
│   ├── context/         # React context providers
│   ├── hooks/           # Custom React hooks
│   ├── layouts/         # Page layout components
│   ├── pages/           # Page components
│   └── utils/           # Helper functions
├── index.html           # HTML entry point
├── package.json         # Dependencies and scripts
├── tailwind.config.js   # Tailwind configuration
├── postcss.config.js    # PostCSS configuration
└── vite.config.ts       # Vite configuration
```

## Key Components

### Layouts
- `MainLayout`: Main application layout with header, footer, and content area

### Pages
- `HomePage`: Dashboard/search view
- `ItemPage`: Individual item view
- `ContainerPage`: Container view
- `BinPage`: Bin view
- `AreaPage`: Area view
- `TagPage`: Tag view
- `LoginPage`: Authentication page

### Common Components
- `Header`: Application header with navigation
- `Footer`: Application footer
- `SearchBar`: Global search component
- `ItemCard`: Card display for inventory items
- `TagBadge`: Display for item tags
- `LocationPill`: Displays area/container/bin location

## State Management

- **React Query**: Used for server state (data fetching, caching, mutations)
- **React Context**: Used for application state (theme, auth)
- **Custom Hooks**: Encapsulate data fetching and mutations

## Styling Guidelines

1. **Tailwind CSS**:
   - Use utility classes for styling
   - Maintain consistent spacing, colors, and typography
   - Follow the mobile-first approach for responsive design

2. **Dark Mode**:
   - All components should support both light and dark modes
   - Use `dark:` prefix for dark mode specific styles
   - Toggle theme via `ThemeContext`

3. **Component Organization**:
   - Prefer smaller, focused components
   - Use composition for complex UIs
   - Keep related components together

## Development Workflow

1. **Starting the development server**:
   ```bash
   cd frontend
   npm run dev
   ```

2. **Building for production**:
   ```bash
   npm run build
   ```

3. **Adding new features**:
   - Create or modify components in appropriate directories
   - Use existing hooks for data fetching when possible
   - Add new API client methods in `api/api.ts` if needed
   - Update routing in `App.tsx` for new pages

4. **Working with the API**:
   - All API calls should go through the `api/api.ts` module
   - Use React Query hooks for data fetching and mutations
   - Handle loading and error states appropriately

## Authentication

- JWT-based authentication via GitHub OAuth
- Token is stored in local storage
- Protected routes should redirect to login page when token is missing or invalid

## Performance Considerations

1. **Code Splitting**:
   - Lazy load routes using React.lazy and Suspense
   - Keep bundle size minimal

2. **Rendering Optimization**:
   - Memoize expensive components with React.memo
   - Use callback and memo hooks appropriately
   - Avoid unnecessary re-renders

3. **Data Fetching**:
   - Leverage React Query's caching capabilities
   - Implement pagination for large data sets
   - Use optimistic updates for mutations
