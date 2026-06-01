import { fireEvent, render, screen } from '@testing-library/react';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ImageUploader from './ImageUploader';

vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    fill,
    unoptimized,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & {
    src: string;
    alt: string;
    fill?: boolean;
    unoptimized?: boolean;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      data-fill={String(fill)}
      data-unoptimized={String(unoptimized)}
      {...props}
    />
  ),
}));

describe('ImageUploader', () => {
  const createObjectURL = vi.fn();
  const revokeObjectURL = vi.fn();

  beforeEach(() => {
    createObjectURL.mockReset();
    revokeObjectURL.mockReset();

    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectURL,
    });
  });

  it('uses an object URL for selected avatar previews and revokes it on unmount', () => {
    createObjectURL.mockReturnValue('blob:profile-preview');
    const onImageSelect = vi.fn();

    const { container, unmount } = render(<ImageUploader onImageSelect={onImageSelect} />);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const avatar = new File(['avatar'], 'avatar.png', { type: 'image/png' });

    fireEvent.change(fileInput, { target: { files: [avatar] } });

    expect(createObjectURL).toHaveBeenCalledWith(avatar);
    expect(onImageSelect).toHaveBeenCalledWith(avatar);
    expect(screen.getByRole('img', { name: 'Profile Preview' })).toHaveAttribute(
      'src',
      'blob:profile-preview',
    );
    expect(screen.getByRole('img', { name: 'Profile Preview' })).toHaveAttribute(
      'data-unoptimized',
      'true',
    );

    unmount();

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:profile-preview');
  });

  it('revokes the previous object URL when the selected avatar changes', () => {
    createObjectURL
      .mockReturnValueOnce('blob:first-preview')
      .mockReturnValueOnce('blob:next-preview');

    const { container, unmount } = render(<ImageUploader onImageSelect={vi.fn()} />);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(fileInput, {
      target: { files: [new File(['first'], 'first.png', { type: 'image/png' })] },
    });
    fireEvent.change(fileInput, {
      target: { files: [new File(['next'], 'next.png', { type: 'image/png' })] },
    });

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:first-preview');

    unmount();

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:next-preview');
  });
});
