/**
 * Dependency Manager for Form State
 * Handles field dependencies, conditional logic, and cascading updates
 */

import {
  FormState,
  ConditionalRule,
  ConditionalAction,
  FieldDescriptor,
  ValidationResult
} from '../types/core';

export interface DependencyGraph {
  [fieldId: string]: {
    dependsOn: string[];
    dependents: string[];
    conditionalRules: ConditionalRule[];
  };
}

export interface FieldVisibilityState {
  [fieldId: string]: boolean;
}

export interface CascadeUpdateResult {
  visibilityChanges: FieldVisibilityState;
  valueChanges: Record<string, any>;
  validationChanges: Record<string, ValidationResult>;
  fieldsToRevalidate: string[];
}

export class DependencyManager {
  private dependencyGraph: DependencyGraph = {};
  private fieldDescriptors: Map<string, FieldDescriptor> = new Map();
  private conditionalRules: ConditionalRule[] = [];

  /**
   * Initialize dependency manager with field descriptors and conditional rules
   */
  initialize(fields: FieldDescriptor[], conditionalRules: ConditionalRule[] = []): void {
    this.fieldDescriptors.clear();
    this.dependencyGraph = {};
    this.conditionalRules = conditionalRules;

    // Build field descriptor map
    fields.forEach(field => {
      this.fieldDescriptors.set(field.id, field);
    });

    // Build dependency graph
    this.buildDependencyGraph(fields, conditionalRules);
  }

  /**
   * Build the dependency graph from field descriptors and conditional rules
   */
  private buildDependencyGraph(fields: FieldDescriptor[], conditionalRules: ConditionalRule[]): void {
    // Initialize graph nodes
    fields.forEach(field => {
      this.dependencyGraph[field.id] = {
        dependsOn: field.dependencies || [],
        dependents: [],
        conditionalRules: []
      };
    });

    // Build reverse dependencies (dependents)
    fields.forEach(field => {
      if (field.dependencies) {
        field.dependencies.forEach(depFieldId => {
          if (this.dependencyGraph[depFieldId]) {
            this.dependencyGraph[depFieldId].dependents.push(field.id);
          }
        });
      }
    });

    // Add conditional rules to affected fields
    conditionalRules.forEach(rule => {
      rule.actions.forEach(action => {
        if (this.dependencyGraph[action.targetFieldId]) {
          this.dependencyGraph[action.targetFieldId].conditionalRules.push(rule);
        }
      });
    });
  }

  /**
   * Calculate cascading updates when a field value changes
   */
  calculateCascadingUpdates(
    changedFieldId: string,
    newValue: any,
    currentState: FormState
  ): CascadeUpdateResult {
    const result: CascadeUpdateResult = {
      visibilityChanges: {},
      valueChanges: {},
      validationChanges: {},
      fieldsToRevalidate: []
    };

    // Create updated state for evaluation
    const updatedState: FormState = {
      ...currentState,
      values: {
        ...currentState.values,
        [changedFieldId]: newValue
      }
    };

    // Get all fields that might be affected by this change
    const affectedFields = this.getAffectedFields(changedFieldId);

    // Process each affected field
    affectedFields.forEach(fieldId => {
      this.processFieldDependencies(fieldId, updatedState, result);
    });

    return result;
  }

  /**
   * Get all fields that might be affected by a change to the given field
   */
  private getAffectedFields(changedFieldId: string): string[] {
    const affected = new Set<string>();
    const toProcess = [changedFieldId];
    const processed = new Set<string>();

    while (toProcess.length > 0) {
      const fieldId = toProcess.pop()!;
      if (processed.has(fieldId)) continue;
      
      processed.add(fieldId);
      
      // Add direct dependents
      const fieldDeps = this.dependencyGraph[fieldId];
      if (fieldDeps) {
        fieldDeps.dependents.forEach(dependent => {
          affected.add(dependent);
          if (!processed.has(dependent)) {
            toProcess.push(dependent);
          }
        });
      }

      // Add fields affected by conditional rules
      this.conditionalRules.forEach(rule => {
        rule.actions.forEach(action => {
          if (!processed.has(action.targetFieldId)) {
            affected.add(action.targetFieldId);
            toProcess.push(action.targetFieldId);
          }
        });
      });
    }

    return Array.from(affected);
  }

  /**
   * Process dependencies for a specific field
   */
  private processFieldDependencies(
    fieldId: string,
    state: FormState,
    result: CascadeUpdateResult
  ): void {
    const fieldDeps = this.dependencyGraph[fieldId];
    if (!fieldDeps) return;

    // Process conditional rules that affect this field
    fieldDeps.conditionalRules.forEach(rule => {
      if (this.evaluateCondition(rule.condition, state)) {
        rule.actions.forEach(action => {
          if (action.targetFieldId === fieldId) {
            this.applyConditionalAction(action, state, result);
          }
        });
      }
    });

    // Check if field should be revalidated due to dependency changes
    const fieldDescriptor = this.fieldDescriptors.get(fieldId);
    if (fieldDescriptor && fieldDescriptor.dependencies) {
      const shouldRevalidate = fieldDescriptor.dependencies.some(depId => 
        state.values[depId] !== undefined
      );
      
      if (shouldRevalidate && !result.fieldsToRevalidate.includes(fieldId)) {
        result.fieldsToRevalidate.push(fieldId);
      }
    }
  }

