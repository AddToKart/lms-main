import React, { useState } from "react";
import {
  FiMenu,
  FiBell,
  FiSettings,
  FiUser,
  FiChevronDown,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onMenuClick: () => void;
  isDarkMode: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 transition-all duration-300">
      {/* Mobile menu button */}
      <Button
        id="mobile-menu-button"
        variant="ghost"
        size="icon"
        className="lg:hidden hover-lift"
        onClick={onMenuClick}
      >
        <span className="sr-only">Open sidebar</span>
        <FiMenu className="h-5 w-5" />
      </Button>

      {/* Separator */}
      <div className="h-6 w-px bg-border lg:hidden" />

      {/* Header title - shows current page */}
      <div className="flex flex-1">
        <h2 className="text-lg font-semibold text-foreground">
          Loan Management System
        </h2>
      </div>

      {/* Header actions */}
      <div className="flex items-center gap-x-4 lg:gap-x-6">
        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative hover-lift"
          onClick={() => setNotificationsOpen(!notificationsOpen)}
        >
          <span className="sr-only">View notifications</span>
          <FiBell className="h-5 w-5" />
          {/* Notification badge */}
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-destructive-foreground">
              3
            </span>
          </span>
        </Button>

        {/* Settings */}
        <Button variant="ghost" size="icon" className="hover-lift">
          <span className="sr-only">Settings</span>
          <FiSettings className="h-5 w-5" />
        </Button>

        {/* Profile dropdown */}
        <div className="relative">
          <Button
            variant="ghost"
            className="flex items-center gap-x-2 hover-lift"
            onClick={() => setProfileOpen(!profileOpen)}
          >
            <span className="sr-only">Open user menu</span>
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <FiUser className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="hidden lg:flex lg:items-center">
              <span className="ml-2 text-sm font-medium text-foreground">
                Admin
              </span>
              <FiChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
            </span>
          </Button>

          {/* Profile dropdown menu */}
          {profileOpen && (
            <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-popover py-1 shadow-lg ring-1 ring-border focus:outline-none animate-scale-in">
              <a
                href="#"
                className="block px-4 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Your Profile
              </a>
              <a
                href="#"
                className="block px-4 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Settings
              </a>
              <a
                href="#"
                className="block px-4 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Sign out
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Notifications dropdown */}
      {notificationsOpen && (
        <div className="absolute right-4 top-16 z-10 w-80 origin-top-right rounded-md bg-popover py-2 shadow-lg ring-1 ring-border focus:outline-none animate-scale-in">
          <div className="px-4 py-2 border-b border-border">
            <h3 className="text-sm font-medium text-popover-foreground">
              Notifications
            </h3>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {/* Sample notifications */}
            <div className="px-4 py-3 hover:bg-accent transition-colors">
              <p className="text-sm text-popover-foreground">
                New loan application received
              </p>
              <p className="text-xs text-muted-foreground">2 minutes ago</p>
            </div>
            <div className="px-4 py-3 hover:bg-accent transition-colors">
              <p className="text-sm text-popover-foreground">
                Payment overdue notification
              </p>
              <p className="text-xs text-muted-foreground">1 hour ago</p>
            </div>
            <div className="px-4 py-3 hover:bg-accent transition-colors">
              <p className="text-sm text-popover-foreground">
                Client profile updated
              </p>
              <p className="text-xs text-muted-foreground">3 hours ago</p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
