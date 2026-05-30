import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { tmdbApi, popcornApi, gamesApi, rawgApi } from '../../api/client'
import { Film, Tv, Star, Plus, Check, Loader2, ArrowLeft, TrendingUp, Gamepad, Gamepad2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function TrendingTop100() {
  const [trending, setTrending] = useState([])
  const [watchlist, setWatchlist] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const appMode = localStorage.getItem('popcorn_app_mode') || 'popcorn'
  const isGame = appMode === 'gamecorn'

  useEffect(() => {
    fetchTrendingAndWatchlist()
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

  const isAlreadyInWatchlist = (title) => {
    return watchlist.some(w => w.title.toLowerCase().trim() === title.toLowerCase().trim())
  }

  const headerColor = isGame ? 'text-emerald-400' : 'text-orange-500'
  const loaderColor = isGame ? 'text-emerald-400' : 'text-orange-500'
  const hoverBorderColor = isGame ? 'hover:border-emerald-500/30' : 'hover:border-orange-500/30'
  const rankBadgeBg = isGame ? 'bg-emerald-600/90' : 'bg-orange-600/90'
  const ratingBadgeText = isGame ? 'text-emerald-400' : 'text-yellow-400'
  const RatingIcon = isGame ? Gamepad2 : Star
  const ratingIconClass = isGame ? 'w-3.5 h-3.5 fill-emerald-400 text-emerald-400' : 'w-3 h-3 fill-yellow-400 text-yellow-400'
  const titleHoverColor = isGame ? 'group-hover:text-emerald-400' : 'group-hover:text-orange-500'
  const buttonBg = isGame 
    ? 'bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-[1.02] shadow-sm' 
    : 'bg-orange-600 hover:bg-orange-500 text-white hover:scale-[1.02] shadow-sm'
  const watchlistText = isGame ? 'Playlist' : 'Watchlist'

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 pb-16">
      {/* Header */}
      <header className="border-b border-white/5 bg-slate-900/40 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-bold text-sm">Dashboard</span>
          </button>
          
          <div className="flex items-center gap-1.5 sm:gap-2">
            <TrendingUp className={`w-4 h-4 sm:w-5 sm:h-5 animate-pulse ${headerColor}`} />
            <h1 className="font-black text-sm sm:text-base md:text-lg text-white truncate max-w-[160px] sm:max-w-none">
              {isGame ? 'Trending Games' : 'Trending Movies'}
              <span className="hidden sm:inline"> Top 100</span>
            </h1>
          </div>
          <div className="w-10 sm:w-24" /> {/* Spacer */}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 mt-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-black text-white">
              {isGame ? 'Weekly Top 100 Games' : 'Weekly Top 100 Movies'}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              {isGame 
                ? 'Discover popular video games trending this week.' 
                : 'Discover popular movies, series, and anime trending this week.'}
            </p>
          </div>
          <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-full text-xs font-bold text-slate-400">
            Data Refreshed Weekly
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className={`w-10 h-10 animate-spin ${loaderColor}`} />
            <p className="text-slate-400 text-sm">Fetching popular releases...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {trending.map((item, idx) => {
              const inWatchlist = isAlreadyInWatchlist(item.title)
              return (
                <div 
                  key={idx}
                  className={`group bg-slate-900/60 border border-slate-800/80 ${hoverBorderColor} rounded-2xl overflow-hidden flex flex-col shadow-md hover:shadow-xl transition-all duration-300 relative`}
                >
                  {/* Rank Badge */}
                  <div className={`absolute top-3 left-3 w-8 h-8 rounded-lg ${rankBadgeBg} text-white flex items-center justify-center font-black text-sm shadow-md z-10`}>
                    {idx + 1}
                  </div>

                  {/* Poster Image */}
                  <div className="aspect-[2/3] bg-slate-950 relative overflow-hidden shrink-0">
                    {item.poster_url ? (
                      <img 
                        src={item.poster_url} 
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                        {isGame ? <Gamepad className="w-10 h-10 text-slate-700 mb-2" /> : <Film className="w-10 h-10 text-slate-700 mb-2" />}
                        <span className="text-xs text-slate-500 font-bold uppercase">{item.title}</span>
                      </div>
                    )}

                    {/* Rating Tag */}
                    <div className={`absolute top-3 right-3 px-2 py-0.5 rounded-full bg-slate-950/70 border border-white/10 text-[10px] font-black ${ratingBadgeText} flex items-center gap-1 backdrop-blur-md`}>
                      <RatingIcon className={ratingIconClass} />
                      <span>{item.rating.toFixed(1)}</span>
                    </div>

                    {/* Category Label */}
                    <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded bg-slate-950/80 border border-white/5 text-[9px] font-black uppercase tracking-wider text-slate-300 backdrop-blur-sm">
                      {isGame ? item.platform : item.category}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between min-h-0">
                    <div className="space-y-2">
                      <h3 className={`font-bold text-sm text-white line-clamp-1 ${titleHoverColor} transition-colors`} title={item.title}>
                        {item.title}
                      </h3>
                      
                      <div className="flex flex-wrap gap-1">
                        {item.genres?.split(', ').slice(0, 2).map((g, gIdx) => (
                          <span key={gIdx} className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-950/50 text-slate-400 border border-white/5 font-semibold">
                            {g}
                          </span>
                        ))}
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed">
                        {item.synopsis || 'No overview available.'}
                      </p>
                    </div>

                    <button
                      onClick={() => !inWatchlist && handleAddToWatchlist(item)}
                      disabled={inWatchlist}
                      className={`w-full mt-4 py-2 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        inWatchlist 
                          ? 'bg-green-500/10 text-green-500 border border-green-500/20 cursor-default'
                          : buttonBg
                      }`}
                    >
                      {inWatchlist ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>In {watchlistText}</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add {watchlistText}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
