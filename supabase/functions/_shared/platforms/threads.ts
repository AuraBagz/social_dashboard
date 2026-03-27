// Threads - Uses Instagram session (Meta platform)
const BASE = 'https://www.threads.net'

function headers(tokens: Record<string, string>) {
  return {
    'Cookie': `sessionid=${tokens.session_id}; csrftoken=${tokens.csrf_token}`,
    'X-CSRFToken': tokens.csrf_token,
    'X-IG-App-ID': '238260118697367',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': '*/*',
    'X-FB-LSD': tokens.lsd || '',
  }
}

export async function verifyCredentials(tokens: Record<string, string>) {
  // Use the Instagram API to verify since Threads shares session
  const res = await fetch(`https://www.instagram.com/api/v1/accounts/current_user/?edit=true`, {
    headers: {
      'Cookie': `sessionid=${tokens.session_id}; csrftoken=${tokens.csrf_token}`,
      'X-CSRFToken': tokens.csrf_token,
      'X-IG-App-ID': '936619743392459',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  })
  if (!res.ok) throw new Error(`Threads auth failed: ${res.status}`)
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
    posts: 0,
  }
}

export async function getTimeline(tokens: Record<string, string>, count = 20) {
  // Threads API via GraphQL
  const res = await fetch(`${BASE}/api/graphql`, {
    method: 'POST',
    headers: headers(tokens),
    body: new URLSearchParams({
      'lsd': tokens.lsd || '',
      'variables': JSON.stringify({ first: count }),
      'doc_id': '6232751443445612', // threads feed doc_id
    }),
  })
  if (!res.ok) return [] // Threads API can be flaky
  try {
    const data = await res.json()
    const edges = data?.data?.mediaData?.edges || []
    return edges.map((edge: any) => {
      const node = edge.node
      return {
        id: node.id,
        content: node.caption?.text || '',
        posted_at: new Date((node.taken_at || 0) * 1000).toISOString(),
        media: [],
        stats: {
          likes: node.like_count || 0,
          replies: node.text_post_app_info?.direct_reply_count || 0,
          reposts: node.text_post_app_info?.repost_count || 0,
        },
      }
    })
  } catch {
    return []
  }
}

export async function createPost(tokens: Record<string, string>, text: string) {
  const res = await fetch(`${BASE}/api/graphql`, {
    method: 'POST',
    headers: headers(tokens),
    body: new URLSearchParams({
      'lsd': tokens.lsd || '',
      'variables': JSON.stringify({
        publish_mode: 'text_post',
        text_post_app_info: { reply_control: 0 },
        caption: text,
      }),
      'doc_id': '6598576986894963', // threads create post doc_id
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Threads post failed: ${err}`)
  }
  return await res.json()
}

export async function updateProfile(_tokens: Record<string, string>, _profile: Record<string, string>) {
  throw new Error('Threads profile is managed via Instagram. Update your Instagram profile instead.')
}

export const requiredTokens = ['session_id', 'csrf_token']
export const tokenLabels = {
  session_id: 'Session ID (sessionid cookie from threads.net)',
  csrf_token: 'CSRF Token (csrftoken cookie from threads.net)',
}
