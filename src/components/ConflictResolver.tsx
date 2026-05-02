'use client';

import React, { useState } from 'react';
import { ConflictRecord, ResolutionStrategy } from '@/lib/conflict/types';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, ArrowRight, Save, History, Check } from 'lucide-react';

interface ConflictResolverProps {
  conflict: ConflictRecord<any>;
  onResolve: (strategy: ResolutionStrategy, manualData?: any) => void;
  onClose: () => void;
}

export const ConflictResolver: React.FC<ConflictResolverProps> = ({
  conflict,
  onResolve,
  onClose,
}) => {
  const [selectedStrategy, setSelectedStrategy] = useState<ResolutionStrategy>('manual');
  const [showHistory, setShowHistory] = useState(false);

  const localItems = Object.entries(conflict.localData).filter(
    ([key]) => !['updatedAt', 'version', 'id'].includes(key),
  );

  const remoteItems = Object.entries(conflict.remoteData).filter(
    ([key]) => !['updatedAt', 'version', 'id'].includes(key),
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[#1a1c1e] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-orange-500/10 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-500">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Conflict Detected</h3>
                <p className="text-sm text-gray-400">
                  Resolution required for {conflict.entityType}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-lg text-gray-400 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {/* Local Changes */}
              <div
                onClick={() => setSelectedStrategy('local')}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  selectedStrategy === 'local'
                    ? 'border-orange-500 bg-orange-500/5'
                    : 'border-white/5 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-orange-500">
                    Local Version
                  </span>
                  {selectedStrategy === 'local' && <Check size={16} className="text-orange-500" />}
                </div>
                <div className="space-y-2">
                  {localItems.map(([key, value]) => (
                    <div key={key} className="flex flex-col">
                      <span className="text-[10px] text-gray-500 uppercase">{key}</span>
                      <span className="text-sm text-gray-200">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Remote Changes */}
              <div
                onClick={() => setSelectedStrategy('remote')}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  selectedStrategy === 'remote'
                    ? 'border-blue-500 bg-blue-500/5'
                    : 'border-white/5 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-500">
                    Remote Version
                  </span>
                  {selectedStrategy === 'remote' && <Check size={16} className="text-blue-500" />}
                </div>
                <div className="space-y-2">
                  {remoteItems.map(([key, value]) => (
                    <div key={key} className="flex flex-col">
                      <span className="text-[10px] text-gray-500 uppercase">{key}</span>
                      <span className="text-sm text-gray-200">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Merge Option */}
            <div
              onClick={() => setSelectedStrategy('merge')}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                selectedStrategy === 'merge'
                  ? 'border-purple-500 bg-purple-500/5'
                  : 'border-white/5 bg-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20 text-purple-500">
                  <ArrowRight size={18} />
                </div>
                <div>
                  <span className="block text-sm font-bold text-white">Smart Merge</span>
                  <span className="text-xs text-gray-400">Combine changes automatically</span>
                </div>
              </div>
              {selectedStrategy === 'merge' && <Check size={18} className="text-purple-500" />}
            </div>

            {/* History Toggle */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors"
            >
              <History size={14} />
              {showHistory ? 'Hide Conflict History' : 'Show Conflict History'}
            </button>

            {showHistory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2 pl-4 border-l border-white/10"
              >
                {conflict.history.map((h, i) => (
                  <div key={i} className="text-[11px]">
                    <span className="text-gray-500">{new Date(h.timestamp).toLocaleString()}</span>
                    <span className="mx-2 text-gray-700">•</span>
                    <span className="text-gray-300 font-medium">{h.action}</span>
                    <p className="text-gray-500 mt-0.5">{h.details}</p>
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Resolved conflicts are tracked in the audit log.
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => onResolve(selectedStrategy)}
                disabled={selectedStrategy === 'manual'}
                className="px-6 py-2 bg-white text-black text-sm font-bold rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                <Save size={16} />
                Resolve Conflict
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
