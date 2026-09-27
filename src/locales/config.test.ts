import type { RegionCode } from './types';

describe('RegionCode uniqueness', () => {
  it('should have no duplicate region codes', () => {
    const codes: RegionCode[] = [
      'US',
      'GB',
      'CA',
      'AU',
      'ES',
      'MX',
      'AR',
      'CO',
      'FR',
      'BE',
      'CH',
      'DE',
      'AT',
      'LI',
      'SA',
      'AE',
      'EG',
      'IL',
      'JP',
      'CN',
      'TW',
      'HK',
      'BR',
      'PT',
      'RU',
      'IT',
      'KR',
    ];

    const unique = new Set(codes);
    expect(unique.size).toBe(codes.length);
  });
});
