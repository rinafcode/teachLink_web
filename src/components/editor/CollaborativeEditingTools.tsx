import React from 'react';

// Mock data for collaborators
const COLLABORATORS = [
  { id: 1, name: 'Alice', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice' },
  { id: 2, name: 'Bob', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob' },
  { id: 3, name: 'Charlie', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie' },
];

export const CollaborativeEditingTools: React.FC = () => {
  const collaboratorNames = COLLABORATORS.map(c => c.name).join(', ');

  return (
    <div className="flex items-center gap-2" role="group" aria-label="Collaborative editing">
      <div 
        className="flex -space-x-2" 
        role="list" 
        aria-label={`Active collaborators: ${collaboratorNames}`}
      >
        {COLLABORATORS.map((user, index) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={user.id}
            role="listitem"
            src={user.avatar}
            alt={`${user.name}, collaborator ${index + 1} of ${COLLABORATORS.length}`}
            title={user.name}
            className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            tabIndex={0}
          />
        ))}
      </div>
      <span
        role="status"
        aria-live="polite"
        className="text-xs text-green-500 font-medium px-2 py-1 bg-green-100 dark:bg-green-900 rounded-full"
      >
        {COLLABORATORS.length} active
      </span>
    </div>
  );
};
