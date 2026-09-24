import { describe, it, expect } from 'vitest';
import {
  EmailTemplateManager,
  MissingTemplateVariablesError,
  extractTemplateVariables,
  getTemplateSchema,
} from '../templates';

const manager = new EmailTemplateManager();

const welcomePayload = { name: 'Ada' };

const verificationPayload = {
  name: 'Ada',
  verificationUrl: 'https://teachlink.test/verify?token=abc',
  backupCode: 'XYZ-123',
  restoreUrl: 'https://teachlink.test/restore',
  expiresInMinutes: 60,
};

describe('extractTemplateVariables', () => {
  it('finds each placeholder once', () => {
    expect(extractTemplateVariables('{{a}} and {{ b }} and {{a}}')).toEqual(['a', 'b']);
  });

  it('tolerates whitespace inside the braces', () => {
    expect(extractTemplateVariables('{{  spaced  }}')).toEqual(['spaced']);
  });

  it('returns nothing for a template with no variables', () => {
    expect(extractTemplateVariables('<p>Static copy</p>')).toEqual([]);
  });
});

describe('getTemplateSchema', () => {
  // Read from the templates themselves, so a declared schema cannot drift
  // away from what the template actually references.
  it('reports the variables each part uses', () => {
    const schema = getTemplateSchema('password-reset');

    expect(schema.html).toEqual(['expiresInMinutes', 'resetUrl']);
    expect(schema.subject).toEqual([]);
  });
});

describe('validatePayload', () => {
  it('accepts a complete payload', () => {
    expect(manager.validatePayload('welcome', welcomePayload)).toEqual({
      valid: true,
      missing: [],
      unused: [],
    });
  });

  it('names a missing variable and where it is used', () => {
    const result = manager.validatePayload('password-reset', { resetUrl: 'https://x.test' });

    expect(result.valid).toBe(false);
    expect(result.missing).toHaveLength(1);
    expect(result.missing[0].name).toBe('expiresInMinutes');
    expect(result.missing[0].parts).toEqual(['html', 'text']);
  });

  // An empty string renders as nothing, which is the failure this validation
  // exists to catch — supplying one is not supplying the variable.
  it('treats an empty or whitespace value as missing', () => {
    expect(manager.validatePayload('welcome', { name: '' }).valid).toBe(false);
    expect(manager.validatePayload('welcome', { name: '   ' }).valid).toBe(false);
  });

  it('treats null and undefined as missing', () => {
    expect(manager.validatePayload('welcome', { name: null }).valid).toBe(false);
    expect(manager.validatePayload('welcome', { name: undefined }).valid).toBe(false);
  });

  it('accepts zero and false as supplied values', () => {
    const result = manager.validatePayload('password-reset', {
      resetUrl: 'https://x.test',
      expiresInMinutes: 0,
    });

    expect(result.valid).toBe(true);
  });

  // `userName` for a template that wants `name` is a far better clue than a
  // blank space in the delivered email.
  it('reports a variable the template never uses', () => {
    const result = manager.validatePayload('welcome', { name: 'Ada', userName: 'Ada' });

    expect(result.valid).toBe(true);
    expect(result.unused).toEqual(['userName']);
  });

  it('reports every missing variable at once', () => {
    const result = manager.validatePayload('email-verification', { name: 'Ada' });

    expect(result.missing.map((variable) => variable.name).sort()).toEqual([
      'backupCode',
      'expiresInMinutes',
      'restoreUrl',
      'verificationUrl',
    ]);
  });
});

describe('getTemplate', () => {
  it('renders a complete payload', () => {
    const template = manager.getTemplate('welcome', welcomePayload);

    expect(template.subject).toBe('Welcome to TeachLink');
    expect(template.html).toContain('Welcome, Ada');
    expect(template.text).toContain('Ada');
  });

  it('renders the verification email', () => {
    const template = manager.getTemplate('email-verification', verificationPayload);

    expect(template.html).toContain('https://teachlink.test/verify?token=abc');
    expect(template.html).toContain('XYZ-123');
  });

  // A password reset whose link rendered as nothing is worse than one never
  // sent: the user cannot tell it is broken.
  it('throws rather than rendering a blank placeholder', () => {
    expect(() => manager.getTemplate('password-reset', { resetUrl: 'https://x.test' })).toThrow(
      MissingTemplateVariablesError,
    );
  });

  it('names the template and variables in the error', () => {
    try {
      manager.getTemplate('password-reset', {});
      expect.unreachable('should have thrown');
    } catch (error) {
      const typed = error as MissingTemplateVariablesError;
      expect(typed.templateId).toBe('password-reset');
      expect(typed.missing.map((variable) => variable.name).sort()).toEqual([
        'expiresInMinutes',
        'resetUrl',
      ]);
      expect(typed.message).toContain('password-reset');
    }
  });

  // Previews and tests still need to render an incomplete payload.
  it('renders anyway when allowMissing is set', () => {
    const template = manager.getTemplate('welcome', {}, { allowMissing: true });

    expect(template.html).toContain('Welcome, ');
  });

  it('still escapes HTML in supplied values', () => {
    const template = manager.getTemplate('welcome', { name: '<script>alert(1)</script>' });

    expect(template.html).not.toContain('<script>');
    expect(template.html).toContain('&lt;script&gt;');
  });

  it('does not reject a payload carrying extra keys', () => {
    expect(() => manager.getTemplate('welcome', { name: 'Ada', extra: 'ignored' })).not.toThrow();
  });
});
