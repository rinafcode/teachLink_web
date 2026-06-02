import { UserRole } from '@/types/api';
import { isAtLeastRole } from './acl';

export const EDITOR_MIN_ROLE = UserRole.INSTRUCTOR;

export function canAccessPostEditor(userRole: UserRole | null | undefined): boolean {
  return isAtLeastRole(userRole, EDITOR_MIN_ROLE);
}
