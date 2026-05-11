import client from './client'

export const uploadImage = (file) => {
  const form = new FormData()
  form.append('file', file)
  return client.post('/upload/image', form).then(r => r.data)
}

export const uploadAudio = (file) => {
  const form = new FormData()
  form.append('file', file)
  return client.post('/upload/audio', form).then(r => r.data)
}
