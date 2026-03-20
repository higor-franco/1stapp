import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CreateSitePage from './CreateSitePage'

const mockSite = {
  id: 'abc',
  slug: 'meu-negocio',
  business_name: 'Meu Negócio',
  business_description: 'Descrição do negócio',
  color_palette: 'azul',
  html_content: '<html><body>Site</body></html>',
  published: false,
  generation_count: 1,
  url: '/site/meu-negocio',
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('CreateSitePage', () => {
  it('exibe o formulário inicial', () => {
    render(<CreateSitePage onSiteCreated={vi.fn()} />)
    expect(screen.getByText(/Crie seu site com IA/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Clínica Bella Pele/i)).toBeInTheDocument()
  })

  it('desabilita o botão gerar se campos não preenchidos', () => {
    render(<CreateSitePage onSiteCreated={vi.fn()} />)
    const btn = screen.getByRole('button', { name: /Gerar meu site com IA/i })
    expect(btn).toBeDisabled()
  })

  it('habilita o botão gerar quando campos estão preenchidos', () => {
    render(<CreateSitePage onSiteCreated={vi.fn()} />)
    fireEvent.change(screen.getByPlaceholderText(/Clínica Bella Pele/i), {
      target: { value: 'Meu Negócio' },
    })
    fireEvent.change(screen.getByPlaceholderText(/Sou fotógrafa/i), {
      target: { value: 'Descrição bem detalhada do meu negócio aqui mesmo' },
    })
    const btn = screen.getByRole('button', { name: /Gerar meu site com IA/i })
    expect(btn).not.toBeDisabled()
  })

  it('mostra tela de geração ao clicar em gerar', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ site: mockSite }),
    } as Response)

    render(<CreateSitePage onSiteCreated={vi.fn()} />)
    fireEvent.change(screen.getByPlaceholderText(/Clínica Bella Pele/i), {
      target: { value: 'Meu Negócio' },
    })
    fireEvent.change(screen.getByPlaceholderText(/Sou fotógrafa/i), {
      target: { value: 'Descrição bem detalhada do meu negócio aqui mesmo' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Gerar meu site com IA/i }))

    expect(screen.getByText(/Gerando seu site/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText(/Seu site está pronto/i)).toBeInTheDocument()
    })

    expect(fetchSpy).toHaveBeenCalledWith('/api/sites/generate', expect.objectContaining({ method: 'POST' }))
  })

  it('exibe erro quando a API retorna falha', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Erro ao gerar site' }),
    } as Response)

    render(<CreateSitePage onSiteCreated={vi.fn()} />)
    fireEvent.change(screen.getByPlaceholderText(/Clínica Bella Pele/i), {
      target: { value: 'Meu Negócio' },
    })
    fireEvent.change(screen.getByPlaceholderText(/Sou fotógrafa/i), {
      target: { value: 'Descrição bem detalhada do meu negócio aqui mesmo' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Gerar meu site com IA/i }))

    await waitFor(() => {
      expect(screen.getByText(/Erro ao gerar site/i)).toBeInTheDocument()
    })
  })

  it('chama onSiteCreated ao publicar', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ site: mockSite }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ site: { ...mockSite, published: true } }),
      } as Response)

    const onSiteCreated = vi.fn()
    render(<CreateSitePage onSiteCreated={onSiteCreated} />)

    fireEvent.change(screen.getByPlaceholderText(/Clínica Bella Pele/i), {
      target: { value: 'Meu Negócio' },
    })
    fireEvent.change(screen.getByPlaceholderText(/Sou fotógrafa/i), {
      target: { value: 'Descrição bem detalhada do meu negócio aqui mesmo' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Gerar meu site com IA/i }))

    await waitFor(() => screen.getByText(/Publicar site/i))
    fireEvent.click(screen.getByRole('button', { name: /Publicar site/i }))

    await waitFor(() => {
      expect(onSiteCreated).toHaveBeenCalledWith(expect.objectContaining({ published: true }))
    })
  })
})
