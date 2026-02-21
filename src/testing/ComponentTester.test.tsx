/**
 * ComponentTester.test.tsx
 *
 * Isolated unit tests for the ComponentTester utility.
 * Covers: rendering, props, a11y, error boundaries, async state,
 * event simulation, and snapshot / visual checks.
 */

import React, { useState, useEffect, FC, ReactNode } from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {  createMockFile } from '../utils/testUtils';

// Sample components used across tests 

interface ButtonProps {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  'aria-label'?: string;
}

const Button: FC<ButtonProps> = ({ label, onClick, disabled, variant = 'primary', ...rest }) => (
  <button
    className={`btn btn--${variant}`}
    onClick={onClick}
    disabled={disabled}
    aria-label={rest['aria-label'] ?? label}
    data-testid="test-button"
  >
    {label}
  </button>
);

interface CounterProps {
  initial?: number;
  step?: number;
  onCount?: (n: number) => void;
}

const Counter: FC<CounterProps> = ({ initial = 0, step = 1, onCount }) => {
  const [count, setCount] = useState(initial);
  const increment = () => {
    const next = count + step;
    setCount(next);
    onCount?.(next);
  };
  return (
    <div>
      <span data-testid="count">{count}</span>
      <button onClick={increment} data-testid="increment">+</button>
    </div>
  );
};

interface AsyncDataProps {
  fetchData: () => Promise<string>;
}

const AsyncDataComponent: FC<AsyncDataProps> = ({ fetchData }) => {
  const [data, setData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData()
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [fetchData]);

  if (loading) return <p data-testid="loading">Loading…</p>;
  if (error) return <p data-testid="error">{error}</p>;
  return <p data-testid="data">{data}</p>;
};

class ErrorBoundary extends React.Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

const Throwing: FC = () => { throw new Error('Render error'); };

interface FormProps {
  onSubmit: (value: string) => void;
}

const SimpleForm: FC<FormProps> = ({ onSubmit }) => {
  const [value, setValue] = useState('');
  return (
    <form
      data-testid="form"
      onSubmit={(e) => { e.preventDefault(); onSubmit(value); }}
    >
      <label htmlFor="name">Name</label>
      <input
        id="name"
        data-testid="input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        required
      />
      <button type="submit" data-testid="submit">Submit</button>
    </form>
  );
};

// Button – rendering & variants 

describe('ComponentTester – Button', () => {
  it('renders with the provided label', () => {
    render(<Button label="Click me" />);
    expect(screen.getByTestId('test-button')).toHaveTextContent('Click me');
  });

  it.each(['primary', 'secondary', 'danger'] as const)(
    'applies "%s" variant class',
    (variant) => {
      render(<Button label="X" variant={variant} />);
      expect(screen.getByTestId('test-button')).toHaveClass(`btn--${variant}`);
    }
  );

  it('calls onClick handler when clicked', async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(<Button label="Go" onClick={handler} />);
    await user.click(screen.getByTestId('test-button'));
    expect(handler).toHaveBeenCalledOnce();
  });

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(<Button label="Go" onClick={handler} disabled />);
    await user.click(screen.getByTestId('test-button'));
    expect(handler).not.toHaveBeenCalled();
  });

  it('has an accessible aria-label', () => {
    render(<Button label="Save" aria-label="Save document" />);
    expect(screen.getByRole('button', { name: 'Save document' })).toBeInTheDocument();
  });

  it('is focusable via keyboard', async () => {
    const user = userEvent.setup();
    render(<Button label="Focus me" />);
    await user.tab();
    expect(screen.getByTestId('test-button')).toHaveFocus();
  });
});

// Counter – stateful component

