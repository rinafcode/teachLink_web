'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HardDrive, 
  Trash2, 
  Download, 
  FileText, 
  Video, 
  BookOpen,
  AlertTriangle
} from 'lucide-react';
import { useOfflineModeContext } from '../../context/OfflineModeContext';

interface StorageItem {
  id: string;
  type: 'course' | 'video' | 'document' | 'quiz';
  title: string;
  size: number;
  downloadedAt: Date;
  lastAccessed: Date;
  isPinned: boolean;
}

interface StorageManagerProps {
  className?: string;
}

export const StorageManager: React.FC<StorageManagerProps> = ({ className = '' }) => {
  const [showManager, setShowManager] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'date' | 'accessed'>('date');
  const [filterBy, setFilterBy] = useState<'all' | 'course' | 'video' | 'document' | 'quiz'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const { 
    storageUsage, 
    clearOfflineData 
  } = useOfflineModeContext();

  // Sample storage items for demonstration
  const [storageItems, setStorageItems] = useState<StorageItem[]>([
    {
      id: 'course-1',
      type: 'course',
      title: 'React Fundamentals',
      size: 250 * 1024 * 1024, // 250MB
      downloadedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      lastAccessed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      isPinned: true
    },
    {
      id: 'course-2',
      type: 'course',
      title: 'Advanced JavaScript',
      size: 180 * 1024 * 1024, // 180MB
      downloadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      lastAccessed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      isPinned: false
    },
    {
      id: 'video-1',
      type: 'video',
      title: 'Introduction to React Hooks',
      size: 45 * 1024 * 1024, // 45MB
      downloadedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      lastAccessed: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      isPinned: false
    },
    {
      id: 'document-1',
      type: 'document',
      title: 'React Best Practices Guide',
      size: 2 * 1024 * 1024, // 2MB
      downloadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      lastAccessed: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      isPinned: true
    }
  ]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const getTypeIcon = (type: StorageItem['type']) => {
    switch (type) {
      case 'course':
        return <BookOpen className="w-4 h-4 text-blue-500" />;
      case 'video':
        return <Video className="w-4 h-4 text-red-500" />;
      case 'document':
        return <FileText className="w-4 h-4 text-green-500" />;
      case 'quiz':
        return <Download className="w-4 h-4 text-purple-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTypeColor = (type: StorageItem['type']) => {
    switch (type) {
      case 'course':
        return 'bg-blue-100 text-blue-800';
      case 'video':
        return 'bg-red-100 text-red-800';
      case 'document':
        return 'bg-green-100 text-green-800';
      case 'quiz':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const sortedAndFilteredItems = storageItems
    .filter(item => filterBy === 'all' || item.type === filterBy)
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.title.localeCompare(b.title);
        case 'size':
          return b.size - a.size;
        case 'date':
          return b.downloadedAt.getTime() - a.downloadedAt.getTime();
        case 'accessed':
          return b.lastAccessed.getTime() - a.lastAccessed.getTime();
        default:
          return 0;
      }
    });

  const selectedSize = storageItems
    .filter(item => selectedItems.includes(item.id))
    .reduce((acc, item) => acc + item.size, 0);

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === sortedAndFilteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(sortedAndFilteredItems.map(item => item.id));
    }
  };

  const deleteSelectedItems = () => {
    setStorageItems(prev => prev.filter(item => !selectedItems.includes(item.id)));
    setSelectedItems([]);
  };

  const pinItem = (itemId: string) => {
    setStorageItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, isPinned: !item.isPinned } : item
    ));
  };

  const clearAllData = async () => {
    await clearOfflineData();
    setStorageItems([]);
    setSelectedItems([]);
  };

  const getStorageWarning = () => {
    const percentage = storageUsage.percentage;
    if (percentage > 90) {
      return { level: 'critical', message: 'Storage almost full!', color: 'text-red-600' };
    } else if (percentage > 75) {
      return { level: 'warning', message: 'Storage getting full', color: 'text-yellow-600' };
    }
    return null;
  };

  const warning = getStorageWarning();

  return (
    <div className={className}>
      {/* Storage Manager Toggle */}
      <button
        onClick={() => setShowManager(!showManager)}
        className="fixed bottom-6 left-6 z-50 bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700 transition-colors"
      >
        <HardDrive className="w-6 h-6" />
        {warning && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            !
          </span>
        )}
      </button>

      {/* Storage Manager Panel */}
      <AnimatePresence>
        {showManager && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="fixed bottom-20 left-6 z-40 w-96 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Storage Manager</h3>
                <button
                  onClick={() => setShowManager(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              {/* Storage Overview */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Used</span>
                  <span className="font-medium">{formatFileSize(storageUsage.used)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      warning?.level === 'critical' ? 'bg-red-500' : 
                      warning?.level === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(storageUsage.percentage, 100)}%` }}
                  />
                </div>
                {warning && (
                  <div className={`flex items-center space-x-1 text-xs ${warning.color}`}>
                    <AlertTriangle className="w-3 h-3" />
                    <span>{warning.message}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="p-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex space-x-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy((e.target.value as 'name' | 'size' | 'date' | 'accessed'))}
                    className="text-xs border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="date">Date</option>
                    <option value="name">Name</option>
                    <option value="size">Size</option>
                    <option value="accessed">Last Accessed</option>
                  </select>
                  <select
                    value={filterBy}
                    onChange={(e) => setFilterBy((e.target.value as 'all' | 'course' | 'video' | 'document' | 'quiz'))}
                    className="text-xs border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="all">All</option>
                    <option value="course">Courses</option>
                    <option value="video">Videos</option>
                    <option value="document">Documents</option>
                    <option value="quiz">Quizzes</option>
                  </select>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1 text-xs ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                  >
                    List
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1 text-xs ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                  >
                    Grid
                  </button>
                </div>
              </div>

              {/* Selection Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === sortedAndFilteredItems.length && sortedAndFilteredItems.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded"
                  />
                  <span className="text-xs text-gray-600">
                    {selectedItems.length} selected ({formatFileSize(selectedSize)})
                  </span>
                </div>
                {selectedItems.length > 0 && (
                  <button
                    onClick={deleteSelectedItems}
                    className="flex items-center space-x-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </div>

            {/* Storage Items List */}
            <div className="max-h-64 overflow-y-auto">
              {sortedAndFilteredItems.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <HardDrive className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No items found</p>
                </div>
              ) : (
                <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-2 p-2' : 'space-y-1'}>
                  {sortedAndFilteredItems.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`p-2 border-b border-gray-100 hover:bg-gray-50 ${
                        viewMode === 'grid' ? 'rounded border' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={() => toggleItemSelection(item.id)}
                          className="mt-1 rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            {getTypeIcon(item.type)}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {item.title}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(item.type)}`}>
                                  {item.type}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatFileSize(item.size)}
                                </span>
                                {item.isPinned && (
                                  <span className="text-xs text-blue-600">📌</span>
                                )}
                              </div>
                            </div>
                          </div>
                          {viewMode === 'list' && (
                            <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                              <span>Downloaded {formatDate(item.downloadedAt)}</span>
                              <span>Accessed {formatDate(item.lastAccessed)}</span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => pinItem(item.id)}
                          className={`p-1 text-xs rounded ${
                            item.isPinned ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          📌
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <div className="flex space-x-2">
                <button
                  onClick={clearAllData}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear All</span>
                </button>
                <button
                  onClick={() => setShowManager(false)}
                  className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
