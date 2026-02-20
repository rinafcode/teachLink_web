
import React from 'react';

// Mock data for collaborators
const COLLABORATORS = [
  { id: 1, name: 'Alice', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice' },
  { id: 2, name: 'Bob', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob' },
  { id: 3, name: 'Charlie', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie' },
];

export const CollaborativeEditingTools: React.FC = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {COLLABORATORS.map((user) => (
          <img
            key={user.id}
            src={user.avatar}
            alt={user.name}
            title={`${user.name} is editing`}
            className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800"
          />
        ))}
      </div>
      <span className="text-xs text-green-500 font-medium px-2 py-1 bg-green-100 dark:bg-green-900 rounded-full">
        3 active
      </span>
    </div>
  );
};
