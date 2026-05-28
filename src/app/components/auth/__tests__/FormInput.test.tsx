import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FormInput } from '../FormInput';

describe('Auth FormInput', () => {
  it('associates label, helper text, and required state with the input', () => {
    render(
      <FormInput
        label="Email"
        name="email"
        type="email"
        required
        helperText="Use the email connected to your account."
      />,
    );

    const input = screen.getByRole('textbox', {
      name: 'Email',
      description: 'Use the email connected to your account.',
    });

    expect(input).toBeRequired();
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(input).toHaveAttribute('aria-invalid', 'false');
  });

  it('links validation errors to the input for screen readers', () => {
    render(
      <FormInput
        label="Email"
        name="email"
        type="email"
        error="Enter a valid email address."
        helperText="Use the email connected to your account."
      />,
    );

    const input = screen.getByRole('textbox', { name: 'Email' });

    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email address.');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(
      'Use the email connected to your account. Enter a valid email address.',
    );
  });

  it('exposes password visibility controls with name, state, and controlled input', () => {
    render(<FormInput label="Password" name="password" type="password" />);

    const input = screen.getByLabelText('Password');
    const toggle = screen.getByRole('button', { name: 'Show Password' });

    expect(input).toHaveAttribute('type', 'password');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(toggle).toHaveAttribute('aria-controls', input.id);

    fireEvent.click(toggle);

    expect(input).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Hide Password' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
