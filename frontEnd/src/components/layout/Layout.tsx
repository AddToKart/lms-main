import React, { useState, useEffect } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  isDarkMode,
  onToggleTheme,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarOpen && window.innerWidth < 1024) {
        const sidebar = document.getElementById("mobile-sidebar");
        const menuButton = document.getElementById("mobile-menu-button");

        if (
          sidebar &&
          !sidebar.contains(event.target as Node) &&
          menuButton &&
          !menuButton.contains(event.target as Node)
        ) {
          setSidebarOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sidebarOpen]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen && window.innerWidth < 1024) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile overlay - only visible on mobile when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isDarkMode={isDarkMode}
        onToggleTheme={onToggleTheme}
      />

      {/* Main content area */}
      <div className="lg:pl-64 transition-all duration-300 ease-in-out">
        {/* Header */}
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          isDarkMode={isDarkMode}
        />

        {/* Page content */}
        <main className="min-h-screen pt-16">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
