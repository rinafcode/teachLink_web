'use client';

import React, { useMemo, useState } from 'react';
import { FolderOpen, Link as LinkIcon, Upload } from 'lucide-react';
import type { GroupResource } from '@/app/hooks/useStudyGroups';

interface SharedResourceLibraryProps {
  resources: GroupResource[];
  onAdd: (resource: { title: string; url?: string; description?: string; type: 'link' | 'file' }) => void;
}

export default function SharedResourceLibrary({ resources, onAdd }: SharedResourceLibraryProps) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const grouped = useMemo(() => {
    const linkItems = resources.filter((r) => r.type === 'link');
    const fileItems = resources.filter((r) => r.type === 'file');
    return { linkItems, fileItems };
  }, [resources]);

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-md p-4">
        <h4 className="font-medium text-gray-900 mb-2">Add Resource</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="px-3 py-2 border rounded-md"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://... (for links)"
            className="px-3 py-2 border rounded-md"
          />
          <label className="inline-flex items-center justify-center gap-2 px-3 py-2 border rounded-md cursor-pointer text-gray-700">
            <Upload size={16} /> Upload file
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
        </div>
        <div className="flex justify-end mt-3">
          <button
            onClick={() => {
              if (!title.trim()) return;
              if (file) {
                const objectUrl = URL.createObjectURL(file);
                onAdd({ title: title.trim(), type: 'file', description: '', url: objectUrl });
              } else if (url.trim()) {
                onAdd({ title: title.trim(), type: 'link', description: '', url: url.trim() });
              } else {
                return;
              }
              setTitle('');
              setUrl('');
              setFile(null);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm"
          >
            Add
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="flex items-center gap-2 text-gray-800 font-medium mb-2"><LinkIcon size={16} /> Links</h4>
          <div className="space-y-2">
            {grouped.linkItems.map((r) => (
              <a key={r.id} href={r.url} target="_blank" rel="noreferrer" className="block p-3 rounded-md border hover:bg-gray-50">
                <div className="text-sm font-medium text-blue-700">{r.title}</div>
                {r.description && <div className="text-xs text-gray-600">{r.description}</div>}
                <div className="text-xs text-gray-500">Added by {r.addedBy.name}</div>
              </a>
            ))}
            {grouped.linkItems.length === 0 && <div className="text-sm text-gray-500">No links yet.</div>}
          </div>
        </div>
        <div>
          <h4 className="flex items-center gap-2 text-gray-800 font-medium mb-2"><FolderOpen size={16} /> Files</h4>
          <div className="space-y-2">
            {grouped.fileItems.map((r) => (
              <a key={r.id} href={r.url} target="_blank" rel="noreferrer" className="block p-3 rounded-md border hover:bg-gray-50">
                <div className="text-sm font-medium text-gray-800">{r.title}</div>
                <div className="text-xs text-gray-500">Added by {r.addedBy.name}</div>
              </a>
            ))}
            {grouped.fileItems.length === 0 && <div className="text-sm text-gray-500">No files yet.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
