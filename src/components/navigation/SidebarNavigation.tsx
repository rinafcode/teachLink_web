'use client';

import React from 'react';
import Link from 'next/link';
import { Home, BookOpen, Users, Settings } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/courses', label: 'Courses', icon: BookOpen },
  { href: '/workshops', label: 'Workshops', icon: Settings },
  { href: '/profile', label: 'Profile', icon: Users },
];

export const SidebarNavigation: React.FC = () => {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  return (
    <aside className="w-full lg:w-72 shrink-0 space-y-8 pr-2">
      <div className="glass-panel p-5 rounded-xl">
        <h3 className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest mb-4">
          Navigation
        </h3>
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-colors duration-200
                    ${isActive ? 'bg-blue-100 dark:bg-blue-900 text-blue-600' : 'text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'}
                  `}
                >
                  <item.icon size={20} className="flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
};
