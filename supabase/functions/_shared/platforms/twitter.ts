// X/Twitter - Uses CT0 + auth_token cookies via GraphQL API (same as web client)
const BASE = 'https://x.com/i/api'

function headers(tokens: Record<string, string>) {
  return {
    'Authorization': `Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA`,
    'Cookie': `auth_token=${tokens.auth_token}; ct0=${tokens.ct0}`,
    'X-Csrf-Token': tokens.ct0,
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'X-Twitter-Active-User': 'yes',
    'X-Twitter-Auth-Type': 'OAuth2Session',
    'X-Twitter-Client-Language': 'en',
    'Referer': 'https://x.com/',
    'Origin': 'https://x.com',
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
  }
}

export async function verifyCredentials(tokens: Record<string, string>) {
  // Try multiple endpoints - Twitter changes these frequently
  const endpoints = [
    `${BASE}/1.1/account/verify_credentials.json?include_entities=false`,
    `${BASE}/1.1/account/settings.json`,
    `https://api.twitter.com/1.1/account/verify_credentials.json?include_entities=false`,
    `https://api.twitter.com/1.1/account/settings.json`,
  ]

  for (const url of endpoints) {
    try {
      const res = await fetch(url, { headers: headers(tokens) })
      if (!res.ok) continue

      const data = await res.json()

      // verify_credentials returns full user object
      if (data.screen_name && data.id_str) {
        return {
          id: data.id_str,
          name: data.name,
          username: data.screen_name,
          avatar: data.profile_image_url_https?.replace('_normal', '_400x400') || '',
          bio: data.description || '',
          followers: data.followers_count || 0,
          following: data.friends_count || 0,
          posts: data.statuses_count || 0,
        }
      }

      // settings.json returns limited info
      if (data.screen_name) {
        return {
          id: '',
          name: data.screen_name,
          username: data.screen_name,
          avatar: '',
          bio: '',
          followers: 0,
          following: 0,
          posts: 0,
        }
      }
    } catch (_) {
      continue
    }
  }

  // Last resort: try GraphQL Viewer query
  const gqlEndpoints = [
    'LimHGpmRAWbW-JTXwbIF3g',
    'PfYIjPnDdLfAbXk7Eb7PUQ',
  ]

  const variables = encodeURIComponent(JSON.stringify({ withCommunitiesMemberships: false }))
  const features = encodeURIComponent(JSON.stringify({
    hidden_profile_subscriptions_enabled: false,
    rweb_tipjar_consumption_enabled: false,
    responsive_web_graphql_exclude_directive_enabled: true,
    verified_phone_label_enabled: false,
    responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
    responsive_web_graphql_timeline_navigation_enabled: true,
  }))

  for (const queryId of gqlEndpoints) {
    try {
      const res = await fetch(
        `${BASE}/graphql/${queryId}/Viewer?variables=${variables}&features=${features}`,
        { headers: headers(tokens) }
      )
      if (!res.ok) continue

      const gqlData = await res.json()
      const user = gqlData?.data?.viewer?.user_results?.result?.legacy
      if (!user) continue

      return {
        id: gqlData.data.viewer.user_results.result.rest_id,
        name: user.name,
        username: user.screen_name,
        avatar: user.profile_image_url_https?.replace('_normal', '_400x400') || '',
        bio: user.description || '',
        followers: user.followers_count || 0,
        following: user.friends_count || 0,
        posts: user.statuses_count || 0,
      }
    } catch (_) {
      continue
    }
  }

  throw new Error('Twitter auth failed: could not verify credentials. Your cookies may be expired — try getting fresh ones from x.com')
}

