import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SharedResourceLibrary from '@/app/components/social/SharedResourceLibrary';

describe('SharedResourceLibrary', () => {
  it('calls onAdd for link resource', () => {
    const onAdd = vi.fn();
    render(<SharedResourceLibrary resources={[]} onAdd={onAdd} />);

    fireEvent.change(screen.getByPlaceholderText('Resource title'), {
      target: { value: 'Great link' },
    });
    fireEvent.change(screen.getByPlaceholderText('https://... (for links)'), {
      target: { value: 'https://example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /add resource/i }));

    expect(onAdd).toHaveBeenCalledWith({
      title: 'Great link',
      type: 'link',
      url: 'https://example.com',
    });
  });
});
