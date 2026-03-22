import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('cookie_consent')) {
      setVisible(true)
    }
  }, [])

  function accept() {
    localStorage.setItem('cookie_consent', 'true')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="max-w-4xl mx-auto bg-gray-900 text-white rounded-2xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-2xl">
        <p className="text-sm text-gray-300 flex-1">
          Usamos cookies para melhorar sua experiência e analisar o uso da plataforma, conforme nossa{' '}
          <Link to="/privacidade" className="text-white underline hover:text-gray-200">
            Política de Privacidade
          </Link>
          .
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setVisible(false)}
            className="text-xs text-gray-400 hover:text-white transition"
          >
            Recusar
          </button>
          <button
            onClick={accept}
            className="bg-white text-gray-900 text-xs font-semibold px-5 py-2 rounded-xl hover:bg-gray-100 transition"
          >
            Aceitar cookies
          </button>
        </div>
      </div>
    </div>
  )
}
