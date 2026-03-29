import { handleCors, corsResponse, corsError } from '../_shared/cors.ts'
import { getSupabaseClient } from '../_shared/supabase.ts'
import { getPlatform } from '../_shared/platforms/index.ts'

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const { action, platforms: targetPlatforms, profile } = await req.json()
    const supabase = getSupabaseClient()

    // GET: Fetch profiles from all connected platforms
    if (action === 'get') {
      const { data: connections, error } = await supabase
        .from('social_connections')
        .select('platform, profile_data, connected_at, last_used_at, status')
        .eq('status', 'active')

      if (error) return corsError(error.message)
      return corsResponse({ profiles: connections || [] })
    }

    // REFRESH: Re-fetch profile data from platforms
    if (action === 'refresh') {
      const { data: connections, error } = await supabase
        .from('social_connections')
        .select('platform, tokens')
        .eq('status', 'active')

      if (error) return corsError(error.message)

      const profiles: Record<string, unknown> = {}
      const errors: Record<string, string> = {}

      await Promise.all(
        (connections || []).map(async (conn) => {
          try {
            const adapter = getPlatform(conn.platform)
            const profileData = await adapter.verifyCredentials(conn.tokens as Record<string, string>)
            const clean = { ...profileData }
            delete (clean as any)._session
            profiles[conn.platform] = clean

            // Update cached profile data
            await supabase
              .from('social_connections')
              .update({ profile_data: clean, last_used_at: new Date().toISOString() })
              .eq('platform', conn.platform)
          } catch (err) {
            errors[conn.platform] = err.message
          }
        })
      )

      return corsResponse({ profiles, errors: Object.keys(errors).length > 0 ? errors : undefined })
    }

    // UPDATE: Push profile changes to selected platforms
    if (action === 'update') {
      if (!targetPlatforms || !profile) {
        return corsError('Missing platforms or profile data')
      }

      const { data: connections, error } = await supabase
        .from('social_connections')
        .select('platform, tokens')
        .eq('status', 'active')
        .in('platform', targetPlatforms)

      if (error) return corsError(error.message)

      const results: Record<string, { success: boolean, error?: string }> = {}

      await Promise.all(
        (connections || []).map(async (conn) => {
          try {
            const adapter = getPlatform(conn.platform)
            await adapter.updateProfile(conn.tokens as Record<string, string>, profile)
            results[conn.platform] = { success: true }
          } catch (err) {
            results[conn.platform] = { success: false, error: err.message }
          }
        })
      )

      return corsResponse({ results })
    }

    return corsError('Invalid action. Use: get, refresh, or update')
  } catch (err) {
    return corsError(err.message, 500)
  }
})
