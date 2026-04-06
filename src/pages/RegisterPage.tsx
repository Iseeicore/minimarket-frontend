import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'
import { sileo } from 'sileo'
import api from '../lib/axios'
import { Store, Eye, EyeOff, Loader2, User, Building2, ChevronRight, ChevronLeft } from 'lucide-react'

// ── Tipos del formulario ───────────────────────────────────────
interface FormData {
  // Sección 1 — cuenta del usuario
  nombre:            string
  email:             string
  password:          string
  // Sección 2 — datos de la empresa
  nombreEmpresa:     string
  ruc:               string
  direccionEmpresa:  string
  telefonoEmpresa:   string
}

const INITIAL: FormData = {
  nombre:           '',
  email:            '',
  password:         '',
  nombreEmpresa:    '',
  ruc:              '',
  direccionEmpresa: '',
  telefonoEmpresa:  '',
}

// ── Indicador de pasos ─────────────────────────────────────────
function StepIndicator({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center gap-2 mb-7">
      {/* Paso 1 */}
      <div className={`flex items-center gap-1.5 ${step === 1 ? 'text-primary-dark' : 'text-tin'}`}>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-200 ${
          step === 1 ? 'bg-primary text-white' : 'bg-primary-pale text-primary-dark'
        }`}>
          {step > 1 ? '✓' : '1'}
        </div>
        <span className="text-xs font-medium hidden sm:inline">Tu cuenta</span>
      </div>

      {/* Línea */}
      <div className={`flex-1 h-0.5 rounded-full transition-colors duration-300 ${step === 2 ? 'bg-primary' : 'bg-tin/30'}`} />

      {/* Paso 2 */}
      <div className={`flex items-center gap-1.5 ${step === 2 ? 'text-primary-dark' : 'text-tin'}`}>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-200 ${
          step === 2 ? 'bg-primary text-white' : 'bg-tin-pale text-tin'
        }`}>
          2
        </div>
        <span className="text-xs font-medium hidden sm:inline">Tu empresa</span>
      </div>
    </div>
  )
}

// ── Input reutilizable ─────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  optional?: boolean
  suffix?: React.ReactNode
}

function Field({ label, optional, suffix, className, ...props }: InputProps) {
  return (
    <div>
      <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
        {label}
        {optional && <span className="text-xs text-tin font-normal">(opcional)</span>}
      </label>
      <div className="relative">
        <input
          {...props}
          className={`w-full border border-tin/30 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors ${suffix ? 'pr-10' : ''} ${className ?? ''}`}
        />
        {suffix && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</div>
        )}
      </div>
    </div>
  )
}

