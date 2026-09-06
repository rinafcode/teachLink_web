import {
  EmailTemplate,
  EmailTemplatePayload,
  MissingTemplateVariable,
  RenderOptions,
  TemplateValidationResult,
} from '@/lib/email/types';

export type TransactionalTemplateId =
  | 'welcome'
  | 'password-reset'
  | 'security-alert'
  | 'course-enrollment'
  | 'email-verification';

const TEMPLATE_SUBJECTS: Record<TransactionalTemplateId, string> = {
  welcome: 'Welcome to TeachLink',
  'password-reset': 'Reset your TeachLink password',
  'security-alert': 'New sign-in detected',
  'course-enrollment': 'You are enrolled successfully',
  'email-verification': 'Verify your TeachLink email address',
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Matches a `{{ placeholder }}` and captures its name. */
const PLACEHOLDER_PATTERN = /{{\s*([\w.-]+)\s*}}/g;

/**
 * The variables a template string references.
 *
 * Read from the template itself rather than a hand-maintained list, so the
 * declared schema cannot drift away from what the template actually uses.
 */
export function extractTemplateVariables(template: string): string[] {
  const names = new Set<string>();
  for (const match of template.matchAll(PLACEHOLDER_PATTERN)) {
    names.add(match[1]);
  }
  return [...names].sort();
}

/** True when the payload supplies a usable value for `name`. */
function isProvided(payload: EmailTemplatePayload, name: string): boolean {
  const value = payload[name];
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function render(template: string, payload: EmailTemplatePayload): string {
  return template.replace(PLACEHOLDER_PATTERN, (_match, key: string) => {
    const value = payload[key];
    return escapeHtml(value == null ? '' : String(value));
  });
}

const HTML_TEMPLATES: Record<TransactionalTemplateId, string> = {
  welcome:
    '<h2>Welcome, {{name}}</h2><p>Your TeachLink account is ready. Start learning today.</p>',
  'password-reset':
    '<h2>Password reset request</h2><p>Use this link to reset your password:</p><p><a href="{{resetUrl}}">Reset Password</a></p><p>This link expires in {{expiresInMinutes}} minutes.</p>',
  'security-alert':
    '<h2>Security alert</h2><p>We noticed a sign-in from {{device}} on {{timestamp}}.</p><p>If this was not you, secure your account immediately.</p>',
  'course-enrollment':
    '<h2>Enrollment confirmed</h2><p>You are now enrolled in <strong>{{courseName}}</strong>.</p><p>Start here: <a href="{{courseUrl}}">Open course</a></p>',
  'email-verification':
    '<h2>Verify your email</h2><p>Welcome, {{name}}. Confirm your email address using this link:</p><p><a href="{{verificationUrl}}">Verify Email</a></p><p>If you lose access, restore it with backup code <strong>{{backupCode}}</strong> or use <a href="{{restoreUrl}}">this recovery link</a>.</p><p>This verification link expires in {{expiresInMinutes}} minutes.</p>',
};

const TEXT_TEMPLATES: Record<TransactionalTemplateId, string> = {
  welcome: 'Welcome, {{name}}. Your TeachLink account is ready.',
  'password-reset':
    'Reset your TeachLink password using this link: {{resetUrl}}. Expires in {{expiresInMinutes}} minutes.',
  'security-alert':
    'Security alert: sign-in from {{device}} on {{timestamp}}. If not you, secure your account.',
  'course-enrollment': 'Enrollment confirmed for {{courseName}}. Start here: {{courseUrl}}',
  'email-verification':
    'Verify your email, {{name}}: {{verificationUrl}}. Backup code: {{backupCode}}. Recovery link: {{restoreUrl}}. Expires in {{expiresInMinutes}} minutes.',
};

/** Thrown when a template is rendered without every variable it references. */
export class MissingTemplateVariablesError extends Error {
  readonly templateId: string;
  readonly missing: MissingTemplateVariable[];

  constructor(templateId: string, missing: MissingTemplateVariable[]) {
    super(
      `Template "${templateId}" is missing ${missing.length} variable(s): ${missing
        .map((variable) => `${variable.name} (${variable.parts.join(', ')})`)
        .join(', ')}`,
    );
    this.name = 'MissingTemplateVariablesError';
    this.templateId = templateId;
    this.missing = missing;
  }
}

/** Every variable the given template references, by part. */
export function getTemplateSchema(
  id: TransactionalTemplateId,
): Record<'subject' | 'html' | 'text', string[]> {
  return {
    subject: extractTemplateVariables(TEMPLATE_SUBJECTS[id]),
    html: extractTemplateVariables(HTML_TEMPLATES[id]),
    text: extractTemplateVariables(TEXT_TEMPLATES[id]),
  };
}

export class EmailTemplateManager {
  /**
   * Checks a payload against the variables the template actually references.
   *
   * Reports unused variables too: a payload with `userName` for a template
   * that wants `name` produces one missing and one unused entry, which is a
   * far better clue than a blank space in the rendered email.
   */
  validatePayload(
    id: TransactionalTemplateId,
    payload: EmailTemplatePayload,
  ): TemplateValidationResult {
    const schema = getTemplateSchema(id);
    const byName = new Map<string, MissingTemplateVariable>();

    for (const part of ['subject', 'html', 'text'] as const) {
      for (const name of schema[part]) {
        if (isProvided(payload, name)) continue;

        const existing = byName.get(name);
        if (existing) existing.parts.push(part);
        else byName.set(name, { name, parts: [part] });
      }
    }

    const referenced = new Set([...schema.subject, ...schema.html, ...schema.text]);
    const unused = Object.keys(payload).filter((key) => !referenced.has(key));

    const missing = [...byName.values()];
    return { valid: missing.length === 0, missing, unused };
  }

  /**
   * Renders a transactional template.
   *
   * Throws [`MissingTemplateVariablesError`] rather than rendering an
   * unresolved placeholder as an empty string — a password-reset email whose
   * link silently rendered as nothing is worse than one that was never sent,
   * because the user cannot tell it is broken.
   */
  getTemplate(
    id: TransactionalTemplateId,
    payload: EmailTemplatePayload,
    options: RenderOptions = {},
  ): EmailTemplate {
    if (!options.allowMissing) {
      const validation = this.validatePayload(id, payload);
      if (!validation.valid) {
        throw new MissingTemplateVariablesError(id, validation.missing);
      }
    }

    return {
      id,
      subject: render(TEMPLATE_SUBJECTS[id], payload),
      html: render(HTML_TEMPLATES[id], payload),
      text: render(TEXT_TEMPLATES[id], payload),
    };
  }
}

export const emailTemplateManager = new EmailTemplateManager();
