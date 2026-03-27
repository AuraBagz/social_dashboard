import '@supabase/functions-js/edge-runtime.d.ts'
import { handleCors, corsResponse, corsError } from '../_shared/cors.ts'
import { getSupabaseClient, cachePosts } from '../_shared/supabase.ts'
import { getPlatform } from '../_shared/platforms/index.ts'

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const { platform, count = 20, cached_only = false } = await req.json()
    const supabase = getSupabaseClient()

    // If requesting cached data only, return from DB
    if (cached_only) {
      let query = supabase
        .from('social_posts_cache')
        .select('*')
        .order('posted_at', { ascending: false })
        .limit(count)

      if (platform && platform !== 'all') {
        query = query.eq('platform', platform)
      }

      const { data, error } = await query
      if (error) return corsError(error.message)
      return corsResponse({ posts: data || [] })
    }

    // Get all active connections or specific platform
    let connectionsQuery = supabase
      .from('social_connections')
      .select('platform, tokens')
      .eq('status', 'active')

    if (platform && platform !== 'all') {
      connectionsQuery = connectionsQuery.eq('platform', platform)
    }

    const { data: connections, error: connError } = await connectionsQuery
    if (connError) return corsError(connError.message)
    if (!connections || connections.length === 0) {
      return corsResponse({ posts: [], message: 'No connected platforms' })
    }

    // Fetch from each platform in parallel
    const allPosts: Array<Record<string, unknown>> = []
    const errors: Record<string, string> = {}

    await Promise.all(
      connections.map(async (conn) => {
        try {
          const adapter = getPlatform(conn.platform)
          const posts = await adapter.getTimeline(conn.tokens as Record<string, string>, count)

          // Tag each post with platform
          const taggedPosts = posts.map(p => ({ ...p, platform: conn.platform }))
          allPosts.push(...taggedPosts)

          // Cache the posts
          await cachePosts(conn.platform, posts)

          // Update last_used_at
          await supabase
            .from('social_connections')
            .update({ last_used_at: new Date().toISOString() })
            .eq('platform', conn.platform)
        } catch (err) {
          errors[conn.platform] = err.message
        }
      })
    )

    // Sort by posted_at descending
    allPosts.sort((a, b) => {
      const dateA = new Date(a.posted_at as string).getTime()
      const dateB = new Date(b.posted_at as string).getTime()
      return dateB - dateA
    })

    return corsResponse({
      posts: allPosts.slice(0, count),
      errors: Object.keys(errors).length > 0 ? errors : undefined,
    })
  } catch (err) {
    return corsError(err.message, 500)
  }
})
