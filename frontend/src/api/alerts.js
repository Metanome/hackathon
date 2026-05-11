import client from './client'
export const getAlerts = (all = false) => client.get('/alerts', { params: { all } }).then(r => r.data)
export const resolveAlert = (id) => client.post(`/alerts/${id}/resolve`).then(r => r.data)
