'use client';

import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Edit, Plus, Video, FileText, FileCheck } from 'lucide-react';
import { Lesson } from '@/hooks/useCourseCreation';

interface LessonBuilderProps {
  lessons: Lesson[];
  onReorder: (lessons: Lesson[]) => void;
  onEdit: (lesson: Lesson) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

const getContentIcon = (type: string) => {
  switch (type) {
    case 'video':
      return <Video className="h-4 w-4" />;
    case 'pdf':
      return <FileText className="h-4 w-4" />;
    case 'text':
      return <FileCheck className="h-4 w-4" />;
    default:
      return <FileCheck className="h-4 w-4" />;
  }
};

interface SortableLessonProps {
  lesson: Lesson;
  index: number;
  onEdit: (lesson: Lesson) => void;
  onDelete: (id: string) => void;
}

const SortableLesson = ({ lesson, index, onEdit, onDelete }: SortableLessonProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lesson.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4 ${
        isDragging ? 'shadow-lg opacity-50 z-10 relative' : 'shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab active:cursor-grabbing outline-none"
        >
          <GripVertical className="h-5 w-5 text-gray-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Lesson {index + 1}
                </span>
              </div>
              <h4 className="font-medium text-gray-900 dark:text-white">{lesson.title}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{lesson.description}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(lesson)}
                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(lesson.id)}
                className="p-1 text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {lesson.content.length > 0 && (
            <div className="flex gap-2 mt-2">
              {lesson.content.map((content, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs dark:text-gray-300"
                >
                  {getContentIcon(content.type)}
                  <span className="capitalize">{content.type}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const LessonBuilder: React.FC<LessonBuilderProps> = ({
  lessons,
  onReorder,
  onEdit,
  onDelete,
  onAdd,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = lessons.findIndex((l) => l.id === active.id);
      const newIndex = lessons.findIndex((l) => l.id === over.id);
      onReorder(arrayMove(lessons, oldIndex, newIndex));
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold dark:text-white">Course Lessons</h3>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Lesson
        </button>
      </div>

      {lessons.length === 0 ? (
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            No lessons yet. Click &quot;Add Lesson&quot; to get started.
          </p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={lessons.map((l) => l.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {lessons.map((lesson, index) => (
                <SortableLesson
                  key={lesson.id}
                  lesson={lesson}
                  index={index}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};
