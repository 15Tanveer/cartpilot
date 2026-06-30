/**
 * MainLayout Component (GLOBAL SCSS Version)
 * Main layout wrapper with sidebar, header, and content
 */

import React, { useState } from "react";
import { Layout as AntLayout } from "antd";
import Header from "../components/HeaderComponent/Header";
import DynamicSidebar from "../components/DynamicSidebar/DynamicSidebar";
import { useResponsive, useTheme, useSidebar } from "../hooks";
import "./MainLayout.scss";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { isMobile } = useResponsive();
  const { theme, toggleTheme } = useTheme();
  const { collapsed, toggleSidebar } = useSidebar();
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const handleMenuClick = () => {
    if (isMobile) {
      setSidebarVisible(true);
    } else {
      toggleSidebar();
    }
  };

  return (
    <AntLayout
      className={`layout theme-${theme}`}
      style={{ minHeight: "100vh" }}
    >
      {/* Desktop Sidebar */}
      {!isMobile && (
        <DynamicSidebar
          collapsed={collapsed}
          onCollapsedChange={toggleSidebar}
          isMobile={false}
        />
      )}

      {/* Main Content Area */}
      <AntLayout className="mainLayout">
        <Header
          onMenuClick={handleMenuClick}
          onThemeToggle={toggleTheme}
          theme={theme}
          collapsed={collapsed}
          onCollapseToggle={toggleSidebar}
        />

        {/* Mobile Sidebar */}
        {isMobile && (
          <DynamicSidebar
            isMobile={true}
            sidebarVisible={sidebarVisible}
            onSidebarClose={() => setSidebarVisible(false)}
          />
        )}

        <AntLayout.Content className="content">
          <div className="contentInner">{children}</div>
        </AntLayout.Content>
      </AntLayout>
    </AntLayout>
  );
};

export default MainLayout;
