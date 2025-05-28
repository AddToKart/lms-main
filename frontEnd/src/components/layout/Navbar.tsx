import React from 'react';
import { Link } from 'react-router-dom';

interface NavbarProps {
  toggleSidebar: () => void;
  isDarkMode: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar, isDarkMode }) => {
  return (
    <nav className={`fixed top-0 left-0 right-0 z-40 h-16 ${
      isDarkMode 
        ? 'bg-secondary-900 text-white border-b border-secondary-800' 
        : 'bg-white text-secondary-900 shadow-md'
    } transition-all duration-200`}>
      <div className="flex justify-between h-full px-4">
        <div className="flex items-center">
          <button 
            onClick={toggleSidebar}
            className={`lg:hidden p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
              isDarkMode ? 'text-secondary-300 hover:bg-secondary-800' : 'text-secondary-500 hover:bg-secondary-100'
            } transition-colors duration-150`}
            aria-label="Toggle Sidebar"
          >
            <span className="material-icons">menu</span>
          </button>
          
          <Link to="/" className="flex items-center ml-2 lg:ml-0">
            <div className={`flex items-center justify-center h-9 w-9 rounded-lg ${
              isDarkMode ? 'bg-primary-700' : 'bg-primary-600'
            } text-white mr-3 transition-colors duration-200`}>
              <span className="material-icons text-xl">account_balance</span>
            </div>
            <h1 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-secondary-900'}`}>
              Loan Management
            </h1>
          </Link>
        </div>
        
        <div className="flex items-center">
          <div className={`hidden md:flex items-center rounded-full px-3 py-1.5 mr-4 ${
            isDarkMode ? 'bg-secondary-800' : 'bg-secondary-100'
          }`}>
            <span className="material-icons text-primary-500 mr-2 text-sm">schedule</span>
            <span className={`text-xs font-medium ${
              isDarkMode ? 'text-secondary-300' : 'text-secondary-600'
            }`}>{new Date().toLocaleDateString()}</span>
          </div>
          
          <div className={`flex items-center px-2 py-1 rounded-lg transition-colors duration-150 ${
            isDarkMode ? 'hover:bg-secondary-800' : 'hover:bg-secondary-100'
          }`}>
            <div className="text-right mr-3">
              <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-secondary-900'}`}>
                Admin User
              </div>
              <div className={`text-xs ${isDarkMode ? 'text-secondary-400' : 'text-secondary-500'}`}>
                Administrator
              </div>
            </div>
            <div className={`h-10 w-10 rounded-full ${isDarkMode ? 'bg-primary-700' : 'bg-primary-500'} flex items-center justify-center text-white shadow-sm`}>
              <span className="material-icons">person</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 