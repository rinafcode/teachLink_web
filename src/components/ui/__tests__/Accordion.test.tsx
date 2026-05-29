import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '../Accordion';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Renders a standard two-item accordion for reuse across tests. */
function renderBasicAccordion(props: Partial<React.ComponentProps<typeof Accordion>> = {}) {
  return render(
    <Accordion {...props}>
      <AccordionItem id="item-1">
        <AccordionTrigger>Section 1</AccordionTrigger>
        <AccordionContent>Content 1</AccordionContent>
      </AccordionItem>
      <AccordionItem id="item-2">
        <AccordionTrigger>Section 2</AccordionTrigger>
        <AccordionContent>Content 2</AccordionContent>
      </AccordionItem>
    </Accordion>,
  );
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('Accordion – rendering', () => {
  it('renders all triggers', () => {
    renderBasicAccordion();
    expect(screen.getByText('Section 1')).toBeInTheDocument();
    expect(screen.getByText('Section 2')).toBeInTheDocument();
  });

  it('hides content panels by default', () => {
    renderBasicAccordion();
    expect(screen.getByText('Content 1').closest('[data-state]')).toHaveAttribute(
      'data-state',
      'closed',
    );
    expect(screen.getByText('Content 2').closest('[data-state]')).toHaveAttribute(
      'data-state',
      'closed',
    );
  });

  it('opens items listed in defaultOpenIds', () => {
    renderBasicAccordion({ defaultOpenIds: ['item-1'] });
    expect(screen.getByText('Content 1').closest('[data-state]')).toHaveAttribute(
      'data-state',
      'open',
    );
    expect(screen.getByText('Content 2').closest('[data-state]')).toHaveAttribute(
      'data-state',
      'closed',
    );
  });

  it('applies custom className to the root wrapper', () => {
    const { container } = renderBasicAccordion({ className: 'my-custom-class' });
    expect(container.firstChild).toHaveClass('my-custom-class');
  });

  it('applies data-state="open" to an open AccordionItem', () => {
    renderBasicAccordion({ defaultOpenIds: ['item-2'] });
    const item = screen.getByText('Content 2').closest('[data-accordion-item]');
    expect(item).toHaveAttribute('data-state', 'open');
  });
});

// ---------------------------------------------------------------------------
// Toggle behaviour
// ---------------------------------------------------------------------------

describe('Accordion – toggle behaviour', () => {
  it('opens a closed item when its trigger is clicked', async () => {
    renderBasicAccordion();
    await userEvent.click(screen.getByText('Section 1'));
    expect(screen.getByText('Content 1').closest('[data-state]')).toHaveAttribute(
      'data-state',
      'open',
    );
  });

  it('closes an open item when its trigger is clicked again', async () => {
    renderBasicAccordion({ defaultOpenIds: ['item-1'] });
    await userEvent.click(screen.getByText('Section 1'));
    expect(screen.getByText('Content 1').closest('[data-state]')).toHaveAttribute(
      'data-state',
      'closed',
    );
  });

  it('allows multiple items open simultaneously by default', async () => {
    renderBasicAccordion();
    await userEvent.click(screen.getByText('Section 1'));
    await userEvent.click(screen.getByText('Section 2'));
    expect(screen.getByText('Content 1').closest('[data-state]')).toHaveAttribute(
      'data-state',
      'open',
    );
    expect(screen.getByText('Content 2').closest('[data-state]')).toHaveAttribute(
      'data-state',
      'open',
    );
  });
});

// ---------------------------------------------------------------------------
// Exclusive mode
// ---------------------------------------------------------------------------

describe('Accordion – exclusive mode', () => {
  it('closes the previously open item when a new one is opened', async () => {
    renderBasicAccordion({ exclusive: true, defaultOpenIds: ['item-1'] });
    await userEvent.click(screen.getByText('Section 2'));
    expect(screen.getByText('Content 1').closest('[data-state]')).toHaveAttribute(
      'data-state',
      'closed',
    );
    expect(screen.getByText('Content 2').closest('[data-state]')).toHaveAttribute(
      'data-state',
      'open',
    );
  });

  it('allows closing the only open item in exclusive mode', async () => {
    renderBasicAccordion({ exclusive: true, defaultOpenIds: ['item-1'] });
    await userEvent.click(screen.getByText('Section 1'));
    expect(screen.getByText('Content 1').closest('[data-state]')).toHaveAttribute(
      'data-state',
      'closed',
    );
  });
});

// ---------------------------------------------------------------------------
// Controlled mode
// ---------------------------------------------------------------------------

describe('Accordion – controlled mode', () => {
  it('reflects the controlled openIds prop', () => {
    render(
      <Accordion openIds={['item-1']} onOpenChange={() => {}}>
        <AccordionItem id="item-1">
          <AccordionTrigger>Section 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
        <AccordionItem id="item-2">
          <AccordionTrigger>Section 2</AccordionTrigger>
          <AccordionContent>Content 2</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    expect(screen.getByText('Content 1').closest('[data-state]')).toHaveAttribute(
      'data-state',
      'open',
    );
    expect(screen.getByText('Content 2').closest('[data-state]')).toHaveAttribute(
      'data-state',
      'closed',
    );
  });

  it('calls onOpenChange with the updated ids when a trigger is clicked', async () => {
    const onOpenChange = vi.fn();
    render(
      <Accordion openIds={[]} onOpenChange={onOpenChange}>
        <AccordionItem id="item-1">
          <AccordionTrigger>Section 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    await userEvent.click(screen.getByText('Section 1'));
    expect(onOpenChange).toHaveBeenCalledWith(['item-1']);
  });

  it('works as a fully controlled component with state', async () => {
    function ControlledAccordion() {
      const [openIds, setOpenIds] = useState<string[]>([]);
      return (
        <Accordion openIds={openIds} onOpenChange={setOpenIds}>
          <AccordionItem id="item-1">
            <AccordionTrigger>Section 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
    }
    render(<ControlledAccordion />);
    expect(screen.getByText('Content 1').closest('[data-state]')).toHaveAttribute(
      'data-state',
      'closed',
    );
    await userEvent.click(screen.getByText('Section 1'));
    expect(screen.getByText('Content 1').closest('[data-state]')).toHaveAttribute(
      'data-state',
      'open',
    );
  });
});

// ---------------------------------------------------------------------------
// Registration system
// ---------------------------------------------------------------------------

describe('Accordion – registration system', () => {
  it('registers items on mount and unregisters on unmount', () => {
    function DynamicAccordion() {
      const [showSecond, setShowSecond] = useState(true);
      return (
        <>
          <button onClick={() => setShowSecond(false)}>Remove item 2</button>
          <Accordion>
            <AccordionItem id="item-1">
              <AccordionTrigger>Section 1</AccordionTrigger>
              <AccordionContent>Content 1</AccordionContent>
            </AccordionItem>
            {showSecond && (
              <AccordionItem id="item-2">
                <AccordionTrigger>Section 2</AccordionTrigger>
                <AccordionContent>Content 2</AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </>
      );
    }

    render(<DynamicAccordion />);
    // Both items present initially
    expect(screen.getByText('Section 1')).toBeInTheDocument();
    expect(screen.getByText('Section 2')).toBeInTheDocument();

    // Remove item 2
    fireEvent.click(screen.getByText('Remove item 2'));
    expect(screen.queryByText('Section 2')).not.toBeInTheDocument();
    // Item 1 still works
    expect(screen.getByText('Section 1')).toBeInTheDocument();
  });

  it('does not affect other items when one is removed while open', async () => {
    function DynamicAccordion() {
      const [showSecond, setShowSecond] = useState(true);
      return (
        <>
          <button onClick={() => setShowSecond(false)}>Remove item 2</button>
          <Accordion defaultOpenIds={['item-1', 'item-2']}>
            <AccordionItem id="item-1">
              <AccordionTrigger>Section 1</AccordionTrigger>
              <AccordionContent>Content 1</AccordionContent>
            </AccordionItem>
            {showSecond && (
              <AccordionItem id="item-2">
                <AccordionTrigger>Section 2</AccordionTrigger>
                <AccordionContent>Content 2</AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </>
      );
    }

    render(<DynamicAccordion />);
    fireEvent.click(screen.getByText('Remove item 2'));
    // Item 1 should still be open
    expect(screen.getByText('Content 1').closest('[data-state]')).toHaveAttribute(
      'data-state',
      'open',
    );
  });
});

// ---------------------------------------------------------------------------
// Disabled items
// ---------------------------------------------------------------------------

describe('Accordion – disabled items', () => {
  it('does not toggle a disabled item when clicked', async () => {
    render(
      <Accordion>
        <AccordionItem id="item-1" disabled>
          <AccordionTrigger>Section 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    await userEvent.click(screen.getByText('Section 1'));
    expect(screen.getByText('Content 1').closest('[data-state]')).toHaveAttribute(
      'data-state',
      'closed',
    );
  });

  it('marks a disabled item with data-disabled attribute', () => {
    render(
      <Accordion>
        <AccordionItem id="item-1" disabled>
          <AccordionTrigger>Section 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    const item = screen.getByText('Content 1').closest('[data-accordion-item]');
    expect(item).toHaveAttribute('data-disabled');
  });
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

describe('Accordion – accessibility', () => {
  it('trigger has aria-expanded="false" when closed', () => {
    renderBasicAccordion();
    const trigger = screen.getByRole('button', { name: 'Section 1' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('trigger has aria-expanded="true" when open', async () => {
    renderBasicAccordion();
    await userEvent.click(screen.getByRole('button', { name: 'Section 1' }));
    expect(screen.getByRole('button', { name: 'Section 1' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('trigger aria-controls points to the content region id', () => {
    renderBasicAccordion({ defaultOpenIds: ['item-1'] });
    const trigger = screen.getByRole('button', { name: 'Section 1' });
    const contentId = trigger.getAttribute('aria-controls');
    expect(contentId).toBeTruthy();
    expect(document.getElementById(contentId!)).toBeInTheDocument();
  });

  it('content region has role="region" and aria-labelledby pointing to trigger', () => {
    renderBasicAccordion({ defaultOpenIds: ['item-1'] });
    const region = screen.getByRole('region', { name: 'Section 1' });
    expect(region).toBeInTheDocument();
  });

  it('trigger can be activated with the keyboard (Enter key)', async () => {
    renderBasicAccordion();
    const trigger = screen.getByRole('button', { name: 'Section 1' });
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByText('Content 1').closest('[data-state]')).toHaveAttribute(
      'data-state',
      'open',
    );
  });

  it('trigger can be activated with the keyboard (Space key)', async () => {
    renderBasicAccordion();
    const trigger = screen.getByRole('button', { name: 'Section 1' });
    trigger.focus();
    await userEvent.keyboard(' ');
    expect(screen.getByText('Content 1').closest('[data-state]')).toHaveAttribute(
      'data-state',
      'open',
    );
  });
});

// ---------------------------------------------------------------------------
// Variants & sizes
// ---------------------------------------------------------------------------

describe('Accordion – variants and sizes', () => {
  it('renders with bordered variant', () => {
    render(
      <Accordion variant="bordered">
        <AccordionItem id="item-1">
          <AccordionTrigger>Section 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    const item = screen.getByText('Content 1').closest('[data-accordion-item]');
    expect(item).toHaveClass('rounded-lg');
  });

  it('renders with ghost variant without border classes', () => {
    render(
      <Accordion variant="ghost">
        <AccordionItem id="item-1">
          <AccordionTrigger>Section 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    const item = screen.getByText('Content 1').closest('[data-accordion-item]');
    expect(item).not.toHaveClass('border-b');
  });

  it('applies sm size class to trigger', () => {
    render(
      <Accordion size="sm">
        <AccordionItem id="item-1">
          <AccordionTrigger>Section 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    expect(screen.getByRole('button', { name: 'Section 1' })).toHaveClass('py-2');
  });

  it('applies lg size class to trigger', () => {
    render(
      <Accordion size="lg">
        <AccordionItem id="item-1">
          <AccordionTrigger>Section 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    expect(screen.getByRole('button', { name: 'Section 1' })).toHaveClass('py-4');
  });
});

// ---------------------------------------------------------------------------
// Error boundaries
// ---------------------------------------------------------------------------

describe('Accordion – context errors', () => {
  it('throws when AccordionItem is used outside Accordion', () => {
    // Suppress the expected console.error from React
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <AccordionItem id="orphan">
          <AccordionTrigger>Orphan</AccordionTrigger>
          <AccordionContent>Orphan content</AccordionContent>
        </AccordionItem>,
      ),
    ).toThrow('Accordion sub-components must be used inside <Accordion>.');
    spy.mockRestore();
  });

  it('throws when AccordionTrigger is used outside AccordionItem', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <Accordion>
          <AccordionTrigger>Orphan trigger</AccordionTrigger>
        </Accordion>,
      ),
    ).toThrow('AccordionTrigger and AccordionContent must be used inside <AccordionItem>.');
    spy.mockRestore();
  });
});
