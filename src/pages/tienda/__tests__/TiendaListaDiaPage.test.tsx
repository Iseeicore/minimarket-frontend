import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../../test/test-utils'
import TiendaListaDiaPage from '../TiendaListaDiaPage'

describe('TiendaListaDiaPage', () => {
  it('renderiza el header "Lista del día"', async () => {
    renderWithProviders(<TiendaListaDiaPage />)
    await waitFor(() => {
      expect(screen.getByText(/Lista del día/i)).toBeInTheDocument()
    })
  })

  it('muestra las cards de resumen', async () => {
    renderWithProviders(<TiendaListaDiaPage />)
    await waitFor(() => {
      expect(screen.getByText(/Ítems hoy/i)).toBeInTheDocument()
      expect(screen.getByText(/Diferencias/i)).toBeInTheDocument()
    })
  })

  it('muestra las columnas de la tabla comparativa', async () => {
    renderWithProviders(<TiendaListaDiaPage />)
    await waitFor(() => {
      expect(screen.getByText('Producto')).toBeInTheDocument()
      expect(screen.getByText('Tienda')).toBeInTheDocument()
      expect(screen.getByText('Almacén')).toBeInTheDocument()
    })
  })
})
