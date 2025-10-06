import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SharedResourceLibrary from '@/app/components/social/SharedResourceLibrary';
import type { GroupResource } from '@/app/hooks/useStudyGroups';

describe('SharedResourceLibrary', () => {
  it('calls onAdd for link resource', () => {
    const onAdd = vi.fn();
    render(
      <SharedResourceLibrary resources={[]} onAdd={onAdd} />
    );

    fireEvent.change(screen.getByPlaceholderText('Title'), { target: { value: 'Great link' } });
    fireEvent.change(screen.getByPlaceholderText('https://... (for links)'), { target: { value: 'https://example.com' } });
    fireEvent.click(screen.getByText('Add'));

    expect(onAdd).toHaveBeenCalledWith({ title: 'Great link', type: 'link', description: '', url: 'https://example.com' });
  });
});
