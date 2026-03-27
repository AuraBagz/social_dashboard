import '@supabase/functions-js/edge-runtime.d.ts'
import { handleCors, corsResponse, corsError } from '../_shared/cors.ts'
import { getSupabaseClient } from '../_shared/supabase.ts'
import { getPlatform } from '../_shared/platforms/index.ts'

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const { content, platforms: targetPlatforms } = await req.json()

    if (!content || !targetPlatforms || targetPlatforms.length === 0) {
      return corsError('Missing content or target platforms')
    }

    const supabase = getSupabaseClient()

    // Get tokens for all target platforms
    const { data: connections, error: connError } = await supabase
      .from('social_connections')
      .select('platform, tokens')
      .eq('status', 'active')
      .in('platform', targetPlatforms)

    if (connError) return corsError(connError.message)

    const results: Record<string, { success: boolean, error?: string, data?: unknown }> = {}

    // Post to each platform in parallel
    await Promise.all(
      (connections || []).map(async (conn) => {
        try {
          const adapter = getPlatform(conn.platform)
          const data = await adapter.createPost(conn.tokens as Record<string, string>, content)
          results[conn.platform] = { success: true, data }
        } catch (err) {
          results[conn.platform] = { success: false, error: err.message }
        }
      })
    )

    // Mark platforms that weren't connected
    for (const p of targetPlatforms) {
      if (!results[p]) {
        results[p] = { success: false, error: 'Platform not connected' }
      }
    }

    // Save to post queue for history
    await supabase.from('post_queue').insert({
      content,
      platforms: targetPlatforms,
      status: 'completed',
      results,
    })

    return corsResponse({ results })
  } catch (err) {
    return corsError(err.message, 500)
  }
})
