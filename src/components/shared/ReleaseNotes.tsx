import React, { useState, useEffect } from 'react';

export interface ReleaseNote {
  version: string;
  date: string;
  changes: string[];
}

export const ReleaseNotes: React.FC = () => {
  const [notes, setNotes] = useState<ReleaseNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching release notes
    const fetchNotes = async () => {
      try {
        // Mock data
        const data: ReleaseNote[] = [
          {
            version: '1.2.0',
            date: '2026-05-30',
            changes: ['Added Lazy Loading support', 'Improved performance', 'Fixed bugs'],
          },
          {
            version: '1.1.0',
            date: '2026-05-15',
            changes: ['Added Release Notes feature', 'Updated dependencies'],
          },
        ];

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        setNotes(data);
      } catch (error) {
        console.error('Failed to fetch release notes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  if (loading) {
    return (
      <div
        className="p-4 animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg h-32"
        data-testid="loading-skeleton"
      ></div>
    );
  }

  return (
    <div className="release-notes space-y-4 p-4 border rounded-lg shadow-sm bg-white dark:bg-gray-900 dark:border-gray-700">
      <h2 className="text-2xl font-bold mb-4">Release Notes</h2>
      {notes.length === 0 ? (
        <p>No release notes available.</p>
      ) : (
        <ul className="space-y-4">
          {notes.map((note) => (
            <li key={note.version} className="border-b pb-4 last:border-b-0 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                v{note.version}{' '}
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({note.date})
                </span>
              </h3>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                {note.changes.map((change, idx) => (
                  <li key={idx} className="text-gray-700 dark:text-gray-300">
                    {change}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ReleaseNotes;
