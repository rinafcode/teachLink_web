import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';
import { ButtonGroup } from '../ButtonGroup';

describe('Button', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>);
    const btn = screen.getByRole('button', { name: /click me/i });
    expect(btn).toBeInTheDocument();
    expect(btn).not.toBeDisabled();
  });

  it('renders variant classes correctly', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-blue-600');

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-gray-100');

    rerender(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole('button')).toHaveClass('border');

    rerender(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-transparent');

    rerender(<Button variant="danger">Danger</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-red-600');
  });

  it('renders size classes correctly', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-8');

    rerender(<Button size="md">Medium</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-10');

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-12');
  });

  it('fires onClick when clicked', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('fires onClick when Enter is pressed', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Press Enter</Button>);
    const btn = screen.getByRole('button');
    fireEvent.keyDown(btn, { key: 'Enter' });
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('fires onClick when Space is pressed', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Press Space</Button>);
    const btn = screen.getByRole('button');
    fireEvent.keyDown(btn, { key: ' ' });
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not fire onClick when disabled', async () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    await userEvent.click(btn);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('forwards ref', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Ref</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('has displayName', () => {
    expect(Button.displayName).toBe('Button');
  });
});

describe('ButtonGroup', () => {
  const renderGroup = (props?: Record<string, unknown>) =>
    render(
      <ButtonGroup aria-label="Toolbar" {...props}>
        <Button>First</Button>
        <Button>Second</Button>
        <Button>Third</Button>
      </ButtonGroup>,
    );

  it('renders all children', () => {
    renderGroup();
    expect(screen.getByRole('button', { name: /first/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /second/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /third/i })).toBeInTheDocument();
  });

  it('has toolbar role and aria-label', () => {
    renderGroup();
    const toolbar = screen.getByRole('toolbar');
    expect(toolbar).toBeInTheDocument();
    expect(toolbar).toHaveAttribute('aria-label', 'Toolbar');
  });

  it('defaults to horizontal orientation', () => {
    renderGroup();
    expect(screen.getByRole('toolbar')).toHaveAttribute(
      'aria-orientation',
      'horizontal',
    );
  });

  it('supports vertical orientation', () => {
    render(
      <ButtonGroup orientation="vertical" aria-label="Vertical toolbar">
        <Button>Up</Button>
        <Button>Down</Button>
      </ButtonGroup>,
    );
    expect(screen.getByRole('toolbar')).toHaveAttribute(
      'aria-orientation',
      'vertical',
    );
  });

  it('navigates with ArrowRight in horizontal group', () => {
    renderGroup();
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveAttribute('tabindex', '0');
    expect(buttons[1]).toHaveAttribute('tabindex', '-1');

    fireEvent.keyDown(screen.getByRole('toolbar'), { key: 'ArrowRight' });
    expect(buttons[0]).toHaveAttribute('tabindex', '-1');
    expect(buttons[1]).toHaveAttribute('tabindex', '0');
  });

  it('navigates with ArrowLeft in horizontal group', () => {
    renderGroup();
    const buttons = screen.getAllByRole('button');

    fireEvent.keyDown(screen.getByRole('toolbar'), { key: 'ArrowRight' });
    expect(buttons[1]).toHaveAttribute('tabindex', '0');

    fireEvent.keyDown(screen.getByRole('toolbar'), { key: 'ArrowLeft' });
    expect(buttons[0]).toHaveAttribute('tabindex', '0');
  });

  it('wraps around when navigating past last button', () => {
    renderGroup();
    const buttons = screen.getAllByRole('button');

    fireEvent.keyDown(screen.getByRole('toolbar'), { key: 'ArrowRight' });
    fireEvent.keyDown(screen.getByRole('toolbar'), { key: 'ArrowRight' });
    expect(buttons[2]).toHaveAttribute('tabindex', '0');

    fireEvent.keyDown(screen.getByRole('toolbar'), { key: 'ArrowRight' });
    expect(buttons[0]).toHaveAttribute('tabindex', '0');
  });

  it('navigates with ArrowDown in vertical group', () => {
    render(
      <ButtonGroup orientation="vertical" aria-label="Vertical">
        <Button>A</Button>
        <Button>B</Button>
      </ButtonGroup>,
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveAttribute('tabindex', '0');

    fireEvent.keyDown(screen.getByRole('toolbar'), { key: 'ArrowDown' });
    expect(buttons[1]).toHaveAttribute('tabindex', '0');
  });

  it('navigates with ArrowUp in vertical group', () => {
    render(
      <ButtonGroup orientation="vertical" aria-label="Vertical">
        <Button>A</Button>
        <Button>B</Button>
      </ButtonGroup>,
    );
    const buttons = screen.getAllByRole('button');

    fireEvent.keyDown(screen.getByRole('toolbar'), { key: 'ArrowDown' });
    expect(buttons[1]).toHaveAttribute('tabindex', '0');

    fireEvent.keyDown(screen.getByRole('toolbar'), { key: 'ArrowUp' });
    expect(buttons[0]).toHaveAttribute('tabindex', '0');
  });

  it('navigates to first button on Home key', () => {
    renderGroup();
    const buttons = screen.getAllByRole('button');

    fireEvent.keyDown(screen.getByRole('toolbar'), { key: 'ArrowRight' });
    fireEvent.keyDown(screen.getByRole('toolbar'), { key: 'ArrowRight' });
    expect(buttons[2]).toHaveAttribute('tabindex', '0');

    fireEvent.keyDown(screen.getByRole('toolbar'), { key: 'Home' });
    expect(buttons[0]).toHaveAttribute('tabindex', '0');
  });

  it('navigates to last button on End key', () => {
    renderGroup();
    const buttons = screen.getAllByRole('button');

    fireEvent.keyDown(screen.getByRole('toolbar'), { key: 'End' });
    expect(buttons[2]).toHaveAttribute('tabindex', '0');
  });
});
