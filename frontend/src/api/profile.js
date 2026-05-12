import client from './client'
export const getProfile = () => client.get('/settings/profile').then(r => r.data)
export const updateProfile = (data) => client.put('/settings/profile', data).then(r => r.data)
