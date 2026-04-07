import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../test/test-utils'
import TiendaCuadernoPage from '../TiendaCuadernoPage'

describe('TiendaCuadernoPage', () => {
  it('renderiza el cuaderno con título', async () => {
    renderWithProviders(<TiendaCuadernoPage />)
    await waitFor(() => {
      expect(screen.getByText('Mi Cuaderno')).toBeInTheDocument()
    })
  })

  it('muestra el botón "Ver otro día"', async () => {
    renderWithProviders(<TiendaCuadernoPage />)
    await waitFor(() => {
      expect(screen.getByText(/Ver otro día/i)).toBeInTheDocument()
    })
  })

  it('muestra el botón "Filtrar"', async () => {
    renderWithProviders(<TiendaCuadernoPage />)
    await waitFor(() => {
      expect(screen.getByText('Filtrar')).toBeInTheDocument()
    })
  })

  it('muestra las columnas del cuaderno', async () => {
    renderWithProviders(<TiendaCuadernoPage />)
    await waitFor(() => {
      expect(screen.getByText('Producto')).toBeInTheDocument()
      expect(screen.getByText('Cant.')).toBeInTheDocument()
      expect(screen.getByText('Hora')).toBeInTheDocument()
    })
  })

  it('navega a la estantería al hacer click en "Ver otro día"', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TiendaCuadernoPage />)

    await waitFor(() => {
      expect(screen.getByText(/Ver otro día/i)).toBeInTheDocument()
    })

    await user.click(screen.getByText(/Ver otro día/i))

    await waitFor(() => {
      expect(screen.getByText('Mis cuadernos')).toBeInTheDocument()
    })
  })
})
