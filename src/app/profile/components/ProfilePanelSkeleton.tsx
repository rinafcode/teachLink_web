interface ProfilePanelSkeletonProps {
  label: string;
}

export default function ProfilePanelSkeleton({ label }: ProfilePanelSkeletonProps) {
  return (
    <div
      className="rounded-lg bg-white p-6 shadow"
      role="status"
      aria-label={`Loading ${label}`}
      aria-live="polite"
    >
      <div className="mb-6 h-6 w-40 rounded bg-gray-200" />
      <div className="space-y-4">
        <div className="h-12 rounded bg-gray-100" />
        <div className="h-12 rounded bg-gray-100" />
        <div className="h-12 rounded bg-gray-100" />
      </div>
    </div>
  );
}