  /**
   * Evaluate a conditional rule condition
   */
  private evaluateCondition(condition: (formState: FormState) => boolean, state: FormState): boolean {
    try {
      return condition(state);
    } catch (error) {
      console.error('Error evaluating conditional rule:', error);
      return false;
    }
  }

  /**
   * Apply a conditional action to the result
   */
  private applyConditionalAction(
    action: ConditionalAction,
    state: FormState,
    result: CascadeUpdateResult
  ): void {
    switch (action.type) {
      case 'show':
        result.visibilityChanges[action.targetFieldId] = true;
        break;
      
      case 'hide':
        result.visibilityChanges[action.targetFieldId] = false;
        break;
      
      case 'setValue':
        if (action.value !== undefined) {
          result.valueChanges[action.targetFieldId] = action.value;
        }
        break;
      
      case 'enable':
        // Enable/disable would be handled by the form builder
        // For now, we just track that the field needs attention
        if (!result.fieldsToRevalidate.includes(action.targetFieldId)) {
          result.fieldsToRevalidate.push(action.targetFieldId);
        }
        break;
      
      case 'disable':
        // Similar to enable
        if (!result.fieldsToRevalidate.includes(action.targetFieldId)) {
          result.fieldsToRevalidate.push(action.targetFieldId);
        }
        break;
    }
  }

  /**
   * Validate field dependencies
   */
  validateDependencies(fields: FieldDescriptor[]): {
    isValid: boolean;
    errors: Array<{ fieldId: string; error: string; dependencyId?: string }>;
  } {
    const errors: Array<{ fieldId: string; error: string; dependencyId?: string }> = [];
    const fieldIds = new Set(fields.map(f => f.id));

    // Check for missing dependencies
    fields.forEach(field => {
      if (field.dependencies) {
        field.dependencies.forEach(depId => {
          if (!fieldIds.has(depId)) {
            errors.push({
              fieldId: field.id,
              error: `Field depends on non-existent field: ${depId}`,
              dependencyId: depId
            });
          }
        });
      }
    });

    // Check for circular dependencies
    const circularDeps = this.detectCircularDependencies(fields);
    circularDeps.forEach(cycle => {
      errors.push({
        fieldId: cycle[0],
        error: `Circular dependency detected: ${cycle.join(' -> ')}`
      });
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Detect circular dependencies using DFS
   */
  private detectCircularDependencies(fields: FieldDescriptor[]): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];

    const dfs = (fieldId: string): boolean => {
      if (recursionStack.has(fieldId)) {
        // Found a cycle
        const cycleStart = path.indexOf(fieldId);
        if (cycleStart !== -1) {
          cycles.push([...path.slice(cycleStart), fieldId]);
        }
        return true;
      }

      if (visited.has(fieldId)) {
        return false;
      }

      visited.add(fieldId);
      recursionStack.add(fieldId);
      path.push(fieldId);

      const field = fields.find(f => f.id === fieldId);
      if (field && field.dependencies) {
        for (const depId of field.dependencies) {
          if (dfs(depId)) {
            return true;
          }
        }
      }

      recursionStack.delete(fieldId);
      path.pop();
      return false;
    };

    fields.forEach(field => {
      if (!visited.has(field.id)) {
        dfs(field.id);
      }
    });

    return cycles;
  }

  /**
   * Get dependency information for a field
   */
  getFieldDependencies(fieldId: string): {
    dependsOn: string[];
    dependents: string[];
    conditionalRules: ConditionalRule[];
  } | null {
    return this.dependencyGraph[fieldId] || null;
  }

  /**
   * Check if a field has dependencies
   */
  hasDependencies(fieldId: string): boolean {
    const deps = this.dependencyGraph[fieldId];
    return deps ? deps.dependsOn.length > 0 : false;
  }

  /**
   * Check if a field has dependents
   */
  hasDependents(fieldId: string): boolean {
    const deps = this.dependencyGraph[fieldId];
    return deps ? deps.dependents.length > 0 : false;
  }

  /**
   * Get all fields that depend on the given field
   */
  getDependentFields(fieldId: string): string[] {
    const deps = this.dependencyGraph[fieldId];
    return deps ? [...deps.dependents] : [];
  }

  /**
   * Get topological sort of fields based on dependencies
   */
  getTopologicalSort(): string[] {
    const visited = new Set<string>();
    const result: string[] = [];

    const dfs = (fieldId: string) => {
      if (visited.has(fieldId)) return;
      
      visited.add(fieldId);
      
      const deps = this.dependencyGraph[fieldId];
      if (deps) {
        deps.dependsOn.forEach(depId => {
          if (this.dependencyGraph[depId]) {
            dfs(depId);
          }
        });
      }
      
      result.push(fieldId);
    };

    Object.keys(this.dependencyGraph).forEach(fieldId => {
      if (!visited.has(fieldId)) {
        dfs(fieldId);
      }
    });

    return result;
  }

  /**
   * Clear all dependency information
   */
  clear(): void {
    this.dependencyGraph = {};
    this.fieldDescriptors.clear();
    this.conditionalRules = [];
  }
}