const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) ?? ''
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ?? ''

export interface CrashReport {
  type: 'stream_disconnect' | 'js_error' | 'unhandled_rejection'
  message: string
  ws_close_code?: number
  ws_close_reason?: string
  stream_duration_s?: number
  extra?: Record<string, unknown>
}

export async function reportCrash(report: CrashReport): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/crash_reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ ...report, app_version: '0.2.0' }),
    })
  } catch {
    // fail silently — crash reporting must never crash the app
  }
}
