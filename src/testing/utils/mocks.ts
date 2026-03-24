import { vi } from 'vitest'

/** Wallet mock for tipping/connection flows */
export const mockWallet = {
  address: '0xABCDEF1234567890',
  isConnected: true,
  connect: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn().mockResolvedValue(undefined),
  balance: '1.5',
}

export const mockDisconnectedWallet = {
  ...mockWallet,
  address: null,
  isConnected: false,
}

/** Generic async handler that resolves successfully */
export const mockSuccessHandler = vi.fn().mockResolvedValue({ success: true })

/** Generic async handler that rejects */
export const mockErrorHandler = vi.fn().mockRejectedValue(new Error('Something went wrong'))

/** Mock user */
export const mockUser = {
  id: 'user-123',
  name: 'Test User',
  email: 'test@teachlink.com',
  avatar: '/avatar.png',
}

/** Reset all mocks between tests */
export function resetMocks() {
  vi.clearAllMocks()
}