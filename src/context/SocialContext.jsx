import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { supabase, callEdgeFunction } from '../lib/supabase.js'

const SocialContext = createContext()

const PLATFORMS = [
  { id: 'twitter', name: 'X (Twitter)', color: '#1da1f2', icon: 'twitter', maxChars: 280 },
  { id: 'instagram', name: 'Instagram', color: '#e4405f', icon: 'instagram', maxChars: 2200 },
  { id: 'facebook', name: 'Facebook', color: '#1877f2', icon: 'facebook', maxChars: 63206 },
  { id: 'youtube', name: 'YouTube', color: '#ff0000', icon: 'youtube', maxChars: 5000 },
  { id: 'tiktok', name: 'TikTok', color: '#010101', icon: 'tiktok', maxChars: 2200 },
  { id: 'linkedin', name: 'LinkedIn', color: '#0a66c2', icon: 'linkedin', maxChars: 3000 },
]

// Token configuration per platform (what the user needs to provide)
const TOKEN_CONFIG = {
  twitter: {
    required: ['auth_token', 'ct0'],
    labels: {
      auth_token: 'Auth Token (auth_token cookie)',
      ct0: 'CT0 Token (ct0 cookie)',
    },
    help: 'Open X.com → DevTools (F12) → Application → Cookies → x.com',
  },
  instagram: {
    required: ['session_id', 'csrf_token'],
    labels: {
      session_id: 'Session ID (sessionid cookie)',
      csrf_token: 'CSRF Token (csrftoken cookie)',
    },
    help: 'Open Instagram.com → DevTools (F12) → Application → Cookies → instagram.com',
  },
  facebook: {
    required: ['access_token'],
    labels: {
      access_token: 'Access Token (from Graph API Explorer)',
    },
    help: 'Go to developers.facebook.com/tools/explorer → Generate Token',
  },
  youtube: {
    required: ['access_token', 'api_key'],
    labels: {
      access_token: 'OAuth Access Token',
      api_key: 'API Key (from Google Cloud Console)',
    },
    help: 'Google Cloud Console → APIs & Services → Credentials',
  },
  tiktok: {
    required: ['session_id', 'csrf_token', 'username'],
    labels: {
      session_id: 'Session ID (sessionid cookie)',
      csrf_token: 'CSRF Token (tt_csrf_token cookie)',
      username: 'TikTok Username (without @)',
    },
    help: 'Open TikTok.com → DevTools (F12) → Application → Cookies → tiktok.com',
  },
  linkedin: {
    required: ['li_at', 'jsessionid'],
    labels: {
      li_at: 'li_at Cookie',
      jsessionid: 'JSESSIONID Cookie',
    },
    help: 'Open LinkedIn.com → DevTools (F12) → Application → Cookies → linkedin.com',
  },
}

