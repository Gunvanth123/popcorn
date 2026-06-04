import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi, popcornApi, tmdbApi, gamesApi, rawgApi, aiApi, groupsApi } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import {
  Plus, Trash2, Edit3, Loader2, Image as ImageIcon, Search,
  Popcorn as PopcornIcon, ExternalLink, ChevronRight, X,
  TrendingUp, Settings, Film, Tv, Star, Globe, Check, ChevronLeft, Sparkles,
  Rocket, Bookmark, Gamepad2, Gamepad, Trophy, MessageSquare, Send,
  Crown, Folder, FolderHeart, FolderMinus, ArrowLeft
} from 'lucide-react'
import toast from 'react-hot-toast'
import LazyRow from './LazyRow'

const GENRE_IDS = {
  "Action": 28,
  "Adventure": 12,
  "Animation": 16,
  "Comedy": 35,
  "Crime": 80,
  "Documentary": 99,
  "Drama": 18,
  "Family": 10751,
  "Fantasy": 14,
  "History": 36,
  "Horror": 27,
  "Music": 10402,
  "Mystery": 9648,
  "Romance": 10749,
  "Sci-Fi": 878,
  "Thriller": 53,
  "Western": 37
}

const LANGUAGE_CODES = {
  "English": "en",
  "Japanese": "ja",
  "Korean": "ko",
  "Spanish": "es",
  "French": "fr",
  "German": "de",
  "Hindi": "hi",
  "Tamil": "ta",
  "Telugu": "te",
  "Malayalam": "ml",
  "Kannada": "kn"
}

const CATEGORIES = ["Movie", "Series", "Anime Movie", "Anime Series"]

const GAME_GENRES = [
  'Action', 'Adventure', 'RPG', 'Strategy', 'Sports', 'Racing',
  'Shooter', 'Puzzle', 'Simulation', 'Horror', 'Fighting', 'Platformer',
  'Stealth', 'Survival', 'MMO', 'Visual Novel', 'Indie'
]

const GAME_PLATFORMS = [
  'PC', 'PlayStation 5', 'PlayStation 4', 'Xbox Series X',
  'Xbox One', 'Nintendo Switch', 'iOS', 'Android', 'Mac'
]

const GENRES = [
  "Action", "Adventure", "Comedy", "Crime", "Documentary", "Drama",
  "Fantasy", "Horror", "Mystery", "Romance", "Sci-Fi", "Thriller",
  "Western", "Psychological", "Slice of Life", "Supernatural", "Animation"
]

const LANGUAGES = [
  "English", "Japanese", "Korean", "Spanish", "French", "German",
  "Hindi", "Tamil", "Telugu", "Malayalam", "Kannada"
]

const REVIEW_TAGS = [
  'Mind-blowing', 'Emotional', 'Suspenseful', 'Inspirational',
  'Masterpiece', 'Must-watch', 'Hilarious', 'Heartwarming'
]

const GAME_TAGS = [
  'Mind-blowing', 'Addictive', 'Masterpiece', 'Must-play',
  'Hilarious', 'Challenging', 'Emotional', 'Relaxing'
]

const getRatingLabel = (val) => {
  if (val >= 4.9) return "Amazing!"
  if (val >= 3.9) return "Great"
  if (val >= 3.0) return "Good"
  if (val >= 2.0) return "Okay"
  return "Meh"
}

const PopcornRating = ({ rating, interactive = false, isGame = false, onChange = () => { } }) => {
  const stars = [1, 2, 3, 4, 5]
  const Icon = isGame ? Gamepad2 : PopcornIcon
  return (
    <div className="flex gap-1.5 items-center">
      {stars.map((i) => {
        const fill = Math.max(0, Math.min(1, rating - (i - 1)))
        return (
          <div
            key={i}
            className="relative cursor-pointer select-none"
            onClick={() => interactive && onChange(i)}
          >
            <Icon className="w-5 h-5 text-slate-700 opacity-30" />
            <div
              className={`absolute inset-0 overflow-hidden ${isGame
                ? 'text-cyan-300 fill-cyan-300 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                : 'text-yellow-500 fill-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]'
                }`}
              style={{ width: `${fill * 100}%` }}
            >
              <Icon className="w-5 h-5" />
            </div>
          </div>
        )
      })}
      {interactive && (
        <span className={`text-xs font-bold ${isGame ? 'text-cyan-300' : 'text-yellow-500'} ml-2`}>
          {Number(rating).toFixed(1)}
        </span>
      )}
    </div>
  )
}

const PopcornSlider = ({ value, onChange, isGame = false }) => {
  const containerRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const Icon = isGame ? Gamepad2 : PopcornIcon

  const updateValue = (clientX) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left))
    const pct = x / rect.width
    const rawVal = 1.0 + pct * 4.0
    const roundedVal = Math.round(rawVal * 10) / 10
    onChange(Math.max(1.0, Math.min(5.0, roundedVal)))
  }

  const handleMouseDown = (e) => {
    setIsDragging(true)
    updateValue(e.clientX)
  }

  const handleTouchStart = (e) => {
    setIsDragging(true)
    if (e.touches && e.touches[0]) {
      updateValue(e.touches[0].clientX)
    }
  }

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) updateValue(e.clientX)
    }
    const handleTouchMove = (e) => {
      if (isDragging && e.touches && e.touches[0]) {
        updateValue(e.touches[0].clientX)
      }
    }
    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      window.addEventListener('touchmove', handleTouchMove)
      window.addEventListener('touchend', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleMouseUp)
    }
  }, [isDragging])

  const percentage = ((value - 1) / 4) * 100

  return (
    <div className="space-y-2 mt-4 px-2 select-none">
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className="relative w-full h-10 flex items-center cursor-pointer touch-none"
      >
        {/* Slider Track (Gradient matching ref UI) */}
        <div className={`absolute left-0 right-0 h-4 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] ${isGame
          ? 'bg-gradient-to-r from-purple-950 via-violet-850 to-cyan-500'
          : 'bg-gradient-to-r from-indigo-900 via-purple-650 to-indigo-500'
          }`} />

        {/* Tick marks */}
        {[1, 2, 3, 4, 5].map((num) => {
          const tickPct = ((num - 1) / 4) * 100
          const active = value >= num
          return (
            <div
              key={num}
              className="absolute -translate-x-1/2 flex flex-col items-center gap-1.5 z-10"
              style={{ left: `${tickPct}%` }}
            >
              {/* Tick outline container */}
              <div className={`p-1.5 rounded-full transition-all duration-300 ${active ? 'text-white' : 'text-slate-500'}`}>
                <Icon className={`w-3.5 h-3.5 ${active ? 'fill-white/10' : ''}`} />
              </div>
              <span className={`text-[10px] font-black tracking-tight ${active ? 'text-white' : 'text-slate-500'}`}>
                {num}
              </span>
            </div>
          )
        })}

        {/* Custom Glowing Thumb */}
        <div
          className={`absolute -translate-x-1/2 w-10 h-10 rounded-full border-2 border-white text-white flex items-center justify-center transition-transform duration-100 z-20 cursor-grab active:cursor-grabbing ${isGame
            ? 'bg-gradient-to-br from-cyan-400 via-teal-500 to-violet-600 shadow-[0_0_22px_rgba(16,185,129,0.95),_0_4px_12px_rgba(0,0,0,0.5)]'
            : 'bg-gradient-to-br from-amber-300 via-indigo-500 to-red-500 shadow-[0_0_22px_rgba(249,115,22,0.95),_0_4px_12px_rgba(0,0,0,0.5)]'
            }`}
          style={{
            left: `${percentage}%`,
            transform: `translateX(-50%) scale(${isDragging ? 1.15 : 1})`
          }}
        >
          {/* Animated popcorn shake on hover */}
          <Icon className={`w-5 h-5 fill-white/10 ${isDragging ? 'animate-bounce' : ''}`} />
        </div>
      </div>
    </div>
  )
}

const renderMarkdown = (text) => {
  if (!text) return "";

  const paragraphs = text.split("\n\n");

  return paragraphs.map((para, pIdx) => {
    let html = para;

    // Bold: **text**
    html = html.replace(/\*\*(.*?)\*\*/g, 'strong_start$1strong_end');

    // Italics: *text*
    html = html.replace(/\*(.*?)\*/g, 'em_start$1em_end');

    // Bullet list items
    const isBulletList = para.trim().startsWith('- ') || para.trim().startsWith('* ');
    if (isBulletList) {
      const items = para.split(/\n[-*]\s+/);
      const listItems = items.map((item, iIdx) => {
        if (iIdx === 0 && item.trim() === '') return null;

        let cleaned = item.trim();
        if (cleaned.startsWith('- ') || cleaned.startsWith('* ')) {
          cleaned = cleaned.substring(2);
        }

        cleaned = cleaned.replace(/strong_start/g, '<strong>').replace(/strong_end/g, '</strong>');
        cleaned = cleaned.replace(/em_start/g, '<em>').replace(/em_end/g, '</em>');

        return <li key={iIdx} dangerouslySetInnerHTML={{ __html: cleaned }} />;
      }).filter(Boolean);

      return <ul key={pIdx} className="list-disc pl-5 my-1.5">{listItems}</ul>;
    }

    // Numbered list items
    const isNumberedList = /^\d+\.\s+/.test(para.trim());
    if (isNumberedList) {
      const items = para.split(/\n\d+\.\s+/);
      const listItems = items.map((item, iIdx) => {
        if (iIdx === 0 && !/^\d+\.\s+/.test(item)) {
          const match = item.match(/^\d+\.\s+(.*)/);
          if (match) item = match[1];
          else return null;
        }

        let cleaned = item.trim();
        cleaned = cleaned.replace(/strong_start/g, '<strong>').replace(/strong_end/g, '</strong>');
        cleaned = cleaned.replace(/em_start/g, '<em>').replace(/em_end/g, '</em>');

        return <li key={iIdx} dangerouslySetInnerHTML={{ __html: cleaned }} />;
      }).filter(Boolean);

      return <ol key={pIdx} className="list-decimal pl-5 my-1.5">{listItems}</ol>;
    }

    html = html.replace(/strong_start/g, '<strong>').replace(/strong_end/g, '</strong>');
    html = html.replace(/em_start/g, '<em>').replace(/em_end/g, '</em>');
    html = html.replace(/\n/g, '<br />');

    return <p key={pIdx} className="mb-2" dangerouslySetInnerHTML={{ __html: html }} />;
  });
};

