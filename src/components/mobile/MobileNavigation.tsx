import React, { useState } from 'react';
import { Home, Search, BookOpen, User } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
}

export const MobileNavigation: React.FC<{
  initialActive?: string;
  onNavChange?: (id: string) => void;
}> = ({ initialActive = 'home', onNavChange }) => {
  const [activeTab, setActiveTab] = useState(initialActive);

  const navItems: NavItem[] = [
    { id: 'home', label: 'Home', icon: <Home size={24} /> },
    { id: 'search', label: 'Search', icon: <Search size={24} /> },
    { id: 'courses', label: 'Courses', icon: <BookOpen size={24} /> },
    { id: 'profile', label: 'Profile', icon: <User size={24} /> },
  ];

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    if (onNavChange) onNavChange(id);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <li key={item.id} className="flex-1">
              <button
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex flex-col items-center justify-center py-2 space-y-1 transition-colors duration-200
                  ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }
                `}
                aria-label={item.label}
              >
                <div
                  className={`${
                    isActive ? 'scale-110' : 'scale-100'
                  } transition-transform duration-200`}
                >
                  {item.icon}
                </div>
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
