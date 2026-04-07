import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../../test/test-utils'
import TiendaHomePage from '../TiendaHomePage'

describe('TiendaHomePage', () => {
  it('renderiza el saludo con el nombre del usuario', () => {
    renderWithProviders(<TiendaHomePage />)
    expect(screen.getByText(/Hola, Maria/i)).toBeInTheDocument()
  })

  it('muestra el monto de ventas del día', async () => {
    renderWithProviders(<TiendaHomePage />)
    await waitFor(() => {
      expect(screen.getByText(/235[.,]50/)).toBeInTheDocument()
    })
  })

  it('muestra el conteo de ventas registradas', async () => {
    renderWithProviders(<TiendaHomePage />)
    await waitFor(() => {
      expect(screen.getByText(/2 ventas registradas/i)).toBeInTheDocument()
    })
  })

  it('muestra el estado de la caja', async () => {
    renderWithProviders(<TiendaHomePage />)
    await waitFor(() => {
      expect(screen.getByText('Abierta')).toBeInTheDocument()
    })
  })

  it('renderiza los botones de acción', () => {
    renderWithProviders(<TiendaHomePage />)
    expect(screen.getByText('Nueva Orden')).toBeInTheDocument()
    expect(screen.getByText('Cuaderno')).toBeInTheDocument()
    expect(screen.getByText('Ver Stock')).toBeInTheDocument()
  })
})
