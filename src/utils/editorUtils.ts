
import { Editor } from '@tiptap/react';

export interface EditorTemplate {
  id: string;
  name: string;
  content: string;
  description: string;
}

export const TEMPLATES: EditorTemplate[] = [
  {
    id: 'lesson-header',
    name: 'Lesson Header',
    description: 'Standard header for a new lesson',
    content: '<h1>Lesson Title</h1><p><strong>Objective:</strong> ...</p><hr>',
  },
  {
    id: 'code-block',
    name: 'Code Example',
    description: 'A block of code with language handling',
    content: '<pre><code>// Your code here</code></pre>',
  },
  {
    id: 'quiz-block',
    name: 'Quiz Block',
    description: 'A simple quiz structure',
    content: '<h3>Quiz</h3><ul><li>[ ] Option A</li><li>[ ] Option B</li></ul>',
  },
  {
      id: 'video-placeholder',
      name: 'Video Placeholder',
      description: 'Placeholder text for a video link to be embedded',
      content: '<p><em>[Insert Video Link Here]</em></p>'
  }
];

export const insertTemplate = (editor: Editor, templateId: string) => {
  const template = TEMPLATES.find((t) => t.id === templateId);
  if (template) {
    editor.chain().focus().insertContent(template.content).run();
  }
};

export const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).format(date);
};
