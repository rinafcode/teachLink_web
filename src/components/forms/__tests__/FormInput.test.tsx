import { render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';
import { FormInput } from '../FormInput';

function renderWithForm(ui: React.ReactNode, options: { error?: string } = {}) {
  function Wrapper() {
    const methods = useForm({ defaultValues: { email: '', bio: '', role: '' } });

    useEffect(() => {
      if (options.error) {
        methods.setError('email', { type: 'manual', message: options.error });
      }
    }, [methods, options.error]);

    return <FormProvider {...methods}>{ui}</FormProvider>;
  }

  return render(<Wrapper />);
}

describe('FormInput', () => {
  it('associates the visible label and helper text with text inputs', () => {
    renderWithForm(
      <FormInput
        name="email"
        label="Email address"
        type="email"
        required
        helperText="Use your school email address."
      />,
    );

    const input = screen.getByRole('textbox', {
      name: 'Email address',
      description: 'Use your school email address.',
    });

    expect(input).toBeRequired();
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(input).toHaveAttribute('aria-invalid', 'false');
  });

  it('announces validation errors through aria-describedby and alert role', async () => {
    renderWithForm(
      <FormInput
        name="email"
        label="Email address"
        type="email"
        helperText="Use your school email address."
      />,
      { error: 'Email address is required.' },
    );

    const error = await screen.findByRole('alert');
    const input = screen.getByRole('textbox', { name: 'Email address' });

    expect(error).toHaveTextContent('Email address is required.');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(
      'Use your school email address. Email address is required.',
    );
  });

  it('supports textarea and select fields with accessible names', () => {
    renderWithForm(
      <>
        <FormInput name="bio" label="Biography" as="textarea" helperText="Keep it brief." />
        <FormInput name="role" label="Role" as="select">
          <option value="">Choose a role</option>
          <option value="teacher">Teacher</option>
        </FormInput>
      </>,
    );

    expect(screen.getByRole('textbox', { name: 'Biography' })).toHaveAccessibleDescription(
      'Keep it brief.',
    );
    expect(screen.getByRole('combobox', { name: 'Role' })).toBeInTheDocument();
  });
});
