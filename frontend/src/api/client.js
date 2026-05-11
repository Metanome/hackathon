import axios from 'axios'

const client = axios.create({
  baseURL: '/api',
  timeout: 60000, // 60s - Gemini calls can take a moment
})

export default client
