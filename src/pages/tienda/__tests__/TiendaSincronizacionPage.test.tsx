import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../../test/test-utils'
import TiendaSincronizacionPage from '../TiendaSincronizacionPage'

describe('TiendaSincronizacionPage', () => {
  it('renderiza el botón de comparar', async () => {
    renderWithProviders(<TiendaSincronizacionPage />)
    await waitFor(() => {
      expect(screen.getByText(/Comparar el día de hoy/i)).toBeInTheDocument()
    })
  })

  it('muestra el link al historial', async () => {
    renderWithProviders(<TiendaSincronizacionPage />)
    await waitFor(() => {
      expect(screen.getByText(/Ver todo el historial/i)).toBeInTheDocument()
    })
  })

  it('muestra sincronizaciones recientes', async () => {
    renderWithProviders(<TiendaSincronizacionPage />)
    await waitFor(() => {
      expect(screen.getByText(/Todo coincide/i)).toBeInTheDocument()
    })
  })
})
