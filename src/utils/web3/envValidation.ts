export function validateStarknetEnv(): { valid: boolean; missing: string[] } {
  const required = ['NEXT_PUBLIC_STARKNET_NETWORK'];
  const missing = required.filter((key) => !process.env[key]);
  return { valid: missing.length === 0, missing };
}

export function getStarknetNetwork(): string {
  return process.env.NEXT_PUBLIC_STARKNET_NETWORK ?? 'testnet';
}
