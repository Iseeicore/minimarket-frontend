import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../../test/test-utils'
import TiendaImpresora from '../TiendaImpresora'

describe('TiendaImpresora', () => {
  it('renderiza la página de impresora', () => {
    renderWithProviders(<TiendaImpresora />)
    expect(screen.getByText('Como conectar')).toBeInTheDocument()
  })

  it('muestra info técnica', () => {
    renderWithProviders(<TiendaImpresora />)
    expect(screen.getByText(/ESC\/POS 58mm/i)).toBeInTheDocument()
  })

  it('muestra instrucciones de conexión', () => {
    renderWithProviders(<TiendaImpresora />)
    expect(screen.getByText(/Encende la impresora termica/i)).toBeInTheDocument()
  })
})
