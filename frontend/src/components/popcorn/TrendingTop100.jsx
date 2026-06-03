import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { tmdbApi, popcornApi, gamesApi, rawgApi } from '../../api/client'
import { Film, Star, Plus, Check, Loader2, ArrowLeft, TrendingUp, Gamepad, Gamepad2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function TrendingTop100() {
  const [trending, setTrending] = useState([])
  const [watchlist, setWatchlist] = useState([])
  const [loading, setLoading] = useState(true)
  const [visibleCount, setVisibleCount] = useState(24)
  const sentinelRef = useRef(null)
  const navigate = useNavigate()

  const appMode = localStorage.getItem('popcorn_app_mode') || 'popcorn'
  const isGame = appMode === 'gamecorn'

  useEffect(() => {
    if (loading || visibleCount >= trending.length) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount(prev => Math.min(prev + 24, trending.length))
        }
      },
      { rootMargin: '200px' }
    )
    const currentSentinel = sentinelRef.current
    if (currentSentinel) observer.observe(currentSentinel)
    return () => {
      if (currentSentinel) observer.unobserve(currentSentinel)
      observer.disconnect()
    }
  }, [loading, visibleCount, trending.length])

  useEffect(() => {
    fetchTrendingAndWatchlist()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchTrendingAndWatchlist = async () => {
    setLoading(true)
    try {
      const [trendingData, watchlistData] = await Promise.all([
        isGame ? rawgApi.getTrending() : tmdbApi.getTrending(),
        isGame ? gamesApi.getAll() : popcornApi.getAll()
      ])
      setTrending(trendingData)
      setWatchlist(watchlistData)
      setVisibleCount(24)
    } catch (err) {
      toast.error(isGame ? 'Failed to load trending games' : 'Failed to load trending titles')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToWatchlist = async (item) => {
    try {
      if (isGame) {
        const res = await gamesApi.create({
          title: item.title,
          platform: item.platform || 'PC',
          rating: item.rating,
          synopsis: item.synopsis,
          reasons_for_liking: 'Saved from Top 100 Trending',
          genres: item.genres,
          poster_url: item.poster_url,
          poster_data: null
        })
        setWatchlist(prev => [res, ...prev])
        toast.success(`"${item.title}" added to your Playlist!`)
      } else {
        const res = await popcornApi.create({
          title: item.title,
          category: item.category,
          language: item.language,
          rating: item.rating,
          synopsis: item.synopsis,
          reasons_for_liking: 'Saved from Top 100 Trending',
          genres: item.genres,
          poster_url: item.poster_url,
          poster_data: null
        })
        setWatchlist(prev => [res, ...prev])
        toast.success(`"${item.title}" added to your watchlist!`)
      }
    } catch (err) {
      toast.error(isGame ? 'Failed to add to Playlist' : 'Failed to add to watchlist')
    }
  }

  const isAlreadyInWatchlist = (title) =>
    watchlist.some(w => w.title.toLowerCase().trim() === title.toLowerCase().trim())

  // Mode-aware tokens (indigo for movies, cyan for games)
  const accent = isGame ? 'cyan' : 'indigo'
  const RatingIcon = isGame ? Gamepad2 : Star
  const EmptyIcon = isGame ? Gamepad : Film
  const watchlistLabel = isGame ? 'Playlist' : 'Watchlist'
  const ambientGlow = isGame ? 'bg-cyan-500/20' : 'bg-indigo-600/25'
  const accentText = isGame ? 'text-cyan-300' : 'text-indigo-300'
  const ratingText = isGame ? 'text-cyan-300' : 'text-amber-300'
  const ratingFill = isGame ? 'fill-cyan-300 text-cyan-300' : 'fill-amber-300 text-amber-300'
  const rankBg = isGame
    ? 'bg-gradient-to-br from-cyan-500 to-cyan-700'
    : 'bg-gradient-to-br from-indigo-500 to-indigo-700'
  const buttonAdd = isGame
    ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 shadow-glow-game text-white'
    : 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-glow-indigo text-white'

  return (
    <div className="min-h-screen bg-midnight text-slate-100 pb-20 relative overflow-hidden">
      {/* Ambient lighting */}
      <div className={`absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] ${ambientGlow} rounded-full blur-[140px] pointer-events-none`} />

      {/* Header */}
      <header className="relative z-20 border-b border-white/5 glass-strong sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-xs uppercase tracking-[0.25em] font-semibold">Back</span>
          </button>

          <div className="flex items-center gap-2">
            <TrendingUp className={`w-4 h-4 ${accentText} animate-pulse`} />
            <h1 className="font-display text-xl sm:text-2xl tracking-[0.15em] text-white">TOP 100</h1>
          </div>
          <div className="w-14" />
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 mt-10 sm:mt-14">
        {/* Hero */}
        <section className="relative mb-10 sm:mb-14">
          <p className={`text-[10px] uppercase tracking-[0.35em] ${accentText} mb-3 font-semibold`}>
            This week in trending
          </p>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <h2 className="font-display text-5xl sm:text-6xl md:text-7xl text-white leading-[0.95]">
              {isGame ? 'The most played' : 'The most watched'}
              <span className={`block ${accentText}`}>right now.</span>
            </h2>
            <span className="self-start md:self-auto px-3 py-1.5 bg-white/[0.04] border border-white/10 rounded-full text-[10px] uppercase tracking-[0.25em] text-slate-400 font-semibold">
              Refreshed weekly
            </span>
          </div>
        </section>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className={`w-8 h-8 animate-spin ${accentText}`} />
            <p className="text-slate-500 text-xs uppercase tracking-[0.3em]">Loading…</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
              {trending.slice(0, visibleCount).map((item, idx) => {
                const inWatchlist = isAlreadyInWatchlist(item.title)
                return (
                  <article
                    key={`${item.title}-${idx}`}
                    className="group relative flex flex-col bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] hover:border-white/15 rounded-2xl overflow-hidden transition-all duration-300"
                  >
                    {/* Poster */}
                    <div className="aspect-[2/3] bg-ink relative overflow-hidden shrink-0">
                      {item.poster_url ? (
                        <img
                          src={item.poster_url}
                          alt={item.title}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-ink to-midnight">
                          <EmptyIcon className="w-10 h-10 text-slate-700 mb-2" />
                          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{item.title}</span>
                        </div>
                      )}

                      {/* Gradient veil for legibility */}
                      <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/20 to-transparent opacity-90" />

                      {/* Rank badge */}
                      <div className={`absolute top-3 left-3 min-w-[36px] h-9 px-2 rounded-lg ${rankBg} text-white flex items-center justify-center font-display text-xl tracking-wider shadow-lg`}>
                        {idx + 1}
                      </div>

                      {/* Rating pill */}
                      <div className={`absolute top-3 right-3 px-2 py-1 rounded-full glass border border-white/10 text-[10px] font-bold ${ratingText} flex items-center gap-1`}>
                        <RatingIcon className={`w-3 h-3 ${ratingFill}`} />
                        <span>{item.rating?.toFixed(1)}</span>
                      </div>

                      {/* Category label */}
                      <div className="absolute bottom-3 left-3 px-2 py-1 rounded bg-black/60 backdrop-blur-sm border border-white/10 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-200">
                        {isGame ? item.platform : item.category}
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-4 flex-1 flex flex-col justify-between min-h-0">
                      <div className="space-y-2">
                        <h3 className={`font-display text-lg tracking-wide text-white line-clamp-1 group-hover:${accentText} transition-colors`} title={item.title}>
                          {item.title}
                        </h3>

                        <div className="flex flex-wrap gap-1">
                          {item.genres?.split(', ').slice(0, 2).map((g, gIdx) => (
                            <span key={gIdx} className="text-[9px] px-2 py-0.5 rounded-full bg-white/[0.04] text-slate-400 border border-white/[0.06] font-semibold uppercase tracking-wider">
                              {g}
                            </span>
                          ))}
                        </div>

                        <p className="text-[11px] text-slate-400/80 line-clamp-3 leading-relaxed">
                          {item.synopsis || 'No overview available.'}
                        </p>
                      </div>

                      <button
                        onClick={() => !inWatchlist && handleAddToWatchlist(item)}
                        disabled={inWatchlist}
                        className={`w-full mt-4 py-2.5 px-4 rounded-xl text-[11px] font-bold uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-all ${
                          inWatchlist
                            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 cursor-default'
                            : `${buttonAdd} active:scale-[0.98]`
                        }`}
                      >
                        {inWatchlist ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>In {watchlistLabel}</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>

            {visibleCount < trending.length && (
              <div ref={sentinelRef} className="flex justify-center py-12 w-full">
                <Loader2 className={`w-7 h-7 animate-spin ${accentText}`} />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
