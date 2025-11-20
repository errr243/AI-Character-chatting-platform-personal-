# UI Migration Checklist

This guide outlines the steps to port the AI Chat Platform UI to another React project.

## 1. Dependencies
This project uses **Vanilla CSS** and standard **React**. There are **NO** external UI libraries (like Tailwind, MUI, or Styled Components) or Icon libraries to install.

- [ ] Ensure the target project has `react` and `react-dom` installed.

## 2. Global Styles & Fonts
The design system relies on CSS variables defined in `index.css`.

- [ ] **Copy `src/index.css` content** to your target project's global CSS file (e.g., `index.css` or `App.css`).
    - *Critical*: Ensure the Google Fonts import (`@import url('https://fonts.googleapis.com/css2?family=Inter...`) is at the top.
    - *Critical*: Ensure the `:root` variables for colors and spacing are included.

## 3. Component Migration
Copy the following files to your target project's component directory (e.g., `src/components/`):

### Core Components
- [ ] `Layout.jsx` & `Layout.css`
- [ ] `Sidebar.jsx` & `Sidebar.css`
- [ ] `RightSidebar.jsx` & `RightSidebar.css`
- [ ] `ChatArea.jsx` & `ChatArea.css`
- [ ] `MessageBubble.jsx` & `MessageBubble.css`

## 4. Integration (App.jsx)
You need to wire up the state management in your parent component.

- [ ] **State**: Copy the `useState` hooks for:
    - `selectedCharacterId`
    - `isSidebarOpen`
    - `isRightSidebarOpen`
- [ ] **Handlers**: Ensure you pass the toggle functions (`() => setIsSidebarOpen(!isSidebarOpen)`) to the `ChatArea` component.
- [ ] **Data**: If you don't have real data yet, copy the `characters` mock array to test the UI.

## 5. Assets
- [ ] This project uses text characters (e.g., `«`, `»`, `⋮`) for icons, so **no image assets** need to be migrated for the UI to work.

## 6. Verification
After copying:
- [ ] Check if the font (Inter) is loading correctly.
- [ ] Verify that `layout-container` takes up the full height (`100vh`).
- [ ] Test both sidebar toggles to ensure CSS transitions work.
