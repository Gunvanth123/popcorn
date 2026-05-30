import { useAuth } from '../../context/AuthContext'
import { LogOut, User, Mail, Calendar, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function Settings() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Signed out successfully')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 pb-16">
      {/* Header Navigation */}
      <header className="border-b border-white/5 bg-slate-900/40 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-bold text-sm">Dashboard</span>
          </button>
          <h1 className="font-black text-lg">Settings & Profile</h1>
          <div className="w-20" /> {/* Spacer */}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 mt-10">
        {/* Profile Card */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-8 shadow-xl">
          <div className="flex flex-col items-center text-center">
            {/* Avatar placeholder */}
            <div className="w-24 h-24 rounded-full bg-orange-600/10 border-2 border-orange-500/20 text-orange-500 flex items-center justify-center font-black text-3xl mb-4 shadow-lg shadow-orange-500/5">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <h2 className="text-2xl font-black text-white">{user?.name || 'User'}</h2>
            <p className="text-slate-400 text-sm mt-1">Popcorn Watcher since {new Date(user?.created_at).toLocaleDateString()}</p>
          </div>

          <div className="mt-8 border-t border-white/5 pt-8 space-y-4">
            <div className="flex items-center gap-4 bg-slate-950/40 p-4 rounded-2xl border border-white/5">
              <User className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Name</p>
                <p className="font-semibold text-slate-200 mt-0.5">{user?.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-slate-950/40 p-4 rounded-2xl border border-white/5">
              <Mail className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Email Address</p>
                <p className="font-semibold text-slate-200 mt-0.5">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-slate-950/40 p-4 rounded-2xl border border-white/5">
              <Calendar className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Join Date</p>
                <p className="font-semibold text-slate-200 mt-0.5">{user?.created_at ? new Date(user.created_at).toDateString() : 'N/A'}</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full mt-8 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white font-bold py-4 px-6 rounded-2xl border border-red-500/20 active:scale-[0.98] transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </main>
    </div>
  )
}
