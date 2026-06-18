const CLIENT_ID = import.meta.env.VITE_TDX_CLIENT_ID
const CLIENT_SECRET = import.meta.env.VITE_TDX_CLIENT_SECRET
const TOKEN_URL = 'https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token'
const API_BASE = 'https://tdx.transportdata.tw/api/basic'

let cachedToken = null
let tokenExpiry = 0

async function getToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  })
  const data = await res.json()
  cachedToken = data.access_token
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000
  return cachedToken
}

export async function queryTrains(originId, destId, date) {
  const token = await getToken()
  const url = `${API_BASE}/v3/Rail/TRA/DailyTrainTimetable/OD/${originId}/to/${destId}/${date}?$format=JSON`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('查詢失敗')
  const data = await res.json()
  return data.TrainTimetables || []
}
