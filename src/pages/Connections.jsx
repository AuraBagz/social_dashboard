import { useState } from 'react'
import { useSocial } from '../context/SocialContext.jsx'
import PlatformIcon from '../components/PlatformIcon.jsx'
import TokenHelp from '../components/TokenHelp.jsx'
import { Check, X, Shield, RefreshCw, AlertCircle, ChevronDown, ChevronUp, Eye, EyeOff, HelpCircle, Plug, Unplug } from 'lucide-react'

export default function Connections() {
  const { platforms, tokenConfig, connections, connectPlatform, disconnectPlatform } = useSocial()
  const [expandedPlatform, setExpandedPlatform] = useState(null)
  const [tokenInputs, setTokenInputs] = useState({})
  const [connecting, setConnecting] = useState(null)
  const [connectError, setConnectError] = useState({})
  const [showDisconnect, setShowDisconnect] = useState(null)
  const [showTokens, setShowTokens] = useState({})
  const [showHelp, setShowHelp] = useState(null)

  const handleTokenChange = (platformId, key, value) => {
    setTokenInputs(prev => ({
      ...prev,
      [platformId]: { ...prev[platformId], [key]: value },
    }))
  }

  const handleConnect = async (platformId) => {
    const tokens = tokenInputs[platformId]
    if (!tokens) return

    setConnecting(platformId)
    setConnectError(prev => ({ ...prev, [platformId]: null }))

    try {
      await connectPlatform(platformId, tokens)
      setExpandedPlatform(null)
      setTokenInputs(prev => ({ ...prev, [platformId]: {} }))
    } catch (err) {
      setConnectError(prev => ({ ...prev, [platformId]: err.message }))
    } finally {
      setConnecting(null)
    }
  }

  const handleDisconnect = async (platformId) => {
    try {
      await disconnectPlatform(platformId)
      setShowDisconnect(null)
    } catch (err) {
      setConnectError(prev => ({ ...prev, [platformId]: err.message }))
    }
  }

  const toggleExpand = (platformId) => {
    setExpandedPlatform(prev => prev === platformId ? null : platformId)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Connections</h1>
        <p className="text-gray-400 text-sm mt-1">Connect your social accounts using personal access tokens</p>
      </div>

      {/* Info banner */}
      <div className="bg-accent-blue/10 border border-accent-blue/20 rounded-xl p-4 flex gap-3">
        <Shield size={20} className="text-accent-blue shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-gray-300">
            <strong className="text-white">Token-Based Authentication</strong> — Enter your personal access tokens or session cookies
            to connect each platform. No paid API access required. Tokens are stored securely in Supabase.
          </p>
        </div>
      </div>

      {/* Platform cards */}
      <div className="space-y-3">
        {platforms.map(platform => {
          const isConnected = connections[platform.id]?.connected
          const isExpanded = expandedPlatform === platform.id
          const isConnecting = connecting === platform.id
          const config = tokenConfig[platform.id]
          const profileData = connections[platform.id]?.profileData
          const error = connectError[platform.id]

          return (
            <div
              key={platform.id}
              className={`
                bg-dark-800 border rounded-xl transition-all overflow-hidden
                ${isConnected ? 'border-accent-green/30' : 'border-dark-600'}
              `}
            >
              {/* Header row */}
              <div className="p-4 flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: platform.color + '20' }}
                >
                  <PlatformIcon platform={platform.id} size={24} style={{ color: platform.color }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-semibold">{platform.name}</h3>
                    {isConnected && (
                      <span className="flex items-center gap-1 text-xs text-accent-green bg-accent-green/10 px-2 py-0.5 rounded-full">
                        <Check size={10} /> Connected
                      </span>
                    )}
                  </div>
                  {isConnected && profileData ? (
                    <p className="text-xs text-gray-500 truncate">
                      {profileData.name || profileData.username}
                      {profileData.followers != null && ` · ${profileData.followers.toLocaleString()} followers`}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500">
                      Requires: {config?.required.map(k => config.labels[k]?.split(' (')[0]).join(', ')}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isConnected ? (
                    <>
                      {showDisconnect === platform.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleDisconnect(platform.id)}
                            className="px-3 py-1.5 rounded-lg bg-accent-red/20 text-accent-red text-xs hover:bg-accent-red/30 transition-colors"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setShowDisconnect(null)}
                            className="px-3 py-1.5 rounded-lg bg-dark-700 text-gray-400 text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowDisconnect(platform.id)}
                          className="p-2 text-gray-500 hover:text-accent-red transition-colors"
                          title="Disconnect"
                        >
                          <Unplug size={16} />
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => toggleExpand(platform.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold/20 text-gold text-sm font-medium hover:bg-gold/30 transition-colors"
                    >
                      <Plug size={14} />
                      {isExpanded ? 'Close' : 'Configure'}
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded token input area */}
              {isExpanded && !isConnected && (
                <div className="border-t border-dark-600 p-4 space-y-4 bg-dark-900/50">
                  {/* Help link */}
                  <button
                    onClick={() => setShowHelp(showHelp === platform.id ? null : platform.id)}
                    className="flex items-center gap-1.5 text-xs text-accent-blue hover:underline"
                  >
                    <HelpCircle size={12} />
                    How to find your {platform.name} tokens
                  </button>

                  {showHelp === platform.id && (
                    <TokenHelp platform={platform.id} config={config} />
                  )}

                  {/* Token fields */}
                  {config?.required.map(key => (
                    <div key={key}>
                      <label className="block text-xs text-gray-400 mb-1.5">{config.labels[key]}</label>
                      <div className="relative">
                        <input
                          type={showTokens[`${platform.id}_${key}`] ? 'text' : 'password'}
                          value={tokenInputs[platform.id]?.[key] || ''}
                          onChange={e => handleTokenChange(platform.id, key, e.target.value)}
                          className="w-full bg-dark-700 border border-dark-500 rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-gold transition-colors pr-10"
                          placeholder={`Enter ${key}`}
                        />
                        <button
                          onClick={() => setShowTokens(prev => ({ ...prev, [`${platform.id}_${key}`]: !prev[`${platform.id}_${key}`] }))}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-300"
                        >
                          {showTokens[`${platform.id}_${key}`] ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                  ))}

                  {error && (
                    <div className="bg-accent-red/10 border border-accent-red/20 rounded-lg p-3 flex items-start gap-2">
                      <AlertCircle size={14} className="text-accent-red mt-0.5 shrink-0" />
                      <p className="text-xs text-accent-red">{error}</p>
                    </div>
                  )}

                  <button
                    onClick={() => handleConnect(platform.id)}
                    disabled={isConnecting || !config?.required.every(k => tokenInputs[platform.id]?.[k])}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-gold to-gold-dark text-dark-900 font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isConnecting ? (
                      <><RefreshCw size={14} className="animate-spin" /> Testing Connection...</>
                    ) : (
                      <><Plug size={14} /> Connect & Verify</>
                    )}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer note */}
      <div className="bg-dark-800 border border-dark-600 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle size={16} className="text-gray-500 mt-0.5 shrink-0" />
          <p className="text-xs text-gray-500">
            Session cookies may expire and need to be re-entered periodically.
            If a connection stops working, re-enter your tokens to reconnect.
          </p>
        </div>
      </div>
    </div>
  )
}
