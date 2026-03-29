import { handleCors, corsResponse, corsError } from '../_shared/cors.ts'
import { saveTokens } from '../_shared/supabase.ts'
import { getPlatform, getTokenConfig } from '../_shared/platforms/index.ts'

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const { platform, tokens, action } = await req.json()

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

    // Verify credentials by fetching profile
    const profileData = await adapter.verifyCredentials(tokens)

    // Remove session data that shouldn't be stored
    const cleanProfile = { ...profileData }
    delete (cleanProfile as any)._session

    // Save to database
    await saveTokens(platform, tokens, cleanProfile as Record<string, unknown>)

    return corsResponse({
      success: true,
      platform,
      profile: cleanProfile,
    })
  } catch (err) {
    return corsError(err.message, 500)
  }
})
