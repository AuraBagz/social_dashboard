import { useState, useCallback } from 'react'
import { callEdgeFunction } from '../lib/supabase.js'

export function usePlatformApi() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const call = useCallback(async (functionName, body) => {
    setLoading(true)
    setError(null)
    try {
      const data = await callEdgeFunction(functionName, body)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const connect = useCallback((platform, tokens) => {
    return call('social-connect', { platform, tokens })
  }, [call])

  const disconnect = useCallback((platform) => {
    return call('social-disconnect', { platform })
  }, [call])

  const fetchFeed = useCallback((platform = 'all', count = 20) => {
    return call('social-feed', { platform, count })
  }, [call])

  const createPost = useCallback((content, platforms) => {
    return call('social-post', { content, platforms })
  }, [call])

  const getProfiles = useCallback(() => {
    return call('social-profile', { action: 'get' })
  }, [call])

  const refreshProfiles = useCallback(() => {
    return call('social-profile', { action: 'refresh' })
  }, [call])

  const updateProfile = useCallback((platforms, profile) => {
    return call('social-profile', { action: 'update', platforms, profile })
  }, [call])

  const getTokenConfig = useCallback(() => {
    return call('social-connect', { action: 'get_config' })
  }, [call])

  return {
    loading,
    error,
    connect,
    disconnect,
    fetchFeed,
    createPost,
    getProfiles,
    refreshProfiles,
    updateProfile,
    getTokenConfig,
  }
}
