import type { ReactElement } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'

// Usuario mock para todas las pruebas de tienda
const MOCK_USER = {
  id: 1,
  nombre: 'Maria Tienda',
  email: 'maria@test.com',
  rol: 'JEFE_VENTA' as const,
  almacenId: 1,
}

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
}

interface WrapperOptions {
  route?: string
}

export function renderWithProviders(
  ui: ReactElement,
  { route = '/', ...renderOptions }: WrapperOptions & RenderOptions = {},
) {
  // Setear auth store antes del render
  useAuthStore.setState({ usuario: MOCK_USER, token: 'fake-token' })

  const queryClient = createTestQueryClient()

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>
          {children}
        </MemoryRouter>
      </QueryClientProvider>
    )
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  }
}

export { MOCK_USER }
