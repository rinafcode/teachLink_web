/**
 * UserFlowTester.test.tsx
 *
 * Integration tests that validate complete user workflows:
 * auth, navigation, CRUD, search, multi-step forms, and error recovery.
 */

import React, { FC, useState,  } from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  mockFetch,
  mockFetchError,
  createTestUser,
} from '../utils/testUtils';

// ─── Lightweight in-app components (stubs until real ones exist) ──────────────

interface User { id: string; name: string; email: string; role: string; }

//  Auth Flow 

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<void>;
}

const LoginForm: FC<LoginFormProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try { await onLogin(email, password); }
    catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} data-testid="login-form">
      <input data-testid="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
      <input data-testid="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
      {error && <p data-testid="auth-error">{error}</p>}
      <button type="submit" disabled={loading} data-testid="login-btn">
        {loading ? 'Logging in…' : 'Login'}
      </button>
    </form>
  );
};

// Todo CRUD Flow 

interface Todo { id: number; text: string; done: boolean; }

const TodoApp: FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState('');

  const add = () => {
    if (!input.trim()) return;
    setTodos(prev => [...prev, { id: Date.now(), text: input.trim(), done: false }]);
    setInput('');
  };
  const toggle = (id: number) => setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const remove = (id: number) => setTodos(prev => prev.filter(t => t.id !== id));

  return (
    <div>
      <input data-testid="todo-input" value={input} onChange={e => setInput(e.target.value)} />
      <button data-testid="add-btn" onClick={add}>Add</button>
      <ul data-testid="todo-list">
        {todos.map(t => (
          <li key={t.id} data-testid={`todo-${t.id}`}>
            <span data-testid="todo-text" style={{ textDecoration: t.done ? 'line-through' : 'none' }}>{t.text}</span>
            <button data-testid="toggle-btn" onClick={() => toggle(t.id)}>Toggle</button>
            <button data-testid="delete-btn" onClick={() => remove(t.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Search Flow 

const ITEMS = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry'];

const SearchComponent: FC = () => {
  const [query, setQuery] = useState('');
  const results = ITEMS.filter(i => i.toLowerCase().includes(query.toLowerCase()));
  return (
    <div>
      <input data-testid="search-input" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search…" />
      <ul data-testid="results">
        {results.map(r => <li key={r} data-testid="result-item">{r}</li>)}
      </ul>
    </div>
  );
};

//  Multi-step form 

const steps = ['Personal Info', 'Address', 'Review'];

const MultiStepForm: FC<{ onSubmit: (data: Record<string, string>) => void }> = ({ onSubmit }) => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Record<string, string>>({});

  const update = (key: string, value: string) => setData(prev => ({ ...prev, [key]: value }));

  return (
    <div>
      <p data-testid="step-label">{steps[step]}</p>
      {step === 0 && (
        <>
          <input data-testid="field-name" placeholder="Name" onChange={e => update('name', e.target.value)} />
          <input data-testid="field-email" placeholder="Email" onChange={e => update('email', e.target.value)} />
        </>
      )}
      {step === 1 && (
        <input data-testid="field-address" placeholder="Address" onChange={e => update('address', e.target.value)} />
      )}
      {step === 2 && (
        <div data-testid="review">
          <p data-testid="review-name">{data.name}</p>
          <p data-testid="review-email">{data.email}</p>
          <p data-testid="review-address">{data.address}</p>
        </div>
      )}
      {step < steps.length - 1
        ? <button data-testid="next-btn" onClick={() => setStep(s => s + 1)}>Next</button>
        : <button data-testid="submit-btn" onClick={() => onSubmit(data)}>Submit</button>}
      {step > 0 && <button data-testid="back-btn" onClick={() => setStep(s => s - 1)}>Back</button>}
    </div>
  );
};

// Tests 

describe('UserFlowTester – Authentication', () => {
  afterEach(() => vi.restoreAllMocks());

  it('completes a successful login flow', async () => {
    const user = userEvent.setup();
    const onLogin = vi.fn().mockResolvedValue(undefined);
    render(<LoginForm onLogin={onLogin} />);

    await user.type(screen.getByTestId('email'), 'jane@example.com');
    await user.type(screen.getByTestId('password'), 'secret123');
    await user.click(screen.getByTestId('login-btn'));

    await waitFor(() => expect(onLogin).toHaveBeenCalledWith('jane@example.com', 'secret123'));
  });

  it('shows loading state while authenticating', async () => {
    const user = userEvent.setup();
    let resolve!: () => void;
    const onLogin = vi.fn(() => new Promise<void>(res => { resolve = res; }));
    render(<LoginForm onLogin={onLogin} />);

    await user.type(screen.getByTestId('email'), 'a@b.com');
    await user.type(screen.getByTestId('password'), 'pass');
    await user.click(screen.getByTestId('login-btn'));

    expect(screen.getByTestId('login-btn')).toBeDisabled();
    expect(screen.getByTestId('login-btn')).toHaveTextContent('Logging in…');
    resolve();
    await waitFor(() => expect(screen.getByTestId('login-btn')).not.toBeDisabled());
  });

  it('displays error message on failed login', async () => {
    const user = userEvent.setup();
    const onLogin = vi.fn().mockRejectedValue(new Error('Invalid credentials'));
    render(<LoginForm onLogin={onLogin} />);

    await user.type(screen.getByTestId('email'), 'bad@bad.com');
    await user.type(screen.getByTestId('password'), 'wrong');
    await user.click(screen.getByTestId('login-btn'));

    await waitFor(() =>
      expect(screen.getByTestId('auth-error')).toHaveTextContent('Invalid credentials')
    );
  });

  it('clears error on subsequent login attempt', async () => {
    const user = userEvent.setup();
    const onLogin = vi.fn()
      .mockRejectedValueOnce(new Error('Bad credentials'))
      .mockResolvedValue(undefined);

    render(<LoginForm onLogin={onLogin} />);
    await user.type(screen.getByTestId('email'), 'a@b.com');
    await user.type(screen.getByTestId('password'), 'p');
    await user.click(screen.getByTestId('login-btn'));
    await waitFor(() => screen.getByTestId('auth-error'));

    await user.click(screen.getByTestId('login-btn'));
    await waitFor(() => expect(screen.queryByTestId('auth-error')).not.toBeInTheDocument());
  });
});


describe('UserFlowTester – Todo CRUD', () => {
  it('adds a new todo', async () => {
    const user = userEvent.setup();
    render(<TodoApp />);
    await user.type(screen.getByTestId('todo-input'), 'Buy groceries');
    await user.click(screen.getByTestId('add-btn'));
    expect(screen.getByText('Buy groceries')).toBeInTheDocument();
  });

  it('does not add empty todos', async () => {
    const user = userEvent.setup();
    render(<TodoApp />);
    await user.click(screen.getByTestId('add-btn'));
    expect(screen.getByTestId('todo-list').children).toHaveLength(0);
  });

  it('clears input after adding', async () => {
    const user = userEvent.setup();
    render(<TodoApp />);
    await user.type(screen.getByTestId('todo-input'), 'Task A');
    await user.click(screen.getByTestId('add-btn'));
    expect((screen.getByTestId('todo-input') as HTMLInputElement).value).toBe('');
  });

  it('toggles a todo done state', async () => {
    const user = userEvent.setup();
    render(<TodoApp />);
    await user.type(screen.getByTestId('todo-input'), 'Toggle me');
    await user.click(screen.getByTestId('add-btn'));
    const toggleBtn = screen.getByTestId('toggle-btn');
    await user.click(toggleBtn);
    expect(screen.getByTestId('todo-text')).toHaveStyle({ textDecoration: 'line-through' });
  });

  it('deletes a todo', async () => {
    const user = userEvent.setup();
    render(<TodoApp />);
    await user.type(screen.getByTestId('todo-input'), 'Delete me');
    await user.click(screen.getByTestId('add-btn'));
    await user.click(screen.getByTestId('delete-btn'));
    expect(screen.queryByText('Delete me')).not.toBeInTheDocument();
  });

  it('manages multiple todos independently', async () => {
    const user = userEvent.setup();
    render(<TodoApp />);
    for (const task of ['Task 1', 'Task 2', 'Task 3']) {
      await user.type(screen.getByTestId('todo-input'), task);
      await user.click(screen.getByTestId('add-btn'));
    }
    expect(screen.getAllByTestId('todo-text')).toHaveLength(3);
  });
});


describe('UserFlowTester – Search', () => {
  it('shows all items when query is empty', () => {
    render(<SearchComponent />);
    expect(screen.getAllByTestId('result-item')).toHaveLength(ITEMS.length);
  });

  it('filters results by query', async () => {
    const user = userEvent.setup();
    render(<SearchComponent />);
    await user.type(screen.getByTestId('search-input'), 'an');
    const items = screen.getAllByTestId('result-item').map(el => el.textContent);
    expect(items).toEqual(expect.arrayContaining(['Banana']));
    expect(items.every(i => i!.toLowerCase().includes('an'))).toBe(true);
  });

  it('is case-insensitive', async () => {
    const user = userEvent.setup();
    render(<SearchComponent />);
    await user.type(screen.getByTestId('search-input'), 'APPLE');
    expect(screen.getAllByTestId('result-item')).toHaveLength(1);
    expect(screen.getByText('Apple')).toBeInTheDocument();
  });

  it('shows no results for unmatched query', async () => {
    const user = userEvent.setup();
    render(<SearchComponent />);
    await user.type(screen.getByTestId('search-input'), 'zzzz');
    expect(screen.queryAllByTestId('result-item')).toHaveLength(0);
  });

  it('restores full list when query is cleared', async () => {
    const user = userEvent.setup();
    render(<SearchComponent />);
    await user.type(screen.getByTestId('search-input'), 'ban');
    await user.clear(screen.getByTestId('search-input'));
    expect(screen.getAllByTestId('result-item')).toHaveLength(ITEMS.length);
  });
});


describe('UserFlowTester – Multi-step form', () => {
  it('starts on step 1 and shows correct label', () => {
    render(<MultiStepForm onSubmit={vi.fn()} />);
    expect(screen.getByTestId('step-label')).toHaveTextContent('Personal Info');
  });

  it('advances to next step', async () => {
    const user = userEvent.setup();
    render(<MultiStepForm onSubmit={vi.fn()} />);
    await user.click(screen.getByTestId('next-btn'));
    expect(screen.getByTestId('step-label')).toHaveTextContent('Address');
  });

  it('goes back a step', async () => {
    const user = userEvent.setup();
    render(<MultiStepForm onSubmit={vi.fn()} />);
    await user.click(screen.getByTestId('next-btn'));
    await user.click(screen.getByTestId('back-btn'));
    expect(screen.getByTestId('step-label')).toHaveTextContent('Personal Info');
  });

  it('completes full workflow and submits data', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<MultiStepForm onSubmit={onSubmit} />);

    await user.type(screen.getByTestId('field-name'), 'Alice');
    await user.type(screen.getByTestId('field-email'), 'alice@example.com');
    await user.click(screen.getByTestId('next-btn'));

    await user.type(screen.getByTestId('field-address'), '123 Main St');
    await user.click(screen.getByTestId('next-btn'));

    expect(screen.getByTestId('review-name')).toHaveTextContent('Alice');
    expect(screen.getByTestId('review-email')).toHaveTextContent('alice@example.com');
    expect(screen.getByTestId('review-address')).toHaveTextContent('123 Main St');

    await user.click(screen.getByTestId('submit-btn'));
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Alice',
      email: 'alice@example.com',
      address: '123 Main St',
    });
  });

  it('hides back button on first step', () => {
    render(<MultiStepForm onSubmit={vi.fn()} />);
    expect(screen.queryByTestId('back-btn')).not.toBeInTheDocument();
  });

  it('hides next button on last step', async () => {
    const user = userEvent.setup();
    render(<MultiStepForm onSubmit={vi.fn()} />);
    await user.click(screen.getByTestId('next-btn'));
    await user.click(screen.getByTestId('next-btn'));
    expect(screen.queryByTestId('next-btn')).not.toBeInTheDocument();
    expect(screen.getByTestId('submit-btn')).toBeInTheDocument();
  });
});

// API-integrated user flow

describe('UserFlowTester – API-backed flow', () => {
  afterEach(() => vi.restoreAllMocks());

  it('fetches and displays user profile', async () => {
    const mockUser = createTestUser({ name: 'Bob', email: 'bob@example.com' });
    const fetchSpy = mockFetch(mockUser);

    const response = await fetch('/api/me');
    const data = await response.json();

    expect(fetchSpy).toHaveBeenCalledWith('/api/me');
    expect(data.name).toBe('Bob');
  });

  it('handles network failure gracefully', async () => {
    mockFetchError('Network error');
    await expect(fetch('/api/me')).rejects.toThrow('Network error');
  });
});