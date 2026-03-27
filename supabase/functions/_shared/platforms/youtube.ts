// YouTube - Uses Data API v3 (free 10,000 units/day)
const BASE = 'https://www.googleapis.com/youtube/v3'

function headers(tokens: Record<string, string>) {
  return {
    'Authorization': `Bearer ${tokens.access_token}`,
    'Content-Type': 'application/json',
  }
}

export async function verifyCredentials(tokens: Record<string, string>) {
  const url = `${BASE}/channels?part=snippet,statistics&mine=true&key=${tokens.api_key || ''}`
  const res = await fetch(url, { headers: headers(tokens) })
  if (!res.ok) throw new Error(`YouTube auth failed: ${res.status}`)
  const data = await res.json()
  const channel = data.items?.[0]
  if (!channel) throw new Error('No YouTube channel found')
  return {
    id: channel.id,
    name: channel.snippet.title,
    username: channel.snippet.customUrl || channel.id,
    avatar: channel.snippet.thumbnails?.default?.url,
    bio: channel.snippet.description || '',
    followers: parseInt(channel.statistics.subscriberCount) || 0,
    following: 0,
    posts: parseInt(channel.statistics.videoCount) || 0,
    views: parseInt(channel.statistics.viewCount) || 0,
  }
}

export async function getTimeline(tokens: Record<string, string>, count = 20) {
  // Get channel's uploads
  const channelRes = await fetch(`${BASE}/channels?part=contentDetails&mine=true&key=${tokens.api_key || ''}`, {
    headers: headers(tokens),
  })
  if (!channelRes.ok) throw new Error(`YouTube channel failed: ${channelRes.status}`)
  const channelData = await channelRes.json()
  const uploadsId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads

  if (!uploadsId) return []

  const playlistRes = await fetch(`${BASE}/playlistItems?part=snippet&playlistId=${uploadsId}&maxResults=${count}&key=${tokens.api_key || ''}`, {
    headers: headers(tokens),
  })
  if (!playlistRes.ok) throw new Error(`YouTube playlist failed: ${playlistRes.status}`)
  const playlistData = await playlistRes.json()
  const videoIds = playlistData.items?.map((i: any) => i.snippet.resourceId.videoId).join(',')

  if (!videoIds) return []

  // Get video stats
  const statsRes = await fetch(`${BASE}/videos?part=statistics,snippet&id=${videoIds}&key=${tokens.api_key || ''}`, {
    headers: headers(tokens),
  })
  const statsData = await statsRes.json()

  return (statsData.items || []).map((v: any) => ({
    id: v.id,
    content: v.snippet.title,
    posted_at: v.snippet.publishedAt,
    media: [v.snippet.thumbnails?.medium?.url],
    stats: {
      likes: parseInt(v.statistics.likeCount) || 0,
      comments: parseInt(v.statistics.commentCount) || 0,
      views: parseInt(v.statistics.viewCount) || 0,
    },
  }))
}

export async function createPost(_tokens: Record<string, string>, _text: string) {
  throw new Error('YouTube video upload requires file upload. Use YouTube Studio directly for video uploads.')
}

export async function updateProfile(tokens: Record<string, string>, profile: Record<string, string>) {
  // Get current channel branding
  const res = await fetch(`${BASE}/channels?part=brandingSettings&mine=true&key=${tokens.api_key || ''}`, {
    headers: headers(tokens),
  })
  const data = await res.json()
  const channel = data.items?.[0]
  if (!channel) throw new Error('No channel found')

  const branding = channel.brandingSettings || {}
  if (profile.description) {
    branding.channel = { ...branding.channel, description: profile.description }
  }

  const updateRes = await fetch(`${BASE}/channels?part=brandingSettings&key=${tokens.api_key || ''}`, {
    method: 'PUT',
    headers: headers(tokens),
    body: JSON.stringify({
      id: channel.id,
      brandingSettings: branding,
    }),
  })
  if (!updateRes.ok) throw new Error(`YouTube profile update failed: ${updateRes.status}`)
  return await updateRes.json()
}

export const requiredTokens = ['access_token', 'api_key']
export const tokenLabels = {
  access_token: 'OAuth Access Token',
  api_key: 'API Key (from Google Cloud Console)',
}
