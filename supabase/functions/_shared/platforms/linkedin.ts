// LinkedIn - Uses li_at cookie with Voyager API
const BASE = 'https://www.linkedin.com'

function headers(tokens: Record<string, string>) {
  return {
    'Cookie': `li_at=${tokens.li_at}; JSESSIONID="${tokens.jsessionid}"`,
    'Csrf-Token': tokens.jsessionid,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/vnd.linkedin.normalized+json+2.1',
    'X-Li-Lang': 'en_US',
    'X-Restli-Protocol-Version': '2.0.0',
  }
}

export async function verifyCredentials(tokens: Record<string, string>) {
  const res = await fetch(`${BASE}/voyager/api/identity/dash/profiles?q=memberIdentity&memberIdentity=me&decorationId=com.linkedin.voyager.dash.deco.identity.profile.WebTopCardCore-20`, {
    headers: headers(tokens),
  })
  if (!res.ok) throw new Error(`LinkedIn auth failed: ${res.status}`)
  const data = await res.json()
  const profile = data.elements?.[0] || data.included?.[0] || {}
  return {
    id: profile.entityUrn || profile.publicIdentifier || 'unknown',
    name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'LinkedIn User',
    username: profile.publicIdentifier || '',
    avatar: profile.profilePicture?.displayImageReference?.vectorImage?.rootUrl || '',
    bio: profile.headline || '',
    followers: 0,
    following: 0,
    posts: 0,
  }
}

export async function getTimeline(tokens: Record<string, string>, count = 20) {
  const res = await fetch(`${BASE}/voyager/api/feed/updates?count=${count}&q=chronologicalFeed`, {
    headers: headers(tokens),
  })
  if (!res.ok) throw new Error(`LinkedIn feed failed: ${res.status}`)
  const data = await res.json()
  return (data.elements || []).slice(0, count).map((item: any) => ({
    id: item.updateMetadata?.urn || item.entityUrn || crypto.randomUUID(),
    content: item.commentary?.text || item.value?.com?.linkedin?.voyager?.feed?.render?.UpdateV2?.commentary?.text?.text || '',
    posted_at: item.createdTime ? new Date(item.createdTime).toISOString() : new Date().toISOString(),
    media: [],
    stats: {
      likes: item.socialDetail?.totalSocialActivityCounts?.numLikes || 0,
      comments: item.socialDetail?.totalSocialActivityCounts?.numComments || 0,
      shares: item.socialDetail?.totalSocialActivityCounts?.numShares || 0,
    },
  }))
}

export async function createPost(tokens: Record<string, string>, text: string) {
  // Use the UGC Post API
  const res = await fetch(`${BASE}/voyager/api/contentcreation/normShares`, {
    method: 'POST',
    headers: {
      ...headers(tokens),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      visibleToConnectionsOnly: false,
      externalAudienceProviders: [],
      commentaryV2: { text, attributesV2: [] },
      origin: 'FEED',
      allowedCommentersScope: 'ALL',
      postState: 'PUBLISHED',
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`LinkedIn post failed: ${err}`)
  }
  return await res.json()
}

export async function updateProfile(_tokens: Record<string, string>, _profile: Record<string, string>) {
  // LinkedIn profile updates via Voyager API are complex and risky
  throw new Error('LinkedIn profile updates should be done directly on linkedin.com')
}

export const requiredTokens = ['li_at', 'jsessionid']
export const tokenLabels = {
  li_at: 'li_at Cookie',
  jsessionid: 'JSESSIONID Cookie',
}