describe('ComponentTester – Counter', () => {
  it('renders initial count', () => {
    render(<Counter initial={5} />);
    expect(screen.getByTestId('count')).toHaveTextContent('5');
  });

  it('increments by default step on each click', async () => {
    const user = userEvent.setup();
    render(<Counter />);
    await user.click(screen.getByTestId('increment'));
    expect(screen.getByTestId('count')).toHaveTextContent('1');
  });

  it('increments by custom step', async () => {
    const user = userEvent.setup();
    render(<Counter step={10} />);
    await user.click(screen.getByTestId('increment'));
    expect(screen.getByTestId('count')).toHaveTextContent('10');
  });

  it('fires onCount callback with the new value', async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    render(<Counter onCount={spy} />);
    await user.click(screen.getByTestId('increment'));
    expect(spy).toHaveBeenCalledWith(1);
  });

  it('accumulates across multiple clicks', async () => {
    const user = userEvent.setup();
    render(<Counter step={3} />);
    for (let i = 0; i < 4; i++) await user.click(screen.getByTestId('increment'));
    expect(screen.getByTestId('count')).toHaveTextContent('12');
  });
});

//  AsyncDataComponent

describe('ComponentTester – AsyncDataComponent', () => {
  afterEach(() => vi.restoreAllMocks());

  it('shows loading state initially', () => {
    render(<AsyncDataComponent fetchData={() => new Promise(() => {})} />);
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('displays data after successful fetch', async () => {
    const fetchData = vi.fn().mockResolvedValue('Hello, World!');
    render(<AsyncDataComponent fetchData={fetchData} />);
    await waitFor(() => expect(screen.getByTestId('data')).toHaveTextContent('Hello, World!'));
  });

  it('displays error when fetch rejects', async () => {
    const fetchData = vi.fn().mockRejectedValue(new Error('fetch failed'));
    render(<AsyncDataComponent fetchData={fetchData} />);
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('fetch failed'));
  });

  it('removes loading indicator after fetch completes', async () => {
    const fetchData = vi.fn().mockResolvedValue('done');
    render(<AsyncDataComponent fetchData={fetchData} />);
    await waitFor(() => expect(screen.queryByTestId('loading')).not.toBeInTheDocument());
  });
});

// ErrorBoundary

describe('ComponentTester – ErrorBoundary', () => {
  it('renders fallback when child throws', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary fallback={<p data-testid="fallback">Something went wrong</p>}>
        <Throwing />
      </ErrorBoundary>
    );
    expect(screen.getByTestId('fallback')).toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary fallback={<p>Error</p>}>
        <Button label="Safe" />
      </ErrorBoundary>
    );
    expect(screen.getByTestId('test-button')).toBeInTheDocument();
  });
});

// SimpleForm 

describe('ComponentTester – SimpleForm', () => {
  it('submits with the entered value', async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(<SimpleForm onSubmit={handler} />);
    await user.type(screen.getByTestId('input'), 'Jane Doe');
    await user.click(screen.getByTestId('submit'));
    expect(handler).toHaveBeenCalledWith('Jane Doe');
  });

  it('is associated with a visible label', () => {
    render(<SimpleForm onSubmit={vi.fn()} />);
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
  });

  it('clears input value when user clears it', async () => {
    const user = userEvent.setup();
    render(<SimpleForm onSubmit={vi.fn()} />);
    const input = screen.getByTestId('input') as HTMLInputElement;
    await user.type(input, 'hello');
    await user.clear(input);
    expect(input.value).toBe('');
  });
});

// File-upload simulation

describe('ComponentTester – File handling', () => {
  it('accepts a mock file object', () => {
    const file = createMockFile('avatar.png', 'binary', 'image/png');
    expect(file.name).toBe('avatar.png');
    expect(file.type).toBe('image/png');
  });

  it('simulates file selection on an input', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<input type="file" data-testid="file-input" onChange={onChange} />);
    const file = createMockFile('doc.pdf', 'content', 'application/pdf');
    await user.upload(screen.getByTestId('file-input'), file);
    expect(onChange).toHaveBeenCalled();
  });
});

// Snapshot regression 
describe('ComponentTester – Snapshot', () => {
  it('matches stored snapshot for default Button', () => {
    const { container } = render(<Button label="Snapshot" />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches stored snapshot for Counter at initial=0', () => {
    const { container } = render(<Counter />);
    expect(container.firstChild).toMatchSnapshot();
  });
});