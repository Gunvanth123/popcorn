import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Lock, Mail, Loader2, ArrowRight, Film } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please enter all fields')
      return
    }

    setLoading(true)
    try {
      await login(email, password)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-midnight text-slate-100 relative overflow-hidden">
      {/* Ambient light */}
      <div className="absolute -top-40 -left-40 w-[520px] h-[520px] bg-indigo-600/25 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[520px] h-[520px] bg-abyss/70 rounded-full blur-[140px] pointer-events-none" />

      {/* Left — Cinematic panel */}
      <aside className="hidden lg:flex relative flex-col justify-between p-12 overflow-hidden starfield">
        <div className="absolute inset-0 bg-indigo-glow opacity-90" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-glow-indigo">
            <Film className="w-5 h-5 text-white" />
          </div>
          <span className="font-display text-2xl tracking-[0.2em] text-white">POPCORN</span>
        </div>

        <div className="relative z-10 max-w-md">
          <p className="font-display text-[64px] leading-[0.95] text-white">
            Your nights in,
            <span className="block text-indigo-300">curated.</span>
          </p>
          <p className="mt-6 text-slate-300/80 text-base leading-relaxed font-light">
            Track films, series, anime and games. Discover what's trending.
            Save what matters. All in one beautifully quiet place.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-6 text-xs uppercase tracking-[0.3em] text-slate-400/80">
          <span className="px-2 py-1 border border-indigo-400/20 rounded">Films</span>
          <span className="px-2 py-1 border border-indigo-400/20 rounded">Series</span>
          <span className="px-2 py-1 border border-indigo-400/20 rounded">Games</span>
        </div>
      </aside>

      {/* Right — Form */}
      <main className="relative z-10 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-glow-indigo">
              <Film className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-2xl tracking-[0.2em] text-white">POPCORN</span>
          </div>

          <div className="mb-10">
            <p className="text-xs uppercase tracking-[0.35em] text-indigo-300/80 mb-3">Welcome back</p>
            <h1 className="font-display text-5xl sm:text-6xl text-white leading-none">Sign in</h1>
            <p className="text-slate-400 text-sm mt-4">
              Pick up where you left off. Your watchlist is waiting.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-indigo-200/70 uppercase tracking-[0.3em]">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-300 transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-white/[0.03] border border-white/10 focus:border-indigo-500/60 focus:bg-white/[0.05] rounded-xl pl-12 pr-4 py-4 text-sm text-white placeholder:text-slate-600 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-indigo-200/70 uppercase tracking-[0.3em]">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-300 transition-colors" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/[0.03] border border-white/10 focus:border-indigo-500/60 focus:bg-white/[0.05] rounded-xl pl-12 pr-4 py-4 text-sm text-white placeholder:text-slate-600 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group w-full mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:from-white/5 disabled:to-white/5 disabled:text-slate-500 text-white font-semibold tracking-wide py-4 px-6 rounded-xl shadow-glow-indigo active:scale-[0.98] transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center text-sm text-slate-400">
            New here?{' '}
            <Link to="/register" className="text-indigo-300 font-semibold hover:text-indigo-200 transition-colors">
              Create an account
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
