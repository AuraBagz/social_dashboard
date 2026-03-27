// Instagram - Uses web API with session cookies
const BASE = 'https://www.instagram.com'

function headers(tokens: Record<string, string>) {
  return {
    'Cookie': `sessionid=${tokens.session_id}; csrftoken=${tokens.csrf_token}`,
    'X-CSRFToken': tokens.csrf_token,
    'X-IG-App-ID': '936619743392459',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': '*/*',
    'X-Requested-With': 'XMLHttpRequest',
  }
}

export async function verifyCredentials(tokens: Record<string, string>) {
  const res = await fetch(`${BASE}/api/v1/accounts/current_user/?edit=true`, {
    headers: headers(tokens),
  })
  if (!res.ok) throw new Error(`Instagram auth failed: ${res.status}`)
  const data = await res.json()
  const user = data.user
  return {
    id: user.pk || user.pk_id,
    name: user.full_name,
    username: user.username,
    avatar: user.profile_pic_url,
    bio: user.biography || '',
    followers: user.follower_count || 0,
    following: user.following_count || 0,
    posts: user.media_count || 0,
  }
}

export async function getTimeline(tokens: Record<string, string>, count = 20) {
  // First get user ID
  const profile = await verifyCredentials(tokens)
  const res = await fetch(`${BASE}/api/v1/feed/user/${profile.id}/?count=${count}`, {
    headers: headers(tokens),
  })
  if (!res.ok) throw new Error(`Instagram feed failed: ${res.status}`)
  const data = await res.json()
  return (data.items || []).map((item: any) => ({
    id: item.id || item.pk,
    content: item.caption?.text || '',
    posted_at: new Date((item.taken_at || 0) * 1000).toISOString(),
    media: item.image_versions2?.candidates?.slice(0, 1).map((c: any) => c.url) || [],
    stats: {
      likes: item.like_count || 0,
      comments: item.comment_count || 0,
      views: item.view_count || item.play_count || 0,
    },
  }))
}

export async function createPost(_tokens: Record<string, string>, _text: string) {
  // Instagram doesn't support text-only posts via web API
  // Media upload requires Graph API with business account
  throw new Error('Instagram posting requires Business account + Graph API. Upload directly via Instagram app.')
}

export async function updateProfile(tokens: Record<string, string>, profile: Record<string, string>) {
  const formData = new URLSearchParams()
  if (profile.name) formData.set('first_name', profile.name)
  if (profile.description) formData.set('biography', profile.description)
  if (profile.url) formData.set('external_url', profile.url)

  const res = await fetch(`${BASE}/api/v1/accounts/edit_profile/`, {
    method: 'POST',
    headers: {
      ...headers(tokens),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  })
  if (!res.ok) throw new Error(`Instagram profile update failed: ${res.status}`)
  return await res.json()
}

export const requiredTokens = ['session_id', 'csrf_token']
export const tokenLabels = {
  session_id: 'Session ID (sessionid cookie)',
  csrf_token: 'CSRF Token (csrftoken cookie)',
}
