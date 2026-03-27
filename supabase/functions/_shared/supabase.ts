import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export function getSupabaseClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
}

export async function getTokens(platform: string) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('social_connections')
    .select('tokens, profile_data')
    .eq('platform', platform)
    .eq('status', 'active')
    .single()

  if (error || !data) return null
  return data
}

export async function saveTokens(platform: string, tokens: Record<string, string>, profileData?: Record<string, unknown>) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('social_connections')
    .upsert({
      platform,
      tokens,
      profile_data: profileData || {},
      connected_at: new Date().toISOString(),
      last_used_at: new Date().toISOString(),
      status: 'active',
    }, { onConflict: 'platform' })
    .select()
    .single()

  if (error) throw new Error(`Failed to save tokens: ${error.message}`)
  return data
}

export async function removeConnection(platform: string) {
  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from('social_connections')
    .delete()
    .eq('platform', platform)

  if (error) throw new Error(`Failed to remove: ${error.message}`)
}

export async function cachePosts(platform: string, posts: Array<Record<string, unknown>>) {
  const supabase = getSupabaseClient()
  const rows = posts.map(p => ({
    platform,
    external_id: String(p.id),
    content: p.content || '',
    media_urls: p.media || [],
    stats: p.stats || {},
    posted_at: p.posted_at || new Date().toISOString(),
    fetched_at: new Date().toISOString(),
  }))

  const { error } = await supabase
    .from('social_posts_cache')
    .upsert(rows, { onConflict: 'platform,external_id' })

  if (error) console.error('Cache error:', error)
}
