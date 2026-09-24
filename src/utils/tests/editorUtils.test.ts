import { describe, it, expect, vi } from 'vitest';
import { TEMPLATES, insertTemplate, formatTime } from '../editorUtils';

// ---------------------------------------------------------------------------
// TEMPLATES
// ---------------------------------------------------------------------------
describe('TEMPLATES', () => {
  it('contains the expected editor templates', () => {
    expect(TEMPLATES).toHaveLength(4);
    expect(TEMPLATES.map((template) => template.id)).toEqual([
      'lesson-header',
      'code-block',
      'quiz-block',
      'video-placeholder',
    ]);
  });

  it('provides all required fields for every template', () => {
    TEMPLATES.forEach((template) => {
      expect(template.id).toEqual(expect.any(String));
      expect(template.id.length).toBeGreaterThan(0);
      expect(template.name).toEqual(expect.any(String));
      expect(template.name.length).toBeGreaterThan(0);
      expect(template.content).toEqual(expect.any(String));
      expect(template.content.length).toBeGreaterThan(0);
      expect(template.description).toEqual(expect.any(String));
      expect(template.description.length).toBeGreaterThan(0);
    });
  });

  it('does not contain duplicate template ids', () => {
    const ids = TEMPLATES.map((template) => template.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('contains the expected template content', () => {
    expect(TEMPLATES).toEqual([
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
        content: '<p><em>[Insert Video Link Here]</em></p>',
      },
    ]);
  });
});

// ---------------------------------------------------------------------------
// insertTemplate
// ---------------------------------------------------------------------------
describe('insertTemplate', () => {
  const createEditorMock = () => {
    const run = vi.fn();
    const insertContent = vi.fn(() => ({ run }));
    const focus = vi.fn(() => ({ insertContent }));
    const chain = vi.fn(() => ({ focus }));

    return {
      editor: { chain } as unknown as import('@tiptap/react').Editor,
      chain,
      focus,
      insertContent,
      run,
    };
  };

  it('inserts the matching template content for a known template id', () => {
    const { editor, chain, focus, insertContent, run } = createEditorMock();

    insertTemplate(editor, 'lesson-header');

    expect(chain).toHaveBeenCalledTimes(1);
    expect(focus).toHaveBeenCalledTimes(1);
    expect(insertContent).toHaveBeenCalledWith(TEMPLATES[0].content);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('inserts each supported template by its id', () => {
    TEMPLATES.forEach((template) => {
      const { editor, insertContent, run } = createEditorMock();

      insertTemplate(editor, template.id);

      expect(insertContent).toHaveBeenCalledWith(template.content);
      expect(run).toHaveBeenCalledTimes(1);
    });
  });

  it.each(['unknown-template', '', 'LESSON-HEADER'])(
    'does nothing for an unknown template id: %s',
    (templateId) => {
      const { editor, chain } = createEditorMock();

      insertTemplate(editor, templateId);

      expect(chain).not.toHaveBeenCalled();
    },
  );
});

// ---------------------------------------------------------------------------
// formatTime
// ---------------------------------------------------------------------------
describe('formatTime', () => {
  it('formats a typical time using the en-US time format', () => {
    const date = new Date(2026, 7, 30, 14, 5, 9);

    expect(formatTime(date)).toBe('2:05:09 PM');
  });

  it('formats midnight as 12:00:00 AM', () => {
    const date = new Date(2026, 7, 30, 0, 0, 0);

    expect(formatTime(date)).toBe('12:00:00 AM');
  });

  it('formats noon as 12:00:00 PM', () => {
    const date = new Date(2026, 7, 30, 12, 0, 0);

    expect(formatTime(date)).toBe('12:00:00 PM');
  });
});
