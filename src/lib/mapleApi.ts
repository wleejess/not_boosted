// ---------------------------------------------------------------------------
// Nexon ranking API — no auth required (proxied via Supabase Edge Function)
// Returns character data including real avatar image and weekly EXP gain
// ---------------------------------------------------------------------------
export interface NexonCharacterData {
  level: number
  jobName: string
  characterImgURL: string
  gap: number   // weekly EXP gained since last reset
  exp: number   // total EXP
}

export async function fetchCharacterFromNexon(ign: string): Promise<NexonCharacterData | null> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string
    const res = await fetch(`${supabaseUrl}/functions/v1/nexon-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ ign }),
    })
    if (!res.ok) return null
    const json = await res.json()
    if (!json.totalCount || !json.ranks?.[0]) return null
    const r = json.ranks[0]
    return { level: r.level, jobName: r.jobName, characterImgURL: r.characterImgURL, gap: r.gap, exp: r.exp }
  } catch {
    return null
  }
}
