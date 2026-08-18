# Plan: Enhanced Sidebar Navigation for Exact Zoho Parity

I will update the sidebar navigation to strictly follow the Zoho Creator UI pattern: a two-level hierarchy where clicking a main tab reveals its sub-tabs in a secondary sidebar list, and the main content area adjusts accordingly.

## Proposed Changes

### Navigation Structure
- Update `src/lib/nav.ts` to ensure all operational modules are correctly categorized.
- (Already refined `src/lib/nav.ts` to include `Diesel Accounts` under `Diesel` and handle specialized routes like `Tyre Management`).

### Sidebar UI Update
- **Component: `SidebarRail` in `src/components/layout/AppShell.tsx`**
  - Transform the sidebar from a simple icon rail with flyouts into a split-sidebar design.
  - **Left Rail**: Small icons for main categories (Dashboard, Diesel, Sales, etc.).
  - **Secondary Sidebar**: A slide-out or fixed panel that shows the list of sub-modules (the "sub-tabs") for the active category.
  - Ensure the active category stays selected and its sub-menu remains visible to match the Zoho "same to same" experience.

### Routing Logic
- Ensure clicking a left-rail icon navigates to the first child and opens that category's sub-menu.
- Update `AppShell` layout to accommodate the wider navigation structure while maintaining responsiveness.

## Technical Details
- Use `useLocation` to determine the active parent category.
- Implement a persistent secondary sidebar that changes based on the top-level route.
- Use Tailwind for a clean, professional transition between categories.
