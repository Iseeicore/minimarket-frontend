import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../../test/test-utils'
import TiendaImpresora from '../TiendaImpresora'

describe('TiendaImpresora', () => {
  it('renderiza la página de impresora', () => {
    renderWithProviders(<TiendaImpresora />)
    expect(screen.getByText('Como conectar')).toBeInTheDocument()
  })

  it('muestra botón de conectar impresora', () => {
    renderWithProviders(<TiendaImpresora />)
    const matches = screen.getAllByText('Conectar Impresora')
    // El botón + el texto en las instrucciones
    expect(matches.length).toBeGreaterThanOrEqual(1)
    const button = matches.find(el => el.closest('button'))
    expect(button).toBeInTheDocument()
  })

  it('muestra info técnica', () => {
    renderWithProviders(<TiendaImpresora />)
    expect(screen.getByText(/ESC\/POS 58mm/i)).toBeInTheDocument()
  })
})
