import { useState, useEffect, useCallback } from 'react'
import { useSocial } from '../context/SocialContext.jsx'
import PlatformIcon from '../components/PlatformIcon.jsx'
import { Heart, MessageCircle, Share2, Repeat, Eye, TrendingUp, BarChart3, RefreshCw, Loader2, AlertCircle } from 'lucide-react'

export default function Feed() {
  const { connectedPlatforms, platforms, connections, fetchFeed } = useSocial()
  const [filterPlatform, setFilterPlatform] = useState('all')
  const [sortBy, setSortBy] = useState('recent')
  const [feedItems, setFeedItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState(null)
  const [lastFetched, setLastFetched] = useState(null)

  const loadFeed = useCallback(async () => {
    if (connectedPlatforms.length === 0) return
    setLoading(true)
    setErrors(null)
    try {
      const data = await fetchFeed(filterPlatform, 30)
      setFeedItems(data.posts || [])
      if (data.errors) setErrors(data.errors)
      setLastFetched(new Date())
    } catch (err) {
      setErrors({ general: err.message })
    } finally {
      setLoading(false)
    }
  }, [fetchFeed, filterPlatform, connectedPlatforms.length])

  useEffect(() => {
    if (connectedPlatforms.length > 0) {
      loadFeed()
    }
  }, [connectedPlatforms.length, filterPlatform])

  let items = [...feedItems]
  if (sortBy === 'engagement') {
    items.sort((a, b) => {
      const aEng = (a.stats?.likes || 0) + (a.stats?.comments || 0) + (a.stats?.shares || 0)
      const bEng = (b.stats?.likes || 0) + (b.stats?.comments || 0) + (b.stats?.shares || 0)
      return bEng - aEng
    })
  }

  const formatNumber = (n) => {
    if (n == null) return '0'
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
    return n.toString()
  }

  const formatTime = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const getEngagementLevel = (stats) => {
    const total = (stats?.likes || 0) + (stats?.comments || 0) + (stats?.shares || stats?.retweets || stats?.reposts || 0)
    if (total > 1000) return 'viral'
    if (total > 100) return 'high'
    return 'normal'
  }

  const engagementColors = {
    viral: 'text-accent-pink bg-accent-pink/10',
    high: 'text-accent-green bg-accent-green/10',
    normal: 'text-gray-400 bg-dark-700',
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Social Feed</h1>
          <p className="text-gray-400 text-sm mt-1">
            {connectedPlatforms.length > 0
              ? `Live posts from ${connectedPlatforms.length} connected platform${connectedPlatforms.length !== 1 ? 's' : ''}`
              : 'Connect platforms to see your feed'
            }
          </p>
        </div>
        {connectedPlatforms.length > 0 && (
          <button
            onClick={loadFeed}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-700 text-gray-300 text-sm hover:bg-dark-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        )}
      </div>

      {/* Errors */}
      {errors && (
        <div className="bg-accent-orange/10 border border-accent-orange/20 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle size={14} className="text-accent-orange mt-0.5 shrink-0" />
            <div className="text-xs text-gray-300">
              {Object.entries(errors).map(([platform, msg]) => (
                <p key={platform}><strong>{platform}:</strong> {msg}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {connectedPlatforms.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-dark-800 border border-dark-600 rounded-lg p-1">
            <button
              onClick={() => setFilterPlatform('all')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                filterPlatform === 'all' ? 'bg-gold/20 text-gold' : 'text-gray-400 hover:text-white'
              }`}
            >
              All
            </button>
            {connectedPlatforms.map(p => (
              <button
                key={p.id}
                onClick={() => setFilterPlatform(p.id)}
                className={`p-1.5 rounded transition-colors ${
                  filterPlatform === p.id ? 'bg-gold/20' : 'hover:bg-dark-700'
                }`}
                title={p.name}
              >
                <PlatformIcon platform={p.id} size={14} style={{ color: filterPlatform === p.id ? p.color : '#6b7280' }} />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-dark-800 border border-dark-600 rounded-lg p-1 ml-auto">
            <button
              onClick={() => setSortBy('recent')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                sortBy === 'recent' ? 'bg-dark-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Recent
            </button>
            <button
              onClick={() => setSortBy('engagement')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                sortBy === 'engagement' ? 'bg-dark-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <BarChart3 size={12} /> Top
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && feedItems.length === 0 && (
        <div className="text-center py-12">
          <Loader2 size={32} className="text-gold mx-auto mb-3 animate-spin" />
          <p className="text-gray-400 text-sm">Fetching your posts...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && connectedPlatforms.length === 0 && (
        <div className="text-center py-12 bg-dark-800 border border-dark-600 rounded-xl">
          <p className="text-gray-500">No platforms connected yet</p>
          <p className="text-xs text-gray-600 mt-1">Go to Connections to add your social accounts</p>
        </div>
      )}

      {/* Feed items */}
      <div className="space-y-4">
        {items.map((item, idx) => {
          const platform = platforms.find(p => p.id === item.platform)
          const engagement = getEngagementLevel(item.stats)
          const profileData = connections[item.platform]?.profileData

          return (
            <div key={item.id || idx} className="bg-dark-800 border border-dark-600 rounded-xl p-5 hover:border-dark-500 transition-colors">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center">
                    {profileData?.avatar ? (
                      <img src={profileData.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-dark-900 font-bold text-xs">SF</span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">
                        {profileData?.name || 'Stalefish'}
                      </span>
                      <div className="flex items-center gap-1" style={{ color: platform?.color }}>
                        <PlatformIcon platform={item.platform} size={12} />
                        <span className="text-xs">{platform?.name}</span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{formatTime(item.posted_at)}</span>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${engagementColors[engagement]}`}>
                  {engagement === 'viral' && <TrendingUp size={10} className="inline mr-1" />}
                  {engagement}
                </span>
              </div>

              {/* Content */}
              <p className="text-sm text-gray-300 mb-4 leading-relaxed whitespace-pre-wrap">{item.content}</p>

              {/* Media */}
              {item.media?.length > 0 && item.media[0] && (
                <div className="mb-4 flex gap-2 overflow-x-auto">
                  {item.media.filter(Boolean).slice(0, 4).map((url, i) => (
                    <img key={i} src={url} alt="" className="h-32 rounded-lg object-cover" />
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center gap-5 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Heart size={14} /> {formatNumber(item.stats?.likes)}
                </span>
                <span className="flex items-center gap-1.5">
                  <MessageCircle size={14} /> {formatNumber(item.stats?.comments || item.stats?.replies)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Repeat size={14} /> {formatNumber(item.stats?.shares || item.stats?.retweets || item.stats?.reposts)}
                </span>
                {item.stats?.views != null && (
                  <span className="flex items-center gap-1.5 ml-auto">
                    <Eye size={14} /> {formatNumber(item.stats.views)}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Last fetched */}
      {lastFetched && (
        <p className="text-xs text-gray-600 text-center">
          Last updated: {lastFetched.toLocaleTimeString()}
        </p>
      )}
    </div>
  )
}