// ── Página ─────────────────────────────────────────────────────
export default function RegisterPage() {
  const [step, setStep]         = useState<1 | 2>(1)
  const [form, setForm]         = useState<FormData>(INITIAL)
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const { setAuth }             = useAuthStore()
  const navigate                = useNavigate()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('')
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  // ── Validar paso 1 antes de avanzar ─────────────────────────
  function handleNextStep(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre.trim() || !form.email.trim() || form.password.length < 6) return
    setError('')
    setStep(2)
  }

  // ── Envío final ──────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombreEmpresa.trim()) {
      setError('El nombre de la empresa es requerido')
      return
    }
    setLoading(true)
    setError('')

    try {
      const { data } = await api.post('/auth/register', {
        nombre:           form.nombre.trim(),
        email:            form.email.trim(),
        password:         form.password,
        nombreEmpresa:    form.nombreEmpresa.trim(),
        ruc:              form.ruc.trim()              || undefined,
        direccionEmpresa: form.direccionEmpresa.trim() || undefined,
        telefonoEmpresa:  form.telefonoEmpresa.trim()  || undefined,
      })

      setAuth(data.access_token, data.usuario)
      sileo.success('¡Bienvenido! Tu empresa quedó registrada')
      navigate('/dashboard')

    } catch (err: any) {
      const msg: string = err?.response?.data?.message ?? ''
      if (msg.toLowerCase().includes('email') || msg.toLowerCase().includes('existe')) {
        // El email ya está tomado → volver al paso 1
        setStep(1)
        setError('Ese email ya está registrado. Usá otro o iniciá sesión.')
      } else if (msg.toLowerCase().includes('ruc')) {
        setError('El RUC ingresado ya existe en el sistema.')
      } else {
        setError('No se pudo crear la cuenta. Intentá de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  const eyeToggle = (
    <button
      type="button"
      onClick={() => setShowPass(v => !v)}
      tabIndex={-1}
      aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      className="p-0.5 text-tin hover:text-tin-dark transition-colors"
    >
      {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
    </button>
  )

  return (
    <div className="min-h-screen bg-tin-pale flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-tin/20 p-7 w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <Store size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">MiniMarket</h1>
            <p className="text-xs text-tin-dark">Registro de cuenta</p>
          </div>
        </div>

        {/* Stepper */}
        <StepIndicator step={step} />

        {/* ── Paso 1 — Tu cuenta ── */}
        {step === 1 && (
          <form onSubmit={handleNextStep} className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <User size={15} className="text-primary-dark" />
              <p className="text-sm font-semibold text-gray-800">Tu cuenta</p>
            </div>

            <Field
              label="Nombre completo"
              name="nombre"
              type="text"
              value={form.nombre}
              onChange={handleChange}
              placeholder="Juan Pérez"
              autoComplete="name"
              required
            />
            <Field
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="tu@email.com"
              autoComplete="email"
              required
            />
            <Field
              label="Contraseña"
              name="password"
              type={showPass ? 'text' : 'password'}
              value={form.password}
              onChange={handleChange}
              placeholder="Mínimo 6 caracteres"
              minLength={6}
              autoComplete="new-password"
              required
              suffix={eyeToggle}
            />

            {error && (
              <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary-dark text-white rounded-xl py-2.5 text-sm font-semibold transition-all duration-150 active:scale-95 flex items-center justify-center gap-2 min-h-[2.75rem]"
            >
              Siguiente <ChevronRight size={15} />
            </button>
          </form>
        )}

        {/* ── Paso 2 — Tu empresa ── */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Building2 size={15} className="text-primary-dark" />
              <p className="text-sm font-semibold text-gray-800">Tu empresa</p>
            </div>

            <Field
              label="Nombre de la empresa"
              name="nombreEmpresa"
              type="text"
              value={form.nombreEmpresa}
              onChange={handleChange}
              placeholder="Mi MiniMarket SRL"
              autoComplete="organization"
              required
            />
            <Field
              label="RUC"
              optional
              name="ruc"
              type="text"
              value={form.ruc}
              onChange={handleChange}
              placeholder="20123456789"
              maxLength={11}
              inputMode="numeric"
            />
            <Field
              label="Dirección"
              optional
              name="direccionEmpresa"
              type="text"
              value={form.direccionEmpresa}
              onChange={handleChange}
              placeholder="Av. Principal 123, Lima"
              autoComplete="street-address"
            />
            <Field
              label="Teléfono"
              optional
              name="telefonoEmpresa"
              type="tel"
              value={form.telefonoEmpresa}
              onChange={handleChange}
              placeholder="01 234 5678"
              autoComplete="tel"
            />

            {error && (
              <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setStep(1); setError('') }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-tin/30 text-sm font-medium text-gray-700 hover:bg-tin-pale transition-colors active:scale-95 duration-150"
              >
                <ChevronLeft size={15} /> Volver
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary hover:bg-primary-dark text-white rounded-xl py-2.5 text-sm font-semibold transition-all duration-150 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 min-h-[2.75rem]"
              >
                {loading && <Loader2 size={15} className="animate-spin" />}
                {loading ? 'Creando cuenta...' : 'Crear cuenta'}
              </button>
            </div>
          </form>
        )}

        {/* Link al login */}
        <p className="text-sm text-center text-tin-dark mt-6">
          ¿Ya tenés cuenta?{' '}
          <Link
            to="/login"
            className="text-primary-dark font-semibold hover:underline transition-colors"
          >
            Ingresar
          </Link>
        </p>
      </div>
    </div>
  )
}
