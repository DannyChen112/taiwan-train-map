import { useState, useEffect } from 'react'

function codeToInfo(code) {
  if (code === 0)           return { label: '晴天',   icon: '☀️' }
  if (code <= 2)            return { label: '晴時多雲', icon: '🌤️' }
  if (code === 3)           return { label: '陰天',   icon: '☁️' }
  if (code <= 48)           return { label: '霧',     icon: '🌫️' }
  if (code <= 55)           return { label: '毛毛雨', icon: '🌦️' }
  if (code <= 65)           return { label: '雨',     icon: '🌧️' }
  if (code <= 75)           return { label: '雪',     icon: '❄️' }
  if (code <= 82)           return { label: '陣雨',   icon: '🌦️' }
  if (code <= 99)           return { label: '雷雨',   icon: '⛈️' }
  return { label: '—', icon: '🌡️' }
}

export function useWeather(lat, lng) {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (lat == null || lng == null) return
    setLoading(true)
    setWeather(null)
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m` +
      `&timezone=Asia%2FTaipei`
    )
      .then(r => r.json())
      .then(d => {
        const c = d.current
        setWeather({
          temp:     Math.round(c.temperature_2m),
          humidity: c.relative_humidity_2m,
          wind:     Math.round(c.wind_speed_10m),
          ...codeToInfo(c.weather_code),
        })
      })
      .catch(() => setWeather(null))
      .finally(() => setLoading(false))
  }, [lat, lng])

  return { weather, loading }
}
