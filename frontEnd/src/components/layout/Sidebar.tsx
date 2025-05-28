import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  onToggleTheme: () => void;
  isDarkMode: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggleTheme, isDarkMode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    
    // Redirect to login page
    navigate('/login');
  };
  
  const menuItems = [
    { path: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { path: '/clients', icon: 'people', label: 'Clients' },
    { path: '/loans', icon: 'account_balance', label: 'Loans' },
    { path: '/payments', icon: 'payment', label: 'Payments' },
    { path: '/reports', icon: 'assessment', label: 'Reports' },
  ];

  return (
    <div 
      className={`fixed inset-y-0 left-0 z-30 w-64 shadow-lg transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 ${isDarkMode ? 'bg-secondary-900' : 'bg-secondary-100'}`}
      style={{ top: '64px', height: 'calc(100vh - 64px)' }}
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto py-2">
          <div className="px-4 py-3">
            <div className={`text-xs uppercase font-semibold tracking-wider ${isDarkMode ? 'text-secondary-400' : 'text-secondary-600'}`}>
              Main Menu
            </div>
          </div>
          <nav className="px-2 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-150 ${
                  isActive(item.path)
                    ? `bg-primary-600 text-white shadow-sm ${isDarkMode ? 'shadow-primary-900/20' : 'shadow-primary-600/20'}`
                    : isDarkMode 
                      ? 'text-secondary-300 hover:bg-secondary-800 hover:text-white' 
                      : 'text-secondary-800 hover:bg-secondary-200 hover:text-secondary-900'
                }`}
              >
                <span className={`material-icons mr-3 text-xl ${isActive(item.path) ? 'opacity-100' : 'opacity-80'}`}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className={`p-4 ${isDarkMode ? 'border-t border-secondary-800' : 'border-t border-secondary-300'}`}>
          <div 
            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors duration-150 ${
              isDarkMode ? 'bg-secondary-800 hover:bg-secondary-700' : 'bg-secondary-200 hover:bg-secondary-300'
            }`}
            onClick={onToggleTheme}
          >
            <div className="flex items-center">
              <span className={`material-icons mr-3 ${isDarkMode ? 'text-secondary-300' : 'text-secondary-700'}`}>
                {isDarkMode ? 'dark_mode' : 'light_mode'}
              </span>
              <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-secondary-800'}`}>
                {isDarkMode ? 'Dark Mode' : 'Light Mode'}
              </span>
            </div>
            <div className={`relative w-10 h-5 rounded-full ${isDarkMode ? 'bg-primary-700' : 'bg-primary-500'}`}>
              <div 
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transform transition-transform duration-200 ${
                  isDarkMode ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              ></div>
            </div>
          </div>

          <div className={`mt-4 px-3 py-3 rounded-lg ${isDarkMode ? 'bg-secondary-800' : 'bg-white shadow-sm border border-secondary-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`h-10 w-10 rounded-full overflow-hidden ${
                  isDarkMode ? 'bg-primary-700' : 'bg-primary-500'
                } flex items-center justify-center`}>
                  <span className="material-icons text-white">person</span>
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-secondary-800'}`}>Admin User</p>
                  <p className={`text-xs font-medium ${isDarkMode ? 'text-secondary-400' : 'text-secondary-500'}`}>Administrator</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-secondary-700 text-secondary-400 hover:text-white' : 'hover:bg-secondary-200 text-secondary-600 hover:text-secondary-900'}`}
                title="Logout"
              >
                <span className="material-icons">logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 