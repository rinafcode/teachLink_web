import { describe, expect, it } from 'vitest';
import nextConfig from './next.config';

describe('next.config modularizeImports', () => {
  it('adds a lucide-react modularization rule for tree-shaken icon imports', () => {
    const modularizeImports = nextConfig.modularizeImports as Record<string, unknown>;

    expect(modularizeImports).toBeDefined();
    expect(modularizeImports.lodash).toEqual({ transform: 'lodash/{{member}}' });
    expect(modularizeImports['lucide-react']).toEqual({
      transform: 'lucide-react/dist/esm/icons/{{member}}',
    });
  });
});
