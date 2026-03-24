import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

/**
 * Wrap with all your app providers here (Redux store, Context, etc.)
 * Add/remove providers to match your actual app setup.
 */
function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Example: <StoreProvider><ThemeProvider>{children}</ThemeProvider></StoreProvider> */}
      {children}
    </>
  )
}

function customRender(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: AllProviders, ...options }),
  }
}

export * from '@testing-library/react'
export { customRender as render }