import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'
import api from '../lib/axios'
import { Store, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const { setAuth }             = useAuthStore()
  const navigate                = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/auth/login', { email, password })
      setAuth(data.access_token, data.usuario)
      navigate('/dashboard')
    } catch {
      setError('Email o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-tin-pale flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-tin/20 p-8 w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center gap-2 mb-7">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Store size={20} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">MiniMarket</h1>
        </div>

        <p className="text-sm text-tin-dark mb-6">Ingresá a tu cuenta para continuar.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full border border-tin/30 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              required
              autoComplete="email"
            />
          </div>

          {/* Contraseña + ojo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-tin/30 rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-tin hover:text-tin-dark transition-colors"
                tabIndex={-1}
                aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-dark text-white rounded-xl py-2.5 text-sm font-semibold transition-all duration-150 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 min-h-[2.75rem]"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        {/* Link al registro */}
        <p className="text-sm text-center text-tin-dark mt-6">
          ¿No tenés cuenta?{' '}
          <Link
            to="/register"
            className="text-primary-dark font-semibold hover:underline transition-colors"
          >
            Crear cuenta
          </Link>
        </p>
      </div>
    </div>
  )
}
