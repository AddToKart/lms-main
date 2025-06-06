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
    </header>
  );
};

export default Header;
