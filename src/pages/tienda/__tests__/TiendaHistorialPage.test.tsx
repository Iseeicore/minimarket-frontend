import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../../test/test-utils'
import TiendaHistorialPage from '../TiendaHistorialPage'

describe('TiendaHistorialPage', () => {
  it('renderiza el header "Historial"', async () => {
    renderWithProviders(<TiendaHistorialPage />)
    await waitFor(() => {
      expect(screen.getByText('Historial')).toBeInTheDocument()
    })
  })

  it('muestra el total de registros', async () => {
    renderWithProviders(<TiendaHistorialPage />)
    await waitFor(() => {
      expect(screen.getByText(/1 registros/i)).toBeInTheDocument()
    })
  })

  it('renderiza las sincronizaciones en la lista', async () => {
    renderWithProviders(<TiendaHistorialPage />)
    await waitFor(() => {
      expect(screen.getByText(/Completada/i)).toBeInTheDocument()
    })
  })
})
