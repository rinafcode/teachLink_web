'use client';

import React, { useMemo, useState } from 'react';
import { Paperclip } from 'lucide-react';
import RichTextEditor from '@/app/components/ui/RichTextEditor';
import type { Attachment } from '@/app/hooks/useStudyGroups';

interface GroupDiscussionThreadProps {
  messages: { id: string; senderName: string; contentHtml: string; createdAt: string; attachments?: Attachment[] }[];
  onPost: (contentHtml: string, attachments?: Attachment[]) => void;
}

export default function GroupDiscussionThread({ messages, onPost }: GroupDiscussionThreadProps) {
  const [content, setContent] = useState<string>('');
  const [files, setFiles] = useState<File[]>([]);

  const attachments = useMemo<Attachment[]>(() =>
    files.map((f) => ({ id: `${f.name}_${f.size}_${f.lastModified}` , name: f.name, url: URL.createObjectURL(f), type: f.type })),
  [files]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4 p-2">
        {messages.map((m) => (
          <div key={m.id} className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">{m.senderName} · {new Date(m.createdAt).toLocaleString()}</div>
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: m.contentHtml }} />
            {!!m.attachments?.length && (
              <div className="mt-2 space-y-1">
                {m.attachments.map((a) => (
                  <a key={a.id} href={a.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline">
                    <Paperclip size={14} /> {a.name}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="border-t p-3 space-y-2 bg-white">
        <RichTextEditor content={content} onChange={setContent} placeholder="Share an update..." />
        <div className="flex items-center justify-between">
          <label className="inline-flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <Paperclip size={16} />
            <span>Attach files</span>
            <input
              type="file"
              className="hidden"
              multiple
              onChange={(e) => {
                const fl = Array.from(e.target.files || []);
                setFiles((prev) => [...prev, ...fl]);
              }}
            />
          </label>
          <button
            onClick={() => {
              if (!content || content === '<p></p>') return;
              onPost(content, attachments.length ? attachments : undefined);
              setContent('');
              setFiles([]);
            }}
            className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
          >
            Post
          </button>
        </div>
        {!!files.length && (
          <div className="text-xs text-gray-600">{files.length} file(s) ready to upload</div>
        )}
      </div>
    </div>
  );
}
