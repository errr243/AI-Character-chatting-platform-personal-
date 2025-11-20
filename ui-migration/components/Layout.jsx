import React from 'react';
import './Layout.css';

const Layout = ({ children, sidebar, isSidebarOpen, rightSidebar, isRightSidebarOpen }) => {
  return (
    <div className="layout-container">
      <aside className={`layout-sidebar ${!isSidebarOpen ? 'closed' : ''}`}>
        {sidebar}
      </aside>
      <main className="layout-main">
        {children}
      </main>
      <aside className={`layout-sidebar layout-right-sidebar ${!isRightSidebarOpen ? 'closed' : ''}`}>
        {rightSidebar}
      </aside>
    </div>
  );
};

export default Layout;
