// Facebook - Uses Graph API with user access token
const BASE = 'https://graph.facebook.com/v18.0'

function headers(tokens: Record<string, string>) {
  return {
    'Content-Type': 'application/json',
  }
}

export async function verifyCredentials(tokens: Record<string, string>) {
  const res = await fetch(`${BASE}/me?fields=id,name,picture.type(large),about,fan_count,followers_count&access_token=${tokens.access_token}`, {
    headers: headers(tokens),
  })
  if (!res.ok) throw new Error(`Facebook auth failed: ${res.status}`)
  const data = await res.json()
  return {
    id: data.id,
    name: data.name,
    username: data.id,
    avatar: data.picture?.data?.url,
    bio: data.about || '',
    followers: data.followers_count || data.fan_count || 0,
    following: 0,
    posts: 0,
  }
}

export async function getTimeline(tokens: Record<string, string>, count = 20) {
  const res = await fetch(`${BASE}/me/posts?fields=id,message,created_time,likes.summary(true),comments.summary(true),shares&limit=${count}&access_token=${tokens.access_token}`)
  if (!res.ok) throw new Error(`Facebook feed failed: ${res.status}`)
  const data = await res.json()
  return (data.data || []).map((p: any) => ({
    id: p.id,
    content: p.message || '',
    posted_at: p.created_time,
    media: [],
    stats: {
      likes: p.likes?.summary?.total_count || 0,
      comments: p.comments?.summary?.total_count || 0,
      shares: p.shares?.count || 0,
    },
  }))
}

export async function createPost(tokens: Record<string, string>, text: string) {
  const res = await fetch(`${BASE}/me/feed`, {
    method: 'POST',
    headers: headers(tokens),
    body: JSON.stringify({
      message: text,
      access_token: tokens.access_token,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Facebook post failed: ${err}`)
  }
  return await res.json()
}

export async function updateProfile(tokens: Record<string, string>, profile: Record<string, string>) {
  // Facebook personal profiles don't support programmatic bio updates
  // Only Pages support this via the API
  if (profile.description) {
    const res = await fetch(`${BASE}/me?bio=${encodeURIComponent(profile.description)}&access_token=${tokens.access_token}`, {
      method: 'POST',
    })
    if (!res.ok) {
      console.warn('Facebook profile update may not be supported for personal accounts')
    }
  }
  return { updated: true }
}

export const requiredTokens = ['access_token']
export const tokenLabels = {
  access_token: 'Access Token (from Graph API Explorer)',
}
