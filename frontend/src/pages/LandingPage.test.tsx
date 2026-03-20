import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LandingPage from './LandingPage'

describe('LandingPage', () => {
  it('exibe o nome da plataforma', () => {
    render(
      <MemoryRouter>
        <LandingPage user={null} />
      </MemoryRouter>
    )
    expect(screen.getAllByText(/Locaweb Start/i).length).toBeGreaterThan(0)
  })

  it('exibe botão de criar site grátis para usuário não logado', () => {
    render(
      <MemoryRouter>
        <LandingPage user={null} />
      </MemoryRouter>
    )
    expect(screen.getByText(/Criar meu site grátis/i)).toBeInTheDocument()
  })

  it('exibe link para o painel quando usuário está logado', () => {
    render(
      <MemoryRouter>
        <LandingPage user={{ name: 'João', plan: 'free' }} />
      </MemoryRouter>
    )
    expect(screen.getByText(/Meu painel/i)).toBeInTheDocument()
  })

  it('exibe os dois planos de preço', () => {
    render(
      <MemoryRouter>
        <LandingPage user={null} />
      </MemoryRouter>
    )
    expect(screen.getByText(/R\$ 0/)).toBeInTheDocument()
    expect(screen.getByText(/R\$ 49/)).toBeInTheDocument()
  })
})
