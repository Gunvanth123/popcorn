import { useAuth } from '../../context/AuthContext'
import { LogOut, User, Mail, Calendar, ArrowLeft, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function Settings() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Signed out')
    navigate('/login')
  }

  const initial = user?.name ? user.name[0].toUpperCase() : 'U'
  const joinedDate = user?.created_at ? new Date(user.created_at) : null

  return (
    <div className="min-h-screen bg-midnight text-slate-100 pb-20 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-indigo-600/20 rounded-full blur-[140px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 glass-strong sticky top-0">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-slate-400 hover:text-indigo-300 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-xs uppercase tracking-[0.25em] font-semibold">Back</span>
          </button>
          <h1 className="font-display text-2xl tracking-[0.15em] text-white">PROFILE</h1>
          <div className="w-14" />
        </div>
      </header>

      <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 mt-12">
        {/* Hero profile card */}
        <section className="relative glass-strong rounded-3xl p-8 sm:p-10 overflow-hidden">
          <div className="absolute inset-0 bg-indigo-glow opacity-30 pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row items-center sm:items-end gap-6">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-full blur-md opacity-60" />
              <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-display text-5xl tracking-wider shadow-glow-indigo">
                {initial}
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <p className="text-[10px] uppercase tracking-[0.35em] text-indigo-300/80 mb-2 flex items-center gap-1.5 justify-center sm:justify-start">
                <Sparkles className="w-3 h-3" />
                Popcorn member
              </p>
              <h2 className="font-display text-5xl text-white leading-none">{user?.name || 'User'}</h2>
              {joinedDate && (
                <p className="text-slate-400 text-sm mt-3">
                  Watching since {joinedDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Details */}
        <section className="mt-8">
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-semibold mb-4 px-1">Account details</p>
          <div className="space-y-3">
            <DetailRow icon={User} label="Display name" value={user?.name} />
            <DetailRow icon={Mail} label="Email address" value={user?.email} />
            <DetailRow
              icon={Calendar}
              label="Member since"
              value={joinedDate ? joinedDate.toDateString() : 'N/A'}
            />
          </div>
        </section>

        {/* Sign out */}
        <button
          onClick={handleLogout}
          className="group w-full mt-10 flex items-center justify-center gap-2 bg-white/[0.03] hover:bg-red-500/10 text-slate-300 hover:text-red-300 font-semibold tracking-wide py-4 px-6 rounded-xl border border-white/10 hover:border-red-500/30 active:scale-[0.99] transition-all"
        >
          <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          <span>Sign out</span>
        </button>
      </main>
    </div>
  )
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-4 bg-white/[0.03] hover:bg-white/[0.05] p-5 rounded-2xl border border-white/[0.06] transition-colors">
      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-indigo-300" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-[0.25em]">{label}</p>
        <p className="font-medium text-white mt-1 truncate">{value || '—'}</p>
      </div>
    </div>
  )
}
