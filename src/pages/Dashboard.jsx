import { Link } from 'react-router-dom'
import { useSocial } from '../context/SocialContext.jsx'
import PlatformIcon from '../components/PlatformIcon.jsx'
import { TrendingUp, Users, Eye, MessageCircle, PenSquare, Link2, UserCircle, ArrowRight, Activity, Loader2 } from 'lucide-react'

export default function Dashboard() {
  const { connectedPlatforms, platforms, connections, posts, scheduledPosts, loadingConnections } = useSocial()

  // Aggregate real stats from connected platform profiles
  const totalFollowers = connectedPlatforms.reduce((sum, p) => {
    return sum + (connections[p.id]?.profileData?.followers || 0)
  }, 0)

  const totalPosts = connectedPlatforms.reduce((sum, p) => {
    return sum + (connections[p.id]?.profileData?.posts || 0)
  }, 0)

  const formatNumber = (n) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
    return n.toLocaleString()
  }

  const statCards = [
    { label: 'Total Followers', value: totalFollowers > 0 ? formatNumber(totalFollowers) : '--', icon: Users, color: 'from-accent-blue to-accent-purple' },
    { label: 'Platforms', value: connectedPlatforms.length.toString(), icon: Link2, color: 'from-accent-green to-accent-blue' },
    { label: 'Total Posts', value: totalPosts > 0 ? formatNumber(totalPosts) : '--', icon: MessageCircle, color: 'from-accent-pink to-accent-red' },
    { label: 'Published Here', value: posts.length.toString(), icon: TrendingUp, color: 'from-gold to-accent-orange' },
  ]

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Overview of your Stalefish social presence</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-dark-800 border border-dark-600 rounded-xl p-4 hover:border-dark-500 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-400 uppercase tracking-wider">{label}</span>
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}>
                <Icon size={16} className="text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">
              {loadingConnections ? <Loader2 size={20} className="animate-spin text-gray-500" /> : value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick actions */}
        <div className="bg-dark-800 border border-dark-600 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Activity size={16} className="text-gold" />
            Quick Actions
          </h2>
          <div className="space-y-2">
            <Link to="/compose" className="flex items-center gap-3 p-3 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors group">
              <PenSquare size={18} className="text-accent-blue" />
              <span className="text-sm text-gray-300 group-hover:text-white">Create New Post</span>
              <ArrowRight size={14} className="text-gray-600 ml-auto group-hover:text-gray-400" />
            </Link>
            <Link to="/profile" className="flex items-center gap-3 p-3 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors group">
              <UserCircle size={18} className="text-accent-purple" />
              <span className="text-sm text-gray-300 group-hover:text-white">Sync Profiles</span>
              <ArrowRight size={14} className="text-gray-600 ml-auto group-hover:text-gray-400" />
            </Link>
            <Link to="/connections" className="flex items-center gap-3 p-3 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors group">
              <Link2 size={18} className="text-accent-green" />
              <span className="text-sm text-gray-300 group-hover:text-white">Manage Connections</span>
              <ArrowRight size={14} className="text-gray-600 ml-auto group-hover:text-gray-400" />
            </Link>
          </div>
        </div>

        {/* Connected Platforms with real data */}
        <div className="bg-dark-800 border border-dark-600 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Connected Platforms</h2>
          {loadingConnections ? (
            <div className="text-center py-6">
              <Loader2 size={24} className="text-gold mx-auto animate-spin" />
            </div>
          ) : connectedPlatforms.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500 text-sm mb-3">No platforms connected yet</p>
              <Link to="/connections" className="text-gold text-sm hover:underline">
                Connect your accounts
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {connectedPlatforms.map(p => {
                const profileData = connections[p.id]?.profileData
                return (
                  <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-dark-700">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden" style={{ backgroundColor: p.color + '20' }}>
                      {profileData?.avatar ? (
                        <img src={profileData.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <PlatformIcon platform={p.id} size={16} style={{ color: p.color }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-gray-300 block truncate">
                        {profileData?.name || p.name}
                      </span>
                      {profileData?.followers != null && (
                        <span className="text-xs text-gray-500">
                          {formatNumber(profileData.followers)} followers
                        </span>
                      )}
                    </div>
                    <span className="w-2 h-2 rounded-full bg-accent-green shrink-0" />
                  </div>
                )
              })}
            </div>
          )}
          {connectedPlatforms.length > 0 && connectedPlatforms.length < platforms.length && (
            <Link to="/connections" className="block text-center text-xs text-gold mt-3 hover:underline">
              + Connect {platforms.length - connectedPlatforms.length} more
            </Link>
          )}
        </div>

        {/* Platform profiles */}
        <div className="bg-dark-800 border border-dark-600 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Platform Stats</h2>
          {connectedPlatforms.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500 text-sm">Connect platforms to see stats</p>
            </div>
          ) : (
            <div className="space-y-3">
              {connectedPlatforms.map(p => {
                const profileData = connections[p.id]?.profileData
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <PlatformIcon platform={p.id} size={14} style={{ color: p.color }} />
                    <span className="text-sm text-gray-300 flex-1">{p.name}</span>
                    <div className="text-right">
                      <span className="text-xs text-gray-400">
                        {profileData?.followers != null ? formatNumber(profileData.followers) : '--'}
                      </span>
                      <span className="text-xs text-gray-600 ml-1">followers</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Post summary bar */}
      <div className="bg-dark-800 border border-dark-600 rounded-xl p-4 flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Published:</span>
          <span className="text-white font-semibold">{posts.length}</span>
        </div>
        <div className="w-px h-4 bg-dark-500" />
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Scheduled:</span>
          <span className="text-white font-semibold">{scheduledPosts.length}</span>
        </div>
        <Link to="/compose" className="ml-auto text-gold hover:text-gold-light text-sm font-medium flex items-center gap-1">
          New Post <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  )
}
