import client from './client'

export const uploadImage = (file, lang = 'en', signal) => {
  const form = new FormData()
  form.append('file', file)
  form.append('lang', lang)
  return client.post('/upload/image', form, { timeout: 300000, signal }).then(r => r.data)
}

export const uploadAudio = (file, lang = 'en', signal) => {
  const form = new FormData()
  form.append('file', file)
  form.append('lang', lang)
  return client.post('/upload/audio', form, { timeout: 300000, signal }).then(r => r.data)
}
