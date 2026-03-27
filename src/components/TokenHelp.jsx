import { Monitor, Cookie, Key } from 'lucide-react'

const helpContent = {
  twitter: {
    icon: Cookie,
    steps: [
      'Open x.com and log into your account',
      'Press F12 to open DevTools',
      'Go to the Application tab → Cookies → x.com',
      'Find and copy the "auth_token" cookie value',
      'Find and copy the "ct0" cookie value',
      'Paste both values into the fields above',
    ],
  },
  instagram: {
    icon: Cookie,
    steps: [
      'Open instagram.com and log into your account',
      'Press F12 to open DevTools',
      'Go to the Application tab → Cookies → instagram.com',
      'Find and copy the "sessionid" cookie value',
      'Find and copy the "csrftoken" cookie value',
      'Paste both values into the fields above',
    ],
  },
  facebook: {
    icon: Key,
    steps: [
      'Go to developers.facebook.com/tools/explorer',
      'Log in with your Facebook account',
      'Select your app or use the default "Graph API Explorer"',
      'Click "Generate Access Token"',
      'Grant the required permissions when prompted',
      'Copy the generated access token and paste it above',
    ],
  },
  youtube: {
    icon: Key,
    steps: [
      'Go to console.cloud.google.com',
      'Create a project or select existing one',
      'Enable the YouTube Data API v3',
      'Go to APIs & Services → Credentials',
      'Create an API Key and an OAuth 2.0 Client ID',
      'Use the OAuth Playground to generate an access token',
    ],
  },
  tiktok: {
    icon: Cookie,
    steps: [
      'Open tiktok.com and log into your account',
      'Press F12 to open DevTools',
      'Go to the Application tab → Cookies → tiktok.com',
      'Find and copy the "sessionid" cookie value',
      'Find and copy the "tt_csrf_token" cookie value',
      'Enter your TikTok username (without the @ symbol)',
    ],
  },
  linkedin: {
    icon: Cookie,
    steps: [
      'Open linkedin.com and log into your account',
      'Press F12 to open DevTools',
      'Go to the Application tab → Cookies → linkedin.com',
      'Find and copy the "li_at" cookie value',
      'Find and copy the "JSESSIONID" cookie value (remove the surrounding quotes)',
      'Paste both values into the fields above',
    ],
  },
  threads: {
    icon: Cookie,
    steps: [
      'Open threads.net and log into your account',
      'Press F12 to open DevTools',
      'Go to the Application tab → Cookies → threads.net',
      'Find and copy the "sessionid" cookie value',
      'Find and copy the "csrftoken" cookie value',
      'Paste both values into the fields above',
    ],
  },
  bluesky: {
    icon: Key,
    steps: [
      'Open bsky.app and log into your account',
      'Go to Settings → Privacy and Security',
      'Click "App Passwords"',
      'Click "Add App Password" and give it a name (e.g. "Stalefish")',
      'Copy the generated app password',
      'Enter your handle (e.g. yourname.bsky.social) and the app password above',
    ],
  },
}

export default function TokenHelp({ platform, config }) {
  const help = helpContent[platform]
  if (!help) return null

  const Icon = help.icon

  return (
    <div className="bg-dark-700 border border-dark-500 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm text-white font-medium">
        <Icon size={16} className="text-gold" />
        How to get your tokens
      </div>
      <ol className="space-y-2">
        {help.steps.map((step, i) => (
          <li key={i} className="flex gap-2.5 text-xs text-gray-300">
            <span className="w-5 h-5 rounded-full bg-dark-600 flex items-center justify-center text-gold font-bold shrink-0 text-[10px]">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
      {config?.help && (
        <p className="text-xs text-gray-500 border-t border-dark-500 pt-2 mt-2">
          {config.help}
        </p>
      )}
    </div>
  )
}
