import { describe, expect, it } from 'vitest';
import { canAccessPostEditor, EDITOR_MIN_ROLE } from '../editorAccess';
import { UserRole } from '@/types/api';

describe('editor access', () => {
  it('requires instructor-level access or higher', () => {
    expect(canAccessPostEditor(UserRole.ADMIN)).toBe(true);
    expect(canAccessPostEditor(UserRole.INSTRUCTOR)).toBe(true);
    expect(canAccessPostEditor(UserRole.STUDENT)).toBe(false);
    expect(canAccessPostEditor(UserRole.GUEST)).toBe(false);
    expect(canAccessPostEditor(null)).toBe(false);
  });

  it('documents the minimum editor role', () => {
    expect(EDITOR_MIN_ROLE).toBe(UserRole.INSTRUCTOR);
  });
});
