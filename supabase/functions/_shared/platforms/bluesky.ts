// Bluesky - Uses AT Protocol (fully free, official API)
const BASE = 'https://bsky.social/xrpc'

async function createSession(tokens: Record<string, string>) {
  const res = await fetch(`${BASE}/com.atproto.server.createSession`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: tokens.identifier, // handle or DID
      password: tokens.app_password,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Bluesky auth failed: ${err}`)
  }
  return await res.json()
}

export async function verifyCredentials(tokens: Record<string, string>) {
  const session = await createSession(tokens)
  const res = await fetch(`${BASE}/app.bsky.actor.getProfile?actor=${session.did}`, {
    headers: { 'Authorization': `Bearer ${session.accessJwt}` },
  })
  if (!res.ok) throw new Error(`Bluesky profile fetch failed: ${res.status}`)
  const profile = await res.json()
  return {
    id: profile.did,
    name: profile.displayName || profile.handle,
    username: profile.handle,
    avatar: profile.avatar,
    bio: profile.description,
    followers: profile.followersCount,
    following: profile.followsCount,
    posts: profile.postsCount,
    _session: session, // pass back for token storage
  }
}

export async function getTimeline(tokens: Record<string, string>, count = 20) {
  const session = await createSession(tokens)
  const res = await fetch(`${BASE}/app.bsky.feed.getAuthorFeed?actor=${session.did}&limit=${count}`, {
    headers: { 'Authorization': `Bearer ${session.accessJwt}` },
  })
  if (!res.ok) throw new Error(`Bluesky feed failed: ${res.status}`)
  const data = await res.json()
  return (data.feed || []).map((item: any) => {
    const post = item.post
    return {
      id: post.uri,
      content: post.record?.text || '',
      posted_at: post.record?.createdAt || post.indexedAt,
      media: post.embed?.images?.map((img: any) => img.thumb) || [],
      stats: {
        likes: post.likeCount || 0,
        reposts: post.repostCount || 0,
        replies: post.replyCount || 0,
      },
    }
  })
}

export async function createPost(tokens: Record<string, string>, text: string) {
  const session = await createSession(tokens)
  const res = await fetch(`${BASE}/com.atproto.repo.createRecord`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.accessJwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      repo: session.did,
      collection: 'app.bsky.feed.post',
      record: {
        text,
        createdAt: new Date().toISOString(),
        $type: 'app.bsky.feed.post',
      },
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Bluesky post failed: ${err}`)
  }
  return await res.json()
}

export async function updateProfile(tokens: Record<string, string>, profile: Record<string, string>) {
  const session = await createSession(tokens)
  // Get current profile record
  const getRes = await fetch(`${BASE}/com.atproto.repo.getRecord?repo=${session.did}&collection=app.bsky.actor.profile&rkey=self`, {
    headers: { 'Authorization': `Bearer ${session.accessJwt}` },
  })
  const current = getRes.ok ? await getRes.json() : { value: {} }

  const updatedProfile = {
    ...current.value,
    $type: 'app.bsky.actor.profile',
  }
  if (profile.name) updatedProfile.displayName = profile.name
  if (profile.description) updatedProfile.description = profile.description

  const res = await fetch(`${BASE}/com.atproto.repo.putRecord`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.accessJwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      repo: session.did,
      collection: 'app.bsky.actor.profile',
      rkey: 'self',
      record: updatedProfile,
    }),
  })
  if (!res.ok) throw new Error(`Bluesky profile update failed: ${res.status}`)
  return await res.json()
}

export const requiredTokens = ['identifier', 'app_password']
export const tokenLabels = {
  identifier: 'Handle or DID (e.g. yourname.bsky.social)',
  app_password: 'App Password (Settings → App Passwords)',
}
