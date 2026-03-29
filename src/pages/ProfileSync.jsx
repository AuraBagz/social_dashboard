import { useState, useRef } from 'react'
import { useSocial } from '../context/SocialContext.jsx'
import PlatformIcon from '../components/PlatformIcon.jsx'
import { Upload, Check, AlertTriangle, Image, Save, RefreshCw, CheckCircle2, XCircle, Loader2, Download } from 'lucide-react'

export default function ProfileSync() {
  const { profile, setProfile, connectedPlatforms, platforms, connections, syncProfile, refreshProfiles } = useSocial()
  const [syncing, setSyncing] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [syncResults, setSyncResults] = useState(null)
  const [selectedPlatforms, setSelectedPlatforms] = useState(new Set())
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [bannerPreview, setBannerPreview] = useState(null)
  const avatarInput = useRef(null)
  const bannerInput = useRef(null)

  const togglePlatform = (id) => {
    setSelectedPlatforms(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectAll = () => {
    setSelectedPlatforms(new Set(connectedPlatforms.map(p => p.id)))
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setAvatarPreview(url)
      setProfile(prev => ({ ...prev, avatar: file }))
    }
  }

  const handleBannerChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setBannerPreview(url)
      setProfile(prev => ({ ...prev, banner: file }))
    }
  }

  const handleSync = async () => {
    if (selectedPlatforms.size === 0) return
    setSyncing(true)
    setSyncResults(null)

    try {
      const data = await syncProfile(
        Array.from(selectedPlatforms),
        {
          name: profile.displayName,
          description: profile.bio,
          url: profile.website,
        }
      )
      setSyncResults(data.results || {})
    } catch (err) {
      setSyncResults({ _error: err.message })
    } finally {
      setSyncing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refreshProfiles()
    } catch (err) {
      console.error('Refresh failed:', err)
    } finally {
      setRefreshing(false)
    }
  }

  const loadFromPlatform = (platformId) => {
    const profileData = connections[platformId]?.profileData
    if (!profileData || profileData.username === 'connected') return
    setProfile(prev => ({
      ...prev,
      displayName: profileData.name || prev.displayName,
      bio: profileData.bio || prev.bio,
      website: prev.website,
    }))
    if (profileData.avatar) {
      setAvatarPreview(profileData.avatar)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Profile Sync</h1>
          <p className="text-gray-400 text-sm mt-1">Update your profile across all connected platforms at once</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing || connectedPlatforms.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-700 text-gray-300 text-sm hover:bg-dark-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh All
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Profile editor - 3 cols */}
        <div className="lg:col-span-3 space-y-5">
          {/* Avatar & Banner */}
          <div className="bg-dark-800 border border-dark-600 rounded-xl overflow-hidden">
            <div className="h-32 bg-dark-700 relative cursor-pointer group" onClick={() => bannerInput.current?.click()}>
              {bannerPreview ? (
                <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <Image size={24} className="text-gray-600 mx-auto mb-1" />
                    <span className="text-xs text-gray-600">Upload Banner</span>
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Upload size={20} className="text-white" />
              </div>
              <input ref={bannerInput} type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
            </div>
            <div className="px-5 pb-5 -mt-10 relative z-10">
              <div className="w-20 h-20 rounded-full bg-dark-600 border-4 border-dark-800 cursor-pointer group relative overflow-hidden" onClick={() => avatarInput.current?.click()}>
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Upload size={18} className="text-gray-500" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Upload size={16} className="text-white" />
                </div>
                <input ref={avatarInput} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>
            </div>
          </div>

          {/* Text fields */}
          <div className="bg-dark-800 border border-dark-600 rounded-xl p-5 space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Display Name</label>
              <input
                type="text"
                value={profile.displayName}
                onChange={e => setProfile(prev => ({ ...prev, displayName: e.target.value }))}
                className="w-full bg-dark-700 border border-dark-500 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-gold transition-colors"
                placeholder="Your display name"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Bio / Description</label>
              <textarea
                value={profile.bio}
                onChange={e => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                className="w-full bg-dark-700 border border-dark-500 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-gold transition-colors resize-none"
                rows={4}
                placeholder="Write a bio that represents your brand across all platforms..."
              />
              <p className="text-xs text-gray-500 mt-1">{profile.bio.length} characters</p>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Website</label>
              <input
                type="url"
                value={profile.website}
                onChange={e => setProfile(prev => ({ ...prev, website: e.target.value }))}
                className="w-full bg-dark-700 border border-dark-500 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-gold transition-colors"
                placeholder="https://stalefish.com"
              />
            </div>
          </div>

          {/* Current platform profiles */}
          {connectedPlatforms.length > 0 && (
            <div className="bg-dark-800 border border-dark-600 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Current Platform Profiles</h3>
              <div className="space-y-3">
                {connectedPlatforms.map(p => {
                  const profileData = connections[p.id]?.profileData
                  return (
                    <div key={p.id} className="flex items-start gap-3 p-3 bg-dark-700 rounded-lg">
                      <div className="w-8 h-8 rounded-full overflow-hidden shrink-0" style={{ backgroundColor: p.color + '20' }}>
                        {profileData?.avatar ? (
                          <img src={profileData.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <PlatformIcon platform={p.id} size={14} style={{ color: p.color }} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-white font-medium">{profileData?.name || p.name}</span>
                          <PlatformIcon platform={p.id} size={10} style={{ color: p.color }} />
                        </div>
                        {profileData?.bio && (
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{profileData.bio}</p>
                        )}
                      </div>
                      {profileData && profileData.username !== 'connected' && (
                        <button
                          onClick={() => loadFromPlatform(p.id)}
                          className="shrink-0 flex items-center gap-1 px-2 py-1 rounded text-xs text-gold hover:bg-gold/10 transition-colors"
                          title={`Load profile from ${p.name}`}
                        >
                          <Download size={12} /> Use
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Platform selector - 2 cols */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-dark-800 border border-dark-600 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Sync To</h3>
              {connectedPlatforms.length > 0 && (
                <button onClick={selectAll} className="text-xs text-gold hover:underline">Select all</button>
              )}
            </div>
            {connectedPlatforms.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Connect platforms first to sync your profile</p>
            ) : (
              <div className="space-y-2">
                {connectedPlatforms.map(platform => (
                  <button
                    key={platform.id}
                    onClick={() => togglePlatform(platform.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                      selectedPlatforms.has(platform.id)
                        ? 'bg-gold/10 border border-gold/30'
                        : 'bg-dark-700 border border-transparent hover:bg-dark-600'
                    }`}
                  >
                    <PlatformIcon platform={platform.id} size={18} style={{ color: platform.color }} />
                    <span className="text-sm text-gray-300 flex-1">{platform.name}</span>
                    {selectedPlatforms.has(platform.id) && <Check size={16} className="text-gold" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleSync}
            disabled={selectedPlatforms.size === 0 || syncing}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-gold to-gold-dark text-dark-900 font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {syncing ? (
              <><Loader2 size={16} className="animate-spin" /> Syncing...</>
            ) : (
              <><Save size={16} /> Sync Profile ({selectedPlatforms.size} selected)</>
            )}
          </button>

          {syncResults && (
            <div className="bg-dark-800 border border-dark-600 rounded-xl p-4">
              <h4 className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Sync Results</h4>
              {syncResults._error ? (
                <p className="text-sm text-accent-red">{syncResults._error}</p>
              ) : (
                Object.entries(syncResults).map(([pid, result]) => {
                  const platform = platforms.find(p => p.id === pid)
                  return (
                    <div key={pid} className="flex items-center gap-2 py-1.5">
                      {result.success
                        ? <CheckCircle2 size={14} className="text-accent-green" />
                        : <XCircle size={14} className="text-accent-red" />
                      }
                      <span className="text-sm text-gray-300">{platform?.name}</span>
                      <span className={`text-xs ml-auto ${result.success ? 'text-accent-green' : 'text-accent-red'}`}>
                        {result.success ? 'Updated' : result.error || 'Failed'}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          )}

          <div className="bg-dark-800 border border-dark-600 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle size={14} className="text-gold mt-0.5 shrink-0" />
              <p className="text-xs text-gray-500">
                Some platforms have limitations on profile updates via API.
                Avatar/banner image uploads may need to be done directly on each platform.
                Bio text will be automatically truncated to fit each platform's character limits.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
