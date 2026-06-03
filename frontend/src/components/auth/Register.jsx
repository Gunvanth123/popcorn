import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Lock, Mail, User, Loader2, ArrowRight, Film } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name || !email || !password) {
      toast.error('Please fill in all fields')
      return
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      await register(name, email, password)
      toast.success('Welcome to Popcorn!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-midnight text-slate-100 relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-[520px] h-[520px] bg-indigo-600/25 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[520px] h-[520px] bg-abyss/70 rounded-full blur-[140px] pointer-events-none" />

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
            Begin your
            <span className="block text-indigo-300">collection.</span>
          </p>
          <p className="mt-6 text-slate-300/80 text-base leading-relaxed font-light">
            Build a watchlist that actually reflects your taste. Discover trending
            films and games. Carry it across every device.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-6 text-xs uppercase tracking-[0.3em] text-slate-400/80">
          <span className="px-2 py-1 border border-indigo-400/20 rounded">Free</span>
          <span className="px-2 py-1 border border-indigo-400/20 rounded">No ads</span>
          <span className="px-2 py-1 border border-indigo-400/20 rounded">Forever</span>
        </div>
      </aside>

      <main className="relative z-10 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-glow-indigo">
              <Film className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-2xl tracking-[0.2em] text-white">POPCORN</span>
          </div>

          <div className="mb-10">
            <p className="text-xs uppercase tracking-[0.35em] text-indigo-300/80 mb-3">Get started</p>
            <h1 className="font-display text-5xl sm:text-6xl text-white leading-none">Create account</h1>
            <p className="text-slate-400 text-sm mt-4">
              Takes thirty seconds. No credit card. No nonsense.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-indigo-200/70 uppercase tracking-[0.3em]">Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-300 transition-colors" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full bg-white/[0.03] border border-white/10 focus:border-indigo-500/60 focus:bg-white/[0.05] rounded-xl pl-12 pr-4 py-4 text-sm text-white placeholder:text-slate-600 outline-none transition-all"
                />
              </div>
            </div>

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
                  placeholder="At least 6 characters"
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
                  <span>Creating account…</span>
                </>
              ) : (
                <>
                  <span>Create account</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-300 font-semibold hover:text-indigo-200 transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
