import { useState, useEffect, useRef } from 'react'
import { gamesApi, rawgApi } from '../../api/client'
import {
  Plus, Trash2, Edit3, Loader2, Search, X,
  ChevronRight, ChevronLeft, Star, Check, Gamepad2,
  Bookmark, Trophy, Sparkles, Globe, Filter,
  Monitor, Smartphone, Zap
} from 'lucide-react'
import toast from 'react-hot-toast'
import LazyRow from './LazyRow'

/* ─── constants ────────────────────────────────────────────── */
const GAME_GENRES = [
  'Action', 'Adventure', 'RPG', 'Strategy', 'Sports', 'Racing',
  'Shooter', 'Puzzle', 'Simulation', 'Horror', 'Fighting', 'Platformer',
  'Stealth', 'Survival', 'MMO', 'Visual Novel', 'Indie'
]

const PLATFORMS = [
  'PC', 'PlayStation 5', 'PlayStation 4', 'Xbox Series X',
  'Xbox One', 'Nintendo Switch', 'iOS', 'Android', 'Mac'
]

const GAME_TAGS = [
  'Mind-blowing', 'Addictive', 'Masterpiece', 'Must-play',
  'Hilarious', 'Challenging', 'Emotional', 'Relaxing'
]

const getRatingLabel = (val) => {
  if (val >= 4.9) return '🏆 Legendary!'
  if (val >= 3.9) return '⭐ Great'
  if (val >= 3.0) return '👍 Good'
  if (val >= 2.0) return '🤷 Okay'
  return '😐 Meh'
}

/* ─── GameRating (controller icons) ────────────────────────── */
const GameRating = ({ rating }) => {
  const pips = [1, 2, 3, 4, 5]
  return (
    <div className="flex gap-1 items-center">
      {pips.map((i) => {
        const fill = Math.max(0, Math.min(1, rating - (i - 1)))
        return (
          <div key={i} className="relative">
            <Gamepad2 className="w-4 h-4 text-slate-700 opacity-30" />
            <div
              className="absolute inset-0 overflow-hidden text-violet-400"
              style={{ width: `${fill * 100}%` }}
            >
              <Gamepad2 className="w-4 h-4 fill-violet-400" />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ─── GameSlider ────────────────────────────────────────────── */
const GameSlider = ({ value, onChange }) => {
  const containerRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)

  const updateValue = (clientX) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left))
    const pct = x / rect.width
    const raw = 1.0 + pct * 4.0
    onChange(Math.max(1.0, Math.min(5.0, Math.round(raw * 10) / 10)))
  }

  const handleMouseDown = (e) => { setIsDragging(true); updateValue(e.clientX) }
  const handleTouchStart = (e) => { setIsDragging(true); if (e.touches?.[0]) updateValue(e.touches[0].clientX) }

  useEffect(() => {
    const onMove = (e) => { if (isDragging) updateValue(e.clientX) }
    const onTouchMove = (e) => { if (isDragging && e.touches?.[0]) updateValue(e.touches[0].clientX) }
    const onUp = () => setIsDragging(false)
    if (isDragging) {
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
      window.addEventListener('touchmove', onTouchMove)
      window.addEventListener('touchend', onUp)
    }
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onUp)
    }
  }, [isDragging])

  const pct = ((value - 1) / 4) * 100
  return (
    <div className="space-y-2 mt-4 px-2 select-none">
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className="relative w-full h-10 flex items-center cursor-pointer touch-none"
      >
        <div className="absolute left-0 right-0 h-4 rounded-full bg-gradient-to-r from-indigo-900 via-violet-700 to-green-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]" />
        {[1, 2, 3, 4, 5].map((num) => {
          const tp = ((num - 1) / 4) * 100
          const active = value >= num
          return (
            <div key={num} className="absolute -translate-x-1/2 flex flex-col items-center gap-1.5 z-10" style={{ left: `${tp}%` }}>
              <div className={`p-1.5 rounded-full transition-all duration-300 ${active ? 'text-white' : 'text-slate-500'}`}>
                <Gamepad2 className={`w-3.5 h-3.5 ${active ? 'fill-white/10' : ''}`} />
              </div>
              <span className={`text-[10px] font-black tracking-tight ${active ? 'text-white' : 'text-slate-500'}`}>{num}</span>
            </div>
          )
        })}
        <div
          className="absolute -translate-x-1/2 w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 via-purple-500 to-green-500 border-2 border-white text-white flex items-center justify-center shadow-[0_0_22px_rgba(139,92,246,0.95),_0_4px_12px_rgba(0,0,0,0.5)] z-20 cursor-grab active:cursor-grabbing transition-transform duration-100"
          style={{ left: `${pct}%`, transform: `translateX(-50%) scale(${isDragging ? 1.15 : 1})` }}
        >
          <Gamepad2 className={`w-5 h-5 fill-white/10 ${isDragging ? 'animate-bounce' : ''}`} />
        </div>
      </div>
    </div>
  )
}

