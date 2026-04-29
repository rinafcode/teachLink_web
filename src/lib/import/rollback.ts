/**
 * Rollback manager for bulk import operations.
 *
 * Callers register compensating actions for each successfully persisted record.
 * On failure, `rollback()` executes them in reverse order (LIFO), ensuring
 * partial writes are cleaned up correctly.
 *
 * Usage:
 *
 *   const rb = createRollbackManager();
 *
 *   for (const record of validRecords) {
 *     const id = await persistRecord(record.data);
 *     rb.register(() => deleteRecord(id), `row ${record.rowIndex}`);
 *   }
 *
 *   if (shouldRollback) {
 *     const result = await rb.rollback();
 *     console.log(result.errors); // any rollback failures
 *   }
 */

export interface RollbackAction {
  /** Human-readable label for error reporting. */
  label: string;
  /** The compensating action to execute. */
  fn: () => Promise<void> | void;
}

export interface RollbackResult {
  /** Number of actions that ran successfully. */
  rolledBack: number;
  /** Errors that occurred during rollback (non-fatal). */
  errors: Array<{ label: string; error: string }>;
}

export interface RollbackManager {
  /** Register a compensating action. */
  register(fn: () => Promise<void> | void, label?: string): void;
  /** Execute all registered actions in reverse order. */
  rollback(): Promise<RollbackResult>;
  /** Discard all registered actions (call after a fully successful import). */
  clear(): void;
  /** How many actions are currently registered. */
  readonly size: number;
}

export function createRollbackManager(): RollbackManager {
  const actions: RollbackAction[] = [];

  return {
    register(fn, label = `action-${actions.length + 1}`) {
      actions.push({ fn, label });
    },

    async rollback(): Promise<RollbackResult> {
      let rolledBack = 0;
      const errors: RollbackResult['errors'] = [];

      // Execute in reverse insertion order
      for (let i = actions.length - 1; i >= 0; i--) {
        const { fn, label } = actions[i];
        try {
          await fn();
          rolledBack++;
        } catch (e: unknown) {
          errors.push({ label, error: e instanceof Error ? e.message : String(e) });
        }
      }

      // Clear after rollback attempt regardless of partial failures
      actions.length = 0;
      return { rolledBack, errors };
    },

    clear() {
      actions.length = 0;
    },

    get size() {
      return actions.length;
    },
  };
}
