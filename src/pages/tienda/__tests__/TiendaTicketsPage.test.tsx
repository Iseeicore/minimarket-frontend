import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../test/test-utils'
import TiendaTicketsPage from '../TiendaTicketsPage'

describe('TiendaTicketsPage', () => {
  it('renderiza el header', () => {
    renderWithProviders(<TiendaTicketsPage />)
    expect(screen.getByText('Tickets')).toBeInTheDocument()
  })

  it('muestra el filtro de fecha con "Hoy"', () => {
    renderWithProviders(<TiendaTicketsPage />)
    expect(screen.getByText('Hoy')).toBeInTheDocument()
  })

  it('carga y muestra órdenes del día', async () => {
    renderWithProviders(<TiendaTicketsPage />)
    await waitFor(() => {
      expect(screen.getByText(/#1/)).toBeInTheDocument()
    })
  })

  it('muestra el total de órdenes', async () => {
    renderWithProviders(<TiendaTicketsPage />)
    await waitFor(() => {
      expect(screen.getByText(/1 orden/i)).toBeInTheDocument()
    })
  })

  it('navega al día anterior con el botón ←', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TiendaTicketsPage />)

    // El botón ← (primer ChevronLeft después del header)
    const botones = screen.getAllByRole('button')
    // El segundo botón es el ← del filtro de fecha
    const botonAnterior = botones[1]
    await user.click(botonAnterior)

    // Ya no debería mostrar "Hoy"
    expect(screen.queryByText('Hoy')).not.toBeInTheDocument()
  })

  it('no permite navegar al futuro', () => {
    renderWithProviders(<TiendaTicketsPage />)
    // El botón → (ChevronRight) debería estar deshabilitado en "Hoy"
    const botones = screen.getAllByRole('button')
    const botonSiguiente = botones[2]
    expect(botonSiguiente).toBeDisabled()
  })

  it('abre modal al hacer click en una orden', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TiendaTicketsPage />)

    await waitFor(() => {
      expect(screen.getByText(/#1/)).toBeInTheDocument()
    })

    await user.click(screen.getByText(/#1/))

    await waitFor(() => {
      expect(screen.getByText(/MINIMARKET/)).toBeInTheDocument()
      expect(screen.getByText(/ORDEN #1/)).toBeInTheDocument()
    })
  })
})
