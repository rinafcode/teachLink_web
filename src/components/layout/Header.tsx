"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { SearchBar } from "@/app/components/search/SearchBar";

export const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleSearchExpanded = (expanded: boolean) => {
    setIsSearchExpanded(expanded);
    if (expanded) {
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link
            href="/"
            className="shrink-0 font-bold text-xl text-blue-600 hover:text-blue-700"
          >
            TeachLink
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md">
            <SearchBar className="w-full" isExpanded={isSearchExpanded} />
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Home
            </Link>
            <Link
              href="/courses"
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Courses
            </Link>
            <Link
              href="/instructor"
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Teach
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Dashboard
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            {/* Mobile Search Icon */}
            <button
              onClick={() => toggleSearchExpanded(!isSearchExpanded)}
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>

            {/* Hamburger Menu */}
            <button
              onClick={toggleMobileMenu}
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Search Bar - Mobile */}
        {isSearchExpanded && (
          <div className="md:hidden pb-4">
            <SearchBar className="w-full" isExpanded={true} />
          </div>
        )}

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <nav className="md:hidden pb-4 space-y-2">
            <Link
              href="/"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/courses"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Courses
            </Link>
            <Link
              href="/instructor"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Teach
            </Link>
            <Link
              href="/dashboard"
              className="block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
};