/* ─── Main GamesDashboard ─────────────────────────────────── */
export default function GamesDashboard() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('discover')

  // Discover / RAWG
  const [rawgRecs, setRawgRecs] = useState(null)
  const [rawgRecsLoading, setRawgRecsLoading] = useState(false)
  const [globalSearch, setGlobalSearch] = useState('')
  const [globalResults, setGlobalResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)

  // Backlog & Played filters
  const [filterPlatform, setFilterPlatform] = useState('All')
  const [filterGenre, setFilterGenre] = useState('All')
  const [dashSearch, setDashSearch] = useState('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 12

  // Review modal
  const [selectedGame, setSelectedGame] = useState(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewRating, setReviewRating] = useState(3.0)
  const [reviewComments, setReviewComments] = useState('')
  const [reviewTags, setReviewTags] = useState([])
  const [isSaving, setIsSaving] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)

  // Add/Edit manual modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingGame, setEditingGame] = useState(null)
  const [addForm, setAddForm] = useState({ title: '', platform: 'PC', genres: [], synopsis: '', poster_url: '', my_rating: 3.0, is_played: false, tags: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Popping loader
  const [showPoppingLoader, setShowPoppingLoader] = useState(false)
  const celebRef = useRef(null)

  /* ─── Fetch entries ───────────────────────────────────────── */
  const fetchEntries = async () => {
    try {
      const data = await gamesApi.getAll()
      setEntries(data)
    } catch {
      toast.error('Failed to load game library')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchEntries() }, [])

  /* ─── RAWG Recommendations ────────────────────────────────── */
  const fetchRawgRecs = async () => {
    if (rawgRecs) return
    setRawgRecsLoading(true)
    try {
      const data = await rawgApi.getRecommendations()
      setRawgRecs(data)
    } catch {
      toast.error('Failed to load game recommendations')
    } finally {
      setRawgRecsLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'discover') fetchRawgRecs()
  }, [activeTab])

  /* ─── RAWG global search ──────────────────────────────────── */
  useEffect(() => {
    const t = setTimeout(async () => {
      if (globalSearch.trim().length > 1) {
        setIsSearching(true)
        try {
          const res = await rawgApi.search(globalSearch)
          setGlobalResults(res.slice(0, 8))
        } catch { toast.error('Search failed') }
        finally { setIsSearching(false) }
      } else { setGlobalResults([]) }
    }, 400)
    return () => clearTimeout(t)
  }, [globalSearch])

  /* ─── Helpers ─────────────────────────────────────────────── */
  const isInLibrary = (title) => entries.some(e => e.title.toLowerCase().trim() === title.toLowerCase().trim())

  const scrollRow = (id, dir) => {
    const el = document.getElementById(id)
    if (el) el.scrollBy({ left: dir === 'left' ? -500 : 500, behavior: 'smooth' })
  }

  /* 3D tilt handlers */
  const handleCardMouseMove = (e) => {
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left, y = e.clientY - rect.top
    const xc = rect.width / 2, yc = rect.height / 2
    card.style.transform = `rotateX(${-(y - yc) / yc * 15}deg) rotateY(${(x - xc) / xc * 15}deg) scale(1.04)`
    const shine = card.querySelector('.movie-card-shine')
    if (shine) {
      shine.style.background = `radial-gradient(circle at ${(x / rect.width) * 100}% ${(y / rect.height) * 100}%, rgba(139,92,246,0.2) 0%, rgba(139,92,246,0) 65%)`
      shine.style.opacity = '1'
    }
  }
  const handleCardMouseEnter = (e) => {
    e.currentTarget.style.transition = 'transform 0.1s cubic-bezier(0.25,0.8,0.25,1), box-shadow 0.3s ease'
  }
  const handleCardMouseLeave = (e) => {
    const card = e.currentTarget
    card.style.transition = 'transform 0.55s cubic-bezier(0.25,0.8,0.25,1), box-shadow 0.55s ease'
    card.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)'
    const shine = card.querySelector('.movie-card-shine')
    if (shine) shine.style.opacity = '0'
  }

  /* ─── Add to Backlog from discover ───────────────────────── */
  const handleAddToBacklog = async (item) => {
    try {
      const res = await gamesApi.create({
        title: item.title,
        platform: item.platform,
        rating: item.rating,
        synopsis: item.synopsis,
        genres: item.genres,
        poster_url: item.poster_url,
        is_played: false
      })
      setEntries(prev => [res, ...prev])
      toast.success(`"${item.title}" added to your backlog! 🎮`)
    } catch { toast.error('Failed to add to backlog') }
  }

  /* ─── Open Review Modal ───────────────────────────────────── */
  const handleGameClick = (item) => {
    const existing = entries.find(e => e.title.toLowerCase().trim() === item.title.toLowerCase().trim())
    setSelectedGame(existing || item)
    setShowReviewModal(true)
  }

  useEffect(() => {
    if (selectedGame) {
      setReviewRating(selectedGame.my_rating ?? 3.0)
      setReviewComments(selectedGame.reasons_for_liking || '')
      setReviewTags(selectedGame.tags ? selectedGame.tags.split(', ').filter(Boolean) : [])
      setShowReviewForm(false)
    }
  }, [selectedGame])

  /* ─── Save Played Review ──────────────────────────────────── */
  const handleSavePlayed = async () => {
    setIsSaving(true)
    try {
      const payload = {
        title: selectedGame.title,
        platform: selectedGame.platform,
        rating: selectedGame.rating,
        synopsis: selectedGame.synopsis,
        genres: selectedGame.genres,
        poster_url: selectedGame.poster_url,
        poster_data: selectedGame.poster_data,
        reasons_for_liking: reviewComments,
        my_rating: reviewRating,
        is_played: true,
        tags: reviewTags.join(', ')
      }

      let res
      if (selectedGame.id) {
        res = await gamesApi.update(selectedGame.id, payload)
        setEntries(prev => prev.map(e => e.id === selectedGame.id ? res : e))
      } else {
        res = await gamesApi.create(payload)
        setEntries(prev => [res, ...prev])
      }

      setShowCelebration(true)
      setTimeout(() => {
        setShowCelebration(false)
        setSelectedGame(res)
        setShowReviewForm(false)
        setShowReviewModal(false)
        toast.success(`"${selectedGame.title}" marked as played! 🏆`)
      }, 1200)
    } catch { toast.error('Failed to save review') }
    finally { setIsSaving(false) }
  }

  /* ─── Move back to Backlog ────────────────────────────────── */
  const handleMoveToBacklog = async () => {
    try {
      const res = await gamesApi.update(selectedGame.id, { is_played: false, my_rating: null, reasons_for_liking: '', tags: null })
      setEntries(prev => prev.map(e => e.id === selectedGame.id ? res : e))
      setSelectedGame(res)
      toast.success(`"${selectedGame.title}" moved back to backlog!`)
      setShowReviewModal(false)
    } catch { toast.error('Failed to update entry') }
  }

  /* ─── Delete ──────────────────────────────────────────────── */
  const handleDelete = async (id) => {
    if (!confirm('Remove this game from your library?')) return
    try {
      await gamesApi.delete(id)
      setEntries(prev => prev.filter(e => e.id !== id))
      toast.success('Game removed')
      if (showReviewModal) setShowReviewModal(false)
    } catch { toast.error('Failed to remove') }
  }

  /* ─── Manual Add/Edit ─────────────────────────────────────── */
  const openAddModal = (game = null) => {
    if (game) {
      setEditingGame(game)
      setAddForm({
        title: game.title, platform: game.platform || 'PC',
        genres: game.genres ? game.genres.split(', ') : [],
        synopsis: game.synopsis || '', poster_url: game.poster_url || '',
        my_rating: game.my_rating || 3.0, is_played: game.is_played || false, tags: game.tags || ''
      })
    } else {
      setEditingGame(null)
      setAddForm({ title: '', platform: 'PC', genres: [], synopsis: '', poster_url: '', my_rating: 3.0, is_played: false, tags: '' })
    }
    setShowAddModal(true)
  }

  const handleAddSubmit = async (e) => {
    e.preventDefault()
    if (!addForm.title) { toast.error('Game title is required'); return }
    setIsSubmitting(true)
    const payload = { ...addForm, genres: addForm.genres.join(', ') }
    try {
      if (editingGame) {
        const res = await gamesApi.update(editingGame.id, payload)
        setEntries(prev => prev.map(e => e.id === editingGame.id ? res : e))
        toast.success('Game updated!')
      } else {
        const res = await gamesApi.create(payload)
        setEntries(prev => [res, ...prev])
        toast.success('Game added to your library!')
      }
      setShowAddModal(false)
    } catch { toast.error('Failed to save') }
    finally { setIsSubmitting(false) }
  }

  /* ─── Filters ─────────────────────────────────────────────── */
  const filteredEntries = entries.filter(e => {
    const matchTab = activeTab === 'backlog' ? !e.is_played : (activeTab === 'played' ? e.is_played : true)
    const matchPlatform = filterPlatform === 'All' || e.platform?.includes(filterPlatform)
    const matchGenre = filterGenre === 'All' || (e.genres && e.genres.split(', ').includes(filterGenre))
    const matchSearch = dashSearch.trim() === '' || e.title.toLowerCase().includes(dashSearch.toLowerCase())
    return matchTab && matchPlatform && matchGenre && matchSearch
  })

  const totalPages = Math.ceil(filteredEntries.length / ITEMS_PER_PAGE)
  const paginatedEntries = filteredEntries.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  useEffect(() => { setCurrentPage(1) }, [filterPlatform, filterGenre, dashSearch, activeTab])

  /* ─── Surprise Me ────────────────────────────────────────── */
  const handleSurpriseMe = async () => {
    setShowPoppingLoader(true)
    let recs = rawgRecs
    if (!recs) {
      try { recs = await rawgApi.getRecommendations(); setRawgRecs(recs) }
      catch { toast.error('No recs found'); setShowPoppingLoader(false); return }
    }
    const all = Object.values(recs).flat().filter(g => g.rating >= 3.5)
    const unique = [...new Map(all.map(g => [g.title.toLowerCase(), g])).values()]
    if (!unique.length) { setShowPoppingLoader(false); return }
    const pick = unique[Math.floor(Math.random() * unique.length)]
    setTimeout(() => {
      setShowPoppingLoader(false)
      handleGameClick(pick)
      toast.success(`🎮 Surprise! Try "${pick.title}"`, { duration: 5000 })
    }, 1800)
  }

  /* ─── Render Discover Row ─────────────────────────────────── */
  const renderRow = (title, items, icon, showRank = false) => {
    if (!items?.length) return null
    const rowId = 'grow-' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    return (
      <LazyRow height="345px">
        <div className="space-y-4">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-base font-black text-white uppercase tracking-wider">{title}</h3>
        </div>
        <div className="relative group/row">
          <button onClick={() => scrollRow(rowId, 'left')} className="absolute left-0 top-[35%] -translate-y-1/2 w-10 h-10 rounded-full bg-slate-950/85 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-all duration-300 z-10 shadow-lg hover:bg-violet-600 hover:border-violet-500 hover:scale-105 active:scale-95">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div id={rowId} className="flex gap-6 overflow-x-auto pb-4 no-scrollbar scroll-row" style={{ touchAction: 'pan-x', WebkitOverflowScrolling: 'touch' }}>
            {items.map((item, idx) => {
              const inLib = isInLibrary(item.title)
              return (
                <div
                  key={idx}
                  onClick={() => handleGameClick(item)}
                  className="movie-3d-card-container min-w-[165px] w-[165px] sm:min-w-[190px] sm:w-[190px] flex-shrink-0"
                >
                  <div
                    className="movie-3d-card bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden flex flex-col justify-between h-full transition-all duration-300 relative cursor-pointer"
                    onMouseMove={handleCardMouseMove}
                    onMouseEnter={handleCardMouseEnter}
                    onMouseLeave={handleCardMouseLeave}
                  >
                    <div className="movie-card-shine absolute inset-0 pointer-events-none z-10 opacity-0 transition-opacity duration-300" />
                    {showRank && (
                      <div className="absolute top-2 left-2 w-7 h-7 rounded-lg bg-violet-600/90 text-white flex items-center justify-center font-black text-xs shadow-md z-10">{idx + 1}</div>
                    )}
                    <div className="aspect-[2/3] bg-slate-950 relative overflow-hidden shrink-0 rounded-t-2xl">
                      {item.poster_url ? (
                        <img src={item.poster_url} alt={item.title} loading="lazy" decoding="async" className="w-full h-full object-cover rounded-t-2xl" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center">
                          <Gamepad2 className="w-8 h-8 text-slate-800 mb-1" />
                          <span className="text-[10px] text-slate-600 font-bold uppercase truncate w-full">{item.title}</span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-slate-950/80 border border-white/10 text-[9px] font-black text-violet-300 flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-violet-400 text-violet-400" />
                        <span>{Number(item.rating || 0).toFixed(1)}</span>
                      </div>
                      {item.platform && (
                        <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-slate-950/80 border border-white/5 text-[8px] font-black uppercase tracking-wider text-slate-300 truncate max-w-[80%]">{item.platform.split(',')[0]}</div>
                      )}
                    </div>
                    <div className="p-3 flex-1 flex flex-col justify-between min-h-0">
                      <div>
                        <h4 className="font-bold text-xs text-white line-clamp-1 leading-snug" title={item.title}>{item.title}</h4>
                        <p className="text-[9px] text-slate-500 mt-0.5">{item.genres?.split(',')[0] || 'Game'}</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); if (!inLib) handleAddToBacklog(item) }}
                        disabled={inLib}
                        className={`w-full mt-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${inLib ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-violet-600 hover:bg-violet-500 text-white'}`}
                      >
                        {inLib ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                        <span>{inLib ? 'In Library' : 'Add to Backlog'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <button onClick={() => scrollRow(rowId, 'right')} className="absolute right-0 top-[35%] -translate-y-1/2 w-10 h-10 rounded-full bg-slate-950/85 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-all duration-300 z-10 shadow-lg hover:bg-violet-600 hover:border-violet-500 hover:scale-105 active:scale-95">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </LazyRow>
    )
  }

  /* ─── JSX ─────────────────────────────────────────────────── */
  return (
    <div className="relative">

      {/* Popping Loader Overlay */}
      {showPoppingLoader && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/85 backdrop-blur-sm">
          <div className="relative flex flex-col items-center gap-6">
            <div className="relative w-24 h-24">
              {[...Array(12)].map((_, i) => {
                const angle = (i / 12) * 360
                const rad = (angle * Math.PI) / 180
                const tx = Math.cos(rad) * 60
                const ty = Math.sin(rad) * 60
                return (
                  <div key={i} className="popcorn-particle" style={{ '--x': `${tx}px`, '--y': `${ty}px`, '--x2': `${tx * 0.3}px`, '--r': `${Math.random() * 360}deg`, '--r2': `${Math.random() * 720}deg`, animationDelay: `${i * 0.13}s`, left: '50%', top: '50%' }} />
                )
              })}
              <div className="absolute inset-0 flex items-center justify-center">
                <Gamepad2 className="w-12 h-12 text-violet-400 animate-pulse" />
              </div>
            </div>
            <p className="text-white font-black text-lg tracking-wider animate-pulse">Finding your next game...</p>
          </div>
        </div>
      )}

      {/* Success Celebration */}
      {showCelebration && (
        <div ref={celebRef} className="fixed inset-0 z-[300] pointer-events-none flex items-center justify-center">
          {[...Array(20)].map((_, i) => {
            const angle = (i / 20) * 360
            const rad = (angle * Math.PI) / 180
            const dist = 80 + Math.random() * 80
            return (
              <div key={i} className="success-popcorn" style={{ '--x': `${Math.cos(rad) * dist}px`, '--y': `${Math.sin(rad) * dist - 60}px`, '--r': `${Math.random() * 720}deg`, left: '50%', top: '50%' }} />
            )
          })}
        </div>
      )}

      {/* Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h2 className="text-3xl font-black text-white bg-gradient-to-r from-violet-400 via-purple-400 to-green-400 bg-clip-text text-transparent">Game Library</h2>
          <p className="text-slate-400 text-sm mt-1">Track games you've played and build your ultimate backlog.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSurpriseMe}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold rounded-2xl shadow-lg shadow-violet-600/20 active:scale-[0.98] transition-all text-sm animate-glow"
          >
            <Sparkles className="w-4 h-4" />
            <span>Surprise Me</span>
          </button>
          <button
            onClick={() => openAddModal()}
            className="flex items-center gap-2 px-5 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl shadow-lg shadow-violet-600/15 active:scale-[0.98] transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Game</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-white/5 mb-8">
        {[
          { id: 'discover', label: 'Discover & Recommendations', icon: <Globe className="w-4 h-4" /> },
          { id: 'backlog', label: 'My Backlog', icon: <Bookmark className="w-4 h-4" />, count: entries.filter(e => !e.is_played).length },
          { id: 'played', label: 'Played', icon: <Trophy className="w-4 h-4" />, count: entries.filter(e => e.is_played).length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-4 px-2 text-xs font-black transition-all border-b-2 uppercase tracking-wider flex items-center gap-2 ${activeTab === tab.id ? 'border-violet-500 text-violet-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="px-1.5 py-0.5 rounded-md bg-slate-950/80 border border-white/5 text-[9px] text-slate-400 font-bold ml-1">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* DISCOVER TAB */}
      {activeTab === 'discover' && (
        <div className="space-y-12">
          {/* Global Search */}
          <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-3xl backdrop-blur-md space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Search className="w-4 h-4 text-violet-400" />
              Search Games & Add to Library
            </h3>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={globalSearch}
                onChange={e => setGlobalSearch(e.target.value)}
                placeholder="Search by game name..."
                className="w-full bg-slate-950/60 border border-white/5 focus:border-violet-500 rounded-xl pl-11 pr-10 py-3 text-sm text-slate-200 outline-none transition-all placeholder:text-slate-500"
              />
              {isSearching && <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400 animate-spin" />}
              {globalSearch && !isSearching && (
                <button onClick={() => { setGlobalSearch(''); setGlobalResults([]) }} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-500 hover:text-slate-300 font-bold uppercase">Clear</button>
              )}
            </div>

            {globalResults.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-2">
                {globalResults.map((item, idx) => {
                  const inLib = isInLibrary(item.title)
                  return (
                    <div
                      key={idx}
                      onClick={() => handleGameClick(item)}
                      className="flex items-center gap-3 p-3 bg-slate-950/60 border border-white/5 hover:border-violet-500/40 rounded-2xl cursor-pointer transition-all group"
                    >
                      {item.poster_url ? (
                        <img src={item.poster_url} alt={item.title} loading="lazy" decoding="async" className="w-10 h-14 object-cover rounded-lg shrink-0" />
                      ) : (
                        <div className="w-10 h-14 bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
                          <Gamepad2 className="w-5 h-5 text-slate-600" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate group-hover:text-violet-300 transition-colors">{item.title}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 truncate">{item.platform?.split(',')[0] || 'PC'}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-2.5 h-2.5 text-violet-400 fill-violet-400" />
                          <span className="text-[9px] text-violet-300 font-bold">{Number(item.rating || 0).toFixed(1)}</span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); if (!inLib) handleAddToBacklog(item) }}
                          disabled={inLib}
                          className={`mt-1.5 w-full text-[9px] font-bold py-1 rounded-lg flex items-center justify-center gap-0.5 transition-all ${inLib ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-violet-600 hover:bg-violet-500 text-white'}`}
                        >
                          {inLib ? <><Check className="w-2.5 h-2.5" /> In Library</> : <><Plus className="w-2.5 h-2.5" /> Backlog</>}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* RAWG Recommendations */}
          {rawgRecsLoading ? (
            <div className="flex items-center justify-center py-24 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
              <p className="text-slate-400 text-sm">Loading game recommendations...</p>
            </div>
          ) : rawgRecs ? (
            <div className="space-y-14">
              {renderRow('🔥 Trending Games', rawgRecs.trending_games, <Zap className="w-5 h-5 text-violet-400" />, true)}
              {renderRow('⚔️ Top RPGs', rawgRecs.top_rpgs, <Star className="w-5 h-5 text-violet-400" />)}
              {renderRow('🎮 Nintendo Switch Hits', rawgRecs.switch_hits, <Monitor className="w-5 h-5 text-violet-400" />)}
              {renderRow('💥 Action Hits', rawgRecs.action_hits, <Zap className="w-5 h-5 text-orange-400" />)}
            </div>
          ) : null}
        </div>
      )}

      {/* BACKLOG / PLAYED TABS */}
      {(activeTab === 'backlog' || activeTab === 'played') && (
        <>
          {/* Filters */}
          <div className="flex flex-col gap-4 mb-8 bg-slate-900/40 border border-slate-800/80 p-5 rounded-3xl backdrop-blur-md">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={dashSearch}
                onChange={e => setDashSearch(e.target.value)}
                placeholder="Search your game library..."
                className="w-full bg-slate-950/60 border border-white/5 focus:border-violet-500 rounded-xl pl-11 pr-10 py-2.5 text-xs text-slate-200 outline-none transition-all placeholder:text-slate-500"
              />
              {dashSearch && (
                <button onClick={() => setDashSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-500 hover:text-slate-300 font-bold uppercase">Clear</button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Platform</label>
                <select value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)} className="w-full bg-slate-950/60 border border-white/5 focus:border-violet-500 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none transition-all">
                  <option value="All">All Platforms</option>
                  {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Genre</label>
                <select value={filterGenre} onChange={e => setFilterGenre(e.target.value)} className="w-full bg-slate-950/60 border border-white/5 focus:border-violet-500 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none transition-all">
                  <option value="All">All Genres</option>
                  {GAME_GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
              <p className="text-slate-400 text-sm">Loading your library...</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-24 bg-slate-900/30 rounded-3xl border border-dashed border-slate-800 p-8">
              <Gamepad2 className="w-12 h-12 mx-auto text-slate-700 opacity-40 mb-4" />
              <h3 className="text-lg font-bold text-slate-300">{activeTab === 'backlog' ? 'Your Backlog is empty' : 'No played games yet'}</h3>
              <p className="text-slate-500 text-sm mt-2">{activeTab === 'backlog' ? 'Discover games and add them to your backlog!' : 'Mark games as played to see them here.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {paginatedEntries.map(entry => (
                <div
                  key={entry.id}
                  onClick={() => handleGameClick(entry)}
                  className="movie-3d-card-container cursor-pointer"
                >
                  <div
                    className="movie-3d-card bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden flex flex-col h-full relative"
                    onMouseMove={handleCardMouseMove}
                    onMouseEnter={handleCardMouseEnter}
                    onMouseLeave={handleCardMouseLeave}
                  >
                    <div className="movie-card-shine absolute inset-0 pointer-events-none z-10 opacity-0 transition-opacity duration-300" />
                    <div className="aspect-[2/3] bg-slate-950 relative overflow-hidden shrink-0 rounded-t-2xl">
                      {entry.poster_url ? (
                        <img src={entry.poster_url} alt={entry.title} loading="lazy" decoding="async" className="w-full h-full object-cover rounded-t-2xl" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                          <Gamepad2 className="w-8 h-8 text-slate-800 mb-1" />
                          <span className="text-[9px] text-slate-600 font-bold uppercase">{entry.title}</span>
                        </div>
                      )}
                      {entry.is_played && (
                        <div className="absolute top-2 left-2 w-6 h-6 rounded-lg bg-green-600/90 text-white flex items-center justify-center shadow-md z-10">
                          <Trophy className="w-3.5 h-3.5" />
                        </div>
                      )}
                      {entry.my_rating && (
                        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-slate-950/70 border border-violet-500/30 text-[9px] font-black text-violet-300 backdrop-blur-md">
                          {Number(entry.my_rating).toFixed(1)}
                        </div>
                      )}
                    </div>
                    <div className="p-3 flex flex-col gap-2 flex-1">
                      <h4 className="font-bold text-xs text-white line-clamp-2 leading-snug" title={entry.title}>{entry.title}</h4>
                      {entry.platform && <p className="text-[9px] text-slate-500 truncate">{entry.platform.split(',')[0]}</p>}
                      {entry.my_rating && <GameRating rating={entry.my_rating} />}
                      <div className="flex gap-1.5 mt-auto pt-1">
                        <button onClick={e => { e.stopPropagation(); openAddModal(entry) }} className="flex-1 py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 text-slate-400 hover:text-white flex items-center justify-center transition-all">
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button onClick={e => { e.stopPropagation(); handleDelete(entry.id) }} className="flex-1 py-1.5 rounded-xl bg-slate-800/60 hover:bg-red-500/20 text-slate-400 hover:text-red-400 flex items-center justify-center transition-all">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 rounded-xl border border-white/5 bg-slate-950/40 text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all disabled:opacity-30 text-xs font-bold">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-400 font-bold px-4">Page {currentPage} of {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 rounded-xl border border-white/5 bg-slate-950/40 text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all disabled:opacity-30 text-xs font-bold">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* ─── Review / View Modal ─────────────────────────────── */}
      {showReviewModal && selectedGame && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
            {/* Close */}
            <button onClick={() => setShowReviewModal(false)} className="absolute top-4 right-4 p-2 rounded-xl border border-white/5 bg-slate-950/60 text-slate-400 hover:text-white transition-colors z-10">
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col sm:flex-row gap-6 p-6">
              {/* Poster */}
              <div className="shrink-0">
                <div className="w-36 h-52 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl">
                  {selectedGame.poster_url ? (
                    <img src={selectedGame.poster_url} alt={selectedGame.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Gamepad2 className="w-12 h-12 text-slate-700" /></div>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-3">
                <div>
                  <h3 className="text-xl font-black text-white leading-snug">{selectedGame.title}</h3>
                  {selectedGame.platform && <p className="text-xs text-slate-400 mt-0.5">{selectedGame.platform}</p>}
                </div>

                {selectedGame.rating && (
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-violet-400 fill-violet-400" />
                    <span className="text-sm font-bold text-violet-300">{Number(selectedGame.rating).toFixed(1)}</span>
                    <span className="text-xs text-slate-500">RAWG Rating</span>
                  </div>
                )}

                {selectedGame.genres && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedGame.genres.split(', ').map(g => (
                      <span key={g} className="px-2 py-0.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300 text-[10px] font-bold">{g}</span>
                    ))}
                  </div>
                )}

                {selectedGame.synopsis && <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{selectedGame.synopsis}</p>}

                {selectedGame.id && selectedGame.is_played && selectedGame.my_rating && (
                  <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2">
                    <Trophy className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-green-300 font-bold">Played — Your Rating: {Number(selectedGame.my_rating).toFixed(1)}</span>
                  </div>
                )}

                {selectedGame.tags && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedGame.tags.split(', ').filter(Boolean).map(t => (
                      <span key={t} className="px-2 py-0.5 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-300 text-[10px] font-bold">{t}</span>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {!showReviewForm && (
                    <button
                      onClick={() => setShowReviewForm(true)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-xs transition-all"
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      {selectedGame.id && selectedGame.is_played ? 'Update Review' : 'Mark as Played'}
                    </button>
                  )}
                  {selectedGame.id && !selectedGame.is_played && (
                    <button
                      onClick={() => handleAddToBacklog(selectedGame)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-all"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      Add to Backlog
                    </button>
                  )}
                  {selectedGame.id && selectedGame.is_played && (
                    <button onClick={handleMoveToBacklog} className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-all">
                      <Bookmark className="w-3.5 h-3.5" />
                      Move to Backlog
                    </button>
                  )}
                  {!selectedGame.id && (
                    <button onClick={() => handleAddToBacklog(selectedGame)} className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-all">
                      <Plus className="w-3.5 h-3.5" />
                      Add to Backlog
                    </button>
                  )}
                  {selectedGame.id && (
                    <button onClick={() => handleDelete(selectedGame.id)} className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-xl text-xs border border-red-500/20 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Review Form */}
            {showReviewForm && (
              <div className="border-t border-slate-800 px-6 pb-6 space-y-5 pt-5">
                <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-violet-400" />
                  Your Review
                </h4>

                {/* Rating slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Your Rating</label>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black text-white">{Number(reviewRating).toFixed(1)}</span>
                      <span className="text-xs text-violet-300 font-bold">{getRatingLabel(reviewRating)}</span>
                    </div>
                  </div>
                  <GameSlider value={reviewRating} onChange={setReviewRating} />
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {GAME_TAGS.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setReviewTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border ${reviewTags.includes(tag) ? 'bg-violet-600/30 border-violet-500/50 text-violet-200' : 'bg-slate-950/60 border-white/5 text-slate-400 hover:border-violet-500/30'}`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comments */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Comments</label>
                  <textarea
                    value={reviewComments}
                    onChange={e => setReviewComments(e.target.value)}
                    maxLength={300}
                    rows={3}
                    placeholder="What made this game special..."
                    className="w-full bg-slate-950/60 border border-white/5 focus:border-violet-500 rounded-xl px-4 py-3 text-xs text-slate-200 outline-none transition-all placeholder:text-slate-500 resize-none"
                  />
                  <p className="text-right text-[10px] text-slate-500">{reviewComments.length}/300</p>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setShowReviewForm(false)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-sm transition-all">
                    Cancel
                  </button>
                  <button
                    onClick={handleSavePlayed}
                    disabled={isSaving}
                    className="flex-1 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
                    Save Review
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Add/Edit Manual Modal ──────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 p-2 rounded-xl border border-white/5 bg-slate-950/60 text-slate-400 hover:text-white transition-colors z-10">
              <X className="w-4 h-4" />
            </button>
            <div className="p-6">
              <h3 className="text-lg font-black text-white mb-6">{editingGame ? 'Edit Game' : 'Add Game Manually'}</h3>
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Game Title *</label>
                  <input value={addForm.title} onChange={e => setAddForm(p => ({ ...p, title: e.target.value }))} className="w-full bg-slate-950/60 border border-white/5 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-all placeholder:text-slate-500" placeholder="e.g. Elden Ring" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Platform</label>
                  <select value={addForm.platform} onChange={e => setAddForm(p => ({ ...p, platform: e.target.value }))} className="w-full bg-slate-950/60 border border-white/5 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-all">
                    {PLATFORMS.map(pl => <option key={pl} value={pl}>{pl}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Genres</label>
                  <div className="flex flex-wrap gap-2">
                    {GAME_GENRES.slice(0, 10).map(g => (
                      <button key={g} type="button" onClick={() => setAddForm(p => ({ ...p, genres: p.genres.includes(g) ? p.genres.filter(x => x !== g) : [...p.genres, g] }))} className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${addForm.genres.includes(g) ? 'bg-violet-600/30 border-violet-500/50 text-violet-200' : 'bg-slate-950/60 border-white/5 text-slate-400 hover:border-violet-500/30'}`}>{g}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Poster URL</label>
                  <input value={addForm.poster_url} onChange={e => setAddForm(p => ({ ...p, poster_url: e.target.value }))} className="w-full bg-slate-950/60 border border-white/5 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-all placeholder:text-slate-500" placeholder="https://..." />
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="isPlayed" checked={addForm.is_played} onChange={e => setAddForm(p => ({ ...p, is_played: e.target.checked }))} className="w-4 h-4 accent-violet-500" />
                  <label htmlFor="isPlayed" className="text-sm text-slate-300 font-bold">Already Played</label>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-sm transition-all">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {editingGame ? 'Save Changes' : 'Add Game'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