export async function getTimeline(tokens: Record<string, string>, count = 20) {
  // Use UserTweets GraphQL endpoint
  // First we need the user ID
  const profile = await verifyCredentials(tokens)
  if (!profile.id) throw new Error('Could not get user ID for timeline')

  const variables = encodeURIComponent(JSON.stringify({
    userId: profile.id,
    count,
    includePromotedContent: false,
    withQuickPromoteEligibilityTweetFields: false,
    withVoice: false,
    withV2Timeline: true,
  }))
  const features = encodeURIComponent(JSON.stringify({
    rweb_tipjar_consumption_enabled: false,
    responsive_web_graphql_exclude_directive_enabled: true,
    verified_phone_label_enabled: false,
    responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
    responsive_web_graphql_timeline_navigation_enabled: true,
    tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
    creator_subscriptions_tweet_preview_api_enabled: true,
    longform_notetweets_consumption_enabled: true,
    longform_notetweets_rich_text_read_enabled: true,
    longform_notetweets_inline_media_enabled: true,
    freedom_of_speech_not_reach_fetch_enabled: true,
    standardized_nudges_misinfo: true,
    tweet_awards_web_tipping_enabled: false,
    tweetypie_unmention_optimization_enabled: true,
    responsive_web_edit_tweet_api_enabled: true,
    graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
    view_counts_everywhere_api_enabled: true,
    responsive_web_twitter_article_tweet_consumption_enabled: true,
    responsive_web_media_download_video_enabled: false,
    articles_preview_enabled: true,
    communities_web_enable_tweet_community_results_fetch: true,
    c9s_tweet_anatomy_moderator_badge_enabled: true,
    responsive_web_grok_analyze_button_fetch_trends_enabled: false,
    responsive_web_grok_analyze_post_followups_enabled: false,
    responsive_web_grok_share_attachment_enabled: false,
  }))

  const res = await fetch(
    `${BASE}/graphql/E3opETHurmVJflFsUBVuUQ/UserTweets?variables=${variables}&features=${features}`,
    { headers: headers(tokens) }
  )
  if (!res.ok) throw new Error(`Twitter timeline failed: ${res.status}`)

  const data = await res.json()
  const entries = data?.data?.user?.result?.timeline_v2?.timeline?.instructions
    ?.find((i: any) => i.type === 'TimelineAddEntries')?.entries || []

  return entries
    .filter((e: any) => e.content?.entryType === 'TimelineTimelineItem')
    .map((e: any) => {
      const tweet = e.content?.itemContent?.tweet_results?.result?.legacy
        || e.content?.itemContent?.tweet_results?.result?.tweet?.legacy
      if (!tweet) return null
      return {
        id: tweet.id_str,
        content: tweet.full_text || '',
        posted_at: new Date(tweet.created_at).toISOString(),
        media: tweet.entities?.media?.map((m: any) => m.media_url_https) || [],
        stats: {
          likes: tweet.favorite_count || 0,
          retweets: tweet.retweet_count || 0,
          replies: tweet.reply_count || 0,
        },
      }
    })
    .filter(Boolean)
    .slice(0, count)
}

export async function createPost(tokens: Record<string, string>, text: string) {
  const res = await fetch(`${BASE}/graphql/a1p9RWpkYKBjWv_I3WzS-A/CreateTweet`, {
    method: 'POST',
    headers: headers(tokens),
    body: JSON.stringify({
      variables: {
        tweet_text: text,
        dark_request: false,
        media: { media_entities: [], possibly_sensitive: false },
        semantic_annotation_ids: [],
      },
      features: {
        communities_web_enable_tweet_community_results_fetch: true,
        c9s_tweet_anatomy_moderator_badge_enabled: true,
        tweetypie_unmention_optimization_enabled: true,
        responsive_web_edit_tweet_api_enabled: true,
        graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
        view_counts_everywhere_api_enabled: true,
        longform_notetweets_consumption_enabled: true,
        responsive_web_twitter_article_tweet_consumption_enabled: true,
        tweet_awards_web_tipping_enabled: false,
        creator_subscriptions_tweet_preview_api_enabled: true,
        longform_notetweets_rich_text_read_enabled: true,
        longform_notetweets_inline_media_enabled: true,
        rweb_tipjar_consumption_enabled: false,
        responsive_web_graphql_exclude_directive_enabled: true,
        verified_phone_label_enabled: false,
        freedom_of_speech_not_reach_fetch_enabled: true,
        standardized_nudges_misinfo: true,
        tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
        responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
        responsive_web_graphql_timeline_navigation_enabled: true,
        responsive_web_media_download_video_enabled: false,
      },
      queryId: 'a1p9RWpkYKBjWv_I3WzS-A',
    }),
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
    headers: { ...headers(tokens), 'Content-Type': 'application/x-www-form-urlencoded' },
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
