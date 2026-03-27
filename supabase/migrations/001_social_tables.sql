-- Social platform connections and token storage
CREATE TABLE IF NOT EXISTS social_connections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  platform text NOT NULL UNIQUE,
  tokens jsonb NOT NULL DEFAULT '{}',
  profile_data jsonb DEFAULT '{}',
  connected_at timestamptz DEFAULT now(),
  last_used_at timestamptz,
  status text DEFAULT 'active'
);

-- Cached posts from all platforms
CREATE TABLE IF NOT EXISTS social_posts_cache (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  platform text NOT NULL,
  external_id text,
  content text,
  media_urls jsonb DEFAULT '[]',
  stats jsonb DEFAULT '{}',
  posted_at timestamptz,
  fetched_at timestamptz DEFAULT now(),
  UNIQUE(platform, external_id)
);

-- Post queue for publishing
CREATE TABLE IF NOT EXISTS post_queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  content text NOT NULL,
  platforms jsonb NOT NULL DEFAULT '[]',
  media_urls jsonb DEFAULT '[]',
  scheduled_for timestamptz,
  status text DEFAULT 'pending',
  results jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
