import axios from 'axios'
import { T } from '../constants'

const client = axios.create({
  baseURL: '/api',
  timeout: 60000, // 60s - Gemini calls can take a moment
})

// Intercept responses to translate backend error messages to the active UI language
client.interceptors.response.use(
  res => res,
  err => {
    // Determine the current language from localStorage (or default to 'en')
    const lang = localStorage.getItem('et-lang') || 'en'
    const t = T[lang]

    if (t && err.response?.data?.detail) {
      const detail = err.response.data.detail
      
      if (typeof detail === 'string') {
        err.response.data.detail = t[detail] || detail
      } else if (typeof detail === 'object' && detail.code) {
        if (detail.code === 'ERR_INSUFFICIENT_STOCK') {
          const title = t[detail.code] || detail.code
          const itemsList = detail.items.map(i => `• ${i}`).join('\n')
          err.response.data.detail = `${title}\n${itemsList}`
        } else {
          err.response.data.detail = t[detail.code] || detail.code
        }
      }
    } else if (t && !err.response) {
      // Network errors (backend down)
      err.message = t['ERR_NETWORK'] || err.message
    }
    
    return Promise.reject(err)
  }
)

export default client
