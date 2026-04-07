import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../test/test-utils'
import TiendaStockPage from '../TiendaStockPage'

describe('TiendaStockPage', () => {
  it('muestra el header de stock', async () => {
    renderWithProviders(<TiendaStockPage />)
    await waitFor(() => {
      expect(screen.getByText('Stock')).toBeInTheDocument()
    })
  })

  it('renderiza productos del stock dual', async () => {
    renderWithProviders(<TiendaStockPage />)
    await waitFor(() => {
      expect(screen.getByText(/Leche Gloria/)).toBeInTheDocument()
      expect(screen.getByText(/Papas Lays/)).toBeInTheDocument()
    })
  })

  it('muestra cantidades de almacen y tienda', async () => {
    renderWithProviders(<TiendaStockPage />)
    await waitFor(() => {
      expect(screen.getByText('50')).toBeInTheDocument() // almacen Leche
      expect(screen.getByText('10')).toBeInTheDocument() // tienda Leche
    })
  })

  it('muestra badge de stock bajo cuando corresponde', async () => {
    renderWithProviders(<TiendaStockPage />)
    await waitFor(() => {
      expect(screen.getByText(/Sin stock en almacen/i)).toBeInTheDocument()
    })
  })

  it('filtra productos por búsqueda', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TiendaStockPage />)

    await waitFor(() => {
      expect(screen.getByText(/Leche Gloria/)).toBeInTheDocument()
    })

    await user.type(screen.getByPlaceholderText(/Buscar producto/i), 'papas')

    expect(screen.queryByText(/Leche Gloria/)).not.toBeInTheDocument()
    expect(screen.getByText(/Papas Lays/)).toBeInTheDocument()
  })

  it('muestra el conteo de productos filtrados', async () => {
    renderWithProviders(<TiendaStockPage />)
    await waitFor(() => {
      expect(screen.getByText(/2 productos disponibles/i)).toBeInTheDocument()
    })
  })
})
