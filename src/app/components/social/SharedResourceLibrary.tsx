'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FolderOpen, Link as LinkIcon, Upload, Search, X, ExternalLink } from 'lucide-react';
import type { GroupResource } from '@/app/hooks/useStudyGroups';

interface SharedResourceLibraryProps {
  resources: GroupResource[];
  onAdd: (resource: { title: string; url?: string; description?: string; type: 'link' | 'file' }) => void;
}

export default function SharedResourceLibrary({ resources, onAdd }: SharedResourceLibraryProps) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'link' | 'file'>('all');

  const filteredResources = useMemo(() => {
    let filtered = resources;
    
    if (filterType !== 'all') {
      filtered = filtered.filter(r => r.type === filterType);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(query) ||
        r.description?.toLowerCase().includes(query) ||
        r.addedBy.name.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [resources, filterType, searchQuery]);

  const handleAdd = () => {
    if (!title.trim()) return;
    
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      onAdd({ title: title.trim(), type: 'file', description: description.trim() || undefined, url: objectUrl });
    } else if (url.trim()) {
      onAdd({ title: title.trim(), type: 'link', description: description.trim() || undefined, url: url.trim() });
    } else {
      return;
    }
    
    setTitle('');
    setUrl('');
    setDescription('');
    setFile(null);
  };

  return (
    <div className="space-y-6">
      {/* Add Resource Form */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 dark:text-gray-50 mb-3">Add Resource</h4>
        <div className="space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Resource title"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://... (for links)"
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <label className="inline-flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <Upload size={16} />
              <span>Upload file</span>
              <input 
                type="file" 
                className="hidden" 
                onChange={(e) => setFile(e.target.files?.[0] || null)} 
              />
            </label>
          </div>
          {file && (
            <div className="flex items-center justify-between p-2 bg-purple-50 dark:bg-purple-900/20 rounded-md">
              <span className="text-sm text-purple-700 dark:text-purple-300">{file.name}</span>
              <button
                onClick={() => setFile(null)}
                className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200"
              >
                <X size={16} />
              </button>
            </div>
          )}
          <div className="flex justify-end">
            <button
              onClick={handleAdd}
              disabled={!title.trim() || (!file && !url.trim())}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors"
            >
              Add Resource
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search resources..."
            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {(['all', 'link', 'file'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filterType === type
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {type === 'all' ? 'All' : type === 'link' ? 'Links' : 'Files'}
            </button>
          ))}
        </div>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="flex items-center gap-2 text-gray-800 dark:text-gray-200 font-medium mb-3">
            <LinkIcon size={18} className="text-blue-600 dark:text-blue-400" />
            Links ({filteredResources.filter(r => r.type === 'link').length})
          </h4>
          <div className="space-y-2">
            {filteredResources
              .filter(r => r.type === 'link')
              .map((r) => (
                <motion.a
                  key={r.id}
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="block p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:border-purple-300 dark:hover:border-purple-700 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-blue-700 dark:text-blue-400 group-hover:text-blue-800 dark:group-hover:text-blue-300 truncate">
                        {r.title}
                      </div>
                      {r.description && (
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {r.description}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        Added by {r.addedBy.name}
                      </div>
                    </div>
                    <ExternalLink size={16} className="text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 flex-shrink-0 mt-0.5" />
                  </div>
                </motion.a>
              ))}
            {filteredResources.filter(r => r.type === 'link').length === 0 && (
              <div className="text-sm text-gray-500 dark:text-gray-400 p-4 text-center border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                {searchQuery || filterType !== 'all' ? 'No matching links found.' : 'No links yet.'}
              </div>
            )}
          </div>
        </div>
        <div>
          <h4 className="flex items-center gap-2 text-gray-800 dark:text-gray-200 font-medium mb-3">
            <FolderOpen size={18} className="text-purple-600 dark:text-purple-400" />
            Files ({filteredResources.filter(r => r.type === 'file').length})
          </h4>
          <div className="space-y-2">
            {filteredResources
              .filter(r => r.type === 'file')
              .map((r) => (
                <motion.a
                  key={r.id}
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="block p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:border-purple-300 dark:hover:border-purple-700 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 truncate">
                        {r.title}
                      </div>
                      {r.description && (
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {r.description}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        Added by {r.addedBy.name}
                      </div>
                    </div>
                    <ExternalLink size={16} className="text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 flex-shrink-0 mt-0.5" />
                  </div>
                </motion.a>
              ))}
            {filteredResources.filter(r => r.type === 'file').length === 0 && (
              <div className="text-sm text-gray-500 dark:text-gray-400 p-4 text-center border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                {searchQuery || filterType !== 'all' ? 'No matching files found.' : 'No files yet.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