export function SocialProvider({ children }) {
  const [connections, setConnections] = useState({})
  const [profile, setProfile] = useState({
    displayName: 'Stalefish',
    bio: 'AI consultation for law firms. Custom integrations, compliance, training & everything A-Z in AI.',
    website: '',
    avatar: null,
    banner: null,
  })
  const [posts, setPosts] = useState([])
  const [scheduledPosts, setScheduledPosts] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loadingConnections, setLoadingConnections] = useState(true)

  // Load connections from Supabase on mount
  useEffect(() => {
    loadConnections()
  }, [])

  const loadConnections = useCallback(async () => {
    setLoadingConnections(true)
    try {
      const { data, error } = await supabase
        .from('social_connections')
        .select('platform, profile_data, connected_at, last_used_at, status')
        .eq('status', 'active')

      if (error) {
        console.error('Failed to load connections:', error)
        return
      }

      const conns = {}
      for (const row of data || []) {
        conns[row.platform] = {
          connected: true,
          connectedAt: row.connected_at,
          lastUsed: row.last_used_at,
          profileData: row.profile_data,
        }
      }
      setConnections(conns)
    } catch (err) {
      console.error('Failed to load connections:', err)
    } finally {
      setLoadingConnections(false)
    }
  }, [])

  const connectPlatform = useCallback(async (platformId, tokens) => {
    let profileData = null

    // For Twitter, verify client-side first (Twitter blocks datacenter IPs)
    if (platformId === 'twitter') {
      const twitterHeaders = {
        'Authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
        'Cookie': `auth_token=${tokens.auth_token}; ct0=${tokens.ct0}`,
        'X-Csrf-Token': tokens.ct0,
        'X-Twitter-Active-User': 'yes',
        'X-Twitter-Auth-Type': 'OAuth2Session',
        'X-Twitter-Client-Language': 'en',
      }

      try {
        const res = await fetch('https://api.twitter.com/1.1/account/verify_credentials.json?include_entities=false', {
          headers: twitterHeaders,
          credentials: 'omit',
        })
        if (res.ok) {
          const user = await res.json()
          profileData = {
            id: user.id_str,
            name: user.name,
            username: user.screen_name,
            avatar: user.profile_image_url_https?.replace('_normal', '_400x400') || '',
            bio: user.description || '',
            followers: user.followers_count || 0,
            following: user.friends_count || 0,
            posts: user.statuses_count || 0,
          }
        }
      } catch (e) {
        console.warn('Client-side Twitter verification failed, falling back to server:', e)
      }
    }

    const data = await callEdgeFunction('social-connect', {
      platform: platformId,
      tokens,
      profileData,
    })
    setConnections(prev => ({
      ...prev,
      [platformId]: {
        connected: true,
        connectedAt: new Date().toISOString(),
        profileData: data.profile,
      }
    }))
    return data
  }, [])

  const disconnectPlatform = useCallback(async (platformId) => {
    await callEdgeFunction('social-disconnect', { platform: platformId })
    setConnections(prev => {
      const next = { ...prev }
      delete next[platformId]
      return next
    })
  }, [])

  const fetchFeed = useCallback(async (platform = 'all', count = 20) => {
    const data = await callEdgeFunction('social-feed', { platform, count })
    return data
  }, [])

  const publishPost = useCallback(async (content, targetPlatforms) => {
    const data = await callEdgeFunction('social-post', { content, platforms: targetPlatforms })
    return data
  }, [])

  const syncProfile = useCallback(async (targetPlatforms, profileData) => {
    const data = await callEdgeFunction('social-profile', {
      action: 'update',
      platforms: targetPlatforms,
      profile: profileData,
    })
    return data
  }, [])

  const refreshProfiles = useCallback(async () => {
    const data = await callEdgeFunction('social-profile', { action: 'refresh' })
    // Update cached profile data in connections
    if (data.profiles) {
      setConnections(prev => {
        const next = { ...prev }
        for (const [platform, profileData] of Object.entries(data.profiles)) {
          if (next[platform]) {
            next[platform] = { ...next[platform], profileData }
          }
        }
        return next
      })
    }
    return data
  }, [])

  const addPost = useCallback((post) => {
    const newPost = {
      id: crypto.randomUUID(),
      ...post,
      createdAt: new Date().toISOString(),
      status: post.scheduledFor ? 'scheduled' : 'published',
    }
    if (post.scheduledFor) {
      setScheduledPosts(prev => [...prev, newPost])
    } else {
      setPosts(prev => [newPost, ...prev])
    }
    return newPost
  }, [])

  const deletePost = useCallback((postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId))
    setScheduledPosts(prev => prev.filter(p => p.id !== postId))
  }, [])

  const connectedPlatforms = PLATFORMS.filter(p => connections[p.id]?.connected)
  const disconnectedPlatforms = PLATFORMS.filter(p => !connections[p.id]?.connected)

  return (
    <SocialContext.Provider value={{
      platforms: PLATFORMS,
      tokenConfig: TOKEN_CONFIG,
      connections,
      connectedPlatforms,
      disconnectedPlatforms,
      connectPlatform,
      disconnectPlatform,
      loadConnections,
      loadingConnections,
      profile,
      setProfile,
      posts,
      scheduledPosts,
      addPost,
      deletePost,
      fetchFeed,
      publishPost,
      syncProfile,
      refreshProfiles,
      notifications,
      setNotifications,
    }}>
      {children}
    </SocialContext.Provider>
  )
}

export function useSocial() {
  const ctx = useContext(SocialContext)
  if (!ctx) throw new Error('useSocial must be used within SocialProvider')
  return ctx
}
