// X/Twitter - Uses CT0 + auth_token cookies for unofficial API access
const BASE = 'https://api.twitter.com'

function headers(tokens: Record<string, string>) {
  return {
    'Authorization': `Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA`,
    'Cookie': `auth_token=${tokens.auth_token}; ct0=${tokens.ct0}`,
    'X-Csrf-Token': tokens.ct0,
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'X-Twitter-Active-User': 'yes',
    'X-Twitter-Auth-Type': 'OAuth2Session',
  }
}

export async function verifyCredentials(tokens: Record<string, string>) {
  const res = await fetch(`${BASE}/1.1/account/verify_credentials.json?include_entities=false`, {
    headers: headers(tokens),
  })
  if (!res.ok) throw new Error(`Twitter auth failed: ${res.status}`)
  const data = await res.json()
  return {
    id: data.id_str,
    name: data.name,
    username: data.screen_name,
    avatar: data.profile_image_url_https?.replace('_normal', '_400x400'),
    bio: data.description,
    followers: data.followers_count,
    following: data.friends_count,
    posts: data.statuses_count,
  }
}

export async function getTimeline(tokens: Record<string, string>, count = 20) {
  const res = await fetch(`${BASE}/1.1/statuses/user_timeline.json?count=${count}&include_entities=true&tweet_mode=extended`, {
    headers: headers(tokens),
  })
  if (!res.ok) throw new Error(`Twitter timeline failed: ${res.status}`)
  const tweets = await res.json()
  return tweets.map((t: any) => ({
    id: t.id_str,
    content: t.full_text || t.text,
    posted_at: new Date(t.created_at).toISOString(),
    media: t.entities?.media?.map((m: any) => m.media_url_https) || [],
    stats: {
      likes: t.favorite_count,
      retweets: t.retweet_count,
      replies: t.reply_count || 0,
    },
  }))
}

export async function createTweet(tokens: Record<string, string>, text: string) {
  const res = await fetch(`${BASE}/1.1/statuses/update.json`, {
    method: 'POST',
    headers: headers(tokens),
    body: new URLSearchParams({ status: text }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Tweet failed: ${err}`)
  }
  return await res.json()
}

export async function updateProfile(tokens: Record<string, string>, profile: Record<string, string>) {
  const params = new URLSearchParams()
  if (profile.name) params.set('name', profile.name)
  if (profile.description) params.set('description', profile.description)
  if (profile.url) params.set('url', profile.url)

  const res = await fetch(`${BASE}/1.1/account/update_profile.json`, {
    method: 'POST',
    headers: headers(tokens),
    body: params,
  })
  if (!res.ok) throw new Error(`Profile update failed: ${res.status}`)
  return await res.json()
}

export const requiredTokens = ['auth_token', 'ct0']
export const tokenLabels = {
  auth_token: 'Auth Token (auth_token cookie)',
  ct0: 'CT0 Token (ct0 cookie)',
}
