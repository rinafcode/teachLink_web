'use client';

import { memo, useCallback, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import Image from 'next/image';
import Link from 'next/link';

export interface CourseListItem {
  id: string;
  title: string;
  subtitle: string;
  instructor: string;
  progress: number;
  category: string;
  thumbnailUrl?: string;
}

interface VirtualizedCourseListProps {
  courses: CourseListItem[];
  itemHeight?: number;
  overscanCount?: number;
}

function CourseRow({ course, style }: { course: CourseListItem; style: React.CSSProperties }) {
  return (
    <div style={style} className="px-1 py-1">
      <Link
        href={`/courses/${course.id}`}
        className="flex items-center gap-4 rounded-lg bg-[#262f40] p-3 transition-colors hover:bg-[#2f3a4f]"
      >
        <div className="relative h-14 w-20 flex-shrink-0 overflow-hidden rounded-md bg-gray-700">
          {course.thumbnailUrl ? (
            <Image
              src={course.thumbnailUrl}
              alt={course.title}
              fill
              sizes="80px"
              className="object-cover"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-gray-700 to-gray-800" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-white">{course.title}</h3>
          <p className="truncate text-xs text-gray-400">{course.instructor}</p>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-700">
              <div
                className="h-full rounded-full bg-blue-500"
                style={{ width: `${course.progress}%` }}
              />
            </div>
            <span className="text-xs text-gray-400">{course.progress}%</span>
          </div>
        </div>
        <span className="flex-shrink-0 rounded bg-gray-700 px-2 py-0.5 text-xs text-gray-300">
          {course.category}
        </span>
      </Link>
    </div>
  );
}

const MemoizedCourseRow = memo(CourseRow);

function VirtualizedCourseList({
  courses,
  itemHeight = 76,
  overscanCount = 5,
}: VirtualizedCourseListProps) {
  const Row = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => (
      <MemoizedCourseRow course={courses[index]!} style={style} />
    ),
    [courses],
  );

  const itemKey = useCallback((index: number) => courses[index]!.id, [courses]);

  const listHeight = useMemo(
    () => Math.min(courses.length * itemHeight, 600),
    [courses.length, itemHeight],
  );

  if (courses.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-gray-400">No courses found.</div>
    );
  }

  return (
    <AutoSizer disableHeight>
      {({ width }: { width: number }) => (
        <List
          height={listHeight}
          width={width}
          itemCount={courses.length}
          itemSize={itemHeight}
          overscanCount={overscanCount}
          itemKey={itemKey}
        >
          {Row}
        </List>
      )}
    </AutoSizer>
  );
}

export default memo(VirtualizedCourseList);