const StatsPanel = ({ entries, isGame, PopcornRating }) => {
  const brandColorText = isGame ? 'text-cyan-300' : 'text-indigo-500'
  const brandBg = isGame ? 'bg-cyan-500/10 border-cyan-500/20' : 'bg-indigo-500/10 border-indigo-500/20'
  const barColor = isGame ? 'bg-cyan-500' : 'bg-indigo-500'

  // Calculations for Stats
  const totalCount = entries.length
  const ratedEntries = entries.filter(e => e.my_rating !== null)
  const avgRating = ratedEntries.length > 0
    ? (ratedEntries.reduce((sum, e) => sum + e.my_rating, 0) / ratedEntries.length).toFixed(1)
    : '0.0'

  // Statuses
  const watchingCount = entries.filter(e => isGame ? e.is_playing : e.is_watching).length
  const seenCount = entries.filter(e => isGame ? e.is_played : e.is_seen).length

  // Category / Platform counts
  const categoryCounts = {}
  entries.forEach(e => {
    const key = isGame ? (e.platform || 'Other') : e.category
    categoryCounts[key] = (categoryCounts[key] || 0) + 1
  })

  // Genre counts
  const genreCounts = {}
  entries.forEach(e => {
    if (e.genres) {
      e.genres.split(', ').forEach(g => {
        if (g) {
          genreCounts[g] = (genreCounts[g] || 0) + 1
        }
      })
    }
  })

  // Sort genres
  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const categoryCountsList = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
          <Trophy className={`w-5 h-5 ${brandColorText}`} />
          <span>Library Insights & Analytics</span>
        </h2>
        <p className="text-slate-400 text-xs mt-0.5">
          Real-time statistics and details for your {isGame ? 'gaming playlists' : 'entertainment lists'}.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-ink/40 border border-white/10 backdrop-blur-md flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Total Tracked</span>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-3xl font-black text-white">{totalCount}</span>
            <span className="text-xs font-semibold text-slate-400">{isGame ? 'games' : 'titles'}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-midnight mt-4 overflow-hidden">
            <div className={`h-full ${barColor}`} style={{ width: '100%' }} />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-ink/40 border border-white/10 backdrop-blur-md flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            {isGame ? 'Currently Playing' : 'Currently Watching'}
          </span>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-3xl font-black text-white">{watchingCount}</span>
            <span className={`w-2.5 h-2.5 rounded-full ${isGame ? 'bg-cyan-500' : 'bg-indigo-500'} animate-pulse inline-block align-middle ml-1`} />
          </div>
          <span className="text-[10px] text-slate-400 mt-4">Active engagement</span>
        </div>

        <div className="p-5 rounded-3xl bg-ink/40 border border-white/10 backdrop-blur-md flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            {isGame ? 'Played & Vaulted' : 'Seen & Vaulted'}
          </span>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-3xl font-black text-white">{seenCount}</span>
            <span className="text-xs font-semibold text-slate-400">completed</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-4">
            {totalCount > 0 ? ((seenCount / totalCount) * 100).toFixed(0) : 0}% completion rate
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-ink/40 border border-white/10 backdrop-blur-md flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Average Rating</span>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-3xl font-black text-white">{avgRating}</span>
            <Star className="w-5 h-5 fill-yellow-500 text-yellow-500 align-middle inline" />
          </div>
          <div className="mt-3 flex gap-1">
            <PopcornRating rating={Number(avgRating)} />
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Genre Performance */}
        <div className="p-6 rounded-3xl bg-ink/40 border border-white/10 backdrop-blur-md space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-white">Top Genres</h3>
          {topGenres.length === 0 ? (
            <p className="text-slate-500 text-xs italic py-6 text-center">Not enough data to calculate genres.</p>
          ) : (
            <div className="space-y-4">
              {topGenres.map(([genre, count]) => {
                const pct = totalCount > 0 ? ((count / totalCount) * 100).toFixed(0) : 0
                return (
                  <div key={genre} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-200">{genre}</span>
                      <span className="text-slate-400 font-bold">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-midnight overflow-hidden">
                      <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Type / Platform Distribution */}
        <div className="p-6 rounded-3xl bg-ink/40 border border-white/10 backdrop-blur-md space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-white">
            {isGame ? 'Platform Distribution' : 'Category Distribution'}
          </h3>
          {categoryCountsList.length === 0 ? (
            <p className="text-slate-500 text-xs italic py-6 text-center">No categories to display.</p>
          ) : (
            <div className="space-y-3">
              {categoryCountsList.map(([cat, count]) => {
                const pct = totalCount > 0 ? ((count / totalCount) * 100).toFixed(0) : 0
                return (
                  <div key={cat} className="flex justify-between items-center p-3 bg-midnight/40 border border-white/5 rounded-2xl hover:border-white/10 transition-colors">
                    <span className="text-xs font-bold text-slate-200">{cat}</span>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${brandBg} ${brandColorText}`}>
                        {count} {count === 1 ? (isGame ? 'game' : 'title') : (isGame ? 'games' : 'titles')}
                      </span>
                      <span className="text-xs text-slate-500 font-semibold">{pct}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const LeaderboardPanel = ({ entries, isGame, fetchEntries, popcornApi, gamesApi, PopcornRating }) => {
  const [isUpdating, setIsUpdating] = useState(false)
  const [selectedAddId, setSelectedAddId] = useState('')
  const brandColorText = isGame ? 'text-cyan-300' : 'text-indigo-500'
  const brandBg = isGame ? 'bg-cyan-500/10 border-cyan-500/20' : 'bg-indigo-500/10 border-indigo-500/20'
  const selectFocus = isGame ? 'focus:border-cyan-500' : 'focus:border-indigo-500'

  const [isEditingRanks, setIsEditingRanks] = useState(false)
  const [tempRanks, setTempRanks] = useState({})

  const handleSaveRanks = async () => {
    setIsUpdating(true)
    try {
      const newRankList = rankedItems.map(item => {
        const nr = tempRanks[item.id]
        return {
          id: item.id,
          newRank: (nr === '' || nr === undefined || nr === null) ? 9999 : Number(nr)
        }
      })

      newRankList.sort((a, b) => {
        if (a.newRank !== b.newRank) {
          return a.newRank - b.newRank
        }
        const itemA = entries.find(x => x.id === a.id)
        const itemB = entries.find(x => x.id === b.id)
        return (itemA?.rank || 0) - (itemB?.rank || 0)
      })

      for (let i = 0; i < newRankList.length; i++) {
        const targetId = newRankList[i].id
        const finalRank = i + 1
        const currentItem = entries.find(x => x.id === targetId)
        if (currentItem && currentItem.rank !== finalRank) {
          if (isGame) {
            await gamesApi.update(targetId, { rank: finalRank })
          } else {
            await popcornApi.update(targetId, { rank: finalRank })
          }
        }
      }

      toast.success('Ranks updated successfully!')
      setIsEditingRanks(false)
      await fetchEntries()
    } catch (err) {
      toast.error('Failed to save ranks')
    } finally {
      setIsUpdating(false)
    }
  }

  // Get ranked entries, sorted by rank ascending
  const rankedItems = entries
    .filter(e => e.rank !== null && e.rank !== undefined)
    .sort((a, b) => a.rank - b.rank)

  // Auto-compact/repair gaps in ranks
  useEffect(() => {
    const compactRanks = async () => {
      let needsCompacting = false
      for (let i = 0; i < rankedItems.length; i++) {
        if (rankedItems[i].rank !== i + 1) {
          needsCompacting = true
          break
        }
      }
      if (needsCompacting && !isUpdating) {
        setIsUpdating(true)
        try {
          for (let i = 0; i < rankedItems.length; i++) {
            if (rankedItems[i].rank !== i + 1) {
              if (isGame) {
                await gamesApi.update(rankedItems[i].id, { rank: i + 1 })
              } else {
                await popcornApi.update(rankedItems[i].id, { rank: i + 1 })
              }
            }
          }
          await fetchEntries()
        } catch (err) {
          console.error("Failed to compact ranks:", err)
        } finally {
          setIsUpdating(false)
        }
      }
    }
    compactRanks()
  }, [entries])

  // Get unranked entries for dropdown selection
  const unrankedItems = entries.filter(e => e.rank === null || e.rank === undefined)

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!selectedAddId || isUpdating) return
    setIsUpdating(true)
    try {
      const selectedItem = entries.find(x => x.id === parseInt(selectedAddId))
      if (selectedItem) {
        const nextRank = rankedItems.length + 1
        if (isGame) {
          await gamesApi.update(selectedItem.id, { rank: nextRank })
        } else {
          await popcornApi.update(selectedItem.id, { rank: nextRank })
        }
        toast.success(`"${selectedItem.title}" ranked #${nextRank}!`)
        setSelectedAddId('')
        await fetchEntries()
      }
    } catch (err) {
      toast.error('Failed to add to leaderboard')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleMove = async (index, direction) => {
    if (isUpdating) return
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= rankedItems.length) return

    setIsUpdating(true)
    try {
      const itemA = rankedItems[index]
      const itemB = rankedItems[targetIndex]

      const rankA = itemA.rank
      const rankB = itemB.rank

      if (isGame) {
        await gamesApi.update(itemA.id, { rank: rankB })
        await gamesApi.update(itemB.id, { rank: rankA })
      } else {
        await popcornApi.update(itemA.id, { rank: rankB })
        await popcornApi.update(itemB.id, { rank: rankA })
      }

      toast.success('Leaderboard updated')
      await fetchEntries()
    } catch (err) {
      toast.error('Failed to update ranking order')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleRemove = async (item) => {
    if (isUpdating) return
    setIsUpdating(true)
    try {
      const currentRank = item.rank
      // Clear rank on target item
      if (isGame) {
        await gamesApi.update(item.id, { rank: null })
      } else {
        await popcornApi.update(item.id, { rank: null })
      }

      // Shift ranks of remaining items to close the gap
      const itemsToShift = rankedItems.filter(x => x.rank > currentRank)
      for (const otherItem of itemsToShift) {
        if (isGame) {
          await gamesApi.update(otherItem.id, { rank: otherItem.rank - 1 })
        } else {
          await popcornApi.update(otherItem.id, { rank: otherItem.rank - 1 })
        }
      }

      toast.success(`Removed "${item.title}" from leaderboard`)
      await fetchEntries()
    } catch (err) {
      toast.error('Failed to remove from leaderboard')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Crown className="w-6 h-6 text-yellow-500 animate-pulse" />
              <span>Personal Leaderboard</span>
            </h2>
            
            {rankedItems.length > 0 && (
              <div className="ml-2">
                {isEditingRanks ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveRanks}
                      disabled={isUpdating}
                      className={`px-3 py-1.5 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1 shrink-0 ${isGame ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-indigo-600 hover:bg-indigo-500'}`}
                    >
                      {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      <span>Save Ranks</span>
                    </button>
                    <button
                      onClick={() => setIsEditingRanks(false)}
                      disabled={isUpdating}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      const initialRanks = {}
                      rankedItems.forEach(item => {
                        initialRanks[item.id] = item.rank
                      })
                      setTempRanks(initialRanks)
                      setIsEditingRanks(true)
                    }}
                    className="px-3 py-1.5 bg-midnight/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-white/10 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Ranks</span>
                  </button>
                )}
              </div>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Rank your absolute favorite {isGame ? 'games' : 'movies & shows'}. Click 'Edit Ranks' to directly reorder them.
          </p>
        </div>

        {/* Add Item to Leaderboard Form */}
        {!isEditingRanks && unrankedItems.length > 0 && (
          <form onSubmit={handleAdd} className="flex items-center gap-2 bg-ink/40 border border-white/10 p-1.5 rounded-2xl animate-in fade-in duration-300">
            <select
              value={selectedAddId}
              onChange={(e) => setSelectedAddId(e.target.value)}
              className={`bg-midnight border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none transition-all ${selectFocus} max-w-[200px] sm:max-w-xs`}
            >
              <option value="">-- Choose item to rank --</option>
              {unrankedItems.map(item => (
                <option key={item.id} value={item.id}>
                  {item.title} ({isGame ? item.platform : item.category})
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={!selectedAddId || isUpdating}
              className={`px-4 py-1.5 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1 shrink-0 ${isGame ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-indigo-600 hover:bg-indigo-500'
                } disabled:opacity-40 disabled:pointer-events-none`}
            >
              {isUpdating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Rank Item</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {rankedItems.length === 0 ? (
        <div className="bg-ink/20 border border-white/10/60 p-12 rounded-3xl text-center backdrop-blur-sm">
          <Crown className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Your Leaderboard is Empty</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-2 leading-relaxed">
            You haven't ranked any {isGame ? 'games' : 'movies or shows'} yet! Select a title from the dropdown above to add it to your leaderboard.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rankedItems.map((item, index) => {
            const isTop3 = item.rank <= 3
            const rankLabel = item.rank === 1 ? '🥇 1st' : item.rank === 2 ? '🥈 2nd' : item.rank === 3 ? '🥉 3rd' : `#${item.rank}`
            const rankBadgeColor = item.rank === 1
              ? 'bg-yellow-500/10 border-yellow-500/30 text-amber-300 shadow-[0_0_15px_rgba(234,179,8,0.15)] font-black text-xs scale-[1.05]'
              : item.rank === 2
                ? 'bg-slate-300/10 border-slate-300/30 text-slate-200 font-black text-xs'
                : item.rank === 3
                  ? 'bg-amber-600/10 border-amber-600/30 text-amber-500 font-black text-xs'
                  : 'bg-midnight/80 border-white/5 text-slate-400 text-[11px] font-bold'

            return (
              <div
                key={item.id}
                className="group relative bg-ink/40 hover:bg-ink/60 border border-white/10 hover:border-white/10 p-4 rounded-3xl flex items-center justify-between gap-4 transition-all duration-300 backdrop-blur-md"
              >
                {/* Left side: Rank, Image and metadata */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  {/* Rank Badge or Input */}
                  {isEditingRanks ? (
                    <input
                      type="number"
                      min="1"
                      value={tempRanks[item.id] !== undefined ? tempRanks[item.id] : ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : parseInt(e.target.value)
                        setTempRanks(prev => ({
                          ...prev,
                          [item.id]: val
                        }))
                      }}
                      className={`w-16 h-8 text-center bg-midnight border ${
                        isGame ? 'border-cyan-500/50 focus:border-cyan-500' : 'border-indigo-500/50 focus:border-indigo-500'
                      } rounded-xl text-xs font-black text-white outline-none transition-all`}
                    />
                  ) : (
                    <div className={`w-16 h-8 flex items-center justify-center rounded-xl border shrink-0 uppercase tracking-wider transition-transform duration-300 ${rankBadgeColor}`}>
                      {rankLabel}
                    </div>
                  )}

                  {/* Thumbnail */}
                  {item.poster_url ? (
                    <img
                      src={item.poster_url}
                      alt={item.title}
                      className="w-10 h-14 object-cover rounded-xl border border-white/5 shadow-md shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-14 bg-midnight rounded-xl border border-white/5 flex items-center justify-center shrink-0">
                      {isGame ? <Gamepad className="w-5 h-5 text-slate-600" /> : <Film className="w-5 h-5 text-slate-600" />}
                    </div>
                  )}

                  {/* Text details */}
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-black text-white truncate" title={item.title}>
                      {item.title}
                    </h4>
                    <p className="text-[9px] font-bold text-slate-500 mt-0.5 uppercase tracking-wider">
                      {isGame ? item.platform : item.category}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      {item.my_rating && (
                        <div className="flex items-center gap-2">
                          {/* Mobile compact rating */}
                          <div className="flex sm:hidden items-center gap-1 text-[10px] font-black text-amber-300">
                            <span>My Rating:</span>
                            <span>{Number(item.my_rating).toFixed(1)}</span>
                            {isGame ? <Gamepad className="w-3.5 h-3.5 text-cyan-400" /> : <PopcornIcon className="w-3.5 h-3.5 text-indigo-500" />}
                          </div>
                          {/* Desktop full rating */}
                          <div className="hidden sm:flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400">My Rating:</span>
                            <PopcornRating rating={item.my_rating} isGame={isGame} />
                          </div>
                        </div>
                      )}
                      {item.genres && (
                        <span className="text-[10px] text-slate-500 truncate hidden sm:inline">
                          {item.genres.split(', ').slice(0, 2).join(' • ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side: Delete Controls */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleRemove(item)}
                    disabled={isUpdating}
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-xl border border-red-500/15 transition-all"
                    title="Remove from Leaderboard"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const OnboardingModal = ({
  authApi,
  tmdbApi,
  rawgApi,
  LANGUAGES,
  refreshUser,
  fetchPersonalizedRecs,
  fetchRecommendations,
  fetchEntries,
  setShowOnboarding,
  setShowSaveCelebration
}) => {
  const [step, setStep] = useState(1)
  const [tutorialSlide, setTutorialSlide] = useState(0)

  // Step 2: Languages selection
  const [selectedLangs, setSelectedLangs] = useState([])

  // Step 3: Movies search & selection
  const [movieQuery, setMovieQuery] = useState('')
  const [movieResults, setMovieResults] = useState([])
  const [movieLoading, setMovieLoading] = useState(false)
  const [selectedMovies, setSelectedMovies] = useState([])

  // Step 4: Games search & selection
  const [gameQuery, setGameQuery] = useState('')
  const [gameResults, setGameResults] = useState([])
  const [gameLoading, setGameLoading] = useState(false)
  const [selectedGames, setSelectedGames] = useState([])

  const [isSubmittingOnboard, setIsSubmittingOnboard] = useState(false)

  // Debounced TMDB search for movies onboarding
  useEffect(() => {
    if (step !== 3) return
    const delayDebounce = setTimeout(async () => {
      if (movieQuery.trim().length > 1) {
        setMovieLoading(true)
        try {
          const res = await tmdbApi.search(movieQuery)
          setMovieResults(res.slice(0, 5))
        } catch (err) {
          console.error(err)
        } finally {
          setMovieLoading(false)
        }
      } else {
        setMovieResults([])
      }
    }, 350)
    return () => clearTimeout(delayDebounce)
  }, [movieQuery, step])

  // Debounced RAWG search for games onboarding
  useEffect(() => {
    if (step !== 4) return
    const delayDebounce = setTimeout(async () => {
      if (gameQuery.trim().length > 1) {
        setGameLoading(true)
        try {
          const res = await rawgApi.search(gameQuery)
          setGameResults(res.slice(0, 5))
        } catch (err) {
          console.error(err)
        } finally {
          setGameLoading(false)
        }
      } else {
        setGameResults([])
      }
    }, 350)
    return () => clearTimeout(delayDebounce)
  }, [gameQuery, step])

  const handleToggleLang = (lang) => {
    if (selectedLangs.includes(lang)) {
      setSelectedLangs(prev => prev.filter(x => x !== lang))
    } else {
      if (selectedLangs.length >= 10) {
        toast.error('You can select up to 10 preferred languages!')
        return
      }
      setSelectedLangs(prev => [...prev, lang])
    }
  }

  const handleSelectMovie = (movie) => {
    if (selectedMovies.some(x => x.title === movie.title)) {
      setSelectedMovies(prev => prev.filter(x => x.title !== movie.title))
    } else {
      if (selectedMovies.length >= 10) {
        toast.error('You can select up to 10 favorite movies/shows!')
        return
      }
      const newItem = {
        title: movie.title,
        category: movie.category || 'Movie',
        language: movie.language || 'English',
        rating: movie.rating || 0.0,
        synopsis: movie.synopsis || '',
        genres: movie.genres || '',
        poster_url: movie.poster_url || '',
        my_rating: 5.0,  // Defaults to 5-star
        is_seen: true,
        is_watching: false,
        reasons_for_liking: 'Selected during onboarding profile setup.',
        group_ids: []
      }
      setSelectedMovies(prev => [...prev, newItem])
    }
  }

  const handleSelectGame = (game) => {
    if (selectedGames.some(x => x.title === game.title)) {
      setSelectedGames(prev => prev.filter(x => x.title !== game.title))
    } else {
      if (selectedGames.length >= 10) {
        toast.error('You can select up to 10 favorite games!')
        return
      }
      const newItem = {
        title: game.title,
        platform: game.platform || 'PC',
        rating: game.rating || 0.0,
        synopsis: game.synopsis || '',
        genres: game.genres || '',
        poster_url: game.poster_url || '',
        my_rating: 5.0,  // Defaults to 5-star
        is_played: true,
        is_playing: false,
        reasons_for_liking: 'Selected during onboarding profile setup.',
        group_ids: []
      }
      setSelectedGames(prev => [...prev, newItem])
    }
  }

  const handleSubmitOnboard = async () => {
    setIsSubmittingOnboard(true)
    try {
      await authApi.onboard({
        preferred_languages: selectedLangs,
        movies: selectedMovies,
        games: selectedGames
      })

      setShowSaveCelebration(true)
      setTimeout(() => setShowSaveCelebration(false), 2500)

      toast.success('Onboarding complete! Loading your custom dashboard...')

      await refreshUser()
      fetchPersonalizedRecs()
      fetchRecommendations()
      fetchEntries()

      setShowOnboarding(false)
    } catch (err) {
      toast.error('Onboarding failed. Please try again.')
    } finally {
      setIsSubmittingOnboard(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-midnight/80 backdrop-blur-lg select-none">
      <div className="relative glass-strong w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="p-6 border-b border-white/5 bg-midnight/40 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Step {step} of 4</span>
            <h2 className="text-lg font-black text-white uppercase tracking-wider mt-1">
              {step === 1 && "Application Features Overview"}
              {step === 2 && "Select Preferred Languages"}
              {step === 3 && "Pick Liked Movies, Shows & Anime"}
              {step === 4 && "Pick Liked Games"}
            </h2>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className={`w-6 h-1.5 rounded-full transition-all duration-300 ${i <= step ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]' : 'bg-slate-800'}`} />
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {step === 1 && (
            <div className="space-y-6">
              {/* Carousel card */}
              <div className="bg-midnight/40 border border-white/10 p-6 rounded-3xl min-h-[320px] flex flex-col justify-between items-center text-center relative overflow-hidden">
                {/* Glow blob */}
                <div className={`absolute -top-12 -left-12 w-36 h-36 rounded-full blur-2xl pointer-events-none opacity-20 transition-colors duration-500 ${tutorialSlide === 0 ? 'bg-indigo-500' :
                  tutorialSlide === 1 ? 'bg-purple-500' :
                    tutorialSlide === 2 ? 'bg-cyan-500' : 'bg-cyan-500'
                  }`} />

                <div className="flex-grow w-full py-2 animate-in fade-in zoom-in-95 duration-300">
                  {tutorialSlide === 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                      <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-4">
                        <div className="p-4 rounded-3xl bg-gradient-to-br from-indigo-500 to-red-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)] animate-bounce self-center md:self-start">
                          <Sparkles className="w-8 h-8 animate-pulse" />
                        </div>
                        <h3 className="text-lg font-black text-white uppercase tracking-wider">Welcome to Popcorn & GameCorn</h3>
                        <p className="text-slate-200 text-xs leading-relaxed">
                          A premium double-sided hub designed to track your entire entertainment library. Seamlessly switch between **Popcorn Mode** for movies/shows and **GameCorn Mode** for games using the switcher in the header.
                        </p>
                      </div>
                      <div className="relative group overflow-hidden rounded-2xl border border-white/10 bg-midnight flex items-center justify-center p-1">
                        <img
                          src="/tutorial_welcome.png"
                          alt="Welcome Tutorial"
                          className="w-full max-h-[180px] md:max-h-[220px] object-cover rounded-xl transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent pointer-events-none" />
                      </div>
                    </div>
                  )}

                  {tutorialSlide === 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                      <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-4">
                        <div className="p-4 rounded-3xl bg-gradient-to-br from-purple-500 to-indigo-500 text-white shadow-[0_0_20px_rgba(147,51,234,0.3)] self-center md:self-start">
                          <Bookmark className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-black text-white uppercase tracking-wider">Statuses & Tracking</h3>
                        <p className="text-slate-200 text-xs leading-relaxed">
                          Organize your titles: send to **Watchlist / Backlog**, log active sessions in **Currently Watching / Currently Playing** (with count badges), or store completed logs in **Seen / Played** with custom reviews.
                        </p>
                      </div>
                      <div className="relative group overflow-hidden rounded-2xl border border-white/10 bg-midnight flex items-center justify-center p-1">
                        <img
                          src="/tutorial_tracking.png"
                          alt="Tracking Tutorial"
                          className="w-full max-h-[180px] md:max-h-[220px] object-cover rounded-xl transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent pointer-events-none" />
                      </div>
                    </div>
                  )}

                  {tutorialSlide === 2 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                      <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-4">
                        <div className="p-4 rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] self-center md:self-start">
                          <Plus className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-black text-white uppercase tracking-wider">Custom Wishlist Groups</h3>
                        <p className="text-slate-200 text-xs leading-relaxed">
                          Create multiple groups like "Weekend Binge", "Co-op Backlog", or "Anime Classics" and associate items dynamically to build highly tailored custom wishlists.
                        </p>
                      </div>
                      <div className="relative group overflow-hidden rounded-2xl border border-white/10 bg-midnight flex items-center justify-center p-1">
                        <img
                          src="/tutorial_groups.png"
                          alt="Groups Tutorial"
                          className="w-full max-h-[180px] md:max-h-[220px] object-cover rounded-xl transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent pointer-events-none" />
                      </div>
                    </div>
                  )}

                  {tutorialSlide === 3 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                      <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-4">
                        <div className="p-4 rounded-3xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] self-center md:self-start">
                          <Trophy className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-black text-white uppercase tracking-wider">AI Assistant & Insights</h3>
                        <p className="text-slate-200 text-xs leading-relaxed">
                          Ask your context-aware **AI assistant** for recommendations or watchlist analysis, and view real-time library metrics (genre progress bars and platform counts) on the new **Stats Panel**.
                        </p>
                      </div>
                      <div className="relative group overflow-hidden rounded-2xl border border-white/10 bg-midnight flex items-center justify-center p-1">
                        <img
                          src="/tutorial_ai.png"
                          alt="AI & Stats Tutorial"
                          className="w-full max-h-[180px] md:max-h-[220px] object-cover rounded-xl transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent pointer-events-none" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Dot markers */}
                <div className="flex gap-2 mt-4">
                  {[0, 1, 2, 3].map(i => (
                    <button
                      key={i}
                      onClick={() => setTutorialSlide(i)}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${tutorialSlide === i ? 'bg-indigo-500 w-6' : 'bg-slate-800'}`}
                    />
                  ))}
                </div>
              </div>

              {/* Prev/Next buttons for slide */}
              <div className="flex justify-between items-center px-2">
                <button
                  disabled={tutorialSlide === 0}
                  onClick={() => setTutorialSlide(prev => prev - 1)}
                  className="px-4 py-2 border border-white/10 text-slate-400 hover:text-white font-bold rounded-xl text-xs transition-colors disabled:opacity-40"
                >
                  Previous Slide
                </button>
                {tutorialSlide < 3 ? (
                  <button
                    onClick={() => setTutorialSlide(prev => prev + 1)}
                    className="px-4 py-2 bg-slate-800 text-white font-bold rounded-xl text-xs hover:bg-slate-700 transition-colors"
                  >
                    Next Slide
                  </button>
                ) : (
                  <button
                    onClick={() => setStep(2)}
                    className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs hover:bg-indigo-500 transition-all flex items-center gap-1.5"
                  >
                    <span>Proceed to Setup</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Select the languages you prefer to watch content in. We will use this to fine-tune your personalized recommendations. (Pick up to 10)
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
                {LANGUAGES.map(lang => {
                  const active = selectedLangs.includes(lang)
                  return (
                    <button
                      key={lang}
                      onClick={() => handleToggleLang(lang)}
                      className={`p-3 rounded-2xl border text-xs font-bold transition-all text-center flex items-center justify-between ${active
                        ? 'bg-indigo-500/10 border-indigo-500 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.25)]'
                        : 'bg-midnight/50 border-white/5 text-slate-400 hover:border-white/10 hover:text-slate-200'
                        }`}
                    >
                      <span>{lang}</span>
                      {active && <Check className="w-3.5 h-3.5 text-indigo-300" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Search and add movies, TV shows, or anime series you have watched and liked. This seeds your recommendation engine. (Pick up to 10)
              </p>

              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search globally (e.g. Inception, Breaking Bad, Naruto)..."
                  value={movieQuery}
                  onChange={(e) => setMovieQuery(e.target.value)}
                  className="w-full bg-midnight/60 border border-white/10 focus:border-indigo-500 rounded-xl pl-11 pr-4 py-2.5 text-xs text-slate-200 outline-none transition-all placeholder:text-slate-500"
                />
              </div>

              {movieLoading && (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                </div>
              )}

              {/* Search Results list */}
              {!movieLoading && movieResults.length > 0 && (
                <div className="bg-midnight/50 border border-slate-850 rounded-2xl overflow-hidden divide-y divide-white/5">
                  {movieResults.map((movie) => {
                    const alreadySelected = selectedMovies.some(x => x.title === movie.title)
                    return (
                      <div key={movie.title} className="p-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          {movie.poster_url ? (
                            <img src={movie.poster_url} className="w-9 h-12 object-cover rounded-md shrink-0" alt="" />
                          ) : (
                            <div className="w-9 h-12 bg-ink rounded-md shrink-0 flex items-center justify-center">
                              <Film className="w-4 h-4 text-slate-700" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{movie.title}</p>
                            <p className="text-[10px] text-slate-500">{movie.category} • {movie.language} • {movie.genres}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleSelectMovie(movie)}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 transition-all ${alreadySelected
                            ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/25'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                            }`}
                        >
                          {alreadySelected ? 'Remove' : 'Like'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Selected Items section */}
              {selectedMovies.length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Liked Movies ({selectedMovies.length}/10)</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedMovies.map(movie => (
                      <div key={movie.title} className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-full text-xs font-semibold">
                        <span className="truncate max-w-[150px]">{movie.title}</span>
                        <button onClick={() => setSelectedMovies(prev => prev.filter(x => x.title !== movie.title))} className="hover:text-white rounded-full p-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Search and add games you have played and loved. This seeds your recommendation engine. (Pick up to 10)
              </p>

              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search globally (e.g. Elden Ring, GTA V, Witcher 3)..."
                  value={gameQuery}
                  onChange={(e) => setGameQuery(e.target.value)}
                  className="w-full bg-midnight/60 border border-slate-850 focus:border-cyan-500 rounded-xl pl-11 pr-4 py-2.5 text-xs text-slate-200 outline-none transition-all placeholder:text-slate-500"
                />
              </div>

              {gameLoading && (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-cyan-500" />
                </div>
              )}

              {/* Search Results list */}
              {!gameLoading && gameResults.length > 0 && (
                <div className="bg-midnight/50 border border-slate-850 rounded-2xl overflow-hidden divide-y divide-white/5">
                  {gameResults.map((game) => {
                    const alreadySelected = selectedGames.some(x => x.title === game.title)
                    return (
                      <div key={game.title} className="p-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          {game.poster_url ? (
                            <img src={game.poster_url} className="w-9 h-12 object-cover rounded-md shrink-0" alt="" />
                          ) : (
                            <div className="w-9 h-12 bg-ink rounded-md shrink-0 flex items-center justify-center">
                              <Gamepad className="w-4 h-4 text-slate-700" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{game.title}</p>
                            <p className="text-[10px] text-slate-500">{game.platform} • {game.genres}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleSelectGame(game)}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 transition-all ${alreadySelected
                            ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/25'
                            : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                            }`}
                        >
                          {alreadySelected ? 'Remove' : 'Like'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Selected Items section */}
              {selectedGames.length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Liked Games ({selectedGames.length}/10)</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedGames.map(game => (
                      <div key={game.title} className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 rounded-full text-xs font-semibold">
                        <span className="truncate max-w-[150px]">{game.title}</span>
                        <button onClick={() => setSelectedGames(prev => prev.filter(x => x.title !== game.title))} className="hover:text-white rounded-full p-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-midnight/40 flex justify-between items-center">
          <button
            onClick={() => step > 1 && setStep(prev => prev - 1)}
            disabled={step === 1}
            className="px-4 py-2 border border-white/10 text-slate-400 hover:text-white font-bold rounded-xl text-xs transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            Back
          </button>
          {step < 4 ? (
            <button
              onClick={() => {
                if (step === 2 && selectedLangs.length === 0) {
                  toast.error('Please select at least one language!')
                  return
                }
                setStep(prev => prev + 1)
              }}
              className="px-5 py-2 text-white font-bold rounded-xl text-xs bg-indigo-600 hover:bg-indigo-500 transition-colors"
            >
              Next Step
            </button>
          ) : (
            <button
              onClick={handleSubmitOnboard}
              disabled={isSubmittingOnboard}
              className="px-5 py-2 text-white font-bold rounded-xl text-xs bg-indigo-600 hover:bg-indigo-500 transition-colors flex items-center gap-1.5"
            >
              {isSubmittingOnboard ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Seeding recommendations...</span>
                </>
              ) : (
                <span>Complete Setup</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PopcornDashboard() {
  const { logout, user, refreshUser } = useAuth()
  const navigate = useNavigate()

  const [appMode, setAppMode] = useState(() => localStorage.getItem('popcorn_app_mode') || 'popcorn')
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    if (user && user.onboarded === false) {
      setShowOnboarding(true)
    }
  }, [user])

  // AI Chatbot State
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatMessagesEndRef = useRef(null)

  // Scroll to bottom of chat when messages change or chat is opened
  useEffect(() => {
    if (chatOpen) {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages, chatOpen])

  // Initialize or reset chatbot greeting when app mode changes
  useEffect(() => {
    const greeting = appMode === 'gamecorn'
      ? "Hi! I am GameCorn AI, your retro gaming assistant. Ask me for recommendations, search for games, or let me analyze your Playlist/Backlog! 🎮"
      : "Hi! I am Popcorn AI, your personal watch assistant. Ask me to recommend movies, series, or anime, or discuss your Watchlist! 🍿"
    setChatMessages([
      { role: 'assistant', content: greeting, recommendations: [] }
    ])
  }, [appMode])

  const handleSendChatMessage = async (e) => {
    e.preventDefault()
    if (!chatInput.trim() || chatLoading) return

    const userMessage = { role: 'user', content: chatInput.trim(), recommendations: [] }
    setChatMessages(prev => [...prev, userMessage])
    setChatInput('')
    setChatLoading(true)

    try {
      const messagesHistory = [...chatMessages, userMessage].slice(1).map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      if (messagesHistory.length === 0) {
        messagesHistory.push({ role: 'user', content: userMessage.content })
      }

      const response = await aiApi.chat({
        messages: messagesHistory,
        app_mode: appMode
      })

      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: response.message,
        recommendations: response.recommendations || []
      }])
    } catch (err) {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Oops, I encountered a communication error with the backend. Please check if your FastAPI server is running with the GROQ API key configured!',
        recommendations: []
      }])
    } finally {
      setChatLoading(false)
    }
  }
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitionTarget, setTransitionTarget] = useState('')

  const triggerModeSwitch = (targetMode) => {
    if (isTransitioning || appMode === targetMode) return
    setIsTransitioning(true)
    setTransitionTarget(targetMode)

    setTimeout(() => {
      setAppMode(targetMode)
    }, 850)

    setTimeout(() => {
      setIsTransitioning(false)
      setTransitionTarget('')
    }, 1700)
  }

  useEffect(() => {
    localStorage.setItem('popcorn_app_mode', appMode)
  }, [appMode])

  // Derived mode constants (used throughout event handlers)
  const isGame = appMode === 'gamecorn'

  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [editingEntry, setEditingEntry] = useState(null)
  const [loadingDescription, setLoadingDescription] = useState(false)

  // Recommendations & Discover tab state
  const [activeTab, setActiveTab] = useState('discover')
  const [recommendations, setRecommendations] = useState(null)
  const [recLoading, setRecLoading] = useState(false)
  const [personalizedRecs, setPersonalizedRecs] = useState([])
  const [personalizedRecsLoading, setPersonalizedRecsLoading] = useState(false)
  const [similarItems, setSimilarItems] = useState([])
  const [similarItemsLoading, setSimilarItemsLoading] = useState(false)

  const [discoverCategory, setDiscoverCategory] = useState('movie')
  const [discoverGenre, setDiscoverGenre] = useState('All')
  const [discoverLanguage, setDiscoverLanguage] = useState('All')
  const [discoverItems, setDiscoverItems] = useState([])
  const [discoverLoading, setDiscoverLoading] = useState(false)

  // Seen review form states
  const [seenRating, setSeenRating] = useState(3.0)
  const [seenComments, setSeenComments] = useState('')
  const [showSeenForm, setShowSeenForm] = useState(false)
  const [selectedTags, setSelectedTags] = useState([])
  const [showPoppingLoader, setShowPoppingLoader] = useState(false)
  const [showSaveCelebration, setShowSaveCelebration] = useState(false)

  // Custom Groups State
  const [groups, setGroups] = useState([])
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('All')
  const [showGroupsModal, setShowGroupsModal] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [isSavingGroup, setIsSavingGroup] = useState(false)

  // Add to Group Modal State
  const [showAddToGroupModal, setShowAddToGroupModal] = useState(false)
  const [addToGroupTarget, setAddToGroupTarget] = useState(null)
  const [selectedGroupIds, setSelectedGroupIds] = useState([])
  const [newGroupModalInput, setNewGroupModalInput] = useState('')
  const [isCreatingGroupInModal, setIsCreatingGroupInModal] = useState(false)
  const [isSavingWatchlist, setIsSavingWatchlist] = useState(false)
  const [togglingGroupId, setTogglingGroupId] = useState(null)
  const [updatingStatusType, setUpdatingStatusType] = useState(null)
  const [isSavingSeen, setIsSavingSeen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deletingGroupId, setDeletingGroupId] = useState(null)


  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [tmdbSearchResults, setTmdbSearchResults] = useState([])
  const [isSearchingTmdb, setIsSearchingTmdb] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'Movie',
    language: 'English',
    rating: 3.0,
    synopsis: '',
    reasons_for_liking: '',
    genres: [],
    poster_url: '',
    poster_data: '',
    platform: 'PC'
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Dashboard Filters
  const [filterCategory, setFilterCategory] = useState('All')
  const [filterGenre, setFilterGenre] = useState('All')
  const [filterLanguage, setFilterLanguage] = useState('All')
  const [dashboardSearch, setDashboardSearch] = useState('')

  // Global Search states
  const [globalSearchQuery, setGlobalSearchQuery] = useState('')
  const [globalSearchResults, setGlobalSearchResults] = useState([])
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false)
  const [globalSearchLanguage, setGlobalSearchLanguage] = useState('All')

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (globalSearchQuery.trim().length > 1) {
        setIsSearchingGlobal(true)
        try {
          const results = appMode === 'gamecorn' ? await rawgApi.search(globalSearchQuery) : await tmdbApi.search(globalSearchQuery)
          setGlobalSearchResults(results.slice(0, 6))
        } catch (err) {
          toast.error('Search failed')
        } finally {
          setIsSearchingGlobal(false)
        }
      } else {
        setGlobalSearchResults([])
      }
    }, 400)
    return () => clearTimeout(delayDebounce)
  }, [globalSearchQuery, appMode])

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  const fetchEntries = async () => {
    setLoading(true)
    try {
      const data = appMode === 'gamecorn' ? await gamesApi.getAll() : await popcornApi.getAll()
      setEntries(data)
    } catch (err) {
      toast.error(`Failed to load ${appMode === 'gamecorn' ? 'Playlist' : 'watchlist'} entries`)
    } finally {
      setLoading(false)
    }
  }

  const fetchGroups = async () => {
    try {
      const data = await groupsApi.getAll(appMode)
      setGroups(data)
    } catch (err) {
      console.error('Failed to load custom groups:', err)
    }
  }

  useEffect(() => {
    fetchEntries()
    fetchGroups()
    setSelectedGroupFilter('All')
    setRecommendations(null)
    setPersonalizedRecs([])
    setSimilarItems([])
  }, [appMode])

  const fetchPersonalizedRecs = async () => {
    setPersonalizedRecsLoading(true)
    try {
      const pData = appMode === 'gamecorn' ? await rawgApi.getPersonalized() : await tmdbApi.getPersonalized()
      setPersonalizedRecs(pData || [])
    } catch (err) {
      console.error('Failed to load personalized recommendations', err)
    } finally {
      setPersonalizedRecsLoading(false)
    }
  }

  const fetchRecommendations = async () => {
    if (recommendations) return
    setRecLoading(true)
    try {
      const data = appMode === 'gamecorn' ? await rawgApi.getRecommendations() : await tmdbApi.getRecommendations()
      setRecommendations(data)
    } catch (err) {
      toast.error('Failed to load recommendations')
    } finally {
      setRecLoading(false)
    }
  }

  const fetchDiscoverItems = async () => {
    if (appMode === 'gamecorn') return
    setDiscoverLoading(true)
    try {
      const params = {
        media_type: discoverCategory,
        sort_by: 'popularity.desc'
      }
      if (discoverGenre !== 'All') {
        params.genre_id = GENRE_IDS[discoverGenre]
      }
      if (discoverLanguage !== 'All') {
        params.language = LANGUAGE_CODES[discoverLanguage]
      }
      const data = await tmdbApi.discover(params)
      setDiscoverItems(data)
    } catch (err) {
      console.error(err)
    } finally {
      setDiscoverLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'discover') {
      fetchRecommendations()
      fetchPersonalizedRecs()
    }
  }, [activeTab, appMode, entries])

  useEffect(() => {
    if (activeTab === 'discover' && appMode !== 'gamecorn') {
      fetchDiscoverItems()
    }
  }, [discoverCategory, discoverGenre, discoverLanguage, activeTab, appMode])

  const handleAddToWatchlist = (item) => {
    setAddToGroupTarget(item)
    setSelectedGroupIds([])
    setNewGroupModalInput('')
    setShowAddToGroupModal(true)
  }

  const confirmAddToWatchlist = async () => {
    if (!addToGroupTarget) return
    setIsSavingWatchlist(true)
    try {
      let res
      if (appMode === 'gamecorn') {
        const payload = {
          title: addToGroupTarget.title,
          platform: addToGroupTarget.platform || 'PC',
          rating: addToGroupTarget.rating,
          synopsis: addToGroupTarget.synopsis,
          reasons_for_liking: addToGroupTarget.reasons_for_liking || 'Saved from recommendations',
          genres: addToGroupTarget.genres,
          poster_url: addToGroupTarget.poster_url,
          poster_data: addToGroupTarget.poster_data || null,
          group_ids: selectedGroupIds,
          is_played: false,
          is_playing: false
        }
        if (addToGroupTarget.id) {
          res = await gamesApi.update(addToGroupTarget.id, payload)
        } else {
          res = await gamesApi.create(payload)
        }
        setEntries(prev => {
          const exists = prev.some(e => e.id === res.id)
          if (exists) {
            return prev.map(e => e.id === res.id ? res : e)
          } else {
            return [res, ...prev]
          }
        })
        setSelectedEntry(res)
        toast.success(`"${addToGroupTarget.title}" added to your Playlist!`)
      } else {
        const payload = {
          title: addToGroupTarget.title,
          category: addToGroupTarget.category,
          language: addToGroupTarget.language,
          rating: addToGroupTarget.rating,
          synopsis: addToGroupTarget.synopsis,
          reasons_for_liking: addToGroupTarget.reasons_for_liking || 'Saved from recommendations',
          genres: addToGroupTarget.genres,
          poster_url: addToGroupTarget.poster_url,
          poster_data: addToGroupTarget.poster_data || null,
          group_ids: selectedGroupIds,
          is_seen: false,
          is_watching: false
        }
        if (addToGroupTarget.id) {
          res = await popcornApi.update(addToGroupTarget.id, payload)
        } else {
          res = await popcornApi.create(payload)
        }
        setEntries(prev => {
          const exists = prev.some(e => e.id === res.id)
          if (exists) {
            return prev.map(e => e.id === res.id ? res : e)
          } else {
            return [res, ...prev]
          }
        })
        setSelectedEntry(res)
        toast.success(`"${addToGroupTarget.title}" added to your watchlist!`)
      }
      setShowAddToGroupModal(false)
      setAddToGroupTarget(null)
      setSelectedGroupIds([])
    } catch (err) {
      toast.error('Failed to add entry')
    } finally {
      setIsSavingWatchlist(false)
    }
  }

  const isAlreadyInWatchlist = (title) => {
    return entries.some(w => w.title.toLowerCase().trim() === title.toLowerCase().trim())
  }

  const scrollRow = (rowId, direction) => {
    const element = document.getElementById(rowId)
    if (element) {
      const scrollAmount = 500
      element.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }



  const handleCardClick = (item) => {
    const existing = entries.find(e => e.title.toLowerCase().trim() === item.title.toLowerCase().trim())
    if (existing) {
      setSelectedEntry(existing)
    } else {
      setSelectedEntry(item)
    }
    setShowViewModal(true)
  }

  const fetchSimilarItems = async (item) => {
    setSimilarItems([])
    setSimilarItemsLoading(true)
    try {
      const data = isGame
        ? await rawgApi.getSimilar(item.title)
        : await tmdbApi.getSimilar(item.title, item.category || 'Movie')
      setSimilarItems(data || [])
    } catch (err) {
      console.error('Failed to load similar items', err)
    } finally {
      setSimilarItemsLoading(false)
    }
  }

  useEffect(() => {
    const fetchGameDetails = async () => {
      if (isGame && selectedEntry && (!selectedEntry.synopsis || selectedEntry.synopsis.includes('Released:') || selectedEntry.synopsis.includes('Metacritic Score:')) && !selectedEntry.descriptionFetched) {
        setLoadingDescription(true)
        try {
          const params = {}
          if (selectedEntry.rawg_id) {
            params.rawg_id = selectedEntry.rawg_id
          } else {
            params.title = selectedEntry.title
          }
          const details = await rawgApi.getDetails(params)
          if (details && details.description) {
            setSelectedEntry(prev => {
              if (!prev || prev.title !== selectedEntry.title) return prev
              return {
                ...prev,
                synopsis: details.description,
                descriptionFetched: true,
                developers: details.developers,
                website: details.website
              }
            })
          }
        } catch (err) {
          console.error('Failed to fetch game details:', err)
        } finally {
          setLoadingDescription(false)
        }
      }
    }

    if (selectedEntry) {
      setSeenRating(selectedEntry.my_rating !== undefined && selectedEntry.my_rating !== null ? selectedEntry.my_rating : 3.0)
      setSeenComments(selectedEntry.reasons_for_liking || '')
      setSelectedTags(selectedEntry.tags ? selectedEntry.tags.split(', ') : [])
      setShowSeenForm(false)
      fetchSimilarItems(selectedEntry)
      fetchGameDetails()
    }
  }, [selectedEntry])

  const handleUpdateStatus = async (statusType) => {
    if (statusType === 'watchlist') {
      handleAddToWatchlist(selectedEntry)
      return
    }
    setUpdatingStatusType(statusType)
    try {
      let payload = {
        title: selectedEntry.title,
        category: selectedEntry.category || 'Movie',
        language: selectedEntry.language || 'English',
        rating: selectedEntry.rating,
        synopsis: selectedEntry.synopsis,
        genres: selectedEntry.genres,
        poster_url: selectedEntry.poster_url,
        poster_data: selectedEntry.poster_data,
        reasons_for_liking: selectedEntry.reasons_for_liking || '',
        my_rating: selectedEntry.my_rating,
        tags: selectedEntry.tags
      }

      if (isGame) {
        payload.platform = selectedEntry.platform || 'PC'
        if (statusType === 'watchlist') {
          payload.is_played = false
          payload.is_playing = false
        } else if (statusType === 'watching') {
          payload.is_played = false
          payload.is_playing = true
        } else if (statusType === 'seen') {
          payload.is_played = true
          payload.is_playing = false
          setShowSeenForm(true)
          return
        }
      } else {
        if (statusType === 'watchlist') {
          payload.is_seen = false
          payload.is_watching = false
        } else if (statusType === 'watching') {
          payload.is_seen = false
          payload.is_watching = true
        } else if (statusType === 'seen') {
          payload.is_seen = true
          payload.is_watching = false
          setShowSeenForm(true)
          return
        }
      }

      let res
      if (selectedEntry.id) {
        res = isGame
          ? await gamesApi.update(selectedEntry.id, payload)
          : await popcornApi.update(selectedEntry.id, payload)
      } else {
        res = isGame
          ? await gamesApi.create(payload)
          : await popcornApi.create(payload)
      }

      setEntries(prev => {
        const exists = prev.some(e => e.id === res.id)
        if (exists) {
          return prev.map(e => e.id === res.id ? res : e)
        } else {
          return [res, ...prev]
        }
      })
      setSelectedEntry(res)
      toast.success('Status updated successfully!')
    } finally {
      setUpdatingStatusType(null)
    }
  }

  const handleToggleGroup = async (group) => {
    setTogglingGroupId(group.id)
    try {
      if (!selectedEntry.id) {
        // First save to library and then associate group
        const payload = isGame ? {
          title: selectedEntry.title,
          platform: selectedEntry.platform || 'PC',
          rating: selectedEntry.rating,
          synopsis: selectedEntry.synopsis,
          genres: selectedEntry.genres,
          poster_url: selectedEntry.poster_url,
          is_played: false,
          group_ids: [group.id]
        } : {
          title: selectedEntry.title,
          category: selectedEntry.category || 'Movie',
          language: selectedEntry.language || 'English',
          rating: selectedEntry.rating,
          synopsis: selectedEntry.synopsis,
          genres: selectedEntry.genres,
          poster_url: selectedEntry.poster_url,
          is_seen: false,
          group_ids: [group.id]
        }

        const res = isGame ? await gamesApi.create(payload) : await popcornApi.create(payload)
        setEntries(prev => [res, ...prev])
        setSelectedEntry(res)
        toast.success(`Saved and added to "${group.name}"!`)
      } else {
        // Toggle association
        const currentGroupIds = selectedEntry.custom_groups ? selectedEntry.custom_groups.map(g => g.id) : []
        const isMember = currentGroupIds.includes(group.id)
        const newGroupIds = isMember
          ? currentGroupIds.filter(id => id !== group.id)
          : [...currentGroupIds, group.id]

        const payload = isGame ? {
          title: selectedEntry.title,
          platform: selectedEntry.platform,
          rating: selectedEntry.rating,
          synopsis: selectedEntry.synopsis,
          reasons_for_liking: selectedEntry.reasons_for_liking || '',
          genres: selectedEntry.genres,
          poster_url: selectedEntry.poster_url,
          poster_data: selectedEntry.poster_data,
          my_rating: selectedEntry.my_rating,
          is_played: selectedEntry.is_played,
          is_playing: selectedEntry.is_playing,
          tags: selectedEntry.tags,
          group_ids: newGroupIds
        } : {
          title: selectedEntry.title,
          category: selectedEntry.category,
          language: selectedEntry.language,
          rating: selectedEntry.rating,
          synopsis: selectedEntry.synopsis,
          reasons_for_liking: selectedEntry.reasons_for_liking || '',
          genres: selectedEntry.genres,
          poster_url: selectedEntry.poster_url,
          poster_data: selectedEntry.poster_data,
          my_rating: selectedEntry.my_rating,
          is_seen: selectedEntry.is_seen,
          is_watching: selectedEntry.is_watching,
          tags: selectedEntry.tags,
          group_ids: newGroupIds
        }

        const res = isGame
          ? await gamesApi.update(selectedEntry.id, payload)
          : await popcornApi.update(selectedEntry.id, payload)

        setEntries(prev => prev.map(e => e.id === selectedEntry.id ? res : e))
        setSelectedEntry(res)
        toast.success(isMember ? `Removed from "${group.name}"` : `Added to "${group.name}"`)
      }
    } catch (err) {
      toast.error('Failed to update group associations')
    } finally {
      setTogglingGroupId(null)
    }
  }

  const handleSaveSeen = async () => {
    setIsSavingSeen(true)
    try {
      const isFirstSeen = selectedEntry.id
        ? (isGame ? !selectedEntry.is_played : !selectedEntry.is_seen)
        : true

      const currentRankedCount = entries.filter(e => e.rank !== null && e.rank !== undefined).length
      const nextRank = isFirstSeen ? currentRankedCount + 1 : selectedEntry.rank

      if (selectedEntry.id) {
        // Update existing entry in database
        const payload = isGame ? {
          title: selectedEntry.title,
          platform: selectedEntry.platform,
          rating: selectedEntry.rating,
          synopsis: selectedEntry.synopsis,
          reasons_for_liking: seenComments,
          genres: selectedEntry.genres,
          poster_url: selectedEntry.poster_url,
          poster_data: selectedEntry.poster_data,
          my_rating: seenRating,
          is_played: true,
          is_playing: false,
          rank: nextRank,
          tags: selectedTags.join(', ')
        } : {
          title: selectedEntry.title,
          category: selectedEntry.category,
          language: selectedEntry.language,
          rating: selectedEntry.rating,
          synopsis: selectedEntry.synopsis,
          reasons_for_liking: seenComments,
          genres: selectedEntry.genres,
          poster_url: selectedEntry.poster_url,
          poster_data: selectedEntry.poster_data,
          my_rating: seenRating,
          is_seen: true,
          is_watching: false,
          rank: nextRank,
          tags: selectedTags.join(', ')
        }
        const res = isGame
          ? await gamesApi.update(selectedEntry.id, payload)
          : await popcornApi.update(selectedEntry.id, payload)

        // Trigger success animation
        setShowSaveCelebration(true)
        setTimeout(() => {
          setShowSaveCelebration(false)
          setEntries(prev => prev.map(e => e.id === selectedEntry.id ? res : e))
          setSelectedEntry(res)
          setShowSeenForm(false)
          setShowViewModal(false)
          if (isFirstSeen) {
            setActiveTab('leaderboard')
            toast.success(`"${selectedEntry.title}" added to Leaderboard! Adjust its ranking below.`)
          } else {
            toast.success(isGame ? 'Played review updated successfully!' : 'Seen review updated successfully!')
          }
        }, 1200)
      } else {
        // Create new entry
        const payload = isGame ? {
          title: selectedEntry.title,
          platform: selectedEntry.platform,
          rating: selectedEntry.rating,
          synopsis: selectedEntry.synopsis,
          reasons_for_liking: seenComments,
          genres: selectedEntry.genres,
          poster_url: selectedEntry.poster_url,
          poster_data: null,
          my_rating: seenRating,
          is_played: true,
          is_playing: false,
          rank: nextRank,
          tags: selectedTags.join(', ')
        } : {
          title: selectedEntry.title,
          category: selectedEntry.category,
          language: selectedEntry.language,
          rating: selectedEntry.rating,
          synopsis: selectedEntry.synopsis,
          reasons_for_liking: seenComments,
          genres: selectedEntry.genres,
          poster_url: selectedEntry.poster_url,
          poster_data: null,
          my_rating: seenRating,
          is_seen: true,
          is_watching: false,
          rank: nextRank,
          tags: selectedTags.join(', ')
        }
        const res = isGame
          ? await gamesApi.create(payload)
          : await popcornApi.create(payload)

        // Trigger success animation
        setShowSaveCelebration(true)
        setTimeout(() => {
          setShowSaveCelebration(false)
          setEntries(prev => [res, ...prev])
          setSelectedEntry(res)
          setShowSeenForm(false)
          setShowViewModal(false)
          setActiveTab('leaderboard')
          toast.success(`"${selectedEntry.title}" marked as ${isGame ? 'Played' : 'Seen'} and added to Leaderboard! Adjust its ranking below.`)
        }, 1200)
      }
    } catch (err) {
      toast.error('Failed to save review')
    } finally {
      setIsSavingSeen(false)
    }
  }

  const handleUnmarkSeen = async () => {
    try {
      const currentRank = selectedEntry.rank

      const payload = isGame ? {
        title: selectedEntry.title,
        platform: selectedEntry.platform,
        rating: selectedEntry.rating,
        synopsis: selectedEntry.synopsis,
        reasons_for_liking: '',
        genres: selectedEntry.genres,
        poster_url: selectedEntry.poster_url,
        poster_data: selectedEntry.poster_data,
        my_rating: null,
        is_played: false,
        is_playing: false,
        rank: null,
        tags: null
      } : {
        title: selectedEntry.title,
        category: selectedEntry.category,
        language: selectedEntry.language,
        rating: selectedEntry.rating,
        synopsis: selectedEntry.synopsis,
        reasons_for_liking: '',
        genres: selectedEntry.genres,
        poster_url: selectedEntry.poster_url,
        poster_data: selectedEntry.poster_data,
        my_rating: null,
        is_seen: false,
        is_watching: false,
        rank: null,
        tags: null
      }
      const res = isGame
        ? await gamesApi.update(selectedEntry.id, payload)
        : await popcornApi.update(selectedEntry.id, payload)

      setEntries(prev => prev.map(e => e.id === selectedEntry.id ? res : e))
      setSelectedEntry(res)
      toast.success(isGame ? `"${selectedEntry.title}" moved to Playlist!` : `"${selectedEntry.title}" moved to Watchlist!`)
      setShowViewModal(false)

      // Shift ranks of remaining items to close the gap
      if (currentRank !== null && currentRank !== undefined) {
        const itemsToShift = entries.filter(e => e.rank !== null && e.rank !== undefined && e.rank > currentRank)
        for (const otherItem of itemsToShift) {
          if (isGame) {
            await gamesApi.update(otherItem.id, { rank: otherItem.rank - 1 })
          } else {
            await popcornApi.update(otherItem.id, { rank: otherItem.rank - 1 })
          }
        }
        await fetchEntries()
      }
    } catch (err) {
      toast.error(isGame ? 'Failed to move to Playlist' : 'Failed to move to watchlist')
    }
  }

  const handleSurpriseMe = async () => {
    let sourceItems = []
    let currentRecs = recommendations

    setShowPoppingLoader(true)

    if (!currentRecs) {
      try {
        currentRecs = isGame ? await rawgApi.getRecommendations() : await tmdbApi.getRecommendations()
        setRecommendations(currentRecs)
      } catch (err) {
        toast.error('Failed to get recommendations')
        setShowPoppingLoader(false)
        return
      }
    }

    // Gather all recommendation lists
    Object.keys(currentRecs).forEach(key => {
      if (Array.isArray(currentRecs[key])) {
        sourceItems = [...sourceItems, ...currentRecs[key]]
      }
    })

    // Deduplicate and filter by rating >= 3.5
    const uniqueItems = []
    const seen = new Set()

    sourceItems.forEach(item => {
      const titleKey = item.title.toLowerCase().trim()
      if (!seen.has(titleKey) && item.rating >= 3.5) {
        seen.add(titleKey)
        uniqueItems.push(item)
      }
    })

    if (uniqueItems.length === 0) {
      toast.error('No recommendations with rating 3.5+ found')
      setShowPoppingLoader(false)
      return
    }

    const randomItem = uniqueItems[Math.floor(Math.random() * uniqueItems.length)]

    setTimeout(() => {
      setShowPoppingLoader(false)
      handleCardClick(randomItem)
      toast.success(
        isGame ? `🎮 Surprise! Try "${randomItem.title}"!` : `🍿 Surprise! How about "${randomItem.title}"?`,
        { icon: '🎉', duration: 5000 }
      )
    }, 1800)
  }

  const renderRecommendationRow = (title, items, icon, showRank = false) => {
    if (!items || items.length === 0) return null
    const rowId = 'row-' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    return (
      <LazyRow height="345px">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="text-base font-black text-white uppercase tracking-wider">{title}</h3>
          </div>

          <div className="relative group/row">
            {/* Left Arrow Button */}
            <button
              onClick={() => scrollRow(rowId, 'left')}
              className="absolute left-0 top-[35%] -translate-y-1/2 w-10 h-10 rounded-full bg-midnight/85 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-all duration-300 z-10 shadow-lg hover:bg-indigo-600 hover:border-indigo-500 hover:scale-105 active:scale-95"
              title="Scroll Left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Carousel */}
            <div
              id={rowId}
              className="flex gap-6 overflow-x-auto pb-4 no-scrollbar scroll-row"
              style={{ touchAction: 'pan-x', WebkitOverflowScrolling: 'touch' }}
            >
              {items.map((item, idx) => {
                const inWatchlist = isAlreadyInWatchlist(item.title)
                return (
                  <div
                    key={idx}
                    onClick={() => handleCardClick(item)}
                    className="movie-3d-card-container min-w-[165px] w-[165px] sm:min-w-[190px] sm:w-[190px] flex-shrink-0"
                  >
                    <div
                      className="movie-3d-card bg-ink/60 border border-white/10 rounded-2xl overflow-hidden flex flex-col justify-between h-full transition-all duration-300 relative cursor-pointer"
                    >
                      <div className="movie-card-shine absolute inset-0 pointer-events-none z-10 opacity-0 transition-opacity duration-300" />
                      {showRank && (
                        <div className="absolute top-2 left-2 w-7 h-7 rounded-lg bg-indigo-600/90 text-white flex items-center justify-center font-black text-xs shadow-md z-10">
                          {idx + 1}
                        </div>
                      )}
                      <div className="aspect-[2/3] bg-midnight relative overflow-hidden shrink-0 rounded-t-2xl">
                        {item.poster_url ? (
                          <img src={item.poster_url} alt={item.title} loading="lazy" decoding="async" className="w-full h-full object-cover rounded-t-2xl" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center">
                            <Film className="w-8 h-8 text-slate-800 mb-1" />
                            <span className="text-[10px] text-slate-600 font-bold uppercase truncate w-full">{item.title}</span>
                          </div>
                        )}
                        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-midnight/80 border border-white/10 text-[9px] font-black text-amber-300 flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />
                          <span>{Number(item.rating || 0).toFixed(1)}</span>
                        </div>
                        <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-midnight/80 border border-white/5 text-[8px] font-black uppercase tracking-wider text-slate-200">
                          {item.category}
                        </div>
                      </div>
                      <div className="p-3 flex-1 flex flex-col justify-between min-h-0">
                        <div>
                          <h4 className="font-bold text-xs text-white line-clamp-1 leading-snug group-hover:text-indigo-500 transition-colors" title={item.title}>{item.title}</h4>
                          <p className="text-[9px] text-slate-500 mt-0.5">{item.language}</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (!inWatchlist) handleAddToWatchlist(item)
                          }}
                          disabled={inWatchlist}
                          className={`w-full mt-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${inWatchlist
                            ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                            }`}
                        >
                          {inWatchlist ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                          <span>{inWatchlist ? 'In Watchlist' : 'Add Watchlist'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Right Arrow Button */}
            <button
              onClick={() => scrollRow(rowId, 'right')}
              className="absolute right-0 top-[35%] -translate-y-1/2 w-10 h-10 rounded-full bg-midnight/85 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-all duration-300 z-10 shadow-lg hover:bg-indigo-600 hover:border-indigo-500 hover:scale-105 active:scale-95"
              title="Scroll Right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </LazyRow>
    )
  }


  // Live Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length > 1) {
        performSearch(searchQuery)
      } else {
        setTmdbSearchResults([])
      }
    }, 400)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery, appMode])

  const performSearch = async (query) => {
    setIsSearchingTmdb(true)
    try {
      const results = appMode === 'gamecorn' ? await rawgApi.search(query) : await tmdbApi.search(query)
      setTmdbSearchResults(results.slice(0, 5))
    } catch (err) {
      console.error(err)
    } finally {
      setIsSearchingTmdb(false)
    }
  }

  const handleSelectAutocompleteItem = (item) => {
    if (appMode === 'gamecorn') {
      setFormData({
        title: item.title,
        platform: item.platform || 'PC',
        rating: item.rating || 3.0,
        synopsis: item.synopsis || '',
        reasons_for_liking: '',
        genres: item.genres ? item.genres.split(', ') : [],
        poster_url: item.poster_url || '',
        poster_data: '',
        category: 'Movie',
        language: 'English'
      })
    } else {
      setFormData({
        title: item.title,
        category: item.category,
        language: item.language || 'English',
        rating: item.rating || 3.0,
        synopsis: item.synopsis || '',
        reasons_for_liking: '',
        genres: item.genres ? item.genres.split(', ') : [],
        poster_url: item.poster_url || '',
        poster_data: '',
        platform: 'PC'
      })
    }
    setSearchQuery('')
    setTmdbSearchResults([])
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleGenreToggle = (genre) => {
    setFormData(prev => {
      const genres = prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre]
      return { ...prev, genres }
    })
  }

  // Base64 file uploader helper
  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size too large (max 2MB)')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          poster_data: reader.result,
          poster_url: '' // Override remote URL if user uploads manually
        }))
        toast.success('Poster uploaded successfully!')
      }
      reader.readAsDataURL(file)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      category: 'Movie',
      language: 'English',
      rating: 3.0,
      synopsis: '',
      reasons_for_liking: '',
      genres: [],
      poster_url: '',
      poster_data: '',
      platform: 'PC'
    })
    setEditingEntry(null)
  }

  const handleEditClick = (entry) => {
    setEditingEntry(entry)
    setFormData({
      title: entry.title,
      category: entry.category || 'Movie',
      language: entry.language || 'English',
      rating: entry.rating || 3.0,
      synopsis: entry.synopsis || '',
      reasons_for_liking: entry.reasons_for_liking || '',
      genres: entry.genres ? entry.genres.split(', ') : [],
      poster_url: entry.poster_url || '',
      poster_data: entry.poster_data || '',
      platform: entry.platform || 'PC'
    })
    setShowModal(true)
  }

  const handleViewClick = (entry) => {
    setSelectedEntry(entry)
    setShowViewModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (appMode === 'gamecorn') {
      if (!formData.title || !formData.platform) {
        toast.error('Title and Platform are required')
        return
      }
    } else {
      if (!formData.title || !formData.category) {
        toast.error('Title and Category are required')
        return
      }
    }

    setIsSubmitting(true)
    const payload = appMode === 'gamecorn' ? {
      title: formData.title,
      platform: formData.platform,
      rating: formData.rating,
      synopsis: formData.synopsis,
      reasons_for_liking: formData.reasons_for_liking,
      genres: formData.genres.join(', '),
      poster_url: formData.poster_url,
      poster_data: formData.poster_data
    } : {
      title: formData.title,
      category: formData.category,
      language: formData.language,
      rating: formData.rating,
      synopsis: formData.synopsis,
      reasons_for_liking: formData.reasons_for_liking,
      genres: formData.genres.join(', '),
      poster_url: formData.poster_url,
      poster_data: formData.poster_data
    }

    try {
      if (editingEntry) {
        const res = appMode === 'gamecorn'
          ? await gamesApi.update(editingEntry.id, payload)
          : await popcornApi.update(editingEntry.id, payload)
        setEntries(prev => prev.map(e => e.id === editingEntry.id ? res : e))
        toast.success('Updated successfully')
      } else {
        const res = appMode === 'gamecorn'
          ? await gamesApi.create(payload)
          : await popcornApi.create(payload)
        setEntries(prev => [res, ...prev])
        toast.success(`Added to your ${appMode === 'gamecorn' ? 'Playlist' : 'watchlist'}!`)
      }
      setShowModal(false)
      resetForm()
    } catch (err) {
      toast.error('Failed to save item')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to remove this?')) return
    setIsDeleting(true)
    try {
      const deletedItem = entries.find(e => e.id === id)
      const deletedRank = deletedItem ? deletedItem.rank : null

      if (appMode === 'gamecorn') {
        await gamesApi.delete(id)
      } else {
        await popcornApi.delete(id)
      }
      setEntries(prev => prev.filter(e => e.id !== id))
      toast.success('Entry removed')
      if (showViewModal) setShowViewModal(false)

      // Shift ranks of remaining items to close the gap
      if (deletedRank !== null && deletedRank !== undefined) {
        const itemsToShift = entries.filter(e => e.rank !== null && e.rank !== undefined && e.rank > deletedRank && e.id !== id)
        for (const otherItem of itemsToShift) {
          if (isGame) {
            await gamesApi.update(otherItem.id, { rank: otherItem.rank - 1 })
          } else {
            await popcornApi.update(otherItem.id, { rank: otherItem.rank - 1 })
          }
        }
        await fetchEntries()
      }
    } catch (err) {
      toast.error('Failed to remove entry')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleLogout = () => {
    logout()
    toast.success('Signed out')
    navigate('/login')
  }

  // Frontend filter logic
  const filteredEntries = entries.filter(e => {
    const isSeenOrPlayed = appMode === 'gamecorn' ? e.is_played : e.is_seen
    const isWatchingOrPlaying = appMode === 'gamecorn' ? e.is_playing : e.is_watching

    let matchesTab = false
    if (activeTab === 'watchlist') {
      matchesTab = !isSeenOrPlayed && !isWatchingOrPlaying
    } else if (activeTab === 'watching') {
      matchesTab = isWatchingOrPlaying
    } else if (activeTab === 'seen') {
      matchesTab = isSeenOrPlayed
    } else {
      matchesTab = true
    }

    const matchesCategory = filterCategory === 'All' || (appMode === 'gamecorn' ? e.platform === filterCategory : e.category === filterCategory)
    const matchesGenre = filterGenre === 'All' || (e.genres && e.genres.split(', ').includes(filterGenre))
    const matchesLanguage = appMode === 'gamecorn' ? true : (filterLanguage === 'All' || e.language === filterLanguage)
    const matchesSearch = dashboardSearch.trim() === '' || e.title.toLowerCase().includes(dashboardSearch.toLowerCase())
    const matchesGroup =
      selectedGroupFilter === 'All' ? true :
        selectedGroupFilter === 'Unassigned' ? (!e.custom_groups || e.custom_groups.length === 0) :
          (e.custom_groups && e.custom_groups.some(g => g.id === parseInt(selectedGroupFilter)))

    return matchesTab && matchesCategory && matchesGenre && matchesLanguage && matchesSearch && matchesGroup
  })

  const getGroupItemCount = (groupId) => {
    return entries.filter(e => {
      const isSeenOrPlayed = appMode === 'gamecorn' ? e.is_played : e.is_seen
      const isWatchingOrPlaying = appMode === 'gamecorn' ? e.is_playing : e.is_watching
      const inWatchlist = !isSeenOrPlayed && !isWatchingOrPlaying
      if (!inWatchlist) return false

      if (groupId === 'All') return true
      if (groupId === 'Unassigned') return !e.custom_groups || e.custom_groups.length === 0
      return e.custom_groups && e.custom_groups.some(cg => cg.id === groupId)
    }).length
  }

  // Pagination Logic
  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage)
  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [filterCategory, filterGenre, filterLanguage, dashboardSearch, activeTab])



  const brandGradient = isGame ? 'from-cyan-300 via-teal-500 to-violet-500' : 'from-indigo-500 via-red-500 to-yellow-500'
  const brandName = isGame ? 'GameCorn' : 'Popcorn'
  const BrandIcon = isGame ? Gamepad2 : PopcornIcon
  const textPrimaryColor = isGame ? 'text-cyan-300' : 'text-indigo-500'
  const bgPrimaryColor = isGame ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-indigo-600 hover:bg-indigo-500'
  const bgPrimaryColorLight = isGame ? 'bg-cyan-600/20 text-cyan-300 hover:bg-cyan-600/30 border border-cyan-500/20' : 'bg-indigo-600/20 text-indigo-500 hover:bg-indigo-600/30 border border-indigo-500/20'
  const borderPrimaryFocus = isGame ? 'focus:border-cyan-500' : 'focus:border-indigo-500'
  const activeBorderClass = isGame ? 'border-cyan-500 text-cyan-500' : 'border-indigo-500 text-indigo-500'
  const surpriseBtnClass = isGame ? 'from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 shadow-cyan-600/20' : 'from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-600/20'

  const renderContinueWatchingRow = () => {
    const watchingEntries = entries.filter(e => isGame ? e.is_playing : e.is_watching)
    if (watchingEntries.length === 0) return null

    const rowId = 'continue-watching-row'
    return (
      <LazyRow height="345px">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isGame ? <Gamepad className="w-5 h-5 text-cyan-400 animate-pulse" /> : <Tv className="w-5 h-5 text-indigo-400 animate-pulse" />}
              <h3 className="text-base font-black text-white uppercase tracking-wider">
                {isGame ? "Continue Playing 🎮" : "Continue Watching 📺"}
              </h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {watchingEntries.length} Active
            </span>
          </div>

          <div className="relative group/row">
            {/* Left Scroll Button */}
            <button
              onClick={() => scrollRow(rowId, 'left')}
              className="absolute left-0 top-[35%] -translate-y-1/2 w-10 h-10 rounded-full bg-midnight/85 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-all duration-300 z-10 shadow-lg hover:bg-indigo-600 hover:border-indigo-500 hover:scale-105 active:scale-95"
              title="Scroll Left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Carousel */}
            <div
              id={rowId}
              className="flex gap-6 overflow-x-auto pb-4 no-scrollbar scroll-row"
              style={{ touchAction: 'pan-x', WebkitOverflowScrolling: 'touch' }}
            >
              {watchingEntries.map((item, idx) => {
                return (
                  <div
                    key={item.id || idx}
                    onClick={() => handleCardClick(item)}
                    className="movie-3d-card-container min-w-[165px] w-[165px] sm:min-w-[190px] sm:w-[190px] flex-shrink-0"
                  >
                    <div
                      className="movie-3d-card bg-ink/60 border border-white/10 rounded-2xl overflow-hidden flex flex-col justify-between h-full transition-all duration-300 relative cursor-pointer"
                    >
                      <div className="movie-card-shine absolute inset-0 pointer-events-none z-10 opacity-0 transition-opacity duration-300" />
                      
                      <div className="aspect-[2/3] bg-midnight relative overflow-hidden shrink-0 rounded-t-2xl">
                        {item.poster_data ? (
                          <img src={item.poster_data} alt={item.title} loading="lazy" decoding="async" className="w-full h-full object-cover rounded-t-2xl" />
                        ) : item.poster_url ? (
                          <img src={item.poster_url} alt={item.title} loading="lazy" decoding="async" className="w-full h-full object-cover rounded-t-2xl" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center">
                            {isGame ? <Gamepad className="w-8 h-8 text-slate-800 mb-1" /> : <Film className="w-8 h-8 text-slate-800 mb-1" />}
                            <span className="text-[10px] text-slate-600 font-bold uppercase truncate w-full">{item.title}</span>
                          </div>
                        )}
                        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-midnight/80 border border-white/10 text-[9px] font-black text-amber-300 flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />
                          <span>{Number(item.rating || 0).toFixed(1)}</span>
                        </div>
                        <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-midnight/80 border border-white/5 text-[8px] font-black uppercase tracking-wider text-slate-200">
                          {isGame ? item.platform : item.category}
                        </div>
                      </div>
                      
                      <div className="p-3 flex-1 flex flex-col justify-between min-h-0">
                        <div>
                          <h4 className="font-bold text-xs text-white line-clamp-1 leading-snug hover:text-indigo-500 transition-colors" title={item.title}>
                            {item.title}
                          </h4>
                          <p className="text-[9px] text-slate-500 mt-0.5">
                            {isGame ? 'Playing' : 'Watching'}
                          </p>
                        </div>
                        
                        <div className="flex gap-1.5 mt-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedEntry(item)
                              setShowSeenForm(true)
                              setShowViewModal(true)
                            }}
                            className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-all border border-white/5 text-white ${
                              isGame 
                                ? 'bg-cyan-600 hover:bg-cyan-500' 
                                : 'bg-indigo-600 hover:bg-indigo-500'
                            }`}
                          >
                            <Check className="w-3 h-3" />
                            <span>{isGame ? 'Mark Played' : 'Mark Seen'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Right Scroll Button */}
            <button
              onClick={() => scrollRow(rowId, 'right')}
              className="absolute right-0 top-[35%] -translate-y-1/2 w-10 h-10 rounded-full bg-midnight/85 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-all duration-300 z-10 shadow-lg hover:bg-indigo-600 hover:border-indigo-500 hover:scale-105 active:scale-95"
              title="Scroll Right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </LazyRow>
    )
  }


  return (
    <div className="min-h-screen bg-midnight text-slate-100 pb-16 relative overflow-hidden">
      {/* Premium Ambient Glow Blobs */}
      <div className={`absolute top-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none z-0 ${isGame ? 'bg-cyan-600/8' : 'bg-purple-600/8'}`}></div>
      <div className={`absolute top-[20%] right-[-100px] w-[600px] h-[600px] rounded-full blur-[130px] pointer-events-none z-0 ${isGame ? 'bg-violet-600/6' : 'bg-indigo-600/6'}`}></div>
      <div className={`absolute bottom-[-100px] left-[10%] w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none z-0 ${isGame ? 'bg-cyan-600/6' : 'bg-teal-600/6'}`}></div>

      {/* Navbar Header */}
      <header className="border-b border-white/5 bg-ink/40 backdrop-blur-md sticky top-0 z-20 relative">
        <div className="w-full px-6 md:px-12 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            {/* <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain rounded-lg" /> */}
            <h1 className={`font-black text-xl tracking-tight bg-gradient-to-r ${brandGradient} bg-clip-text text-transparent uppercase hidden sm:block`}>{brandName}</h1>
          </div>

          {/* Premium Mode Switch Toggle */}
          <div className="flex bg-midnight/80 p-1 rounded-2xl border border-white/5 items-center shrink-0">
            <button
              onClick={() => triggerModeSwitch('popcorn')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all rounded-xl ${!isGame
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              <PopcornIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Popcorn</span>
            </button>
            <button
              onClick={() => triggerModeSwitch('gamecorn')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all rounded-xl ${isGame
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              <Gamepad className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">GameCorn</span>
            </button>
          </div>

          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <Link
              to="/trending"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all text-xs font-bold shadow-sm ${isGame
                ? 'bg-cyan-600/10 border-cyan-500/20 text-cyan-300 hover:bg-cyan-600 hover:text-white'
                : 'bg-indigo-600/10 border-indigo-500/20 text-indigo-500 hover:bg-indigo-600 hover:text-white'
                }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span className="hidden md:inline">Trending Top 100</span>
            </Link>



            <button
              onClick={() => navigate('/settings')}
              className="p-2 rounded-xl border border-white/5 bg-midnight/40 hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
              title="Profile Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full px-6 md:px-12 mt-8 relative z-10">

        {/* Banner Welcome */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <h2 className="text-3xl font-black text-white bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Hi {user?.name || 'there'}!</h2>
            <p className="text-slate-400 text-sm mt-1">
              {isGame
                ? 'Keep track of all your favorite games, backlogs, and Playlists in one gaming-grade space.'
                : 'Keep track of all your favorite movies and tv shows in one premium space.'}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSurpriseMe}
              className={`flex items-center gap-2 px-5 py-3 bg-gradient-to-r ${surpriseBtnClass} text-white font-bold rounded-2xl shadow-lg active:scale-[0.98] transition-all text-sm animate-glow`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Surprise Me</span>
            </button>
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className={`flex items-center gap-2 px-5 py-3 ${bgPrimaryColor} text-white font-bold rounded-2xl shadow-lg active:scale-[0.98] transition-all text-sm`}
            >
              <Plus className="w-4 h-4" />
              <span>{isGame ? 'Add to Playlist' : 'Add to Watchlist'}</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-4 border-b border-white/5 mb-8 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('discover')}
            className={`pb-4 px-2 text-xs font-black transition-all border-b-2 uppercase tracking-wider flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${activeTab === 'discover'
              ? activeBorderClass
              : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
          >
            <Globe className="w-4 h-4 flex-shrink-0" />
            <span>{isGame ? 'Discover' : 'Discover'}</span>
          </button>
          <button
            onClick={() => setActiveTab('watchlist')}
            className={`pb-4 px-2 text-xs font-black transition-all border-b-2 uppercase tracking-wider flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${activeTab === 'watchlist'
              ? activeBorderClass
              : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
          >
            <Bookmark className="w-4 h-4 flex-shrink-0" />
            <span>{isGame ? 'My Playlist' : 'My Watchlist'}</span>
            <span className="px-1.5 py-0.5 rounded-md bg-midnight/80 border border-white/5 text-[9px] text-slate-400 font-bold ml-1 flex-shrink-0">
              {entries.filter(e => isGame ? (!e.is_played && !e.is_playing) : (!e.is_seen && !e.is_watching)).length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('watching')}
            className={`pb-4 px-2 text-xs font-black transition-all border-b-2 uppercase tracking-wider flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${activeTab === 'watching'
              ? activeBorderClass
              : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
          >
            {isGame ? <Gamepad className="w-4 h-4 flex-shrink-0" /> : <Tv className="w-4 h-4 flex-shrink-0" />}
            <span>{isGame ? 'Currently Playing' : 'Currently Watching'}</span>
            <span className="px-1.5 py-0.5 rounded-md bg-midnight/80 border border-white/5 text-[9px] text-slate-400 font-bold ml-1 flex-shrink-0">
              {entries.filter(e => isGame ? e.is_playing : e.is_watching).length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('seen')}
            className={`pb-4 px-2 text-xs font-black transition-all border-b-2 uppercase tracking-wider flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${activeTab === 'seen'
              ? activeBorderClass
              : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
          >
            <BrandIcon className="w-4 h-4 flex-shrink-0" />
            <span>{isGame ? 'Played' : 'Seen'}</span>
            <span className="px-1.5 py-0.5 rounded-md bg-midnight/80 border border-white/5 text-[9px] text-slate-400 font-bold ml-1 flex-shrink-0">
              {entries.filter(e => isGame ? e.is_played : e.is_seen).length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`pb-4 px-2 text-xs font-black transition-all border-b-2 uppercase tracking-wider flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${activeTab === 'stats'
              ? activeBorderClass
              : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
          >
            <Trophy className="w-4 h-4 flex-shrink-0" />
            <span>Stats</span>
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`pb-4 px-2 text-xs font-black transition-all border-b-2 uppercase tracking-wider flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${activeTab === 'leaderboard'
              ? activeBorderClass
              : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
          >
            <Crown className="w-4 h-4 flex-shrink-0 text-yellow-500" />
            <span>Leaderboard</span>
            <span className="px-1.5 py-0.5 rounded-md bg-midnight/80 border border-white/5 text-[9px] text-slate-400 font-bold ml-1 flex-shrink-0">
              {entries.filter(e => e.rank !== null && e.rank !== undefined).length}
            </span>
          </button>
        </div>

        {activeTab === 'stats' ? (
          <StatsPanel entries={entries} isGame={isGame} PopcornRating={PopcornRating} />
        ) : activeTab === 'leaderboard' ? (
          <LeaderboardPanel
            entries={entries}
            isGame={isGame}
            fetchEntries={fetchEntries}
            popcornApi={popcornApi}
            gamesApi={gamesApi}
            PopcornRating={PopcornRating}
          />
        ) : ['watchlist', 'watching', 'seen'].includes(activeTab) ? (
          <>
            {/* Filters Panel */}
            <div className="flex flex-col gap-4 mb-8 bg-ink/40 border border-white/10 p-5 rounded-3xl backdrop-blur-md">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={isGame ? "Search saved games by title..." : "Search saved movies & shows by title..."}
                  value={dashboardSearch}
                  onChange={(e) => setDashboardSearch(e.target.value)}
                  className={`w-full bg-midnight/60 border border-white/5 ${borderPrimaryFocus} rounded-xl pl-11 pr-10 py-2.5 text-xs text-slate-200 outline-none transition-all placeholder:text-slate-500`}
                />
                {dashboardSearch && (
                  <button
                    onClick={() => setDashboardSearch('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-500 hover:text-slate-200 font-bold uppercase"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Select Dropdown Filters */}
              <div className={`grid grid-cols-1 ${isGame ? 'md:grid-cols-3' : 'md:grid-cols-4'} gap-4`}>
                {/* Category/Platform Filter */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {isGame ? 'Platform' : 'Type'}
                  </label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className={`w-full bg-midnight/60 border border-white/5 ${borderPrimaryFocus} rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none transition-all`}
                  >
                    <option value="All">{isGame ? 'All Platforms' : 'All Categories'}</option>
                    {isGame
                      ? GAME_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)
                      : CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Genre Filter */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Genre</label>
                  <select
                    value={filterGenre}
                    onChange={(e) => setFilterGenre(e.target.value)}
                    className={`w-full bg-midnight/60 border border-white/5 ${borderPrimaryFocus} rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none transition-all`}
                  >
                    <option value="All">All Genres</option>
                    {isGame
                      ? GAME_GENRES.map(g => <option key={g} value={g}>{g}</option>)
                      : GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                {/* Language Filter (Only for Popcorn) */}
                {!isGame && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Language</label>
                    <select
                      value={filterLanguage}
                      onChange={(e) => setFilterLanguage(e.target.value)}
                      className={`w-full bg-midnight/60 border border-white/5 ${borderPrimaryFocus} rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none transition-all`}
                    >
                      <option value="All">All Languages</option>
                      {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                )}

                {/* Group Filter */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Custom Group</label>
                    <button
                      onClick={() => setShowGroupsModal(true)}
                      className={`text-[9px] font-black uppercase tracking-wider ${isGame ? 'text-cyan-300 hover:text-cyan-200' : 'text-indigo-500 hover:text-indigo-300'} transition-colors`}
                    >
                      Manage
                    </button>
                  </div>
                  <select
                    value={selectedGroupFilter}
                    onChange={(e) => setSelectedGroupFilter(e.target.value)}
                    className={`w-full bg-midnight/60 border border-white/5 ${borderPrimaryFocus} rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none transition-all`}
                  >
                    <option value="All">All Groups</option>
                    {groups.map(g => (
                      <option key={g.id} value={g.id.toString()}>{g.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            {/* Folder Directory for Watchlist Tab */}
            {activeTab === 'watchlist' && !loading && selectedGroupFilter === 'All' && (
              <div className="mb-8 space-y-4">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <FolderHeart className={`w-3.5 h-3.5 ${textPrimaryColor}`} />
                  <span>{isGame ? 'Playlist Folders' : 'Watchlist Folders'}</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {/* All Items Folder */}
                  <div
                    onClick={() => setSelectedGroupFilter('All')}
                    className={`group/folder relative bg-ink/40 hover:bg-ink/60 border rounded-2xl p-4 flex flex-col justify-between gap-4 cursor-pointer transition-all duration-300 backdrop-blur-md ${selectedGroupFilter === 'All'
                        ? (isGame ? 'border-cyan-500/50 shadow-md shadow-cyan-500/5' : 'border-indigo-500/50 shadow-md shadow-indigo-500/5')
                        : 'border-white/10 hover:border-white/20'
                      }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className={`p-3 rounded-xl ${isGame ? 'bg-cyan-500/10 text-cyan-300' : 'bg-indigo-500/10 text-indigo-300'} group-hover/folder:scale-105 transition-transform duration-300`}>
                        <Folder className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 group-hover/folder:text-slate-400 transition-colors uppercase tracking-widest">
                        Folder
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-white group-hover/folder:text-indigo-400 transition-colors truncate">
                        All Items
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {getGroupItemCount('All')} {isGame ? 'games' : 'movies'}
                      </p>
                    </div>
                  </div>

                  {/* Unassigned Folder */}
                  <div
                    onClick={() => setSelectedGroupFilter('Unassigned')}
                    className={`group/folder relative bg-ink/40 hover:bg-ink/60 border rounded-2xl p-4 flex flex-col justify-between gap-4 cursor-pointer transition-all duration-300 backdrop-blur-md ${selectedGroupFilter === 'Unassigned'
                        ? (isGame ? 'border-cyan-500/50 shadow-md shadow-cyan-500/5' : 'border-indigo-500/50 shadow-md shadow-indigo-500/5')
                        : 'border-white/10 hover:border-white/20'
                      }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="p-3 rounded-xl bg-slate-500/10 text-slate-400 group-hover/folder:scale-105 transition-transform duration-300">
                        <FolderMinus className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 group-hover/folder:text-slate-400 transition-colors uppercase tracking-widest">
                        System
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-white group-hover/folder:text-indigo-400 transition-colors truncate">
                        Unassigned
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {getGroupItemCount('Unassigned')} {isGame ? 'games' : 'movies'}
                      </p>
                    </div>
                  </div>

                  {/* Custom Folders */}
                  {groups.map(group => {
                    const count = getGroupItemCount(group.id)
                    return (
                      <div
                        key={group.id}
                        onClick={() => setSelectedGroupFilter(group.id.toString())}
                        className={`group/folder relative bg-ink/40 hover:bg-ink/60 border rounded-2xl p-4 flex flex-col justify-between gap-4 cursor-pointer transition-all duration-300 backdrop-blur-md ${selectedGroupFilter === group.id.toString()
                            ? (isGame ? 'border-cyan-500/50 shadow-md shadow-cyan-500/5' : 'border-indigo-500/50 shadow-md shadow-indigo-500/5')
                            : 'border-white/10 hover:border-white/20'
                          }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className={`p-3 rounded-xl ${isGame ? 'bg-cyan-500/10 text-cyan-300' : 'bg-indigo-500/10 text-indigo-300'} group-hover/folder:scale-105 transition-transform duration-300`}>
                            <FolderHeart className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 group-hover/folder:text-slate-400 transition-colors uppercase tracking-widest">
                            Custom
                          </span>
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-white group-hover/folder:text-indigo-400 transition-colors truncate" title={group.name}>
                            {group.name}
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {count} {isGame ? 'games' : 'movies'}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Folder Breadcrumb/Navigation Header */}
            {activeTab === 'watchlist' && !loading && selectedGroupFilter !== 'All' && (
              <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 bg-ink/30 border border-white/5 rounded-2xl backdrop-blur-md animate-in slide-in-from-top-4 duration-200">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedGroupFilter('All')}
                    className={`p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all hover:bg-white/10 flex items-center justify-center`}
                    title="Back to Folders"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      <span>{isGame ? 'Playlist' : 'Watchlist'}</span>
                      <span>/</span>
                      <span className={textPrimaryColor}>
                        {selectedGroupFilter === 'Unassigned' ? 'Unassigned' : 'Group Folder'}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-white uppercase tracking-wide mt-0.5">
                      {selectedGroupFilter === 'Unassigned'
                        ? 'Unassigned Items'
                        : (groups.find(g => g.id.toString() === selectedGroupFilter)?.name || 'Custom Folder')}
                    </h3>
                  </div>
                </div>
                <div className="text-[10px] font-bold text-slate-400 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 uppercase tracking-wider">
                  {filteredEntries.length} {filteredEntries.length === 1 ? (isGame ? 'game' : 'movie') : (isGame ? 'games' : 'movies')} found
                </div>
              </div>
            )}

            {/* Watchlist Grid */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className={`w-8 h-8 animate-spin ${textPrimaryColor}`} />
                <p className="text-slate-400 text-sm">Loading your vault...</p>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="text-center py-24 bg-ink/30 rounded-3xl border border-dashed border-white/10 p-8">
                <BrandIcon className="w-12 h-12 mx-auto text-slate-700 opacity-40 mb-4" />
                <h3 className="text-lg font-bold text-slate-200">
                  {activeTab === 'watchlist' && selectedGroupFilter !== 'All'
                    ? 'This folder is empty'
                    : `Your ${activeTab === 'watchlist' ? (isGame ? 'Playlist' : 'Watchlist') : activeTab === 'watching' ? (isGame ? 'Currently Playing' : 'Currently Watching') : (isGame ? 'Played Vault' : 'Seen Vault')} is empty`}
                </h3>
                <p className="text-slate-500 text-xs mt-1.5 max-w-xs mx-auto mb-4">
                  {activeTab === 'watchlist' && selectedGroupFilter !== 'All'
                    ? 'Associate items with this group from their details modal, or check this group when adding new items.'
                    : (activeTab === 'watchlist'
                      ? (isGame ? 'Start building your collection by adding games manually or checking recommendations!' : 'Start building your collection by adding movies manually or checking recommendations!')
                      : activeTab === 'watching'
                        ? (isGame ? "You aren't playing any games currently. Mark backlog items as Currently Playing!" : "You aren't watching anything currently. Mark watchlist items as Currently Watching!")
                        : (isGame ? 'Track your played games by marking Playlist items as Played!' : 'Track your watched movies by marking watchlist items as Seen!'))}
                </p>
                <button
                  onClick={() => setActiveTab('discover')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${bgPrimaryColorLight}`}
                >
                  Explore Recommendations
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                {paginatedEntries.map((entry) => {
                  const entryPlayed = isGame ? entry.is_played : entry.is_seen
                  return (
                    <div
                      key={entry.id}
                      onClick={() => handleCardClick(entry)}
                      className="movie-3d-card-container cursor-pointer"
                    >
                      <div
                        className="movie-3d-card bg-ink/60 border border-white/10 rounded-2xl overflow-hidden flex flex-col justify-between h-full transition-all duration-300 relative"
                      >
                        <div className="movie-card-shine absolute inset-0 pointer-events-none z-10 opacity-0 transition-opacity duration-300" />
                        {/* Poster Cover */}
                        <div className="aspect-[2/3] bg-midnight relative overflow-hidden shrink-0 rounded-t-2xl">
                          {entry.poster_data ? (
                            <img src={entry.poster_data} alt={entry.title} loading="lazy" decoding="async" className="w-full h-full object-cover rounded-t-2xl group-hover:scale-[1.03] transition-transform duration-500 animate-in fade-in" />
                          ) : entry.poster_url ? (
                            <img src={entry.poster_url} alt={entry.title} loading="lazy" decoding="async" className="w-full h-full object-cover rounded-t-2xl group-hover:scale-[1.03] transition-transform duration-500 animate-in fade-in" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                              {isGame ? <Gamepad className="w-8 h-8 text-slate-700 mb-2" /> : <Film className="w-8 h-8 text-slate-700 mb-2" />}
                              <span className="text-[10px] text-slate-500 font-bold tracking-wide uppercase line-clamp-3">{entry.title}</span>
                            </div>
                          )}

                          {/* Top tags */}
                          <div className="absolute top-3 right-3">
                            {entryPlayed && entry.my_rating !== null ? (
                              <div className={`px-2 py-0.5 rounded-full bg-midnight/85 border ${isGame ? 'border-cyan-500/30 text-cyan-300 shadow-cyan-500/10' : 'border-indigo-500/30 text-indigo-300 shadow-indigo-500/10'} text-[10px] font-black flex items-center gap-1 backdrop-blur-md shadow-md`}>
                                <BrandIcon className={`w-3 h-3 ${isGame ? 'fill-cyan-300 text-cyan-300' : 'fill-indigo-300 text-indigo-300'}`} />
                                <span>{Number(entry.my_rating).toFixed(1)}</span>
                              </div>
                            ) : (
                              <div className="px-2 py-0.5 rounded-full bg-midnight/70 border border-white/10 text-[10px] font-black text-amber-300 flex items-center gap-1 backdrop-blur-md">
                                <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                                <span>{Number(entry.rating || 0).toFixed(1)}</span>
                              </div>
                            )}
                          </div>

                          <div className="absolute bottom-3 left-3">
                            <span className="px-2 py-0.5 rounded bg-midnight/80 border border-white/5 text-[9px] font-black uppercase tracking-wider text-slate-200 backdrop-blur-sm">
                              {isGame ? entry.platform : entry.category}
                            </span>
                          </div>
                        </div>

                        {/* Details Section */}
                        <div className="p-4 flex-1 flex flex-col justify-between min-h-0">
                          <div>
                            <div className="flex justify-between items-start gap-2 mb-2">
                              <h3 className={`font-bold text-sm text-white line-clamp-1 hover:${textPrimaryColor} transition-colors`} title={entry.title}>
                                {entry.title}
                              </h3>
                            </div>

                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {entry.genres?.split(', ').slice(0, 2).map((g, gIdx) => (
                                <span key={gIdx} className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-midnight/50 text-slate-400 border border-white/5">
                                  {g}
                                </span>
                              ))}
                              {entryPlayed && entry.tags?.split(', ').slice(0, 1).map((t, tIdx) => (
                                <span key={tIdx} className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${isGame ? 'bg-cyan-600/10 text-cyan-300 border-cyan-500/20' : 'bg-indigo-600/10 text-indigo-300 border-indigo-500/20'}`}>
                                  {t}
                                </span>
                              ))}
                            </div>

                            <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed">
                              {entry.synopsis || 'No synopsis provided.'}
                            </p>
                          </div>

                          {/* Actions footer */}
                          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleViewClick(entry); }}
                              className="flex-1 py-2 px-3 bg-midnight/60 hover:bg-slate-800 border border-white/5 hover:text-white rounded-xl text-[10px] font-bold text-slate-200 transition-all text-center"
                            >
                              View Details
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleEditClick(entry); }}
                              className={`p-2 bg-midnight/60 border border-white/5 text-slate-400 hover:text-white rounded-xl transition-all ${isGame ? 'hover:bg-cyan-600/10 hover:text-cyan-300' : 'hover:bg-indigo-600/10 hover:text-indigo-500'}`}
                              title="Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }}
                              className="p-2 bg-midnight/60 hover:bg-red-500/10 border border-white/5 text-slate-400 hover:text-red-500 rounded-xl transition-all"
                              title="Remove"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Pagination controls */}
            {!loading && totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-10">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="px-4 py-2 bg-ink border border-white/10 rounded-xl text-xs font-bold text-slate-400 disabled:opacity-40 hover:bg-slate-800 transition-all"
                >
                  Previous
                </button>
                <span className="text-xs font-bold text-slate-500">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="px-4 py-2 bg-ink border border-white/10 rounded-xl text-xs font-bold text-slate-400 disabled:opacity-40 hover:bg-slate-800 transition-all"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-12">
            {/* Global Search & Quick Add */}
            <div className="bg-ink/40 border border-white/10 p-5 rounded-3xl backdrop-blur-md space-y-4">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Search className={`w-4 h-4 ${textPrimaryColor}`} />
                  <span>Search & Quick Add</span>
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  {isGame
                    ? 'Search the global RAWG database to add games directly to your Playlist or Played Vault.'
                    : 'Search the global TMDB database to add movies directly to your Watchlist or Seen Vault.'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder={isGame ? "Type game name to search globally..." : "Type movie or web series name to search globally..."}
                    value={globalSearchQuery}
                    onChange={(e) => setGlobalSearchQuery(e.target.value)}
                    className={`w-full bg-midnight/60 border border-white/5 ${borderPrimaryFocus} rounded-xl pl-11 pr-10 py-2.5 text-xs text-slate-200 outline-none transition-all placeholder:text-slate-500`}
                  />
                  {globalSearchQuery && (
                    <button
                      onClick={() => { setGlobalSearchQuery(''); setGlobalSearchResults([]); }}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-500 hover:text-slate-200 font-bold uppercase"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {!isGame && (
                  <div className="w-full sm:w-48 shrink-0">
                    <select
                      value={globalSearchLanguage}
                      onChange={(e) => setGlobalSearchLanguage(e.target.value)}
                      className={`w-full bg-midnight/60 border border-white/5 ${borderPrimaryFocus} rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none transition-all cursor-pointer`}
                    >
                      <option value="All">All Languages</option>
                      {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {isSearchingGlobal && (
                <div className="flex items-center gap-2 py-4 justify-center">
                  <Loader2 className={`w-4 h-4 animate-spin ${textPrimaryColor}`} />
                  <span className="text-xs text-slate-400">Searching global database...</span>
                </div>
              )}

              {!isSearchingGlobal && globalSearchResults.length > 0 && (() => {
                const filteredGlobalResults = isGame
                  ? globalSearchResults
                  : globalSearchResults.filter(item => globalSearchLanguage === 'All' || item.language === globalSearchLanguage)
                if (filteredGlobalResults.length === 0) {
                  return (
                    <div className="text-center py-6 bg-slate-955/20 rounded-2xl border border-dashed border-white/10/85 p-4">
                      <p className="text-slate-500 text-xs">No matches found in search results. Try clearing filters.</p>
                    </div>
                  )
                }
                return (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Search Results</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {filteredGlobalResults.map((item, idx) => {
                        const inWatchlist = isAlreadyInWatchlist(item.title)
                        return (
                          <div key={idx} className="movie-3d-card-container">
                            <div
                              className="movie-3d-card bg-slate-955 border border-slate-850 rounded-2xl overflow-hidden flex flex-col justify-between h-full transition-all duration-300 relative cursor-pointer"
                              onClick={() => handleCardClick(item)}
                            >
                              <div className="movie-card-shine absolute inset-0 pointer-events-none z-10 opacity-0 transition-opacity duration-300" />
                              <div className="aspect-[2/3] bg-ink relative overflow-hidden shrink-0 rounded-t-2xl">
                                {item.poster_url ? (
                                  <img src={item.poster_url} alt={item.title} loading="lazy" decoding="async" className="w-full h-full object-cover rounded-t-2xl group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center">
                                    {isGame ? <Gamepad className="w-8 h-8 text-slate-800 mb-1" /> : <Film className="w-8 h-8 text-slate-800 mb-1" />}
                                    <span className="text-[10px] text-slate-600 font-bold uppercase truncate w-full">{item.title}</span>
                                  </div>
                                )}
                                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-midnight/70 border border-white/10 text-[9px] font-black text-amber-300 flex items-center gap-0.5 backdrop-blur-md">
                                  <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />
                                  <span>{Number(item.rating || 0).toFixed(1)}</span>
                                </div>
                              </div>

                              <div className="p-3 flex-1 flex flex-col justify-between">
                                <div>
                                  <h4 className={`font-bold text-xs text-white line-clamp-1 leading-snug hover:${textPrimaryColor} transition-colors`} title={item.title}>{item.title}</h4>
                                  <p className="text-[9px] text-slate-500 mt-0.5">
                                    {isGame ? item.platform : `${item.category} • ${item.language}`}
                                  </p>
                                </div>

                                <div className="flex flex-col gap-1.5 mt-3">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (!inWatchlist) handleAddToWatchlist(item)
                                    }}
                                    disabled={inWatchlist}
                                    className={`w-full py-1.5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${inWatchlist
                                      ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                                      : `${bgPrimaryColor} text-white`
                                      }`}
                                  >
                                    {inWatchlist ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                    <span>{inWatchlist ? (isGame ? 'In Playlist' : 'In Watchlist') : (isGame ? 'Add Playlist' : 'Add Watchlist')}</span>
                                  </button>

                                  {!inWatchlist && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setSelectedEntry(item)
                                        setShowSeenForm(true)
                                        setShowViewModal(true)
                                      }}
                                      className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-[10px] transition-all flex items-center justify-center gap-1 border border-white/5"
                                    >
                                      <BrandIcon className={`w-3 h-3 ${isGame ? 'fill-cyan-300 text-cyan-300' : 'fill-indigo-300 text-indigo-300'}`} />
                                      <span>{isGame ? 'Mark as Played' : 'Mark as Seen'}</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* Dynamic Discovery Explorer */}
            {!isGame && (
              <div className="bg-ink/40 border border-white/10 p-6 rounded-3xl backdrop-blur-md space-y-6">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2 uppercase tracking-wider">
                    <Search className="w-4 h-4 text-indigo-500" />
                    <span>Dynamic Discovery Explorer</span>
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">Combine any category, genre, and language to dynamically discover top titles.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</label>
                    <select
                      value={discoverCategory}
                      onChange={(e) => setDiscoverCategory(e.target.value)}
                      className="w-full bg-midnight/60 border border-white/5 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none transition-all"
                    >
                      <option value="movie">Movies</option>
                      <option value="tv">Web Series</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Genre</label>
                    <select
                      value={discoverGenre}
                      onChange={(e) => setDiscoverGenre(e.target.value)}
                      className="w-full bg-midnight/60 border border-white/5 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none transition-all"
                    >
                      <option value="All">All Genres</option>
                      {Object.keys(GENRE_IDS).map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Language</label>
                    <select
                      value={discoverLanguage}
                      onChange={(e) => setDiscoverLanguage(e.target.value)}
                      className="w-full bg-midnight/60 border border-white/5 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none transition-all"
                    >
                      <option value="All">All Languages</option>
                      {Object.keys(LANGUAGE_CODES).map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>

                {discoverLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                    <p className="text-slate-400 text-xs">Finding matches...</p>
                  </div>
                ) : discoverItems.length === 0 ? (
                  <div className="text-center py-12 bg-midnight/20 rounded-2xl border border-dashed border-white/10 p-6">
                    <p className="text-slate-500 text-xs">No matching titles found. Try changing your discovery options.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <span>Matches</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 text-[10px]">{discoverItems.length}</span>
                    </h4>

                    <div className="relative group/row">
                      {/* Left Scroll Button */}
                      <button
                        onClick={() => scrollRow('discover-row', 'left')}
                        className="absolute left-0 top-[35%] -translate-y-1/2 w-10 h-10 rounded-full bg-midnight/85 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-all duration-300 z-10 shadow-lg hover:bg-indigo-600 hover:border-indigo-500 hover:scale-105 active:scale-95"
                        title="Scroll Left"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>

                      {/* Explorer Matches list */}
                      <div
                        id="discover-row"
                        className="flex gap-6 overflow-x-auto pb-4 no-scrollbar scroll-row"
                        style={{ touchAction: 'pan-x', WebkitOverflowScrolling: 'touch' }}
                      >
                        {discoverItems.map((item, idx) => {
                          const inWatchlist = isAlreadyInWatchlist(item.title)
                          return (
                            <div
                              key={idx}
                              onClick={() => handleCardClick(item)}
                              className="movie-3d-card-container min-w-[165px] w-[165px] sm:min-w-[190px] sm:w-[190px] flex-shrink-0"
                            >
                              <div
                                className="movie-3d-card bg-midnight border border-slate-850 rounded-2xl overflow-hidden flex flex-col justify-between h-full transition-all duration-300 relative cursor-pointer"
                              >
                                <div className="movie-card-shine absolute inset-0 pointer-events-none z-10 opacity-0 transition-opacity duration-300" />
                                <div className="aspect-[2/3] bg-ink relative overflow-hidden shrink-0 rounded-t-2xl">
                                  {item.poster_url ? (
                                    <img src={item.poster_url} alt={item.title} loading="lazy" decoding="async" className="w-full h-full object-cover rounded-t-2xl" />
                                  ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center">
                                      <Film className="w-8 h-8 text-slate-800 mb-1" />
                                      <span className="text-[10px] text-slate-600 font-bold uppercase truncate w-full">{item.title}</span>
                                    </div>
                                  )}
                                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-midnight/80 border border-white/10 text-[9px] font-black text-amber-300 flex items-center gap-0.5">
                                    <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />
                                    <span>{Number(item.rating || 0).toFixed(1)}</span>
                                  </div>
                                </div>
                                <div className="p-3 flex-1 flex flex-col justify-between">
                                  <div>
                                    <h4 className="font-bold text-xs text-white line-clamp-1 leading-snug group-hover:text-indigo-500 transition-colors" title={item.title}>{item.title}</h4>
                                    <p className="text-[9px] text-slate-500 mt-0.5">{item.category} • {item.language}</p>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (!inWatchlist) handleAddToWatchlist(item)
                                    }}
                                    disabled={inWatchlist}
                                    className={`w-full mt-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${inWatchlist
                                      ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                                      }`}
                                  >
                                    {inWatchlist ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                    <span>{inWatchlist ? 'In Watchlist' : 'Add Watchlist'}</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Right Scroll Button */}
                      <button
                        onClick={() => scrollRow('discover-row', 'right')}
                        className="absolute right-0 top-[35%] -translate-y-1/2 w-10 h-10 rounded-full bg-midnight/85 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-all duration-300 z-10 shadow-lg hover:bg-indigo-600 hover:border-indigo-500 hover:scale-105 active:scale-95"
                        title="Scroll Right"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Curated Recommendations Lists */}
            {renderContinueWatchingRow()}

            {recLoading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className={`w-8 h-8 animate-spin ${textPrimaryColor}`} />
                <p className="text-slate-400 text-sm">
                  {isGame ? 'Brewing game recommendations...' : 'Brewing movie recommendations...'}
                </p>
              </div>
            ) : recommendations ? (
              isGame ? (
                <div className="space-y-12">
                  {renderRecommendationRow("Recommended For You 🌟", personalizedRecs, <Sparkles className="w-5 h-5 text-amber-300" />)}
                  {renderRecommendationRow("Recently Released Games 🚀", recommendations.recently_released, <Rocket className="w-5 h-5 text-cyan-400" />)}
                  {renderRecommendationRow("Popular Upcoming Games 🚀", recommendations.upcoming, <Rocket className="w-5 h-5 text-purple-400" />)}
                  {renderRecommendationRow("Trending Games 🔥", recommendations.trending_games, <TrendingUp className="w-5 h-5 text-cyan-300" />, true)}
                  {renderRecommendationRow("Top Role-Playing Games 🧙", recommendations.top_rpgs, <Gamepad2 className="w-5 h-5 text-violet-500" />)}
                  {renderRecommendationRow("Action Hits 💥", recommendations.action_hits, <Gamepad className="w-5 h-5 text-teal-400" />)}
                  {renderRecommendationRow("Indie Gems 💡", recommendations.indie_hits, <Sparkles className="w-5 h-5 text-pink-400" />)}
                  {renderRecommendationRow("Strategy Masters 🧠", recommendations.strategy_hits, <Trophy className="w-5 h-5 text-amber-400" />)}
                  {renderRecommendationRow("Shooter Games 🎯", recommendations.shooter_hits, <Gamepad className="w-5 h-5 text-red-400" />)}
                  {renderRecommendationRow("Puzzle & Brain Games 🧩", recommendations.puzzle_hits, <Sparkles className="w-5 h-5 text-blue-400" />)}
                  {renderRecommendationRow("Simulation Games 🌍", recommendations.simulation_hits, <Globe className="w-5 h-5 text-cyan-300" />)}
                  {renderRecommendationRow("Adventure Games 🗺️", recommendations.adventure_hits, <Rocket className="w-5 h-5 text-indigo-300" />)}
                  {renderRecommendationRow("Sports Games ⚽", recommendations.sports_hits, <Trophy className="w-5 h-5 text-green-400" />)}
                  {renderRecommendationRow("Horror Games 👻", recommendations.horror_hits, <Gamepad className="w-5 h-5 text-slate-400" />)}
                  {renderRecommendationRow("Fighting Games 🥊", recommendations.fighting_hits, <Gamepad2 className="w-5 h-5 text-rose-400" />)}
                  {renderRecommendationRow("Nintendo Switch Hits 🕹️", recommendations.switch_hits, <Gamepad className="w-5 h-5 text-red-500" />)}
                  {renderRecommendationRow("Top PC Games 💻", recommendations.top_pc, <Gamepad2 className="w-5 h-5 text-sky-400" />)}
                  {renderRecommendationRow("Top PS5 Games 🎮", recommendations.top_ps5, <Gamepad2 className="w-5 h-5 text-blue-500" />)}
                  {renderRecommendationRow("Top Xbox Games 🟢", recommendations.top_xbox, <Gamepad className="w-5 h-5 text-green-500" />)}
                </div>
              ) : (
                <div className="space-y-12">
                  {renderRecommendationRow("Recommended For You 🌟", personalizedRecs, <Sparkles className="w-5 h-5 text-amber-300" />)}
                  {renderRecommendationRow("Recently Released Movies 🚀", recommendations.recently_released, <Rocket className="w-5 h-5 text-cyan-400" />)}
                  {renderRecommendationRow("Popular Upcoming Movies & Shows 🚀", recommendations.upcoming, <Rocket className="w-5 h-5 text-purple-400" />)}
                  {renderRecommendationRow("Trending Top 50 in the World 🔥", recommendations.trending_top_10, <TrendingUp className="w-5 h-5 text-indigo-500" />, true)}
                  {renderRecommendationRow("Top Rated Movies of All Time ⭐", recommendations.top_rated, <Star className="w-5 h-5 text-yellow-500" />)}
                  {renderRecommendationRow("Top Web Series 📺", recommendations.web_series, <Tv className="w-5 h-5 text-purple-500" />)}
                  {renderRecommendationRow("Popular Series Now 🍿", recommendations.popular_series, <Tv className="w-5 h-5 text-indigo-400" />)}
                  {renderRecommendationRow("Top Classics 🏆", recommendations.top_classics, <Trophy className="w-5 h-5 text-amber-400" />)}
                  {renderRecommendationRow("Top Anime Movies 🌸", recommendations.anime_movies, <Film className="w-5 h-5 text-teal-500" />)}
                  {renderRecommendationRow("Top Anime Series 🌸", recommendations.anime_series, <Tv className="w-5 h-5 text-cyan-500" />)}

                  {/* Genre Rows */}
                  {renderRecommendationRow("Top Action Movies 💥", recommendations.action, <Film className="w-5 h-5 text-red-500" />)}
                  {renderRecommendationRow("Top Thriller Movies 🔪", recommendations.thriller, <Film className="w-5 h-5 text-slate-400" />)}
                  {renderRecommendationRow("Top Horror Movies 👻", recommendations.horror, <Film className="w-5 h-5 text-zinc-400" />)}
                  {renderRecommendationRow("Top Sci-Fi Movies 🚀", recommendations.sci_fi, <Rocket className="w-5 h-5 text-sky-400" />)}
                  {renderRecommendationRow("Top Comedy Movies 😂", recommendations.comedy, <Film className="w-5 h-5 text-blue-500" />)}
                  {renderRecommendationRow("Top Drama Movies 🎭", recommendations.drama, <Film className="w-5 h-5 text-violet-400" />)}
                  {renderRecommendationRow("Top Romance Movies 💕", recommendations.romance, <Film className="w-5 h-5 text-pink-400" />)}
                  {renderRecommendationRow("Top Adventure Movies 🗺️", recommendations.adventure, <Rocket className="w-5 h-5 text-indigo-300" />)}
                  {renderRecommendationRow("Top Fantasy Movies ✨", recommendations.fantasy, <Sparkles className="w-5 h-5 text-purple-400" />)}
                  {renderRecommendationRow("Top Documentaries 🎬", recommendations.documentary, <Film className="w-5 h-5 text-cyan-300" />)}

                  {/* Language Rows */}
                  {renderRecommendationRow("Telugu Hits 🎬", recommendations.telugu, <Globe className="w-5 h-5 text-cyan-500" />)}
                  {renderRecommendationRow("Hindi Hits 🎬", recommendations.hindi, <Globe className="w-5 h-5 text-indigo-300" />)}
                  {renderRecommendationRow("English Hits 🎬", recommendations.english, <Globe className="w-5 h-5 text-blue-400" />)}
                  {renderRecommendationRow("Tamil Hits 🎬", recommendations.tamil, <Globe className="w-5 h-5 text-red-400" />)}
                  {renderRecommendationRow("Kannada Hits 🎬", recommendations.kannada, <Globe className="w-5 h-5 text-amber-300" />)}
                  {renderRecommendationRow("Korean Hits 🇰🇷", recommendations.korean, <Globe className="w-5 h-5 text-pink-400" />)}
                  {renderRecommendationRow("French Hits 🇫🇷", recommendations.french, <Globe className="w-5 h-5 text-indigo-400" />)}
                  {renderRecommendationRow("Spanish Hits 🇪🇸", recommendations.spanish, <Globe className="w-5 h-5 text-amber-400" />)}
                </div>
              )
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-500 text-xs">
                  {isGame ? 'Failed to load game recommendations.' : 'Failed to load recommendations. Please verify your TMDB key.'}
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* VIEW DETAILS MODAL */}
      {showViewModal && selectedEntry && (() => {
        const entryPlayed = isGame ? selectedEntry.is_played : selectedEntry.is_seen
        return (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowViewModal(false)} />
            <div className="relative glass-strong w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] animate-in zoom-in-95 duration-200">

              {/* Left Poster */}
              <div className="w-full md:w-2/5 h-48 md:h-auto bg-midnight relative shrink-0 overflow-hidden">
                {selectedEntry.poster_data ? (
                  <img src={selectedEntry.poster_data} className="w-full h-full object-cover" alt={selectedEntry.title} />
                ) : selectedEntry.poster_url ? (
                  <img src={selectedEntry.poster_url} className="w-full h-full object-cover" alt={selectedEntry.title} />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 bg-midnight">
                    {isGame ? <Gamepad className="w-16 h-16 text-slate-800 mb-2" /> : <Film className="w-16 h-16 text-slate-800 mb-2" />}
                    <span className="text-xs font-bold text-slate-600 uppercase">{selectedEntry.title}</span>
                  </div>
                )}
                <button
                  onClick={() => setShowViewModal(false)}
                  className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full md:hidden z-20"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Right Detailed Info */}
              <div className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-black text-white">{selectedEntry.title}</h2>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <div className="flex items-center gap-1 text-xs font-bold text-yellow-500">
                        <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                        <span>{isGame ? 'RAWG' : 'TMDB'}: {Number(selectedEntry.rating || 0).toFixed(1)}</span>
                      </div>
                      {entryPlayed && selectedEntry.my_rating !== null && (
                        <div className={`flex items-center gap-1.5 text-xs font-bold ${isGame ? 'text-cyan-300 bg-cyan-500/5 border-cyan-500/15' : 'text-indigo-300 bg-indigo-500/5 border-indigo-500/15'} px-2 py-0.5 rounded-lg border`}>
                          <BrandIcon className={`w-4 h-4 ${isGame ? 'fill-cyan-300 text-cyan-300' : 'fill-indigo-300 text-indigo-300'}`} />
                          <span>My Rating: {Number(selectedEntry.my_rating).toFixed(1)}</span>
                        </div>
                      )}
                      <span className={`px-2.5 py-0.5 rounded ${isGame ? 'bg-cyan-600/10 border-cyan-500/20 text-cyan-300' : 'bg-indigo-600/10 border-indigo-500/20 text-indigo-500'} text-[10px] font-bold uppercase`}>
                        {isGame ? selectedEntry.platform : selectedEntry.category}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setShowViewModal(false)} className="hidden md:block p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{isGame ? 'Platform' : 'Language'}</p>
                    <p className="text-sm font-semibold text-slate-200 mt-0.5">
                      {isGame ? (selectedEntry.platform || 'Not specified') : (selectedEntry.language || 'Not specified')}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Status</p>
                    <p className="text-sm font-semibold text-slate-200 mt-0.5">
                      {entryPlayed
                        ? (isGame ? "Played & Reviewed" : "Seen & Reviewed")
                        : (selectedEntry.created_at ? (isGame ? "In Playlist" : "In Watchlist") : "Not Tracked")}
                    </p>
                  </div>
                  {isGame && selectedEntry.developers && (
                    <div className="col-span-2 border-t border-white/5 pt-2">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Developers</p>
                      <p className="text-xs font-semibold text-cyan-400 mt-0.5">{selectedEntry.developers}</p>
                    </div>
                  )}
                  {isGame && selectedEntry.website && (
                    <div className="col-span-2 border-t border-white/5 pt-2">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Official Website</p>
                      <a href={selectedEntry.website} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1 mt-0.5">
                        <span>{selectedEntry.website}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>

                {selectedEntry.genres && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Genres</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedEntry.genres.split(', ').map(g => (
                        <span key={g} className="px-3 py-1 rounded-xl bg-midnight/60 border border-white/10 text-xs font-semibold text-slate-200">
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Synopsis</p>
                  {loadingDescription ? (
                    <div className="flex items-center gap-2 py-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-300" />
                      <span className="text-xs text-slate-500">Fetching game description...</span>
                    </div>
                  ) : (
                    <p className="text-slate-200 text-sm leading-relaxed italic">
                      "{selectedEntry.synopsis || 'No synopsis provided.'}"
                    </p>
                  )}
                </div>

                {entryPlayed && (
                  <div className={`p-5 rounded-3xl border space-y-4 ${isGame ? 'bg-cyan-500/5 border-cyan-500/15' : 'bg-indigo-500/5 border-indigo-500/15'}`}>
                    <div className={`flex justify-between items-center border-b pb-2.5 ${isGame ? 'border-cyan-500/10' : 'border-indigo-500/10'}`}>
                      <p className={`text-[10px] font-black uppercase tracking-widest ${isGame ? 'text-cyan-300' : 'text-indigo-500'}`}>
                        {isGame ? 'My Played Review' : 'My Seen Review'}
                      </p>
                      {selectedEntry.my_rating !== null && (
                        <div className="flex gap-1">
                          <PopcornRating rating={selectedEntry.my_rating} isGame={isGame} />
                        </div>
                      )}
                    </div>

                    {selectedEntry.tags && (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedEntry.tags.split(', ').map(tag => (
                          <span key={tag} className={`px-2.5 py-1 rounded-xl border text-[9px] font-bold ${isGame ? 'bg-cyan-600/10 border-cyan-500/20 text-cyan-300' : 'bg-indigo-600/10 border-indigo-500/20 text-indigo-300'}`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-slate-200 text-xs leading-relaxed italic">
                      "{selectedEntry.reasons_for_liking || 'No comments provided.'}"
                    </p>
                  </div>
                )}

                {!entryPlayed && selectedEntry.reasons_for_liking && (
                  <div className={`p-4 rounded-2xl border space-y-1.5 ${isGame ? 'bg-cyan-500/5 border-cyan-500/10' : 'bg-indigo-500/10 border-indigo-500/10'}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${isGame ? 'text-cyan-300' : 'text-indigo-500'}`}>Personal Note</p>
                    <p className="text-slate-200 text-xs leading-relaxed">{selectedEntry.reasons_for_liking}</p>
                  </div>
                )}

                <div className="space-y-4 pt-4 border-t border-white/5">
                  {showSeenForm ? (
                    <div className="p-5 rounded-3xl bg-midnight/45 border border-white/10 space-y-6 animate-in fade-in slide-in-from-top-3 duration-300">

                      {/* Rate This Header */}
                      <div className="space-y-1">
                        <h4 className={`text-xs font-black uppercase tracking-wider ${isGame ? 'text-cyan-300' : 'text-indigo-500'}`}>
                          {isGame ? 'Rate This Game' : 'Rate This Movie'}
                        </h4>
                        <p className="text-[10px] text-slate-400">How would you rate your experience?</p>
                      </div>

                      <div className="flex items-center gap-6 py-2">
                        {/* Rating slider */}
                        <div className="flex-1">
                          <PopcornSlider value={seenRating} onChange={(val) => setSeenRating(val)} isGame={isGame} />
                        </div>

                        {/* Dotted border feedback indicator ring */}
                        <div className={`relative w-20 h-20 flex-shrink-0 flex flex-col items-center justify-center rounded-full bg-ink border border-dashed transition-all duration-300 ${seenRating > 4.5
                          ? (isGame ? 'border-cyan-300 shadow-[0_0_22px_rgba(16,185,129,0.4)] scale-105' : 'border-amber-300 shadow-[0_0_22px_rgba(253,224,71,0.4)] scale-105')
                          : (isGame ? 'border-cyan-500/40 shadow-lg shadow-cyan-500/5' : 'border-indigo-500/40 shadow-lg shadow-indigo-500/5')
                          }`}>
                          <div className={`absolute inset-1 rounded-full border border-dotted transition-all duration-300 ${seenRating > 4.5
                            ? (isGame ? 'border-cyan-400/50 animate-spin-dotted-fast' : 'border-amber-300/50 animate-spin-dotted-fast')
                            : (isGame ? 'border-cyan-500/20 animate-spin-dotted' : 'border-indigo-500/20 animate-spin-dotted')
                            }`} />
                          <span className={`text-2xl font-black transition-all duration-300 ${seenRating > 4.5
                            ? (isGame ? 'text-cyan-300 drop-shadow-[0_0_12px_rgba(16,185,129,0.55)]' : 'text-amber-300 animate-gold-pulse drop-shadow-[0_0_12px_rgba(253,224,71,0.55)]')
                            : (isGame ? 'text-cyan-300' : 'text-indigo-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]')
                            }`}>
                            {seenRating.toFixed(1)}
                          </span>
                          <span className={`text-[8px] font-black uppercase tracking-wider mt-0.5 transition-colors duration-300 ${seenRating > 4.5
                            ? (isGame ? 'text-cyan-300' : 'text-amber-300')
                            : (isGame ? 'text-cyan-300/80' : 'text-indigo-300/80')
                            }`}>
                            {getRatingLabel(seenRating)}
                          </span>
                        </div>
                      </div>

                      {/* Share Your Thoughts review textarea */}
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <h5 className={`text-[11px] font-black uppercase tracking-wider ${isGame ? 'text-cyan-300' : 'text-indigo-500'}`}>
                            Share Your Thoughts
                          </h5>
                          <p className="text-[10px] text-slate-400">
                            {isGame ? 'Your review helps others discover great games.' : 'Your review helps others discover great movies.'}
                          </p>
                        </div>

                        <div className="flex gap-4 items-start">
                          {/* Rocket / Controller Avatar */}
                          <div className={`w-11 h-11 rounded-full bg-midnight/80 border border-white/10 flex items-center justify-center ${isGame ? 'text-cyan-300' : 'text-indigo-500'} shadow-inner shrink-0 mt-1`}>
                            {isGame ? <Gamepad className="w-5 h-5 animate-pulse" /> : <Rocket className="w-5 h-5 animate-pulse" />}
                          </div>

                          {/* Textarea */}
                          <div className="flex-1 relative">
                            <textarea
                              maxLength={500}
                              rows={3}
                              value={seenComments}
                              onChange={(e) => setSeenComments(e.target.value)}
                              placeholder="Write your review here..."
                              className={`w-full bg-midnight/60 border border-white/10 ${isGame ? 'focus:border-cyan-500' : 'focus:border-indigo-500'} rounded-xl px-4 py-3 text-xs text-slate-200 outline-none transition-all resize-none min-h-[90px]`}
                            />
                            <div className="absolute bottom-2.5 right-3 text-[9px] font-bold text-slate-500">
                              {seenComments.length}/500
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Add Tags section */}
                      <div className="space-y-3">
                        <h5 className={`text-[11px] font-black uppercase tracking-wider ${isGame ? 'text-cyan-300' : 'text-indigo-500'}`}>
                          Add Tags (Optional)
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {(isGame ? GAME_TAGS : REVIEW_TAGS).map((tag) => {
                            const active = selectedTags.includes(tag)
                            const activeColors = {
                              'Mind-blowing': 'bg-purple-500/10 border-purple-500/30 text-purple-400',
                              'Emotional': 'bg-teal-500/10 border-teal-500/30 text-teal-400',
                              'Suspenseful': 'bg-red-500/10 border-red-500/30 text-red-400',
                              'Inspirational': 'bg-yellow-500/10 border-yellow-500/30 text-amber-300',
                              'Masterpiece': 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
                              'Must-watch': 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
                              'Must-play': 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
                              'Hilarious': 'bg-pink-500/10 border-pink-500/30 text-pink-400',
                              'Heartwarming': 'bg-sky-500/10 border-sky-500/30 text-sky-400',
                              'Addictive': 'bg-red-500/10 border-red-500/30 text-red-400',
                              'Challenging': 'bg-yellow-500/10 border-yellow-500/30 text-amber-300',
                              'Relaxing': 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                            }
                            const colorClass = activeColors[tag] || (isGame ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300' : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300')
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => {
                                  setSelectedTags(prev =>
                                    prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                                  )
                                }}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black border transition-all ${active
                                  ? `${colorClass} shadow-md`
                                  : 'bg-midnight/60 border-white/5 text-slate-400 hover:border-white/10'
                                  }`}
                              >
                                {tag}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Footer form buttons */}
                      <div className="flex gap-3 pt-4 border-t border-white/5">
                        <button
                          type="button"
                          onClick={() => setShowSeenForm(false)}
                          className="px-5 py-3 rounded-xl border border-white/5 hover:bg-white/5 text-xs font-bold text-slate-400 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveSeen}
                          disabled={isSavingSeen}
                          className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white font-bold text-xs transition-all shadow-lg active:scale-[0.98] ${isGame ? 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/15' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/15'} disabled:opacity-50`}
                        >
                          {isSavingSeen ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Saving Review...</span>
                            </>
                          ) : (
                            <>
                              <Bookmark className="w-4 h-4 fill-white/10" />
                              <span>{selectedEntry.id ? (isGame ? 'Save Played Review' : 'Save Seen Review') : (isGame ? 'Add to Playlist as Played' : 'Add to Watchlist as Seen')}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Segmented Status Control */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">My Status</p>
                        <div className="flex bg-midnight/80 p-1 rounded-2xl border border-white/5 items-center max-w-md shadow-inner">
                          <button
                            onClick={() => handleUpdateStatus('watchlist')}
                            disabled={updatingStatusType !== null}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-all rounded-xl ${selectedEntry.id !== undefined && !selectedEntry.is_seen && !selectedEntry.is_played && !(isGame ? selectedEntry.is_playing : selectedEntry.is_watching)
                              ? (isGame ? 'bg-cyan-600 text-white shadow-md' : 'bg-indigo-600 text-white shadow-md')
                              : 'text-slate-400 hover:text-slate-200'
                              } disabled:opacity-50`}
                          >
                            {updatingStatusType === 'watchlist' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bookmark className="w-3.5 h-3.5" />}
                            <span>{isGame ? 'Backlog' : 'Watchlist'}</span>
                          </button>

                          <button
                            onClick={() => handleUpdateStatus('watching')}
                            disabled={updatingStatusType !== null}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-all rounded-xl ${(isGame ? selectedEntry.is_playing : selectedEntry.is_watching)
                              ? (isGame ? 'bg-cyan-600 text-white shadow-md' : 'bg-indigo-600 text-white shadow-md')
                              : 'text-slate-400 hover:text-slate-200'
                              } disabled:opacity-50`}
                          >
                            {updatingStatusType === 'watching' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (isGame ? <Gamepad className="w-3.5 h-3.5" /> : <Tv className="w-3.5 h-3.5" />)}
                            <span>{isGame ? 'Playing' : 'Watching'}</span>
                          </button>

                          <button
                            onClick={() => handleUpdateStatus('seen')}
                            disabled={updatingStatusType !== null}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-all rounded-xl ${(isGame ? selectedEntry.is_played : selectedEntry.is_seen)
                              ? (isGame ? 'bg-cyan-600 text-white shadow-md' : 'bg-indigo-600 text-white shadow-md')
                              : 'text-slate-400 hover:text-slate-200'
                              } disabled:opacity-50`}
                          >
                            {updatingStatusType === 'seen' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trophy className="w-3.5 h-3.5" />}
                            <span>{isGame ? 'Played' : 'Seen'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Custom Groups Assignment */}
                      <div className="space-y-2 pt-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                          {isGame ? 'Game Playlists / Groups' : 'Custom Groups'}
                        </p>
                        <div className="flex flex-wrap gap-2 items-center">
                          {groups.length === 0 ? (
                            <p className="text-slate-500 text-[10px] italic">
                              No custom groups created. Click "Manage" in the filter panel to create one.
                            </p>
                          ) : (
                            groups.map(group => {
                              const isMember = selectedEntry.custom_groups?.some(g => g.id === group.id)
                              return (
                                <button
                                  key={group.id}
                                  type="button"
                                  onClick={() => handleToggleGroup(group)}
                                  disabled={togglingGroupId !== null}
                                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all flex items-center gap-1.5 ${isMember
                                    ? (isGame ? 'bg-cyan-600/20 border-cyan-500 text-cyan-300 shadow-md' : 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-md')
                                    : 'bg-midnight/60 border-white/5 text-slate-400 hover:border-white/10'
                                    } disabled:opacity-60`}
                                >
                                  {togglingGroupId === group.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    isMember ? '✓ ' : '+ '
                                  )}
                                  <span>{group.name}</span>
                                </button>
                              )
                            })
                          )}
                        </div>
                      </div>

                      {/* Edit / Remove actions */}
                      {selectedEntry.id && (
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => { handleEditClick(selectedEntry); setShowViewModal(false); }}
                            className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold transition-all text-slate-200 flex items-center justify-center gap-1.5"
                            title="Edit details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Metadata</span>
                          </button>
                          <button
                            onClick={() => handleDelete(selectedEntry.id)}
                            disabled={isDeleting}
                            className="py-2.5 px-4 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                            title="Remove"
                          >
                            {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            <span>Remove</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Similar Items Row */}
                <div className="space-y-4 pt-6 border-t border-white/5">
                  <h4 className={`text-xs font-black uppercase tracking-wider ${isGame ? 'text-cyan-300' : 'text-indigo-500'}`}>
                    {isGame ? 'Similar Games You May Like' : 'Similar Movies & Shows'}
                  </h4>
                  {similarItemsLoading ? (
                    <div className="flex items-center gap-3 py-6 justify-center">
                      <Loader2 className={`w-5 h-5 animate-spin ${isGame ? 'text-cyan-300' : 'text-indigo-500'}`} />
                      <span className="text-xs text-slate-500">Finding similar titles...</span>
                    </div>
                  ) : similarItems.length > 0 ? (
                    <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar scroll-row" style={{ touchAction: 'pan-x', WebkitOverflowScrolling: 'touch' }}>
                      {similarItems.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleCardClick(item)}
                          className="w-[110px] min-w-[110px] bg-slate-955 border border-slate-850 rounded-xl p-2 cursor-pointer hover:border-slate-750 transition-all shrink-0 group/similar"
                        >
                          <div className="aspect-[2/3] bg-ink rounded-lg overflow-hidden relative mb-2">
                            {item.poster_url ? (
                              <img src={item.poster_url} loading="lazy" decoding="async" className="w-full h-full object-cover" alt={item.title} />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                {isGame ? <Gamepad className="w-5 h-5 text-slate-700" /> : <Film className="w-5 h-5 text-slate-700" />}
                              </div>
                            )}
                          </div>
                          <p className="text-[10px] font-bold text-slate-200 line-clamp-1 leading-tight group-hover/similar:text-white" title={item.title}>
                            {item.title}
                          </p>
                          <p className="text-[8px] text-slate-500 mt-0.5 truncate">
                            {isGame ? (item.platform?.split(', ')[0] || 'PC') : (item.category || 'Movie')}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-[10px] italic py-2">No similar recommendations found.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowModal(false)} />
          <div className="relative glass-strong w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-midnight/40">
              <div>
                <h2 className="text-xl font-black text-white uppercase">{editingEntry ? (isGame ? 'Edit Game Item' : 'Edit Watchlist Item') : (isGame ? 'Add to Playlist' : 'Add to Watchlist')}</h2>
                <p className="text-slate-400 text-xs mt-1">{isGame ? 'Search RAWG automatically or enter manually.' : 'Search TMDB automatically or enter manually.'}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">

              {/* Autocomplete Search */}
              {!editingEntry && (
                <div className="space-y-1.5 relative">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isGame ? 'Search Game (RAWG)' : 'Search Movie/Show (TMDB)'}</label>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={isGame ? "Type keyword or title (e.g. Witcher, GTA)..." : "Type keyword or title (e.g. Inception, Naruto)..."}
                      className={`w-full bg-midnight/50 border border-white/10 ${isGame ? 'focus:border-cyan-500' : 'focus:border-indigo-500'} rounded-2xl pl-10 pr-4 py-3 text-xs text-slate-200 outline-none transition-all`}
                    />
                    {isSearchingTmdb && (
                      <Loader2 className={`absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin ${isGame ? 'text-cyan-500' : 'text-indigo-500'}`} />
                    )}
                  </div>

                  {/* Results list overlay */}
                  {tmdbSearchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-2 bg-midnight border border-white/10 rounded-2xl shadow-xl overflow-hidden z-30 divide-y divide-white/5 animate-in fade-in duration-200">
                      {tmdbSearchResults.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleSelectAutocompleteItem(item)}
                          className="flex items-center gap-3 p-3 hover:bg-ink cursor-pointer transition-colors"
                        >
                          <div className="w-10 h-14 bg-ink rounded overflow-hidden shrink-0">
                            {item.poster_url ? (
                              <img src={item.poster_url} loading="lazy" decoding="async" className="w-full h-full object-cover" alt="Search item" />
                            ) : (
                              isGame ? <Gamepad2 className="w-4 h-4 text-slate-700 m-auto" /> : <Film className="w-4 h-4 text-slate-700 m-auto" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-slate-200 truncate">{item.title}</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">{isGame ? `${item.platform} • Game` : `${item.category} • ${item.language}`}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Form Layout */}
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Left Column: Image/Upload */}
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Poster Art</label>

                  {/* Poster Image preview box */}
                  <div className="aspect-[2/3] w-40 md:w-full mx-auto bg-midnight border-2 border-dashed border-white/10 rounded-2xl overflow-hidden flex flex-col items-center justify-center p-4 relative group">
                    {formData.poster_data ? (
                      <>
                        <img src={formData.poster_data} alt="Upload preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setFormData(p => ({ ...p, poster_data: '' }))}
                          className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500 rounded-full text-white transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : formData.poster_url ? (
                      <>
                        <img src={formData.poster_url} alt="URL preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setFormData(p => ({ ...p, poster_url: '' }))}
                          className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500 rounded-full text-white transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        {isGame ? (
                          <Gamepad2 className={`w-10 h-10 text-slate-800 mb-2 group-hover:text-cyan-500 transition-colors`} />
                        ) : (
                          <ImageIcon className={`w-10 h-10 text-slate-800 mb-2 group-hover:text-indigo-500 transition-colors`} />
                        )}
                        <p className="text-[11px] text-slate-500 text-center px-4">Upload poster image or paste URL link below</p>
                      </>
                    )}
                  </div>

                  {/* Manual file upload */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Upload Image File</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className={`w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold ${isGame ? 'file:bg-cyan-600/10 file:text-cyan-500 hover:file:bg-cyan-600/20' : 'file:bg-indigo-600/10 file:text-indigo-500 hover:file:bg-indigo-600/20'} cursor-pointer`}
                    />
                  </div>

                  {/* Image URL link */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Or Poster URL Link</label>
                    <input
                      type="text"
                      name="poster_url"
                      value={formData.poster_url}
                      onChange={handleInputChange}
                      placeholder="https://example.com/poster.jpg..."
                      className={`w-full bg-midnight/60 border border-white/10 ${isGame ? 'focus:border-cyan-500' : 'focus:border-indigo-500'} rounded-xl px-3 py-2 text-xs text-slate-200 outline-none transition-all`}
                    />
                  </div>
                </div>

                {/* Right Column: Inputs */}
                <div className="space-y-4">
                  {/* Title */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Title *</label>
                    <input
                      type="text"
                      required
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder={isGame ? "e.g. Witcher 3" : "e.g. Interstellar"}
                      className={`w-full bg-midnight/60 border border-white/10 ${isGame ? 'focus:border-cyan-500' : 'focus:border-indigo-500'} rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none transition-all`}
                    />
                  </div>

                  {/* Category / Platform select */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {isGame ? 'Platform *' : 'Category *'}
                    </label>
                    {isGame ? (
                      <select
                        name="platform"
                        value={formData.platform}
                        onChange={handleInputChange}
                        className={`w-full bg-midnight/60 border border-white/10 focus:border-cyan-500 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none transition-all`}
                      >
                        {GAME_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    ) : (
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className={`w-full bg-midnight/60 border border-white/10 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none transition-all`}
                      >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    )}
                  </div>

                  {/* Language select (Popcorn only) */}
                  {!isGame && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Language</label>
                      <select
                        name="language"
                        value={formData.language}
                        onChange={handleInputChange}
                        className="w-full bg-midnight/60 border border-white/10 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none transition-all"
                      >
                        {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                  )}

                  {/* Rating selection */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Rating</label>
                    <div className="mt-2.5">
                      <PopcornRating
                        rating={formData.rating}
                        interactive={true}
                        isGame={isGame}
                        onChange={(r) => setFormData(p => ({ ...p, rating: r }))}
                      />
                    </div>
                  </div>

                  {/* Genres checkboxes */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Genres</label>
                    <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto border border-slate-850 p-2.5 bg-midnight/40 rounded-xl">
                      {(isGame ? GAME_GENRES : GENRES).map((g) => {
                        const active = formData.genres.includes(g)
                        return (
                          <button
                            key={g}
                            type="button"
                            onClick={() => handleGenreToggle(g)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${active
                              ? (isGame ? 'bg-cyan-600/10 border-cyan-500/25 text-cyan-500' : 'bg-indigo-600/10 border-indigo-500/25 text-indigo-500')
                              : 'bg-midnight border-white/5 text-slate-400 hover:border-white/10'
                              }`}
                          >
                            {g}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Synopsis */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Synopsis</label>
                    <textarea
                      name="synopsis"
                      rows={3}
                      value={formData.synopsis}
                      onChange={handleInputChange}
                      placeholder={isGame ? "Brief overview of the gameplay/story..." : "Brief overview of the plot..."}
                      className={`w-full bg-midnight/60 border border-white/10 ${isGame ? 'focus:border-cyan-500' : 'focus:border-indigo-500'} rounded-xl px-3 py-2 text-xs text-slate-200 outline-none transition-all`}
                    />
                  </div>

                  {/* Reasons For Liking */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isGame ? 'Personal Note (Why you played/liked it)' : 'Personal Note (Why you liked it)'}</label>
                    <textarea
                      name="reasons_for_liking"
                      rows={2}
                      value={formData.reasons_for_liking}
                      onChange={handleInputChange}
                      placeholder={isGame ? "My notes about levels, mechanics, bosses, graphics..." : "My notes about characters, music, visuals..."}
                      className={`w-full bg-midnight/60 border border-white/10 ${isGame ? 'focus:border-cyan-500' : 'focus:border-indigo-500'} rounded-xl px-3 py-2 text-xs text-slate-200 outline-none transition-all`}
                    />
                  </div>
                </div>

                {/* Footer Save Button */}
                <div className="md:col-span-2 pt-4 border-t border-white/5 flex gap-3 justify-end bg-midnight/10">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-white/5 hover:bg-white/5 text-xs font-bold text-slate-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex items-center justify-center gap-1.5 px-6 py-2.5 disabled:bg-slate-800 text-white font-bold rounded-xl shadow-md text-xs transition-all ${isGame ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-indigo-600 hover:bg-indigo-500'}`}
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    <span>{isGame ? 'Save Game' : 'Save Watchlist'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Popcorn/GameCorn Loader (for Surprise Me) */}
      {showPoppingLoader && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#070a13]/95 backdrop-blur-xl">
          <div className="relative w-48 h-48 flex items-center justify-center">
            {/* Generating particles */}
            {Array.from({ length: 18 }).map((_, i) => {
              const x = `${(Math.random() - 0.5) * 220}px`
              const y = `${-80 - Math.random() * 160}px`
              const x2 = `${(Math.random() - 0.5) * 360}px`
              const r = `${Math.random() * 360}deg`
              const r2 = `${360 + Math.random() * 720}deg`
              const delay = `${Math.random() * 1.2}s`

              return (
                <div
                  key={i}
                  className={isGame ? "gamecorn-pixel" : "popcorn-particle"}
                  style={{
                    '--x': x,
                    '--y': y,
                    '--x2': x2,
                    '--r': r,
                    '--r2': r2,
                    animationDelay: delay
                  }}
                />
              )
            })}

            {/* Bucket / Gamepad container */}
            <div className="absolute bottom-4 flex flex-col items-center animate-bounce duration-1000">
              {isGame ? (
                <Gamepad className="w-20 h-20 text-cyan-400 fill-cyan-600/10 drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]" />
              ) : (
                <PopcornIcon className="w-20 h-20 text-indigo-500 fill-indigo-600/10 drop-shadow-[0_0_15px_rgba(249,115,22,0.4)]" />
              )}
              <div className={`mt-4 px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest animate-pulse ${isGame ? 'bg-cyan-600/10 border-cyan-500/25 text-cyan-300' : 'bg-indigo-600/10 border-indigo-500/25 text-indigo-500'}`}>
                {isGame ? 'Finding next quest...' : 'Popping Surprise...'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Burst Success Celebration Animation (for saving reviews) */}
      {showSaveCelebration && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-64 h-64 flex items-center justify-center">
            {/* Burst of success particles radial */}
            {Array.from({ length: 24 }).map((_, i) => {
              const angle = (i * 360) / 24
              const rad = (angle * Math.PI) / 180
              const dist = 120 + Math.random() * 140
              const x = `${Math.cos(rad) * dist}px`
              const y = `${Math.sin(rad) * dist}px`
              const r = `${Math.random() * 360}deg`

              return (
                <div
                  key={i}
                  className={isGame ? "success-trophy-star" : "success-popcorn"}
                  style={{
                    '--x': x,
                    '--y': y,
                    '--r': r,
                    animationDelay: '0s'
                  }}
                />
              )
            })}

            {/* Glowing success circle */}
            {isGame ? (
              <div className="w-24 h-24 rounded-full bg-amber-500 text-amber-200 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.7)] animate-in zoom-in duration-300">
                <Trophy className="w-12 h-12 stroke-[2.5]" />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-cyan-500 text-white flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.6)] animate-in zoom-in duration-300">
                <Check className="w-12 h-12 stroke-[3]" />
              </div>
            )}

            <div className="absolute bottom-4 text-white text-xs font-black uppercase tracking-widest animate-pulse">
              {isGame ? 'Achievement Unlocked!' : 'Popcorn Saved!'}
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Mode Transition Overlay */}
      {isTransitioning && (
        <div className={`screen-transition-overlay to-${transitionTarget}`}>
          {transitionTarget === 'gamecorn' && <div className="crt-scanlines crt-flicker" />}

          <div className="relative w-72 h-72 flex flex-col items-center justify-center">

            {/* Popcorn transition: Pop exploding kernels */}
            {transitionTarget === 'popcorn' && (
              <>
                {Array.from({ length: 20 }).map((_, i) => {
                  const angle = Math.random() * 360;
                  const rad = (angle * Math.PI) / 180;
                  const dist = 140 + Math.random() * 165;
                  const tx = `${Math.cos(rad) * dist}px`;
                  const ty = `${Math.sin(rad) * dist}px`;
                  const rot = `${Math.random() * 360}deg`;
                  const delay = `${Math.random() * 0.5}s`;
                  return (
                    <div
                      key={i}
                      className="transition-popcorn-kernel"
                      style={{
                        '--tx': tx,
                        '--ty': ty,
                        '--rot': rot,
                        animationDelay: delay
                      }}
                    />
                  );
                })}

                <div className="transition-bucket flex flex-col items-center z-20">
                  <div className="w-28 h-28 bg-gradient-to-b from-red-600 to-red-800 rounded-2xl flex items-center justify-center border-4 border-amber-300 shadow-[0_0_30px_rgba(239,68,68,0.6)]">
                    <PopcornIcon className="w-16 h-16 text-amber-200 fill-yellow-200 animate-pulse" />
                  </div>

                  <div className="mt-8 flex flex-col items-center gap-1.5 text-center">
                    <span className="text-white text-lg font-black tracking-widest uppercase animate-pulse drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                      CINEMA SHOWTIME
                    </span>
                    <span className="text-[10px] text-red-400 font-bold uppercase tracking-widest animate-pulse delay-75">
                      Preparing Film Reels...
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* GameCorn transition: Boot screen & Retro Gamepad */}
            {transitionTarget === 'gamecorn' && (
              <div className="flex flex-col items-center z-20">
                <div className="transition-gamepad w-28 h-28 rounded-full border-4 border-cyan-500/80 bg-midnight/90 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                  <Gamepad className="w-16 h-16 text-cyan-300 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                </div>

                <div className="mt-8 flex flex-col items-start font-mono gap-1 text-cyan-400 bg-black/60 p-4 border border-cyan-500/20 rounded-xl min-w-[240px] text-xs">
                  <div className="terminal-line terminal-line-1 flex items-center gap-1.5">
                    <span className="text-cyan-400">&gt;</span> SYSTEM BOOT...
                  </div>
                  <div className="terminal-line terminal-line-2 flex items-center gap-1.5">
                    <span className="text-cyan-400">&gt;</span> CORE.GAMECORN_v1.08...
                  </div>
                  <div className="terminal-line terminal-line-3 flex items-center gap-1.5">
                    <span className="text-cyan-400">&gt;</span> API_GRID: CONNECTED
                  </div>
                  <div className="terminal-line terminal-line-4 flex items-center gap-1.5 text-amber-300 animate-pulse mt-1">
                    <span className="text-cyan-400">&gt;</span> READY! INSERT COIN
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
      {/* Floating AI Chatbot Widget */}
      <div className="chat-widget-container select-none">
        {chatOpen && (
          <div className="chat-window-panel">
            {/* Header */}
            <div className="chat-window-header">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${isGame ? 'bg-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.8)]'} animate-pulse`} />
                <span className="text-xs font-black uppercase text-white tracking-widest">
                  {isGame ? 'GameCorn AI' : 'Popcorn AI'}
                </span>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="p-1 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="chat-messages-area">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`chat-message-bubble ${msg.role} ${isGame ? 'gamecorn' : ''}`}
                >
                  {msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content}

                  {/* Recommendations Cards rendered underneath */}
                  {msg.role === 'assistant' && msg.recommendations && msg.recommendations.length > 0 && (
                    <div className="chat-recommendations-list no-scrollbar">
                      {msg.recommendations.map((rec, recIdx) => {
                        const inWatchlist = isAlreadyInWatchlist(rec.title)
                        return (
                          <div
                            key={recIdx}
                            className="flex-shrink-0 w-[115px] bg-midnight/80 border border-white/5 rounded-xl overflow-hidden flex flex-col justify-between"
                          >
                            <div className="aspect-[2/3] relative bg-ink shrink-0">
                              {rec.poster_url ? (
                                <img src={rec.poster_url} loading="lazy" decoding="async" className="w-full h-full object-cover" alt={rec.title} />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-[7px] text-slate-600">
                                  {isGame ? <Gamepad className="w-4 h-4 mb-1" /> : <Film className="w-4 h-4 mb-1" />}
                                  <span className="truncate w-full font-bold">{rec.title}</span>
                                </div>
                              )}
                              <div className="absolute top-1 right-1 px-1 py-0.2 rounded bg-midnight/80 text-[7px] text-amber-300 font-black flex items-center gap-0.5">
                                <Star className="w-2 h-2 fill-amber-300 text-amber-300" />
                                <span>{Number(rec.rating || 0.0).toFixed(1)}</span>
                              </div>
                            </div>
                            <div className="p-1.5 flex-1 flex flex-col justify-between min-h-0">
                              <h5
                                className={`text-[9px] font-black text-slate-200 line-clamp-1 leading-tight cursor-pointer hover:${textPrimaryColor} transition-colors`}
                                title={rec.title}
                                onClick={() => handleCardClick(rec)}
                              >
                                {rec.title}
                              </h5>
                              <button
                                onClick={() => !inWatchlist && handleAddToWatchlist(rec)}
                                disabled={inWatchlist}
                                className={`w-full mt-1.5 py-1 rounded-lg text-[7px] font-black flex items-center justify-center gap-0.5 transition-all ${inWatchlist
                                  ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                                  : (isGame ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white')
                                  }`}
                              >
                                {inWatchlist ? <Check className="w-2 h-2" /> : <Plus className="w-2 h-2" />}
                                <span>{inWatchlist ? 'Added' : 'Add'}</span>
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}

              {chatLoading && (
                <div className="chat-message-bubble assistant">
                  <div className="typing-indicator">
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                  </div>
                </div>
              )}
              <div ref={chatMessagesEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendChatMessage} className="chat-input-bar">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={isGame ? "Ask for games, tips, backlogs..." : "Ask for movies, TV shows, watchlist..."}
                className={`chat-input-field ${isGame ? 'gamecorn' : ''}`}
                disabled={chatLoading}
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || chatLoading}
                className={`p-2 rounded-xl text-white transition-all ${!chatInput.trim() || chatLoading ? 'opacity-40 bg-slate-800' : bgPrimaryColor}`}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}

        {/* Trigger Button */}
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className={`chat-trigger-btn ${isGame ? 'gamecorn bg-cyan-600 hover:bg-cyan-500' : 'bg-indigo-600 hover:bg-indigo-500'}`}
          title="AI Assistant"
        >
          {chatOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        </button>
      </div>

      {/* Custom Groups Management Modal */}
      {showGroupsModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowGroupsModal(false)} />
          <div className="relative glass-strong w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-midnight/40">
              <div>
                <h2 className="text-lg font-black text-white uppercase">
                  {isGame ? 'Manage Game Playlists' : 'Manage Movie Groups'}
                </h2>
                <p className="text-slate-400 text-xs mt-1">Create and delete custom wishlist groups.</p>
              </div>
              <button onClick={() => setShowGroupsModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
              {/* Create Group Form */}
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!newGroupName.trim()) return;
                setIsSavingGroup(true);
                try {
                  const res = await groupsApi.create({ name: newGroupName.trim(), type: appMode });
                  setGroups(prev => [res, ...prev]);
                  setNewGroupName('');
                  toast.success(`Group "${res.name}" created!`);
                } catch (err) {
                  toast.error('Failed to create group');
                } finally {
                  setIsSavingGroup(false);
                }
              }} className="flex gap-2">
                <input
                  type="text"
                  placeholder="New group name..."
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className={`flex-1 bg-midnight/60 border border-white/10 ${isGame ? 'focus:border-cyan-500' : 'focus:border-indigo-500'} rounded-xl px-3 py-2 text-xs text-slate-200 outline-none transition-all placeholder:text-slate-500`}
                />
                <button
                  type="submit"
                  disabled={isSavingGroup}
                  className={`px-4 py-2 text-white font-bold rounded-xl text-xs transition-colors shrink-0 ${bgPrimaryColor}`}
                >
                  {isSavingGroup ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
                </button>
              </form>

              {/* Groups List */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Existing Groups</p>
                {groups.length === 0 ? (
                  <p className="text-slate-500 text-xs italic py-4 text-center">No groups created yet.</p>
                ) : (
                  <div className="space-y-1.5">
                    {groups.map(g => (
                      <div key={g.id} className="flex justify-between items-center p-3 bg-midnight/40 border border-white/5 rounded-xl hover:border-white/10 transition-colors">
                        <span className="text-xs font-bold text-slate-200">{g.name}</span>
                        <button
                          onClick={async () => {
                            if (!confirm(`Are you sure you want to delete group "${g.name}"? Items inside it won't be deleted.`)) return;
                            setDeletingGroupId(g.id);
                            try {
                              await groupsApi.delete(g.id);
                              setGroups(prev => prev.filter(x => x.id !== g.id));
                              if (selectedGroupFilter === g.id.toString()) {
                                setSelectedGroupFilter('All');
                              }
                              toast.success('Group deleted');
                            } catch (err) {
                              toast.error('Failed to delete group');
                            } finally {
                              setDeletingGroupId(null);
                            }
                          }}
                          disabled={deletingGroupId !== null}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg border border-red-500/15 transition-all disabled:opacity-40"
                        >
                          {deletingGroupId === g.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Group Selection Modal for Adding to Watchlist */}
      {showAddToGroupModal && addToGroupTarget && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => { setShowAddToGroupModal(false); setAddToGroupTarget(null); }} />
          <div className="relative glass-strong w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-midnight/40">
              <div>
                <h2 className="text-lg font-black text-white uppercase">
                  {isGame ? 'Add Game to Playlist' : 'Add Movie to Watchlist'}
                </h2>
                <p className="text-slate-400 text-xs mt-1">
                  Select which groups to add <span className={`font-semibold ${textPrimaryColor}`}>"{addToGroupTarget.title}"</span> to.
                </p>
              </div>
              <button
                onClick={() => { setShowAddToGroupModal(false); setAddToGroupTarget(null); }}
                className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[50vh]">
              {/* Existing Groups Checklist */}
              <div className="space-y-2.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Available Groups</p>
                <div className="grid grid-cols-1 gap-2 max-h-[250px] overflow-y-auto pr-1">
                  {/* Ungrouped / Watchlist only option */}
                  <label
                    className={`flex items-center gap-3 p-3 bg-midnight/40 border rounded-xl cursor-pointer select-none transition-all ${selectedGroupIds.length === 0
                        ? (isGame ? 'border-cyan-500/50 bg-cyan-600/10' : 'border-indigo-500/50 bg-indigo-600/10')
                        : 'border-white/5 hover:border-white/10 hover:bg-white/[0.02]'
                      }`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={selectedGroupIds.length === 0}
                      onChange={() => {
                        setSelectedGroupIds([])
                      }}
                    />
                    <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${selectedGroupIds.length === 0
                        ? (isGame ? 'bg-cyan-500 border-cyan-500' : 'bg-indigo-500 border-indigo-500')
                        : 'border-white/20'
                      }`}>
                      {selectedGroupIds.length === 0 && <Check className="w-3 h-3 text-white stroke-[3px]" />}
                    </div>
                    <span className={`text-xs font-bold ${selectedGroupIds.length === 0 ? 'text-white' : 'text-slate-300'}`}>
                      {isGame ? 'Ungrouped (Playlist Only)' : 'Ungrouped (Watchlist Only)'}
                    </span>
                  </label>

                  {/* Render custom groups list */}
                  {groups.map(group => {
                    const isChecked = selectedGroupIds.includes(group.id)
                    return (
                      <label
                        key={group.id}
                        className={`flex items-center gap-3 p-3 bg-midnight/40 border rounded-xl cursor-pointer select-none transition-all ${isChecked
                            ? (isGame ? 'border-cyan-500/50 bg-cyan-600/10' : 'border-indigo-500/50 bg-indigo-600/10')
                            : 'border-white/5 hover:border-white/10 hover:bg-white/[0.02]'
                          }`}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={isChecked}
                          onChange={() => {
                            setSelectedGroupIds(prev =>
                              isChecked ? prev.filter(id => id !== group.id) : [...prev, group.id]
                            )
                          }}
                        />
                        <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${isChecked
                            ? (isGame ? 'bg-cyan-500 border-cyan-500' : 'bg-indigo-500 border-indigo-500')
                            : 'border-white/20'
                          }`}>
                          {isChecked && <Check className="w-3 h-3 text-white stroke-[3px]" />}
                        </div>
                        <span className={`text-xs font-bold ${isChecked ? 'text-white' : 'text-slate-300'}`}>
                          {group.name}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Inline Create Group */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Create New Group</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="New group name..."
                    value={newGroupModalInput}
                    onChange={(e) => setNewGroupModalInput(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (!newGroupModalInput.trim() || isCreatingGroupInModal) return
                        setIsCreatingGroupInModal(true)
                        try {
                          const res = await groupsApi.create({ name: newGroupModalInput.trim(), type: appMode })
                          setGroups(prev => [res, ...prev])
                          setSelectedGroupIds(prev => [...prev, res.id])
                          setNewGroupModalInput('')
                          toast.success(`Group "${res.name}" created and selected!`)
                        } catch (err) {
                          toast.error('Failed to create group')
                        } finally {
                          setIsCreatingGroupInModal(false)
                        }
                      }
                    }}
                    className={`flex-1 bg-midnight/60 border border-white/10 ${isGame ? 'focus:border-cyan-500' : 'focus:border-indigo-500'} rounded-xl px-3 py-2 text-xs text-slate-200 outline-none transition-all placeholder:text-slate-500`}
                  />
                  <button
                    type="button"
                    disabled={!newGroupModalInput.trim() || isCreatingGroupInModal}
                    onClick={async () => {
                      if (!newGroupModalInput.trim() || isCreatingGroupInModal) return
                      setIsCreatingGroupInModal(true)
                      try {
                        const res = await groupsApi.create({ name: newGroupModalInput.trim(), type: appMode })
                        setGroups(prev => [res, ...prev])
                        setSelectedGroupIds(prev => [...prev, res.id])
                        setNewGroupModalInput('')
                        toast.success(`Group "${res.name}" created and selected!`)
                      } catch (err) {
                        toast.error('Failed to create group')
                      } finally {
                        setIsCreatingGroupInModal(false)
                      }
                    }}
                    className={`px-3 py-2 text-white font-bold rounded-xl text-xs transition-colors shrink-0 ${bgPrimaryColor}`}
                  >
                    {isCreatingGroupInModal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-white/5 bg-midnight/40 flex justify-between items-center gap-3">
              <button
                type="button"
                onClick={() => { setShowAddToGroupModal(false); setAddToGroupTarget(null); }}
                className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold transition-all text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAddToWatchlist}
                disabled={isSavingWatchlist}
                className={`flex-1 py-2.5 rounded-xl text-white font-bold text-xs transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-1.5 ${isGame ? 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/15' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/15'
                  } disabled:opacity-50`}
              >
                {isSavingWatchlist ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  selectedGroupIds.length === 0 ? (isGame ? 'Add to Playlist' : 'Add to Watchlist') : `Add to ${selectedGroupIds.length} ${selectedGroupIds.length === 1 ? 'Group' : 'Groups'}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {showOnboarding && (
        <OnboardingModal
          authApi={authApi}
          tmdbApi={tmdbApi}
          rawgApi={rawgApi}
          LANGUAGES={LANGUAGES}
          refreshUser={refreshUser}
          fetchPersonalizedRecs={fetchPersonalizedRecs}
          fetchRecommendations={fetchRecommendations}
          fetchEntries={fetchEntries}
          setShowOnboarding={setShowOnboarding}
          setShowSaveCelebration={setShowSaveCelebration}
        />
      )}
    </div>
  )
}
