import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  toggleSidebar: () => void;
  isDarkMode: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar, isDarkMode }) => {
  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-40 h-16 transition-all duration-300 ${
        isDarkMode
          ? "bg-card border-b border-border shadow-xl backdrop-blur-xl"
          : "bg-white border-b border-gray-200 shadow-md"
      }`}
    >
      <div className="flex justify-between h-full px-4">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={`lg:hidden ${
              isDarkMode
                ? "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                : "text-gray-500 hover:bg-gray-100"
            }`}
            aria-label="Toggle Sidebar"
          >
            <span className="material-icons">menu</span>
          </Button>

          <Link to="/" className="flex items-center ml-2 lg:ml-0">
            <div
              className={`flex items-center justify-center h-10 w-10 rounded-xl mr-3 transition-all duration-300 ${
                isDarkMode
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "bg-primary-600 text-white shadow-md"
              }`}
            >
              <span className="material-icons text-xl">account_balance</span>
            </div>
            <h1
              className={`text-xl font-semibold transition-colors duration-300 ${
                isDarkMode ? "text-foreground" : "text-gray-900"
              }`}
            >
              Loan Management
            </h1>
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          {/* Date Display */}
          <div
            className={`hidden md:flex items-center rounded-lg px-3 py-2 transition-colors duration-300 ${
              isDarkMode
                ? "bg-muted/50 text-muted-foreground"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            <span className="material-icons text-primary mr-2 text-sm">
              schedule
            </span>
            <span className="text-xs font-medium">
              {new Date().toLocaleDateString()}
            </span>
          </div>

          {/* User Profile */}
          <div
            className={`flex items-center px-3 py-2 rounded-lg transition-colors duration-300 ${
              isDarkMode ? "hover:bg-muted/50" : "hover:bg-gray-100"
            }`}
          >
            <div className="text-right mr-3 hidden sm:block">
              <div
                className={`text-sm font-medium transition-colors duration-300 ${
                  isDarkMode ? "text-foreground" : "text-gray-900"
                }`}
              >
                Admin User
              </div>
              <div className="text-xs text-muted-foreground">Administrator</div>
            </div>
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                isDarkMode
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "bg-primary-500 text-white shadow-md"
              }`}
            >
              <span className="material-icons text-lg">person</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
