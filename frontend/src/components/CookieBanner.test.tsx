import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CookieBanner from './CookieBanner'

describe('CookieBanner', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows banner when no consent stored', () => {
    render(<MemoryRouter><CookieBanner /></MemoryRouter>)
    expect(screen.getByText(/Aceitar cookies/i)).toBeInTheDocument()
  })

  it('hides banner when consent already given', () => {
    localStorage.setItem('cookie_consent', 'true')
    render(<MemoryRouter><CookieBanner /></MemoryRouter>)
    expect(screen.queryByText(/Aceitar cookies/i)).not.toBeInTheDocument()
  })

  it('stores consent and hides banner on accept', () => {
    render(<MemoryRouter><CookieBanner /></MemoryRouter>)
    fireEvent.click(screen.getByText(/Aceitar cookies/i))
    expect(localStorage.getItem('cookie_consent')).toBe('true')
    expect(screen.queryByText(/Aceitar cookies/i)).not.toBeInTheDocument()
  })

  it('hides banner on decline without storing consent', () => {
    render(<MemoryRouter><CookieBanner /></MemoryRouter>)
    fireEvent.click(screen.getByText(/Recusar/i))
    expect(localStorage.getItem('cookie_consent')).toBeNull()
    expect(screen.queryByText(/Aceitar cookies/i)).not.toBeInTheDocument()
  })

  it('links to privacy policy', () => {
    render(<MemoryRouter><CookieBanner /></MemoryRouter>)
    const link = screen.getByText(/Política de Privacidade/i)
    expect(link.closest('a')).toHaveAttribute('href', '/privacidade')
  })
})
