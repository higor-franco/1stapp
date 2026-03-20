import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import DashboardPage from './DashboardPage'

const mockUser = {
  id: 'user-1',
  email: 'joao@example.com',
  name: 'João Silva',
  plan: 'free',
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('DashboardPage', () => {
  it('exibe saudação com o primeiro nome do usuário', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ site: null }),
    } as Response)

    render(<DashboardPage user={mockUser} onLogout={vi.fn()} />)
    expect(screen.getByText(/Olá, João/i)).toBeInTheDocument()
  })

  it('exibe CTA para criar site quando não há site', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ site: null }),
    } as Response)

    render(<DashboardPage user={mockUser} onLogout={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText(/Crie seu site agora/i)).toBeInTheDocument()
    })
  })

  it('exibe banner de upgrade para plano free', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ site: null }),
    } as Response)

    render(<DashboardPage user={mockUser} onLogout={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText(/Faça upgrade para o Plano Start/i)).toBeInTheDocument()
    })
  })

  it('não exibe banner de upgrade para plano start', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ site: null }),
    } as Response)

    render(<DashboardPage user={{ ...mockUser, plan: 'start' }} onLogout={vi.fn()} />)

    await waitFor(() => {
      expect(screen.queryByText(/Faça upgrade para o Plano Start/i)).not.toBeInTheDocument()
    })
  })

  it('exibe card do site quando existe site', async () => {
    const mockSite = {
      id: 'site-1',
      slug: 'joao-silva',
      business_name: 'Barbearia do João',
      business_description: 'Barbearia premium',
      color_palette: 'azul',
      html_content: '<html><body>Site</body></html>',
      published: false,
      generation_count: 2,
      url: '/site/joao-silva',
    }

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ site: mockSite }),
    } as Response)

    render(<DashboardPage user={mockUser} onLogout={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Barbearia do João')).toBeInTheDocument()
    })
    expect(screen.getByText(/2 gerações/i)).toBeInTheDocument()
  })

  it('exibe painel SEO quando site está na seção Meu Site', async () => {
    const mockSite = {
      id: 'site-1',
      slug: 'joao-silva',
      business_name: 'Barbearia do João',
      business_description: 'Barbearia premium',
      color_palette: 'azul',
      html_content: '<html><head></head><body>Site</body></html>',
      published: true,
      generation_count: 1,
      url: '/site/joao-silva',
    }

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ site: mockSite }),
    } as Response)

    render(<DashboardPage user={mockUser} onLogout={vi.fn()} />)

    // Wait for "Meu Site" nav button to appear (after site loads) then click
    const meuSiteBtn = await screen.findByRole('button', { name: /Meu Site/i })
    fireEvent.click(meuSiteBtn)

    await waitFor(() => {
      expect(screen.getByText(/SEO e Descoberta/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/Meta tags SEO/i)).toBeInTheDocument()
    expect(screen.getByText('Sitemap.xml')).toBeInTheDocument()
    expect(screen.getByText(/JSON-LD Schema/i)).toBeInTheDocument()
  })

  it('exibe sidebar com itens de navegação', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ site: null }),
    } as Response)

    render(<DashboardPage user={mockUser} onLogout={vi.fn()} />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Minha Logo')).toBeInTheDocument()
  })
})
