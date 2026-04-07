import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../test/test-utils'
import TiendaVentasPage from '../TiendaVentasPage'

describe('TiendaVentasPage', () => {
  it('muestra el header de nueva orden', async () => {
    renderWithProviders(<TiendaVentasPage />)
    await waitFor(() => {
      expect(screen.getByText(/Nueva Orden/i)).toBeInTheDocument()
    })
  })

  it('muestra el buscador de productos', async () => {
    renderWithProviders(<TiendaVentasPage />)
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Buscar producto/i)).toBeInTheDocument()
    })
  })

  it('muestra el botón de confirmar deshabilitado sin items', async () => {
    renderWithProviders(<TiendaVentasPage />)
    await waitFor(() => {
      const btn = screen.getByText(/Confirmar e Imprimir Ticket/i)
      expect(btn.closest('button')).toBeDisabled()
    })
  })

  it('muestra el botón de "Listado de tickets"', async () => {
    renderWithProviders(<TiendaVentasPage />)
    await waitFor(() => {
      expect(screen.getByText(/Listado de tickets/i)).toBeInTheDocument()
    })
  })

  it('busca productos al escribir en el buscador', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TiendaVentasPage />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Buscar producto/i)).toBeInTheDocument()
    })

    await user.type(screen.getByPlaceholderText(/Buscar producto/i), 'leche')

    await waitFor(() => {
      expect(screen.getByText(/Leche Gloria/i)).toBeInTheDocument()
    })
  })
})
