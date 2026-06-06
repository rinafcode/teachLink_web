'use client';

import React from 'react';
import Link from 'next/link';
import { useInternationalization } from '@/hooks/useInternationalization';
import { Award, Briefcase, ChevronRight, FileText, Globe, HelpCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  const { t } = useInternationalization();

  const grantLinks = [
    { name: 'Apply for Grants', href: '/grants/apply', icon: Award },
    { name: 'Active Grant Programs', href: '/grants/programs', icon: Globe },
    { name: 'Application Guidelines', href: '/grants/guidelines', icon: FileText },
    { name: 'Grant FAQ', href: '/grants/faq', icon: HelpCircle },
    { name: 'Manage My Grants', href: '/dashboard/grants', icon: Briefcase },
  ];

  return (
    <footer className="no-print bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 transition-colors duration-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-1">
            <Link
              href="/"
              className="font-bold text-2xl text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              TeachLink
            </Link>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Empowering education through decentralized learning and comprehensive funding
              opportunities.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Platform</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/courses"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center group"
                >
                  <ChevronRight className="w-4 h-4 mr-2 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  {t('navigation.courses') || 'Courses'}
                </Link>
              </li>
              <li>
                <Link
                  href="/instructor"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center group"
                >
                  <ChevronRight className="w-4 h-4 mr-2 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  {t('navigation.teach') || 'Teach'}
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center group"
                >
                  <ChevronRight className="w-4 h-4 mr-2 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  {t('navigation.dashboard') || 'Dashboard'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Grant Management Section */}
          <div className="col-span-1 md:col-span-2 bg-blue-50 dark:bg-gray-900 rounded-2xl p-6 border border-blue-100 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Grant Management
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Explore funding opportunities, track applications, and manage active educational
              grants.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {grantLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition-all duration-200 shadow-sm border border-transparent hover:border-blue-200 dark:hover:border-blue-500 group"
                  >
                    <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:text-white transition-colors" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-white transition-colors">
                      {link.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} TeachLink. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              href="/privacy"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
