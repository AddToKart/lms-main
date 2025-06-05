import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiLogOut,
  FiMoon,
  FiSun,
  FiX,
  FiCreditCard,
  FiUser,
} from "react-icons/fi";
import { logout } from "../../utils/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  onToggleTheme,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    // Use the secure logout function
    logout();
    navigate("/login");
  };

  const menuItems = [
    { path: "/dashboard", icon: "dashboard", label: "Dashboard" },
    { path: "/clients", icon: "people", label: "Clients" },
    { path: "/loans", icon: "account_balance", label: "Loans" },
    { path: "/payments", icon: "payment", label: "Payments" },
    { path: "/reports", icon: "assessment", label: "Reports" },
  ];

  return (
    <>
      {/* Desktop Sidebar - Fixed positioning */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-border bg-card px-6 pb-4">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <FiCreditCard className="text-primary-foreground text-lg" />
              </div>
              <span className="text-xl font-bold text-foreground">LMS</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {menuItems.map((item) => (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                          isActive(item.path)
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                      >
                        <span
                          className={`material-icons mr-3 text-xl transition-transform duration-200 ${
                            isActive(item.path)
                              ? "scale-110"
                              : "group-hover:scale-105"
                          }`}
                        >
                          {item.icon}
                        </span>
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>

              {/* Bottom section */}
              <li className="mt-auto">
                <div className="space-y-4">
                  {/* Theme Toggle Slider */}
                  <div className="border-t border-border pt-4">
                    <div className="flex items-center justify-between px-3 py-2">
                      <div className="flex items-center gap-2">
                        <FiSun className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">
                          Theme
                        </span>
                      </div>
                      <div className="flex items-center">
                        <button
                          onClick={onToggleTheme}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                            isDarkMode
                              ? "bg-primary"
                              : "bg-gray-200 dark:bg-gray-700"
                          }`}
                          role="switch"
                          aria-checked={isDarkMode}
                        >
                          <span className="sr-only">Toggle dark mode</span>
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              isDarkMode ? "translate-x-5" : "translate-x-0"
                            }`}
                          >
                            {isDarkMode ? (
                              <FiMoon className="h-3 w-3 text-gray-600 absolute top-1 left-1" />
                            ) : (
                              <FiSun className="h-3 w-3 text-yellow-500 absolute top-1 left-1" />
                            )}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* User Profile with Logout Button */}
                  <div className="flex items-center gap-x-2 px-3 py-3 text-sm font-medium leading-6 text-muted-foreground hover:bg-muted rounded-md transition-all duration-200 hover-lift">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                      <FiUser className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        Admin User
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        admin@lms.com
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleLogout}
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 hover-lift flex-shrink-0"
                      title="Logout"
                    >
                      <FiLogOut className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile Sidebar - Overlay positioning */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex grow flex-col gap-y-5 overflow-y-auto px-6 pb-4 h-full">
          {/* Mobile Header with Close Button */}
          <div className="flex h-16 shrink-0 items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <FiCreditCard className="text-primary-foreground text-lg" />
              </div>
              <span className="text-xl font-bold text-foreground">LMS</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 hover-lift"
            >
              <FiX className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {menuItems.map((item) => (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        onClick={onClose} // Close sidebar when nav item is clicked
                        className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                          isActive(item.path)
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                      >
                        <span
                          className={`material-icons mr-3 text-xl transition-transform duration-200 ${
                            isActive(item.path)
                              ? "scale-110"
                              : "group-hover:scale-105"
                          }`}
                        >
                          {item.icon}
                        </span>
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>

              {/* Mobile Bottom section */}
              <li className="mt-auto">
                <div className="space-y-4">
                  {/* Mobile Theme Toggle Slider */}
                  <div className="border-t border-border pt-4">
                    <div className="flex items-center justify-between px-3 py-2">
                      <div className="flex items-center gap-2">
                        <FiSun className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">
                          Theme
                        </span>
                      </div>
                      <div className="flex items-center">
                        <button
                          onClick={onToggleTheme}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                            isDarkMode
                              ? "bg-primary"
                              : "bg-gray-200 dark:bg-gray-700"
                          }`}
                          role="switch"
                          aria-checked={isDarkMode}
                        >
                          <span className="sr-only">Toggle dark mode</span>
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              isDarkMode ? "translate-x-5" : "translate-x-0"
                            }`}
                          >
                            {isDarkMode ? (
                              <FiMoon className="h-3 w-3 text-gray-600 absolute top-1 left-1" />
                            ) : (
                              <FiSun className="h-3 w-3 text-yellow-500 absolute top-1 left-1" />
                            )}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Mobile User Profile with Logout Button */}
                  <div className="flex items-center gap-x-2 px-3 py-3 text-sm font-medium leading-6 text-muted-foreground hover:bg-muted rounded-md transition-all duration-200 hover-lift">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                      <FiUser className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        Admin User
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        admin@lms.com
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleLogout}
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 hover-lift flex-shrink-0"
                      title="Logout"
                    >
                      <FiLogOut className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
