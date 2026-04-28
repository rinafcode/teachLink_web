import type { QueryComplexityReport } from './types';

const FIELD_WEIGHT = 2;
const DEPTH_WEIGHT = 5;
const ALIAS_WEIGHT = 3;
const FRAGMENT_WEIGHT = 4;

export function analyzeQueryComplexity(query: string): QueryComplexityReport {
  const cleaned = query.replace(/#[^\n]*/g, '').replace(/\s+/g, ' ').trim();

  let depth = 0;
  let maxDepth = 0;
  let fields = 0;

  for (const char of cleaned) {
    if (char === '{') {
      depth += 1;
      maxDepth = Math.max(maxDepth, depth);
    } else if (char === '}') {
      depth = Math.max(0, depth - 1);
    }
  }

  const fieldsMatch = cleaned.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b(?=\s*(\(|\{|\s))/g);
  if (fieldsMatch) {
    fields = fieldsMatch.filter((token) => !isGraphQLKeyword(token)).length;
  }

  const aliases = (cleaned.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\s*:/g) ?? []).length;
  const fragments = (cleaned.match(/\bfragment\b|\.\.\./g) ?? []).length;

  const complexity =
    fields * FIELD_WEIGHT +
    maxDepth * DEPTH_WEIGHT +
    aliases * ALIAS_WEIGHT +
    fragments * FRAGMENT_WEIGHT;

  return {
    complexity,
    depth: maxDepth,
    fields,
    aliases,
    fragments,
  };
}

function isGraphQLKeyword(token: string): boolean {
  return ['query', 'mutation', 'subscription', 'fragment', 'on'].includes(token);
}
