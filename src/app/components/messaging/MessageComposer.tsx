'use client';

import { useState, useRef, useCallback } from 'react';
import {
    FiSend,
    FiPaperclip,
    FiX,
    FiFile,
    FiImage,
    FiFileText,
} from 'react-icons/fi';
import RichTextEditor from '@/app/components/ui/RichTextEditor';

interface MessageComposerProps {
    onSendMessage: (content: string) => void;
    onTypingStart: () => void;
    onTypingStop: () => void;
    onFileSelect: (files: FileList) => void;
    selectedFiles: File[];
    onRemoveFile: (index: number) => void;
    isUploading: boolean;
    disabled: boolean;
}

function getFileIcon(type: string) {
    if (type.startsWith('image/')) return <FiImage className="w-4 h-4" />;
    if (type.includes('pdf')) return <FiFileText className="w-4 h-4" />;
    return <FiFile className="w-4 h-4" />;
}

function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MessageComposer({
    onSendMessage,
    onTypingStart,
    onTypingStop,
    onFileSelect,
    selectedFiles,
    onRemoveFile,
    isUploading,
    disabled,
}: MessageComposerProps) {
    const [content, setContent] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleContentChange = useCallback(
        (newContent: string) => {
            setContent(newContent);
            if (newContent.trim()) {
                onTypingStart();
            } else {
                onTypingStop();
            }
        },
        [onTypingStart, onTypingStop]
    );

    const handleSend = useCallback(() => {
        const trimmedContent = content.replace(/<p><\/p>/g, '').trim();
        if (!trimmedContent && selectedFiles.length === 0) return;

        onSendMessage(trimmedContent);
        setContent('');
    }, [content, selectedFiles, onSendMessage]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        },
        [handleSend]
    );

    const handleFileClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files && e.target.files.length > 0) {
                onFileSelect(e.target.files);
                // Reset input so same file can be selected again
                e.target.value = '';
            }
        },
        [onFileSelect]
    );

    const hasContent = content.replace(/<[^>]*>/g, '').trim().length > 0;
    const canSend = (hasContent || selectedFiles.length > 0) && !isUploading && !disabled;

    return (
        <div className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
            {/* Selected Files Preview */}
            {selectedFiles.length > 0 && (
                <div className="px-4 pt-3 pb-1">
                    <div className="flex flex-wrap gap-2">
                        {selectedFiles.map((file, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-2 px-3 py-2 bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/30 rounded-lg text-sm group transition-all duration-200 hover:shadow-sm"
                            >
                                <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                                    {getFileIcon(file.type)}
                                </div>
                                <div className="max-w-[120px]">
                                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                                        {file.name}
                                    </p>
                                    <p className="text-[10px] text-gray-400">
                                        {formatFileSize(file.size)}
                                    </p>
                                </div>
                                <button
                                    onClick={() => onRemoveFile(index)}
                                    className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-950/50 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                    aria-label={`Remove ${file.name}`}
                                >
                                    <FiX className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Uploading Indicator */}
            {isUploading && (
                <div className="px-4 py-2">
                    <div className="flex items-center gap-2 text-xs text-violet-600 dark:text-violet-400">
                        <div className="w-4 h-4 border-2 border-violet-300 dark:border-violet-700 border-t-violet-600 dark:border-t-violet-400 rounded-full animate-spin" />
                        Uploading files...
                    </div>
                </div>
            )}

            {/* Composer Area */}
            <div className="px-4 py-3">
                <div className="flex items-end gap-2">
                    {/* Attachment Button */}
                    <button
                        onClick={handleFileClick}
                        disabled={disabled}
                        className="flex-shrink-0 w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-violet-100 dark:hover:bg-violet-950/30 hover:text-violet-600 dark:hover:text-violet-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Attach file"
                        id="attach-file-button"
                    >
                        <FiPaperclip className="w-5 h-5" />
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileChange}
                        accept="image/*,.pdf,.doc,.docx,.txt,.zip,.xlsx,.pptx"
                        id="file-input"
                    />

                    {/* Rich Text Editor */}
                    <div className="flex-1 min-w-0" onKeyDown={handleKeyDown}>
                        <RichTextEditor
                            content={content}
                            onChange={handleContentChange}
                            placeholder="Type your message..."
                        />
                    </div>

                    {/* Send Button */}
                    <button
                        onClick={handleSend}
                        disabled={!canSend}
                        className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${canSend
                            ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-md shadow-purple-500/25 hover:shadow-lg hover:shadow-purple-500/30 hover:scale-105 active:scale-95'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                            }`}
                        title="Send message"
                        id="send-message-button"
                    >
                        <FiSend className={`w-5 h-5 ${canSend ? '-rotate-45' : ''} transition-transform`} />
                    </button>
                </div>

                {/* Helper Text */}
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 ml-12">
                    Press <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-mono">Enter</kbd> to send
                    · <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-mono">Shift+Enter</kbd> for new line
                    · Max 10MB per file
                </p>
            </div>
        </div>
    );
}