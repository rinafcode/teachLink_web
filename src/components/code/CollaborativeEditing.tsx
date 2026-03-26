import React, { useEffect, useState } from 'react';
import { Users, Wifi } from 'lucide-react';
import type { Collaborator } from '@/hooks/useCodeEditor';

interface CollaborativeEditingProps {
  collaborators: Collaborator[];
  roomId?: string;
}

export const CollaborativeEditing: React.FC<CollaborativeEditingProps> = ({
  collaborators,
  roomId,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [activeCount, setActiveCount] = useState(collaborators.length);

  // Simulate a Socket.IO connection lifecycle
  useEffect(() => {
    if (!roomId) return;

    // Simulate connection delay
    const connectTimer = setTimeout(() => {
      setIsConnected(true);
    }, 800);

    // Simulate occasional collaborator join/leave
    const updateTimer = setInterval(() => {
      setActiveCount((prev) => {
        const delta = Math.random() > 0.5 ? 0 : Math.random() > 0.5 ? 1 : -1;
        return Math.max(0, Math.min(collaborators.length + 2, prev + delta));
      });
    }, 8000);

    return () => {
      clearTimeout(connectTimer);
      clearInterval(updateTimer);
      setIsConnected(false);
    };
  }, [roomId, collaborators.length]);

  const visibleCollaborators = collaborators.slice(0, 4);
  const overflow = Math.max(0, activeCount - 4);

  return (
    <div className="flex items-center gap-3">
      {/* Connection status */}
      {roomId && (
        <div className="flex items-center gap-1.5">
          <Wifi
            className={`w-3 h-3 transition-colors ${
              isConnected ? 'text-green-400' : 'text-gray-500'
            }`}
          />
          <span
            className={`text-xs font-medium transition-colors ${
              isConnected ? 'text-green-400' : 'text-gray-500'
            }`}
          >
            {isConnected ? 'Live' : 'Connecting…'}
          </span>
        </div>
      )}

      {/* Avatar stack */}
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2.5">
          {visibleCollaborators.map((user) => (
            <div
              key={user.id}
              className="relative"
              title={`${user.name}${user.cursorLine ? ` — Line ${user.cursorLine}` : ''}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={user.avatar}
                alt={user.name}
                className="w-7 h-7 rounded-full object-cover"
                style={{
                  border: `2px solid ${user.color}`,
                  boxShadow: `0 0 0 1px rgba(0,0,0,0.4)`,
                }}
              />
              {/* Presence dot */}
              <span
                className="absolute bottom-0 right-0 w-2 h-2 rounded-full border border-gray-900"
                style={{ backgroundColor: user.color }}
              />
            </div>
          ))}

          {overflow > 0 && (
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold
                          bg-gray-700 text-gray-300 border-2 border-gray-600"
              title={`${overflow} more collaborators`}
            >
              +{overflow}
            </div>
          )}
        </div>

        {/* Count badge */}
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                        bg-indigo-900/50 text-indigo-300 border border-indigo-700/40">
          <Users className="w-3 h-3" />
          {activeCount} live
        </div>
      </div>
    </div>
  );
};
