import type { GraphQLQueryConfig, GraphQLSelectionSet, GraphQLScalar } from './types';

export function buildQuery(config: GraphQLQueryConfig): string {
  const selection = serializeSelection(config.selection);
  const variableDefs = serializeVariableDefinitions(config.variables, config.variableTypes);
  const variableRefs = serializeVariableReferences(config.variables);

  return `query ${config.operationName}${variableDefs} { ${config.rootField}${variableRefs} ${selection} }`;
}

function serializeSelection(selection: GraphQLSelectionSet): string {
  const fields = Object.entries(selection)
    .map(([fieldName, value]) => {
      if (value === true) {
        return fieldName;
      }

      const args = serializeArgs(value.args);
      const nested = value.fields ? serializeSelection(value.fields) : '';
      return `${fieldName}${args}${nested ? ` ${nested}` : ''}`;
    })
    .join(' ');

  return `{ ${fields} }`;
}

function serializeArgs(args?: Record<string, GraphQLScalar>): string {
  if (!args || Object.keys(args).length === 0) {
    return '';
  }

  const entries = Object.entries(args).map(([key, value]) => `${key}: ${serializeScalar(value)}`);
  return `(${entries.join(', ')})`;
}

function serializeScalar(value: GraphQLScalar): string {
  if (value === null) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

function serializeVariableDefinitions(
  variables?: Record<string, unknown>,
  variableTypes?: Record<string, string>,
): string {
  if (!variables || Object.keys(variables).length === 0) {
    return '';
  }

  const defs = Object.keys(variables).map((key) => `$${key}: ${variableTypes?.[key] ?? 'String'}`);
  return `(${defs.join(', ')})`;
}

function serializeVariableReferences(variables?: Record<string, unknown>): string {
  if (!variables || Object.keys(variables).length === 0) {
    return '';
  }

  const refs = Object.keys(variables).map((key) => `${key}: $${key}`);
  return `(${refs.join(', ')})`;
}
