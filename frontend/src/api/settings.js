import client from './client'
export const getSettings = () => client.get('/settings').then(r => r.data)
export const saveSettings = (data) => client.post('/settings', data).then(r => r.data)
export const resetDatabase = () => client.post('/settings/reset').then(r => r.data)
