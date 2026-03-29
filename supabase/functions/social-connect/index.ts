import { handleCors, corsResponse, corsError } from '../_shared/cors.ts'
import { saveTokens } from '../_shared/supabase.ts'
import { getPlatform, getTokenConfig } from '../_shared/platforms/index.ts'

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const { platform, tokens, action, profileData: clientProfile } = await req.json()

    // Return token configuration for all platforms
    if (action === 'get_config') {
      return corsResponse({ config: getTokenConfig() })
    }

    if (!platform || !tokens) {
      return corsError('Missing platform or tokens')
    }

    const adapter = getPlatform(platform)

    // Validate required tokens are present
    for (const key of adapter.requiredTokens) {
      if (!tokens[key]) {
        return corsError(`Missing required token: ${adapter.tokenLabels[key] || key}`)
      }
    }

    let profileToSave: Record<string, unknown>

    // If client already verified and sent profile data, use that
    if (clientProfile && clientProfile.username) {
      profileToSave = clientProfile
    } else {
      // Try server-side verification (works for platforms that don't block datacenter IPs)
      try {
        const profileData = await adapter.verifyCredentials(tokens)
        const cleanProfile = { ...profileData }
        delete (cleanProfile as any)._session
        profileToSave = cleanProfile
      } catch (_) {
        // Server-side verification failed (likely IP blocked)
        // Store tokens with minimal profile - client will provide profile data
        profileToSave = { username: 'connected', name: 'Connected' }
      }
    }

    // Save to database
    await saveTokens(platform, tokens, profileToSave as Record<string, unknown>)

    return corsResponse({
      success: true,
      platform,
      profile: profileToSave,
    })
  } catch (err) {
    return corsError(err.message, 500)
  }
})
