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
      <div className="flex -space-x-2" role="list" aria-label="Active collaborators">
        {COLLABORATORS.map((user) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={user.id}
            role="listitem"
            src={user.avatar}
            alt={`${user.name} is editing`}
            title={`${user.name} is editing`}
            className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800"
          />
        ))}
      </div>
      <span
        aria-label={`${COLLABORATORS.length} active collaborators`}
        className="text-xs text-green-500 font-medium px-2 py-1 bg-green-100 dark:bg-green-900 rounded-full"
      >
        {COLLABORATORS.length} active
      </span>
    </div>
  );
};
