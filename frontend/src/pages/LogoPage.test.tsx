import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LogoPage from './LogoPage'

const freeUser = { id: '1', email: 'a@a.com', name: 'Ana', plan: 'free' }
const startUser = { id: '2', email: 'b@b.com', name: 'Bruno', plan: 'start' }

const mockLogo = {
  id: 'logo-1',
  svgs: [
    '<svg viewBox="0 0 300 100" xmlns="http://www.w3.org/2000/svg"><text x="10" y="50">Logo 1</text></svg>',
    '<svg viewBox="0 0 300 100" xmlns="http://www.w3.org/2000/svg"><text x="10" y="50">Logo 2</text></svg>',
    '<svg viewBox="0 0 300 100" xmlns="http://www.w3.org/2000/svg"><text x="10" y="50">Logo 3</text></svg>',
  ],
  selected_index: 0,
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('LogoPage', () => {
  it('exibe upgrade wall para usuário free', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ logo: null }),
    } as Response)

    render(<LogoPage user={freeUser} />)
    expect(screen.getByText(/Logo com IA — Plano Start/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Fazer upgrade/i })).toBeInTheDocument()
  })

  it('exibe estado vazio para usuário start sem logo', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ logo: null, site: null }),
    } as Response)

    render(<LogoPage user={startUser} />)

    await waitFor(() => {
      expect(screen.getByText(/Crie sua logo com IA/i)).toBeInTheDocument()
    })
  })

  it('exibe 3 opções de logo quando existem logos', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ logo: mockLogo, site: { business_name: 'Teste', business_description: 'Desc' } }),
    } as Response)

    render(<LogoPage user={startUser} />)

    await waitFor(() => {
      expect(screen.getByText('Opção 1 ✓')).toBeInTheDocument()
      expect(screen.getByText('Opção 2')).toBeInTheDocument()
      expect(screen.getByText('Opção 3')).toBeInTheDocument()
    })
  })

  it('exibe barra de download com logo selecionada', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ logo: mockLogo, site: { business_name: 'Teste', business_description: 'Desc' } }),
    } as Response)

    render(<LogoPage user={startUser} />)

    await waitFor(() => {
      expect(screen.getByText(/Logo 1 selecionada/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Baixar SVG/i })).toBeInTheDocument()
    })
  })

  it('chama /api/logos/generate ao clicar em gerar', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      // GET logos/me
      .mockResolvedValueOnce({ ok: true, json: async () => ({ logo: null }) } as Response)
      // GET sites/me
      .mockResolvedValueOnce({ ok: true, json: async () => ({ site: { business_name: 'Teste', business_description: 'Uma descrição de negócio' } }) } as Response)
      // POST generate
      .mockResolvedValueOnce({ ok: true, json: async () => ({ logo: mockLogo }) } as Response)

    render(<LogoPage user={startUser} />)

    await waitFor(() => screen.getByRole('button', { name: /Gerar minha logo/i }))
    fireEvent.click(screen.getByRole('button', { name: /Gerar minha logo/i }))

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('/api/logos/generate', expect.objectContaining({ method: 'POST' }))
    })
  })

  it('exibe erro quando geração falha', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: async () => ({ logo: null }) } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ site: { business_name: 'Teste', business_description: 'Desc' } }) } as Response)
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'CLAUDE_API_KEY não configurado' }) } as Response)

    render(<LogoPage user={startUser} />)

    await waitFor(() => screen.getByRole('button', { name: /Gerar minha logo/i }))
    fireEvent.click(screen.getByRole('button', { name: /Gerar minha logo/i }))

    await waitFor(() => {
      expect(screen.getByText(/CLAUDE_API_KEY não configurado/i)).toBeInTheDocument()
    })
  })
})
