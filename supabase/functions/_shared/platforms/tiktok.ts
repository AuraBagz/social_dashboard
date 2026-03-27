// TikTok - Uses web API with session cookies
const BASE = 'https://www.tiktok.com'

function headers(tokens: Record<string, string>) {
  return {
    'Cookie': `sessionid=${tokens.session_id}; tt_csrf_token=${tokens.csrf_token}`,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
  }
}

export async function verifyCredentials(tokens: Record<string, string>) {
  const res = await fetch(`${BASE}/api/user/detail/?uniqueId=${tokens.username || ''}`, {
    headers: headers(tokens),
  })
  if (!res.ok) throw new Error(`TikTok auth failed: ${res.status}`)
  const data = await res.json()
  const user = data.userInfo?.user || {}
  const stats = data.userInfo?.stats || {}
  return {
    id: user.id || user.uniqueId,
    name: user.nickname || user.uniqueId,
    username: user.uniqueId,
    avatar: user.avatarLarger || user.avatarMedium,
    bio: user.signature || '',
    followers: stats.followerCount || 0,
    following: stats.followingCount || 0,
    posts: stats.videoCount || 0,
    likes: stats.heartCount || 0,
  }
}

export async function getTimeline(tokens: Record<string, string>, count = 20) {
  const res = await fetch(`${BASE}/api/post/item_list/?secUid=${tokens.sec_uid || ''}&count=${count}&cursor=0`, {
    headers: headers(tokens),
  })
  if (!res.ok) throw new Error(`TikTok feed failed: ${res.status}`)
  const data = await res.json()
  return (data.itemList || []).map((item: any) => ({
    id: item.id,
    content: item.desc || '',
    posted_at: new Date((item.createTime || 0) * 1000).toISOString(),
    media: [item.video?.cover],
    stats: {
      likes: item.stats?.diggCount || 0,
      comments: item.stats?.commentCount || 0,
      shares: item.stats?.shareCount || 0,
      views: item.stats?.playCount || 0,
    },
  }))
}

export async function createPost(_tokens: Record<string, string>, _text: string) {
  throw new Error('TikTok posting requires video upload. Use TikTok app directly.')
}

export async function updateProfile(_tokens: Record<string, string>, _profile: Record<string, string>) {
  throw new Error('TikTok profile updates should be done directly in the TikTok app.')
}

export const requiredTokens = ['session_id', 'csrf_token', 'username']
export const tokenLabels = {
  session_id: 'Session ID (sessionid cookie)',
  csrf_token: 'CSRF Token (tt_csrf_token cookie)',
  username: 'TikTok Username (without @)',
}
