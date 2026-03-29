import { handleCors, corsResponse, corsError } from '../_shared/cors.ts'
import { removeConnection } from '../_shared/supabase.ts'

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const { platform } = await req.json()

    if (!platform) {
      return corsError('Missing platform')
    }

    await removeConnection(platform)

    return corsResponse({ success: true, platform })
  } catch (err) {
    return corsError(err.message, 500)
  }
})
