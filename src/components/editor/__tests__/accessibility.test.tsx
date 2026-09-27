import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CollaborativeEditingTools } from '../CollaborativeEditingTools';
import { MediaEmbedder } from '../MediaEmbedder';
import { ContentTemplateLibrary } from '../ContentTemplateLibrary';
import { MaterialEditorWrapper } from '../MaterialEditorWrapper';

// ─── CollaborativeEditingTools ────────────────────────────────────────────────

describe('CollaborativeEditingTools accessibility', () => {
  it('renders collaborator list with role=list and aria-label', () => {
    render(<CollaborativeEditingTools />);
    const list = screen.getByRole('list', { name: /active collaborators/i });
    expect(list).toBeInTheDocument();
  });

  it('renders each collaborator avatar as a listitem with descriptive alt', () => {
    render(<CollaborativeEditingTools />);
    const items = screen.getAllByRole('listitem');
    expect(items.length).toBeGreaterThan(0);
    items.forEach((item) => {
      expect(item).toHaveAttribute('alt', expect.stringMatching(/is editing/i));
    });
  });

  it('status badge has aria-label with collaborator count', () => {
    render(<CollaborativeEditingTools />);
    const badge = screen.getByLabelText(/3 active collaborators/i);
    expect(badge).toBeInTheDocument();
  });
});

// ─── MediaEmbedder ────────────────────────────────────────────────────────────

describe('MediaEmbedder accessibility', () => {
  const noop = vi.fn();

  it('image trigger button has aria-label', () => {
    render(<MediaEmbedder onAddImage={noop} onAddYoutube={noop} />);
    expect(screen.getByRole('button', { name: /add image/i })).toBeInTheDocument();
  });

  it('youtube trigger button has aria-label', () => {
    render(<MediaEmbedder onAddImage={noop} onAddYoutube={noop} />);
    expect(screen.getByRole('button', { name: /add youtube video/i })).toBeInTheDocument();
  });

  it('dialog has role=dialog, aria-modal, and aria-labelledby when open', () => {
    render(<MediaEmbedder onAddImage={noop} onAddYoutube={noop} />);
    fireEvent.click(screen.getByRole('button', { name: /add image/i }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby');

    const titleId = dialog.getAttribute('aria-labelledby')!;
    expect(document.getElementById(titleId)).toBeInTheDocument();
  });

  it('URL input has an accessible label', () => {
    render(<MediaEmbedder onAddImage={noop} onAddYoutube={noop} />);
    fireEvent.click(screen.getByRole('button', { name: /add image/i }));
    expect(screen.getByLabelText(/image url/i)).toBeInTheDocument();
  });

  it('error paragraph has role=alert and aria-live=assertive', () => {
    render(<MediaEmbedder onAddImage={noop} onAddYoutube={noop} />);
    fireEvent.click(screen.getByRole('button', { name: /add image/i }));

    const errorEl = screen.getByRole('alert');
    expect(errorEl).toHaveAttribute('aria-live', 'assertive');
  });

  it('input is described by the error element', () => {
    render(<MediaEmbedder onAddImage={noop} onAddYoutube={noop} />);
    fireEvent.click(screen.getByRole('button', { name: /add image/i }));

    const input = screen.getByLabelText(/image url/i);
    const errorEl = screen.getByRole('alert');
    expect(input).toHaveAttribute('aria-describedby', errorEl.id);
  });

  it('offers an alt-text field for images and passes it to onAddImage', () => {
    const onAddImage = vi.fn();
    render(<MediaEmbedder onAddImage={onAddImage} onAddYoutube={noop} />);
    fireEvent.click(screen.getByRole('button', { name: /add image/i }));

    fireEvent.change(screen.getByLabelText(/image url/i), {
      target: { value: 'https://example.com/photo.png' },
    });
    fireEvent.change(screen.getByLabelText(/alt text/i), {
      target: { value: 'A screenshot of the dashboard' },
    });
    fireEvent.click(screen.getByRole('button', { name: /embed/i }));

    expect(onAddImage).toHaveBeenCalledWith(
      'https://example.com/photo.png',
      'A screenshot of the dashboard',
    );
  });

  it('does not show an alt-text field for YouTube embeds', () => {
    render(<MediaEmbedder onAddImage={noop} onAddYoutube={noop} />);
    fireEvent.click(screen.getByRole('button', { name: /add youtube video/i }));

    expect(screen.queryByLabelText(/alt text/i)).not.toBeInTheDocument();
  });
});

// ─── ContentTemplateLibrary ───────────────────────────────────────────────────

describe('ContentTemplateLibrary accessibility', () => {
  const mockEditor = {
    chain: () => ({ focus: () => ({ insertContent: () => ({ run: vi.fn() }) }) }),
  } as unknown as import('@tiptap/react').Editor;

  it('renders as an aside with aria-label', () => {
    render(<ContentTemplateLibrary editor={mockEditor} />);
    const sidebar = screen.getByRole('complementary', { name: /content templates/i });
    expect(sidebar).toBeInTheDocument();
  });

  it('each template button has a descriptive aria-label', () => {
    render(<ContentTemplateLibrary editor={mockEditor} />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      const label = btn.getAttribute('aria-label') ?? '';
      expect(label.length).toBeGreaterThan(0);
      expect(label.toLowerCase()).toContain('insert');
    });
  });

  it('template icons are hidden from assistive technology', () => {
    render(<ContentTemplateLibrary editor={mockEditor} />);
    // Icon wrappers should carry aria-hidden="true"
    const hiddenEls = document.querySelectorAll('[aria-hidden="true"]');
    expect(hiddenEls.length).toBeGreaterThan(0);
  });
});

// ─── MaterialEditorWrapper ─────────────────────────────────────────────────────

describe('MaterialEditorWrapper accessibility', () => {
  it('marks the submit button aria-busy and announces status while submitting', async () => {
    let resolveSubmit: () => void = () => {};
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve;
        }),
    );

    render(
      <MaterialEditorWrapper title="Post Editor" onSubmit={onSubmit}>
        <div>content</div>
      </MaterialEditorWrapper>,
    );

    const publishButton = screen.getByRole('button', { name: /publish/i });
    expect(publishButton).toHaveAttribute('aria-busy', 'false');

    fireEvent.click(publishButton);

    expect(publishButton).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent(/publish, please wait/i);

    resolveSubmit();
    await waitFor(() => {
      expect(publishButton).toHaveAttribute('aria-busy', 'false');
    });
  });
});
